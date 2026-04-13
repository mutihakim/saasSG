import React, { useEffect, useState } from "react";

type ExitConfirmModalProps = {
    eventName?: string;
    title?: string;
    message?: string;
    continueLabel?: string;
    exitLabel?: string;
};

type ExitEventDetail = {
    onConfirm?: () => void;
};

const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
    eventName = "app:request-exit",
    title = "Leave this page?",
    message = "Unsaved progress may be lost.",
    continueLabel = "Stay",
    exitLabel = "Leave",
}) => {
    const [showModal, setShowModal] = useState(false);
    const [pendingNav, setPendingNav] = useState<(() => void) | null>(null);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, []);

    useEffect(() => {
        const triggerExit = (event: Event) => {
            const custom = event as CustomEvent<ExitEventDetail>;
            setShowModal(true);
            setPendingNav(() => custom.detail?.onConfirm ?? null);
        };

        window.addEventListener(eventName, triggerExit as EventListener);
        return () => window.removeEventListener(eventName, triggerExit as EventListener);
    }, [eventName]);

    const confirmExit = () => {
        setShowModal(false);
        if (pendingNav) {
            pendingNav();
        } else {
            window.history.back();
        }
    };

    const cancelExit = () => {
        setShowModal(false);
        setPendingNav(null);
    };

    if (!showModal) return null;

    return (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1060 }}>
            <div className="modal-backdrop fade show" style={{ zIndex: -1 }} />
            <div className="modal-dialog modal-dialog-centered modal-sm" role="document" style={{ zIndex: 1061 }}>
                <div className="modal-content shadow-lg border-0">
                    <div className="modal-header border-0 pb-0">
                        <h6 className="modal-title">{title}</h6>
                        <button
                            type="button"
                            className="btn-close"
                            aria-label="Close"
                            onClick={cancelExit}
                        />
                    </div>
                    <div className="modal-body py-2">
                        <p className="text-muted small mb-0">{message}</p>
                    </div>
                    <div className="modal-footer border-0 pt-0">
                        <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={cancelExit}
                        >
                            {continueLabel}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={confirmExit}
                        >
                            {exitLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExitConfirmModal;
