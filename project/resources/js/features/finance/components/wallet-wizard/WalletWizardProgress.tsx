import React from "react";

type StepTitle = {
    number: number;
    label: string;
    icon: string;
};

type Props = {
    activeStep: number;
    stepTitles: StepTitle[];
};

const WalletWizardProgress = ({ activeStep, stepTitles }: Props) => (
    <div className="mb-4 mt-3">
        <div className="d-flex justify-content-between align-items-center position-relative">
            <div className="position-absolute top-50 start-0 w-100 translate-middle-y" style={{ height: "2px", background: "#e2e8f0", zIndex: 0 }} />

            <div
                className="position-absolute top-50 start-0 translate-middle-y"
                style={{
                    height: "2px",
                    background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
                    width: `${((activeStep - 1) / 2) * 100}%`,
                    zIndex: 1,
                    transition: "width 0.3s ease",
                }}
            />

            {stepTitles.map((step) => {
                const isActive = activeStep === step.number;
                const isCompleted = activeStep > step.number;

                return (
                    <div key={step.number} className="text-center position-relative" style={{ zIndex: 2, flex: 1 }}>
                        <div
                            className="mx-auto d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                                width: 48,
                                height: 48,
                                background: isCompleted ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : isActive ? "#fff" : "#f1f5f9",
                                border: isActive || isCompleted ? "3px solid #3b82f6" : "3px solid #e2e8f0",
                                transition: "all 0.3s ease",
                                boxShadow: isActive ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none",
                            }}
                        >
                            {isCompleted ? (
                                <i className="ri-check-line text-white fs-5"></i>
                            ) : (
                                <i className={`${step.icon} ${isActive ? "text-primary" : "text-muted"} fs-5`}></i>
                            )}
                        </div>
                        <div className={`mt-2 fw-semibold ${isActive ? "text-primary" : isCompleted ? "text-success" : "text-muted"}`} style={{ fontSize: "0.7rem" }}>
                            {step.label}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export default WalletWizardProgress;
