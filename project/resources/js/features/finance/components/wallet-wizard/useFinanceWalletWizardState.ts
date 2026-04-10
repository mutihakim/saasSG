import { useMemo, useState } from "react";

import { FinanceAccount, FinanceBudget, FinanceMember, FinanceWallet, FinanceWalletFormState } from "../../types";

type Args = {
    wallet: FinanceWallet | null;
    accounts: FinanceAccount[];
    budgets: FinanceBudget[];
    members: FinanceMember[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
    onHide: () => void;
    onSave: (values: FinanceWalletFormState) => Promise<void>;
};

export const walletIconOptions = [
    { value: "ri-shopping-bag-line", label: "Belanja" },
    { value: "ri-restaurant-line", label: "Makan" },
    { value: "ri-car-line", label: "Transport" },
    { value: "ri-t-shirt-line", label: "Fashion" },
    { value: "ri-movie-2-line", label: "Hiburan" },
    { value: "ri-home-4-line", label: "Rumah" },
    { value: "ri-safe-2-line", label: "Tabungan" },
    { value: "ri-plane-line", label: "Travel" },
    { value: "ri-hand-heart-line", label: "Ibadah" },
    { value: "ri-macbook-line", label: "Gadget" },
    { value: "ri-briefcase-4-line", label: "Bisnis" },
    { value: "ri-heart-line", label: "Kesehatan" },
];

export const walletColorOptions = [
    "#fef08a",
    "#06b6d4",
    "#fbcfe8",
    "#86efac",
    "#fcd34d",
    "#93c5fd",
    "#c4b5fd",
    "#ffedd5",
    "#e2e8f0",
    "#f87171",
    "#fb923c",
    "#a3e635",
];

export const walletTypeSuggestions = [
    { value: "personal", icon: "ri-user-line", label: "Personal", desc: "Dompet pribadi harian" },
    { value: "business", icon: "ri-briefcase-4-line", label: "Business", desc: "Operasional bisnis" },
    { value: "family", icon: "ri-home-heart-line", label: "Family", desc: "Kebutuhan keluarga" },
    { value: "project", icon: "ri-kanban-view-2-line", label: "Project", desc: "Pos proyek atau event" },
];

const stepTitles = [
    { number: 1, label: "Informasi Dasar", icon: "ri-file-list-3-line" },
    { number: 2, label: "Budget Default", icon: "ri-bank-card-line" },
    { number: 3, label: "Personalisasi", icon: "ri-palette-line" },
];

export const useFinanceWalletWizardState = ({
    wallet,
    accounts,
    budgets,
    members,
    activeMemberId,
    canManageShared = false,
    onHide,
    onSave,
}: Args) => {
    const [activeStep, setActiveStep] = useState(1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const isEdit = Boolean(wallet);
    const isSystemWallet = Boolean(wallet?.is_system);
    const canManageScope = !isEdit || canManageShared || String(wallet?.owner_member_id) === String(activeMemberId);

    const buildFormState = (sourceWallet?: FinanceWallet | null): FinanceWalletFormState => {
        if (sourceWallet) {
            return {
                name: sourceWallet.name || "",
                type: sourceWallet.is_system ? "personal" : sourceWallet.type || "personal",
                purpose_type: (sourceWallet.purpose_type as FinanceWalletFormState["purpose_type"]) || "spending",
                scope: sourceWallet.scope || "private",
                real_account_id: sourceWallet.real_account_id || sourceWallet.real_account?.id || "",
                owner_member_id: sourceWallet.owner_member_id ? String(sourceWallet.owner_member_id) : activeMemberId ? String(activeMemberId) : "",
                default_budget_id: sourceWallet.default_budget_id ? String(sourceWallet.default_budget_id) : "",
                default_budget_key: sourceWallet.default_budget_key ? String(sourceWallet.default_budget_key) : "",
                budget_lock_enabled: Boolean(sourceWallet.budget_lock_enabled),
                icon_key: sourceWallet.icon_key || "ri-wallet-3-line",
                notes: sourceWallet.notes || "",
                background_color: sourceWallet.background_color || "#fef08a",
                row_version: sourceWallet.row_version || 1,
                member_access: ((sourceWallet as any).member_access || (sourceWallet as any).memberAccess || []).map((m: any) => ({
                    id: String(m.id),
                    can_view: Boolean(m.pivot?.can_view),
                    can_use: Boolean(m.pivot?.can_use),
                    can_manage: Boolean(m.pivot?.can_manage),
                })),
            };
        }

        return {
            name: "",
            type: "personal",
            purpose_type: "spending",
            scope: "private",
            real_account_id: accounts[0]?.id || "",
            owner_member_id: activeMemberId ? String(activeMemberId) : members[0] ? String(members[0].id) : "",
            default_budget_id: "",
            default_budget_key: "",
            budget_lock_enabled: false,
            icon_key: "ri-wallet-3-line",
            notes: "",
            background_color: "#fef08a",
            row_version: 1,
            member_access: [],
        };
    };

    const [formData, setFormData] = useState<FinanceWalletFormState>(() => buildFormState(wallet));

    const selectedAccount = useMemo(
        () => accounts.find((account) => String(account.id) === String(formData.real_account_id)) || null,
        [accounts, formData.real_account_id],
    );
    const selectedAccountAllowsShared = selectedAccount?.scope === "shared";

    const walletBudgetOptions = useMemo(() => {
        return budgets
            .filter((budget) => {
                if (!budget || budget.is_active === false) return false;
                if (formData.scope === "shared") {
                    return budget.scope === "shared";
                }
                return true;
            })
            .filter((budget, index, self) => {
                const identifier = String(budget.budget_key || budget.code || budget.id);
                if (!identifier) return false;

                return index === self.findIndex((item) => String(item.budget_key || item.code || item.id) === identifier);
            });
    }, [budgets, formData.scope]);

    const updateField = (field: keyof FinanceWalletFormState, value: any) => {
        const fieldKey = String(field);
        setFormData((prev) => ({ ...prev, [field]: value }));

        if (errors[fieldKey]) {
            setErrors((prev) => {
                const nextErrors = { ...prev };
                delete nextErrors[fieldKey];
                return nextErrors;
            });
        }
    };

    const validateStep1 = (): boolean => {
        if (isSystemWallet) {
            setErrors({});
            return true;
        }

        const nextErrors: Record<string, string> = {};

        if (!formData.name || formData.name.length < 3) {
            nextErrors.name = "Nama wallet minimal 3 karakter";
        }

        if (!formData.purpose_type || !["spending", "saving", "income"].includes(formData.purpose_type)) {
            nextErrors.purpose_type = "Fungsi wallet wajib dipilih";
        }

        if (!formData.real_account_id) {
            nextErrors.real_account_id = "Source account wajib dipilih";
        }

        if (formData.scope === "shared" && !selectedAccountAllowsShared) {
            nextErrors.scope = "Wallet shared hanya bisa dibuat di account shared";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        if (isSystemWallet) {
            return true;
        }

        const nextErrors: Record<string, string> = {};
        if (!formData.type || formData.type.trim().length < 2) {
            nextErrors.type = "Konteks wallet minimal 2 karakter";
        }
        setErrors((prev) => ({ ...prev, ...nextErrors }));

        return Object.keys(nextErrors).length === 0;
    };

    const handleNext = () => {
        if (activeStep === 1) {
            if (validateStep1()) {
                setActiveStep(2);
            }
            return;
        }

        if (activeStep === 2) {
            setActiveStep(3);
        }
    };

    const handleBack = () => {
        if (activeStep > 1) {
            setActiveStep(activeStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep3()) {
            return;
        }
        await onSave(formData);
    };

    const handleModalHide = () => {
        setActiveStep(1);
        setErrors({});
        setFormData(buildFormState(wallet));
        onHide();
    };

    return {
        activeStep,
        errors,
        formData,
        isEdit,
        isSystemWallet,
        canManageScope,
        stepTitles,
        selectedAccountAllowsShared,
        walletBudgetOptions,
        updateField,
        handleNext,
        handleBack,
        handleSubmit,
        handleModalHide,
    };
};
