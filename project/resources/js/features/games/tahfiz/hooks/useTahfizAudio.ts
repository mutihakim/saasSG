import { useState, useCallback, useRef, useEffect } from "react";

import { TahfizAyah, TahfizSettings, TahfizTab } from "../types";

export function useTahfizAudio(
    currentAyah: TahfizAyah | null,
    activeTab: TahfizTab,
    settings: TahfizSettings,
    onNext: () => void,
) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isTtsPlaying, setIsTtsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [currentRepeat, setCurrentRepeat] = useState(0);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const stopSignalRef = useRef(false);
    const handlePlaybackEndedRef = useRef<() => void>(() => {});
    // Track apakah audio sedang bermain secara synchronous (tidak tergantung setState yang async)
    const wasPlayingRef = useRef(false);

    const speakTranslation = useCallback((text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "id-ID";
        utterance.rate = playbackRate;

        utterance.onstart = () => setIsTtsPlaying(true);
        utterance.onend = () => {
            if (!stopSignalRef.current && activeTab === "terjemah") {
                handlePlaybackEndedRef.current();
            } else {
                setIsTtsPlaying(false);
            }
        };
        utterance.onerror = () => setIsTtsPlaying(false);

        window.speechSynthesis.speak(utterance);
    }, [playbackRate, activeTab]);

    const handlePlaybackEnded = useCallback(() => {
        if (stopSignalRef.current) return;

        if (currentRepeat < settings.repeat_count) {
            setCurrentRepeat((prev) => prev + 1);
            if (activeTab === "terjemah") {
                if (currentAyah) speakTranslation(currentAyah.teks_indonesia);
            } else {
                if (audioRef.current && currentAyah) {
                    audioRef.current.src = currentAyah.audio;
                    void audioRef.current.play();
                }
            }
        } else {
            // Set ref DULU (synchronous) sebelum setState yang async
            // supaya useEffect di controller bisa membaca state bermain yang benar
            wasPlayingRef.current = true;
            setCurrentRepeat(0);
            setIsPlaying(false);
            setIsTtsPlaying(false);
            onNext();
        }
    }, [currentRepeat, settings.repeat_count, activeTab, currentAyah, speakTranslation, onNext]);

    useEffect(() => {
        handlePlaybackEndedRef.current = handlePlaybackEnded;
    }, [handlePlaybackEnded]);

    const togglePlay = useCallback(() => {
        if (!currentAyah) return;

        if (activeTab === "terjemah") {
            if (isTtsPlaying) {
                window.speechSynthesis.cancel();
                setIsTtsPlaying(false);
                stopSignalRef.current = true;
            } else {
                stopSignalRef.current = false;
                if (isPlaying && audioRef.current) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                }
                speakTranslation(currentAyah.teks_indonesia);
                setCurrentRepeat(1);
            }
        } else {
            if (isPlaying) {
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
                stopSignalRef.current = true;
            } else {
                stopSignalRef.current = false;
                window.speechSynthesis.cancel();
                setIsTtsPlaying(false);
                if (audioRef.current) {
                    audioRef.current.playbackRate = playbackRate;
                    audioRef.current.src = currentAyah.audio;
                    void audioRef.current.play();
                }
                setIsPlaying(true);
                setCurrentRepeat(1);
            }
        }
    }, [currentAyah, activeTab, isTtsPlaying, isPlaying, playbackRate, speakTranslation]);

    const stop = useCallback(() => {
        stopSignalRef.current = true;
        wasPlayingRef.current = false; // reset: user sengaja stop
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsTtsPlaying(false);
        setCurrentRepeat(0);
    }, []);

    const playCurrent = useCallback(() => {
        if (!currentAyah) return;
        stopSignalRef.current = false;
        setCurrentRepeat(1);

        if (activeTab === "terjemah") {
            speakTranslation(currentAyah.teks_indonesia);
        } else {
            if (audioRef.current) {
                audioRef.current.playbackRate = playbackRate;
                audioRef.current.src = currentAyah.audio;
                void audioRef.current.play();
            }
            setIsPlaying(true);
        }
    }, [currentAyah, activeTab, playbackRate, speakTranslation]);

    return {
        audioRef,
        isPlaying,
        isTtsPlaying,
        playbackRate,
        setPlaybackRate,
        currentRepeat,
        setCurrentRepeat,
        togglePlay,
        stop,
        playCurrent,
        handlePlaybackEnded,
        stopSignalRef,
        wasPlayingRef,
    };
}
