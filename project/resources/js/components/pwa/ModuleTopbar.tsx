import React from "react";

type ModuleTopbarProps = {
    title: string;
    action?: React.ReactNode;
    badgeText?: string;
    className?: string;
    onBack?: () => void;
};

const ModuleTopbar: React.FC<ModuleTopbarProps> = ({
    title,
    action,
    badgeText,
    className = "games-shell__topbar",
    onBack,
}) => {
    const handleBack = () => {
        if (onBack) {
            onBack();
            return;
        }

        window.history.back();
    };

    return (
        <div className={className}>
            <div className="d-flex align-items-center gap-2">
                <button
                    type="button"
                    className="btn btn-sm btn-link text-white p-0 border-0"
                    onClick={handleBack}
                    aria-label="Back"
                >
                    <i className="ri-arrow-left-line fs-5" />
                </button>
                <span className="fw-semibold text-white">{title}</span>
                {badgeText ? (
                    <span className="badge bg-danger-subtle text-danger fs-10 ms-1">
                        <i className="ri-shield-check-line me-1" />
                        {badgeText}
                    </span>
                ) : null}
            </div>
            <div className="d-flex align-items-center gap-2">{action}</div>
        </div>
    );
};

export default ModuleTopbar;
