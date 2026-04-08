import React from "react";

import { FinancePocket, FinanceSavingsGoal } from "../../Finance/types";
import { GoalFormState } from "../types";

import GoalFormWizard from "./GoalFormWizard";

type Props = {
    selectedGoal: FinanceSavingsGoal | null;
    showGoalModal: boolean;
    setShowGoalModal: (show: boolean) => void;
    goalForm: GoalFormState;
    setGoalForm: React.Dispatch<React.SetStateAction<GoalFormState>>;
    handleSaveGoal: (values: GoalFormState) => Promise<void>;
    savingGoal: boolean;
    wallets: FinancePocket[];
};

const GoalDialogs = ({
    selectedGoal,
    showGoalModal,
    setShowGoalModal,
    handleSaveGoal,
    savingGoal,
    wallets,
}: Props) => {
    return (
        <GoalFormWizard
            key={`${selectedGoal?.id || "new"}:${showGoalModal ? "open" : "closed"}`}
            show={showGoalModal}
            onHide={() => setShowGoalModal(false)}
            onSave={handleSaveGoal}
            saving={savingGoal}
            goal={selectedGoal}
            wallets={wallets}
        />
    );
};

export default GoalDialogs;
