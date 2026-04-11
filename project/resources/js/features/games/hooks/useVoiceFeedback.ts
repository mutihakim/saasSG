import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for Indonesian text-to-speech voice feedback.
 * Manages speech synthesis for praise and encouragement messages.
 */
const useVoiceFeedback = () => {
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
            return;
        }

        synthesisRef.current = window.speechSynthesis;

        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            // Prefer Indonesian voice
            const indonesianVoice = voices.find(
                (v) => v.lang === "id-ID" || v.lang.startsWith("id-")
            ) || voices.find(
                (v) => v.name.toLowerCase().includes("indonesian")
            );

            if (indonesianVoice) {
                setVoice(indonesianVoice);
            } else if (voices.length > 0) {
                // Fallback to first available voice
                setVoice(voices[0]);
            }
        };

        // Load voices immediately if available
        const initialVoices = window.speechSynthesis.getVoices();
        if (initialVoices.length > 0) {
            loadVoices();
        }

        // Otherwise wait for voiceschanged event
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            if (synthesisRef.current) {
                synthesisRef.current.cancel();
            }
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    const speak = useCallback(
        (text: string) => {
            if (!synthesisRef.current || !isEnabled) {
                return;
            }

            // Cancel any ongoing speech
            synthesisRef.current.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            if (voice) {
                utterance.voice = voice;
            }
            utterance.lang = "id-ID";
            utterance.rate = 0.9; // Slightly slower for clarity

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            synthesisRef.current.speak(utterance);
        },
        [voice, isEnabled]
    );

    const cancel = useCallback(() => {
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
            setIsSpeaking(false);
        }
    }, []);

    const toggleEnabled = useCallback(() => {
        setIsEnabled((prev) => {
            const next = !prev;
            if (!next && synthesisRef.current) {
                synthesisRef.current.cancel();
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
