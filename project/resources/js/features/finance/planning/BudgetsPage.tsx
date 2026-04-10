import axios from "axios";
import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";

import FinancePlanningTopbar from "../components/pwa/FinancePlanningTopbar";
import useFinancePlanningState from "../hooks/useFinancePlanningState";
import useFinanceStructuresData from "../hooks/useFinanceStructuresData";
import { FinancePlanningPageProps } from "../types";
import { FinanceBudget } from "../types";

import { currentMonthValue, shiftMonthValue } from "@/core/constants/month";
import { notify } from "@/core/lib/notify";
import FinanceShellLayout from "@/layouts/FinanceShellLayout";

const FinanceBudgetsTab = React.lazy(() => import("../components/FinanceBudgetsTab"));
const BudgetModal = React.lazy(() => import("../components/BudgetModal"));
const BudgetDetailSheet = React.lazy(() => import("../components/pwa/BudgetDetailSheet"));
const DangerDeleteModal = React.lazy(() => import("@/components/ui/DangerDeleteModal"));

const TabLoadingFallback = () => (
    <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
            <span className="visually-hidden">Loading...</span>
        </div>
        <div className="text-muted small mt-2">Memuat...</div>
    </div>
);

const BudgetsPage = ({
    accounts: seededAccounts,
    wallets: seededPockets,
    budgets: seededBudgets,
    goals: seededGoals,
    wishes: seededWishes,
    summary: seededSummary,
    monthlyReview: seededMonthlyReview,
    members,
    defaultCurrency,
    activeMemberId,
    permissions,
    financeRoute,
}: FinancePlanningPageProps) => {
    const { t } = useTranslation();
    const [planningMonth, setPlanningMonth] = React.useState(financeRoute?.period_month ?? currentMonthValue());
    const planningMonthLabel = new Date(`${planningMonth}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });

    const page = useFinancePlanningState(
        seededAccounts[0]?.id ?? null,
        "budgets"
    );

    const {
        tenantRoute,
        budgets,
        setBudgets,
        wallets,
        syncForTab,
    } = useFinanceStructuresData({
        seededAccounts,
        seededPockets,
        seededBudgets,
        seededGoals,
        seededWishes,
        seededSummary,
        seededMonthlyReview,
        search: page.search,
        periodMonth: planningMonth,
        preloaded: financeRoute?.preloaded,
    });

    const openBudgetModal = (budget?: FinanceBudget | null) => {
        page.setSelectedBudget(budget ?? null);
        page.setShowBudgetModal(true);
    };

    const openBudgetDetail = (budget: FinanceBudget) => {
        page.setSelectedBudget(budget);
        page.setShowBudgetDetailSheet(true);
    };

    const handleSaveBudget = async (budget?: FinanceBudget) => {
        if (!budget) {
            await syncForTab("budgets", { periodMonth: planningMonth, force: true });
            return;
        }
        setBudgets((prev) => [budget, ...prev.filter((item) => item.id !== budget.id)]);
        await syncForTab("budgets", { periodMonth: budget.period_month || planningMonth, force: true });
    };

    const [deleteIntent, setDeleteIntent] = React.useState<{ kind: "budget"; id: string; name: string } | null>(null);
    const [deletingEntity, setDeletingEntity] = React.useState(false);

    const handleDeleteBudget = async () => {
        if (!page.selectedBudget) return;
        setDeletingEntity(true);
        try {
            await axios.delete(tenantRoute.apiTo(`/finance/budgets/${page.selectedBudget.id}`));
            setBudgets((prev) => prev.filter((item) => item.id !== page.selectedBudget?.id));
            page.setShowBudgetModal(false);
            page.setSelectedBudget(null);
            setDeleteIntent(null);
            notify.success(t("finance.budgets.messages.deleted", { defaultValue: "Budget berhasil dihapus" }));
            await syncForTab("budgets", { periodMonth: planningMonth, force: true });
        } finally {
            setDeletingEntity(false);
        }
    };

    return (
        <FinanceShellLayout
            activeSection="planning"
            planningView="budgets"
            periodMonth={planningMonth}
            topbar={(
                <FinancePlanningTopbar
                    title={financeRoute?.title ?? "Budgets"}
                    entityLabel={financeRoute?.entity_label ?? t("wallet.entity_label")}
                    searchOpen={page.searchOpen}
                    searchValue={page.search}
                    onToggleSearch={() => page.setSearchOpen((prev) => !prev)}
                    onSearchChange={page.setSearch}
                    periodLabel={planningMonthLabel}
                    onPrevMonth={() => {
                        const prevMonth = shiftMonthValue(planningMonth, -1);
                        setPlanningMonth(prevMonth);
                        void syncForTab("budgets", { periodMonth: prevMonth });
                        window.history.replaceState({}, "", `/finance/planning?view=budgets&period_month=${prevMonth}`);
                    }}
                    onNextMonth={() => {
                        const nextMonth = shiftMonthValue(planningMonth, 1);
                        setPlanningMonth(nextMonth);
                        void syncForTab("budgets", { periodMonth: nextMonth });
                        window.history.replaceState({}, "", `/finance/planning?view=budgets&period_month=${nextMonth}`);
                    }}
                />
            )}
            fab={permissions.create && (
                <div className="position-fixed end-0 z-3" style={{ bottom: "calc(92px + env(safe-area-inset-bottom))", right: 20 }}>
                    <button
                        type="button"
                        className="btn btn-primary rounded-circle shadow-lg d-inline-flex align-items-center justify-content-center"
                        style={{ width: 58, height: 58 }}
                        onClick={() => openBudgetModal(null)}
                    >
                        <i className="ri-add-line fs-3" />
                    </button>
                </div>
            )}
        >
            <>
                <Suspense fallback={<TabLoadingFallback />}>
                    <FinanceBudgetsTab
                        budgets={budgets}
                        defaultCurrency={defaultCurrency}
                        canManageFinanceStructures={permissions.manageShared}
                        activeMemberId={activeMemberId}
                        onCreateBudget={() => openBudgetModal(null)}
                        onOpenDetail={openBudgetDetail}
                    />
                </Suspense>

                {page.showBudgetModal && (
                    <Suspense fallback={null}>
                        <BudgetModal
                            show={page.showBudgetModal}
                            onClose={() => {
                                page.setShowBudgetModal(false);
                                page.setSelectedBudget(null);
                            }}
                            onSuccess={(budget) => void handleSaveBudget(budget)}
                            onDelete={() => {
                                if (!page.selectedBudget) return;
                                setDeleteIntent({
                                    kind: "budget",
                                    id: page.selectedBudget.id,
                                    name: page.selectedBudget.name,
                                });
                            }}
                            budget={page.selectedBudget}
                            members={members}
                            pockets={wallets}
                            activeMemberId={activeMemberId}
                            canManageShared={permissions.manageShared}
                            canDelete={permissions.delete}
                        />
                    </Suspense>
                )}

                {page.showBudgetDetailSheet && (
                    <Suspense fallback={null}>
                        <BudgetDetailSheet
                            show={page.showBudgetDetailSheet}
                            budget={page.selectedBudget}
                            onClose={() => {
                                page.setShowBudgetDetailSheet(false);
                                page.setSelectedBudget(null);
                            }}
                            onEdit={() => {
                                page.setShowBudgetDetailSheet(false);
                                page.setShowBudgetModal(true);
                            }}
                            onDelete={() => {
                                if (!page.selectedBudget) return;
                                page.setShowBudgetDetailSheet(false);
                                setDeleteIntent({
                                    kind: "budget",
                                    id: page.selectedBudget.id,
                                    name: page.selectedBudget.name,
                                });
                            }}
                            activeMemberId={activeMemberId}
                            canManage={permissions.manageShared || String(page.selectedBudget?.owner_member_id || "") === String(activeMemberId || "")}
                        />
                    </Suspense>
                )}

                {deleteIntent && (
                    <Suspense fallback={null}>
                        <DangerDeleteModal
                            show={Boolean(deleteIntent)}
                            onClose={() => !deletingEntity && setDeleteIntent(null)}
                            onConfirm={handleDeleteBudget}
                            loading={deletingEntity}
                            title="Hapus budget ini?"
                            entityLabel="Budget"
                            entityName={deleteIntent?.name || ""}
                            message="Budget hanya bisa dihapus jika backend mengizinkan. Pastikan histori bulanan yang terkait sudah tidak dibutuhkan."
                            confirmLabel="Ya, Hapus Budget"
                        />
                    </Suspense>
                )}
            </>
        </FinanceShellLayout>
    );
};

export default BudgetsPage;
