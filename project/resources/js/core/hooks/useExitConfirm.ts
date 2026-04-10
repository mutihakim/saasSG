import { useCallback } from "react";

type UseExitConfirmArgs = {
    eventName?: string;
};

type UseExitConfirmReturn = {
    requestExit: (onConfirm?: () => void) => void;
};

const useExitConfirm = ({ eventName = "app:request-exit" }: UseExitConfirmArgs = {}): UseExitConfirmReturn => {
    const requestExit = useCallback((onConfirm?: () => void) => {
        window.dispatchEvent(
            new CustomEvent(eventName, {
                detail: { onConfirm },
            })
        );
    }, [eventName]);

    return { requestExit };
};

export default useExitConfirm;
