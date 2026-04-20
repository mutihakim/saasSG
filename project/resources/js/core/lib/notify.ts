import { createElement, isValidElement, type ReactNode } from "react";
import { toast, ToastOptions } from "react-toastify";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    try {
        if (typeof window === "undefined") return null;
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return null;
        if (!audioContext) {
            audioContext = new Ctx();
        }
        return audioContext;
    } catch {
        return null;
    }
}

function playTone(frequency: number, durationSec: number, type: OscillatorType) {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // On some mobile browsers, the context might be suspended and needs a resume call
        if (ctx.state === "suspended") {
            void ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(now);
        oscillator.stop(now + durationSec);
    } catch {
        // Silently fail if audio cannot be played
    }
}

function playSuccessSound() {
    playTone(920, 0.09, "sine");
}

function playErrorSound() {
    playTone(240, 0.16, "square");
}

function withDefaults(options?: ToastOptions): ToastOptions {
    return {
        position: "top-right",
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        ...options,
    };
}

type NotifyType = "success" | "error" | "warning" | "info";
type ErrorInput = ReactNode | { title: string; detail?: ReactNode };

function buildTwoLineErrorMessage(input: ErrorInput): ReactNode {
    if (isValidElement(input)) {
        return input;
    }

    if (typeof input === "object" && input !== null && "title" in input) {
        const title = String(input.title || "Terjadi kesalahan");
        const detail = input.detail || "Silakan coba lagi beberapa saat lagi.";
        return createElement(
            "div",
            null,
            createElement("div", { className: "fw-semibold" }, title),
            createElement("div", { className: "small text-muted mt-1" }, detail)
        );
    }

    const text = typeof input === "string" ? input.trim() : String(input ?? "").trim();
    const [titleRaw, ...rest] = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const title = titleRaw || "Terjadi kesalahan";
    const detail = rest.join(" ") || "Silakan coba lagi beberapa saat lagi.";

    return createElement(
        "div",
        null,
        createElement("div", { className: "fw-semibold" }, title),
        createElement("div", { className: "small text-muted mt-1" }, detail)
    );
}

function emit(type: NotifyType, message: ReactNode, options?: ToastOptions) {
    // Dismiss all previous toasts immediately to ensure only one is visible.
    // This is the snappiest way as it bypasses any queuing logic and 
    // forces a fresh DOM element for the new toast.
    toast.dismiss();

    return toast(message, {
        ...withDefaults(options),
        type,
    });
}

export const notify = {
    success(message: ReactNode, options?: ToastOptions) {
        playSuccessSound();
        return emit("success", message, options);
    },
    error(message: ErrorInput, options?: ToastOptions) {
        playErrorSound();
        return emit("error", buildTwoLineErrorMessage(message), options);
    },
    warning(message: ReactNode, options?: ToastOptions) {
        playErrorSound();
        return emit("warning", message, options);
    },
    info(message: ReactNode, options?: ToastOptions) {
        return emit("info", message, options);
    },
};
