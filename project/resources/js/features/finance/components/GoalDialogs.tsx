import React from "react";

import { FinanceWallet, FinanceSavingsGoal } from "../types";
import { FinanceGoalFormState } from "../types";

import GoalFormWizard from "./GoalFormWizard";

type Props = {
    selectedGoal: FinanceSavingsGoal | null;
    showGoalModal: boolean;
    setShowGoalModal: (show: boolean) => void;
    goalForm: FinanceGoalFormState;
    setGoalForm: React.Dispatch<React.SetStateAction<FinanceGoalFormState>>;
    handleSaveGoal: (values: FinanceGoalFormState) => Promise<void>;
    savingGoal: boolean;
    wallets: FinanceWallet[];
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
