import { useState } from "react";

import useExitConfirm from "@/core/hooks/useExitConfirm";

type UseGameShellReturn = {
    isGameActive: boolean;
    setGameActive: (active: boolean) => void;
    requestExit: (onConfirm?: () => void) => void;
};

/**
 * Manages the PWA shell state for game pages.
 * Handles exit confirmation intent and game active status.
 */
const useGameShell = (): UseGameShellReturn => {
    const [isGameActive, setGameActive] = useState(false);
    const { requestExit } = useExitConfirm({ eventName: "games:request-exit" });

    return { isGameActive, setGameActive, requestExit };
};

export default useGameShell;
