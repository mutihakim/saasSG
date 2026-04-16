import { useCallback, useEffect, useRef, useState } from "react";

const useVoiceFeedback = () => {
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const unlockedRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
            return;
        }

        synthesisRef.current = window.speechSynthesis;

        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            const indonesianVoice = voices.find((item) => item.lang === "id-ID" || item.lang.startsWith("id-"))
                || voices.find((item) => item.name.toLowerCase().includes("indonesian"));

            if (indonesianVoice) {
                setVoice(indonesianVoice);
            } else if (voices.length > 0) {
                setVoice(voices[0]);
            }
        };

        if (window.speechSynthesis.getVoices().length > 0) {
            loadVoices();
        }

        window.speechSynthesis.onvoiceschanged = loadVoices;

        const unlockSynth = () => {
            if (!synthesisRef.current || unlockedRef.current) {
                return;
            }

            unlockedRef.current = true;
            
            // Trik khusus Mobile (iOS/Android): harus call speak() di dalam user interaction event!
            const unlockUtterance = new SpeechSynthesisUtterance("");
            unlockUtterance.volume = 0; // bisu, hanya untuk mancing engine idle status
            synthesisRef.current.speak(unlockUtterance);
            
            synthesisRef.current.resume();
            loadVoices();
        };

        window.addEventListener("click", unlockSynth, { passive: true });
        window.addEventListener("touchend", unlockSynth, { passive: true });
        window.addEventListener("keydown", unlockSynth);

        return () => {
            synthesisRef.current?.cancel();
            window.speechSynthesis.onvoiceschanged = null;
            window.removeEventListener("click", unlockSynth);
            window.removeEventListener("touchend", unlockSynth);
            window.removeEventListener("keydown", unlockSynth);
        };
    }, []);

    const speak = useCallback((text: string, lang?: string) => {
        if (!synthesisRef.current || !isEnabled) {
            return;
        }

        synthesisRef.current.cancel();
        synthesisRef.current.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        const targetLang = lang || "id-ID";
        utterance.lang = targetLang;

        // Try to find a voice matching the target language
        const voices = window.speechSynthesis.getVoices();
        const targetLangNormalized = targetLang.toLowerCase().replace("_", "-");
        const targetPrimary = targetLangNormalized.split("-")[0];

        const matchingVoice = voices.find((v) => {
            const vLang = v.lang.toLowerCase().replace("_", "-");
            return vLang === targetLangNormalized || vLang.startsWith(targetPrimary);
        });
        
        if (matchingVoice) {
            utterance.voice = matchingVoice;
        } else if (voice) {
            utterance.voice = voice;
        }

        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthesisRef.current.speak(utterance);
    }, [isEnabled, voice]);

    const cancel = useCallback(() => {
        synthesisRef.current?.cancel();
        utteranceRef.current = null;
        setIsSpeaking(false);
    }, []);

    const toggleEnabled = useCallback(() => {
        setIsEnabled((prev) => {
            const next = !prev;
            if (!next) {
                synthesisRef.current?.cancel();
                setIsSpeaking(false);
            }
            return next;
        });
    }, []);

    return {
        speak,
        cancel,
        isSpeaking,
        isEnabled,
        setIsEnabled,
        toggleEnabled,
        hasVoiceSupport: typeof window !== "undefined" && Boolean(window.speechSynthesis),
    };
};

export default useVoiceFeedback;
