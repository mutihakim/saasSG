import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Button, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import DeleteModal from "../../../Components/Common/DeleteModal";
import { parseApiError } from "../../../common/apiError";
import { currentMonthValue, shiftMonthValue } from "../../../common/month";
import { notify } from "../../../common/notify";
import { useTenantRoute } from "../../../common/tenantRoute";

import AccountModal from "./components/AccountModal";
import BudgetModal from "./components/BudgetModal";
import ReportsPanel from "./components/ReportsPanel";
import TransactionModal from "./components/TransactionModal";
import TransferModal from "./components/TransferModal";
import FinanceBottomNav from "./components/pwa/FinanceBottomNav";
import FinanceComposerFab from "./components/pwa/FinanceComposerFab";
import FinanceFilterPanel from "./components/pwa/FinanceFilterPanel";
import { SummarySkeleton, TransactionSkeleton } from "./components/pwa/FinanceSkeletons";
import FinanceTopbar from "./components/pwa/FinanceTopbar";
import TransactionDetailSheet from "./components/pwa/TransactionDetailSheet";
import TransactionGroupedList from "./components/pwa/TransactionGroupedList";
import {
    CARD_RADIUS,
    FinanceFilters,
    MainTab,
    MoreView,
    QuickType,
    SURFACE_BG,
    TransactionType,
    formatAmount,
    toMonthLabel,
} from "./components/pwa/types";

interface FinanceProps {
    categories: any[];
    currencies: any[];
    defaultCurrency: string;
    paymentMethods: any[];
    members: any[];
    accounts: any[];
    budgets: any[];
    activeMemberId?: number | null;
    permissions: {
        create: boolean;
        update: boolean;
        delete: boolean;
        manageShared: boolean;
        managePrivateStructures: boolean;
    };
    limits: {
        accounts: { current: number; limit: number | null };
        budgets: { current: number; limit: number | null };
    };
}

const FinanceIndex = ({
    categories,
    currencies,
    defaultCurrency,
    paymentMethods,
    members,
    accounts: seededAccounts,
    budgets: seededBudgets,
    activeMemberId,
    permissions,
    limits,
}: FinanceProps) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();

    const [activeTab, setActiveTab] = useState<MainTab>("transactions");
    const [moreView, setMoreView] = useState<MoreView>("menu");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState<any | null>(null);
    const [accounts, setAccounts] = useState<any[]>(seededAccounts ?? []);
    const [budgets, setBudgets] = useState<any[]>(seededBudgets ?? []);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [errorState, setErrorState] = useState<string | null>(null);
    const [showComposer, setShowComposer] = useState(false);
    const [transactionModal, setTransactionModal] = useState(false);
    const [transferModal, setTransferModal] = useState(false);
    const [accountModal, setAccountModal] = useState(false);
    const [budgetModal, setBudgetModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [focusedTransactionId, setFocusedTransactionId] = useState<string | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [selectedBudget, setSelectedBudget] = useState<any>(null);
    const [showDetailSheet, setShowDetailSheet] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [deleteTargetType, setDeleteTargetType] = useState<"transaction" | "account" | "budget">("transaction");
    const [isDeleting, setIsDeleting] = useState(false);
    const [transactionPresetType, setTransactionPresetType] = useState<"pemasukan" | "pengeluaran">("pengeluaran");
    const [statsMetric, setStatsMetric] = useState<"expense" | "income">("expense");
    const [showFilters, setShowFilters] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [quickType, setQuickType] = useState<QuickType>("all");
    const canManageFinanceStructures = permissions.manageShared || permissions.managePrivateStructures;
    const accountCreateDisabled = canManageFinanceStructures && limits.accounts.limit !== null && limits.accounts.limit !== -1 && accounts.length >= limits.accounts.limit;
    const budgetCreateDisabled = canManageFinanceStructures && limits.budgets.limit !== null && limits.budgets.limit !== -1 && budgets.filter((budget) => budget.is_active !== false).length >= limits.budgets.limit;
    const [filters, setFilters] = useState<FinanceFilters>({
        search: "",
        owner_member_id: permissions.manageShared ? "" : String(activeMemberId ?? ""),
        bank_account_id: "",
        category_id: "",
        transaction_kind: "all",
        month: currentMonthValue(),
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
        date_to: new Date().toISOString().slice(0, 10),
        use_custom_range: false,
    });
    const [draftFilters, setDraftFilters] = useState<FinanceFilters>({
        search: "",
        owner_member_id: permissions.manageShared ? "" : String(activeMemberId ?? ""),
        bank_account_id: "",
        category_id: "",
        transaction_kind: "all",
        month: currentMonthValue(),
        date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
        date_to: new Date().toISOString().slice(0, 10),
        use_custom_range: false,
    });

    const apiParams = useMemo(() => {
        const params: Record<string, string> = {
            search: filters.search,
            owner_member_id: filters.owner_member_id,
            bank_account_id: filters.bank_account_id,
            category_id: filters.category_id,
            transaction_kind: filters.transaction_kind,
        };

        if (filters.use_custom_range) {
            params.date_from = filters.date_from;
            params.date_to = filters.date_to;
        } else {
            params.month = filters.month;
        }

        Object.keys(params).forEach((key) => {
            if (!params[key]) {
                delete params[key];
            }
        });

        return params;
    }, [filters]);

    const fetchTransactions = useCallback(async () => {
        const response = await axios.get(tenantRoute.apiTo("/finance/transactions"), { params: apiParams });
        setTransactions(response.data.data?.transactions || []);
    }, [apiParams, tenantRoute]);

    const fetchSummary = useCallback(async () => {
        setSummaryLoading(true);
        try {
            const response = await axios.get(tenantRoute.apiTo("/finance/summary"), { params: apiParams });
            setSummary(response.data.data || null);
        } finally {
            setSummaryLoading(false);
        }
    }, [apiParams, tenantRoute]);

    const fetchAccounts = useCallback(async () => {
        const response = await axios.get(tenantRoute.apiTo("/finance/accounts"));
        setAccounts(response.data.data?.accounts || []);
    }, [tenantRoute]);

    const fetchBudgets = useCallback(async () => {
        const response = await axios.get(tenantRoute.apiTo("/finance/budgets"), {
            params: filters.use_custom_range ? undefined : { period_month: filters.month },
        });
        setBudgets(response.data.data?.budgets || []);
    }, [filters.month, filters.use_custom_range, tenantRoute]);

    const refreshFinanceSideData = useCallback(async () => {
        await Promise.all([fetchSummary(), fetchAccounts(), fetchBudgets()]);
    }, [fetchAccounts, fetchBudgets, fetchSummary]);

    const loadFinance = useCallback(async () => {
        setLoading(true);
        setErrorState(null);
        try {
            await Promise.all([fetchTransactions(), fetchSummary(), fetchAccounts(), fetchBudgets()]);
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.notifications.transaction_load_failed"));
            setErrorState(parsed.detail || parsed.title);
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    }, [fetchAccounts, fetchBudgets, fetchSummary, fetchTransactions, t]);

    useEffect(() => {
        loadFinance();
    }, [loadFinance]);

    const totalAssets = useMemo(
        () => accounts.filter((account) => !["credit_card", "paylater"].includes(account.type)).reduce((sum, account) => sum + Number(account.current_balance || 0), 0),
        [accounts]
    );
    const totalLiabilities = useMemo(
        () => accounts.filter((account) => ["credit_card", "paylater"].includes(account.type)).reduce((sum, account) => sum + Number(account.current_balance || 0), 0),
        [accounts]
    );
    const categoryBreakdown = useMemo(() => {
        const targetType = statsMetric === "expense" ? "pengeluaran" : "pemasukan";
        const grouped = new Map<string, { name: string; amount: number }>();

        transactions
            .filter((transaction) => transaction.type === targetType)
            .forEach((transaction) => {
                const key = transaction.category?.name || t("finance.shared.uncategorized");
                const current = grouped.get(key) || { name: key, amount: 0 };
                current.amount += Number(transaction.amount_base || 0);
                grouped.set(key, current);
            });

        return Array.from(grouped.values()).sort((a, b) => b.amount - a.amount);
    }, [statsMetric, t, transactions]);

    const categoryChartOptions: ApexCharts.ApexOptions = {
        chart: { type: "donut", toolbar: { show: false } },
        labels: categoryBreakdown.map((item) => item.name),
        legend: { show: false },
        dataLabels: { enabled: false },
        stroke: { width: 0 },
        colors: ["#ff7a6b", "#4ba3ff", "#ffbf69", "#7bd389", "#b388eb", "#4ecdc4"],
        plotOptions: { pie: { donut: { size: "72%" } } },
    };
    const categoryChartSeries = categoryBreakdown.map((item) => item.amount);

    const subtitle = filters.use_custom_range
        ? `${filters.date_from} - ${filters.date_to}`
        : toMonthLabel(filters.month);

    const ownerLabel = filters.owner_member_id
        ? members.find((member) => String(member.id) === filters.owner_member_id)?.full_name
        : permissions.manageShared
            ? t("finance.pwa.scope.all")
            : t("finance.pwa.scope.relevant");

    const kindLabel = filters.transaction_kind !== "all"
        ? t(`finance.pwa.filters.kind_${filters.transaction_kind}`)
        : null;

    const showTransferHint = (summary?.transaction_count || 0) > 0
        && filters.transaction_kind !== "internal_transfer"
        && !filters.owner_member_id
        && permissions.manageShared
        && (summary?.transfer_total_base || 0) > 0;

    const focusTransactionRow = useCallback((transactionId?: string | null) => {
        if (!transactionId || typeof window === "undefined") {
            return;
        }

        window.setTimeout(() => {
            const element = document.getElementById(`finance-transaction-${transactionId}`);
            if (!element) {
                return;
            }

            element.scrollIntoView({ block: "center", behavior: "smooth" });
            element.classList.add("shadow-sm");
            window.setTimeout(() => element.classList.remove("shadow-sm"), 1200);
        }, 60);
    }, []);

    const closeDetailSheet = useCallback(() => {
        const currentId = String(selectedTransaction?.id || "");
        setShowDetailSheet(false);

        if (currentId) {
            setFocusedTransactionId(currentId);
            focusTransactionRow(currentId);
        }
    }, [focusTransactionRow, selectedTransaction?.id]);

    const isTransactionVisibleInCurrentList = useCallback((transaction: any) => {
        if (!transaction) {
            return false;
        }

        const transactionDate = String(transaction.transaction_date || "").slice(0, 10);
        const transactionMonth = transactionDate.slice(0, 7);
        const ownerMemberId = String(transaction.owner_member_id || transaction.owner_member?.id || "");
        const bankAccountId = String(transaction.bank_account_id || transaction.bank_account?.id || "");
        const categoryId = String(transaction.category_id || transaction.category?.id || "");
        const searchHaystack = [
            transaction.description,
            transaction.category?.name,
            transaction.owner_member?.full_name,
            transaction.bank_account?.name,
            transaction.notes,
            transaction.reference_number,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        if (filters.search && !searchHaystack.includes(filters.search.toLowerCase())) {
            return false;
        }

        if (filters.owner_member_id && ownerMemberId !== filters.owner_member_id) {
            return false;
        }

        if (filters.bank_account_id && bankAccountId !== filters.bank_account_id) {
            return false;
        }

        if (filters.category_id && categoryId !== filters.category_id) {
            return false;
        }

        const isInternalTransfer = transaction.type === "transfer" || Boolean(transaction.is_internal_transfer);
        if (filters.transaction_kind === "external" && isInternalTransfer) {
            return false;
        }
        if (filters.transaction_kind === "internal_transfer" && !isInternalTransfer) {
            return false;
        }

        if (filters.use_custom_range) {
            if (filters.date_from && transactionDate < filters.date_from) {
                return false;
            }
            if (filters.date_to && transactionDate > filters.date_to) {
                return false;
            }
        } else if (filters.month && transactionMonth !== filters.month) {
            return false;
        }

        return true;
    }, [filters]);

    const sortTransactions = useCallback((items: any[]) => {
        return [...items].sort((a, b) => {
            const dateCompare = String(b.transaction_date || "").localeCompare(String(a.transaction_date || ""));
            if (dateCompare !== 0) {
                return dateCompare;
            }

            return String(b.created_at || b.id || "").localeCompare(String(a.created_at || a.id || ""));
        });
    }, []);

    const upsertTransactionInList = useCallback((transaction: any) => {
        if (!transaction) {
            return;
        }

        setTransactions((prev) => {
            const withoutCurrent = prev.filter((item) => String(item.id) !== String(transaction.id));
            if (!isTransactionVisibleInCurrentList(transaction)) {
                return withoutCurrent;
            }

            return sortTransactions([transaction, ...withoutCurrent]);
        });

        setSelectedTransaction(transaction);
        setFocusedTransactionId(String(transaction.id));
        focusTransactionRow(String(transaction.id));
    }, [focusTransactionRow, isTransactionVisibleInCurrentList, sortTransactions]);

    const removeTransactionFromList = useCallback((transactionId: string) => {
        let fallbackId: string | null = null;

        setTransactions((prev) => {
            const index = prev.findIndex((item) => String(item.id) === transactionId);
            if (index !== -1) {
                fallbackId = String(prev[index + 1]?.id || prev[index - 1]?.id || "");
            }

            return prev.filter((item) => String(item.id) !== transactionId);
        });

        setFocusedTransactionId(fallbackId || null);
        if (fallbackId) {
            focusTransactionRow(fallbackId);
        }
    }, [focusTransactionRow]);

    const upsertAccountInList = useCallback((account: any) => {
        if (!account) {
            return;
        }

        setAccounts((prev) => {
            const withoutCurrent = prev.filter((item) => String(item.id) !== String(account.id));
            return [...withoutCurrent, account].sort((a, b) => {
                const scopeCompare = String(a.scope || "").localeCompare(String(b.scope || ""));
                if (scopeCompare !== 0) {
                    return scopeCompare;
                }

                return String(a.name || "").localeCompare(String(b.name || ""));
            });
        });
    }, []);

    const removeAccountFromList = useCallback((accountId: string) => {
        setAccounts((prev) => prev.filter((item) => String(item.id) !== accountId));
    }, []);

    const isBudgetVisibleInCurrentList = useCallback((budget: any) => {
        if (!budget) {
            return false;
        }

        if (filters.use_custom_range) {
            return true;
        }

        return String(budget.period_month || "") === filters.month;
    }, [filters.month, filters.use_custom_range]);

    const upsertBudgetInList = useCallback((budget: any) => {
        if (!budget) {
            return;
        }

        setBudgets((prev) => {
            const withoutCurrent = prev.filter((item) => String(item.id) !== String(budget.id));
            if (!isBudgetVisibleInCurrentList(budget)) {
                return withoutCurrent;
            }

            return [...withoutCurrent, budget].sort((a, b) => {
                const periodCompare = String(b.period_month || "").localeCompare(String(a.period_month || ""));
                if (periodCompare !== 0) {
                    return periodCompare;
                }

                return String(a.name || "").localeCompare(String(b.name || ""));
            });
        });
    }, [isBudgetVisibleInCurrentList]);

    const removeBudgetFromList = useCallback((budgetId: string) => {
        setBudgets((prev) => prev.filter((item) => String(item.id) !== budgetId));
    }, []);

    const editFromDetailSheet = useCallback(() => {
        setShowDetailSheet(false);
        setTransactionPresetType(selectedTransaction?.type === "pemasukan" ? "pemasukan" : "pengeluaran");
        setTransactionModal(true);
    }, [selectedTransaction]);

    const openNewTransaction = (type: TransactionType) => {
        setShowComposer(false);
        if (type === "transfer") {
            setTransferModal(true);
            return;
        }

        setTransactionPresetType(type);
        setSelectedTransaction(null);
        setTransactionModal(true);
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setIsDeleting(true);
        try {
            if (deleteTargetType === "transaction") {
                await axios.delete(tenantRoute.apiTo(`/finance/transactions/${deleteTarget.id}`));
            }

            if (deleteTargetType === "account") {
                await axios.delete(tenantRoute.apiTo(`/finance/accounts/${deleteTarget.id}`));
            }

            if (deleteTargetType === "budget") {
                await axios.delete(tenantRoute.apiTo(`/finance/budgets/${deleteTarget.id}`));
            }

            notify.success(t("finance.shared.deleted"));
            setDeleteModal(false);

            if (deleteTargetType === "transaction") {
                const deletedId = String(deleteTarget.id);
                setShowDetailSheet(false);
                setSelectedTransaction(null);
                removeTransactionFromList(deletedId);
                await refreshFinanceSideData();
                return;
            }

            if (deleteTargetType === "account") {
                removeAccountFromList(String(deleteTarget.id));
                setSelectedAccount(null);
                return;
            }

            if (deleteTargetType === "budget") {
                removeBudgetFromList(String(deleteTarget.id));
                setSelectedBudget(null);
            }
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.shared.delete_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDelete}
                onCloseClick={() => setDeleteModal(false)}
                loading={isDeleting}
            />

            <TransactionDetailSheet
                show={showDetailSheet}
                transaction={selectedTransaction}
                defaultCurrency={defaultCurrency}
                onClose={closeDetailSheet}
                onEdit={editFromDetailSheet}
                onDelete={() => {
                    if (!selectedTransaction) {
                        return;
                    }
                    setDeleteTarget(selectedTransaction);
                    setDeleteTargetType("transaction");
                    setDeleteModal(true);
                }}
                canEdit={permissions.update}
                canDelete={permissions.delete}
            />

            <TransactionModal
                show={transactionModal}
                onClose={() => {
                    setTransactionModal(false);
                    if (!showDetailSheet) {
                        setSelectedTransaction(null);
                    }
                }}
                onSuccess={async (transaction) => {
                    upsertTransactionInList(transaction);
                    setShowDetailSheet(false);
                    await refreshFinanceSideData();
                }}
                transaction={selectedTransaction}
                categories={categories}
                currencies={currencies}
                defaultCurrency={defaultCurrency}
                paymentMethods={paymentMethods}
                accounts={accounts}
                budgets={budgets}
                members={members}
                activeMemberId={activeMemberId}
                canManageShared={permissions.manageShared}
                initialType={transactionPresetType}
            />

            <TransferModal
                show={transferModal}
                onClose={() => setTransferModal(false)}
                onSuccess={async (payload) => {
                    if (payload?.transaction) {
                        upsertTransactionInList(payload.transaction);
                    }
                    await refreshFinanceSideData();
                }}
                accounts={accounts}
                members={members}
                activeMemberId={activeMemberId}
            />

            <AccountModal
                show={accountModal}
                onClose={() => {
                    setAccountModal(false);
                    setSelectedAccount(null);
                }}
                onSuccess={(account) => {
                    upsertAccountInList(account);
                }}
                onDelete={() => {
                    if (!selectedAccount) {
                        return;
                    }
                    setDeleteTarget(selectedAccount);
                    setDeleteTargetType("account");
                    setDeleteModal(true);
                }}
                account={selectedAccount}
                currencies={currencies}
                members={members}
                activeMemberId={activeMemberId}
                canManageShared={permissions.manageShared}
                canDelete={permissions.manageShared || (selectedAccount?.scope === "private" && String(selectedAccount?.owner_member_id || "") === String(activeMemberId || ""))}
            />

            <BudgetModal
                show={budgetModal}
                onClose={() => {
                    setBudgetModal(false);
                    setSelectedBudget(null);
                }}
                onSuccess={(budget) => {
                    upsertBudgetInList(budget);
                }}
                onDelete={() => {
                    if (!selectedBudget) {
                        return;
                    }
                    setDeleteTarget(selectedBudget);
                    setDeleteTargetType("budget");
                    setDeleteModal(true);
                }}
                budget={selectedBudget}
                members={members}
                activeMemberId={activeMemberId}
                canManageShared={permissions.manageShared}
                canDelete={permissions.manageShared || (selectedBudget?.scope === "private" && String(selectedBudget?.owner_member_id || "") === String(activeMemberId || ""))}
            />

            <FinanceFilterPanel
                show={showFilters}
                onClose={() => setShowFilters(false)}
                onApply={() => {
                    setFilters(draftFilters);
                    setShowFilters(false);
                }}
                draft={draftFilters}
                setDraft={setDraftFilters}
                members={members}
                accounts={accounts}
                categories={categories}
                permissions={permissions}
            />

            <div style={{ minHeight: "100vh" }}>
                <div className="position-relative d-flex flex-column" style={{ minHeight: "100vh", background: SURFACE_BG }}>
                    <FinanceTopbar
                        title={activeTab === "more"
                            ? moreView === "budgets"
                                ? t("finance.budgets.title")
                                : moreView === "reports"
                                    ? t("finance.reports.title")
                                    : t("finance.pwa.headers.more")
                            : t(`finance.pwa.headers.${activeTab}`)}
                        subtitle={subtitle}
                        searchOpen={searchOpen}
                        draftSearch={draftFilters.search}
                        onToggleSearch={() => setSearchOpen((prev) => !prev)}
                        onDraftSearchChange={(value) => setDraftFilters((prev) => ({ ...prev, search: value }))}
                        onApplySearch={() => setFilters((prev) => ({ ...prev, search: draftFilters.search }))}
                        onOpenFilter={() => setShowFilters(true)}
                        onPrevMonth={() => {
                            const next = shiftMonthValue(filters.month, -1);
                            setDraftFilters((prev) => ({ ...prev, month: next }));
                            setFilters((prev) => ({ ...prev, month: next, use_custom_range: false }));
                        }}
                        onNextMonth={() => {
                            const next = shiftMonthValue(filters.month, 1);
                            setDraftFilters((prev) => ({ ...prev, month: next }));
                            setFilters((prev) => ({ ...prev, month: next, use_custom_range: false }));
                        }}
                        filterOwnerLabel={ownerLabel}
                        filterKindLabel={kindLabel}
                    />

                    <div
                        className="flex-grow-1 px-3 pt-3"
                        style={{
                            paddingBottom: activeTab === "transactions" && permissions.create
                                ? "calc(180px + env(safe-area-inset-bottom))"
                                : "calc(128px + env(safe-area-inset-bottom))",
                        }}
                    >
                        {errorState ? (
                            <Card className="border-0 shadow-sm" style={{ borderRadius: CARD_RADIUS, background: "#fff" }}>
                                <Card.Body className="text-center py-5">
                                    <div className="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                                        <i className="ri-error-warning-line fs-2"></i>
                                    </div>
                                    <div className="fw-semibold text-dark mb-2">{t("finance.pwa.error.title")}</div>
                                    <div className="text-muted small mb-3">{errorState}</div>
                                    <Button variant="danger" className="rounded-pill px-4" onClick={loadFinance}>{t("finance.pwa.error.retry")}</Button>
                                </Card.Body>
                            </Card>
                        ) : loading ? (
                            <TransactionSkeleton />
                        ) : (
                            <>
                                <div className="mb-3">
                                    {summaryLoading ? (
                                        <SummarySkeleton />
                                    ) : (
                                        <div className="d-flex gap-2">
                                            <Card className="border-0 shadow-sm flex-fill" style={{ borderRadius: CARD_RADIUS }}>
                                                <Card.Body className="p-3">
                                                    <div className="small text-muted">{t("finance.summary.income")}</div>
                                                    <div className="fw-bold text-info fs-6 mt-1">{formatAmount(summary?.total_income_base || 0, defaultCurrency)}</div>
                                                </Card.Body>
                                            </Card>
                                            <Card className="border-0 shadow-sm flex-fill" style={{ borderRadius: CARD_RADIUS }}>
                                                <Card.Body className="p-3">
                                                    <div className="small text-muted">{t("finance.summary.expense")}</div>
                                                    <div className="fw-bold text-danger fs-6 mt-1">{formatAmount(summary?.total_expense_base || 0, defaultCurrency)}</div>
                                                </Card.Body>
                                            </Card>
                                            <Card className="border-0 shadow-sm flex-fill" style={{ borderRadius: CARD_RADIUS }}>
                                                <Card.Body className="p-3">
                                                    <div className="small text-muted">{t("finance.summary.net")}</div>
                                                    <div className={`fw-bold fs-6 mt-1 ${(summary?.balance_base || 0) >= 0 ? "text-success" : "text-danger"}`}>
                                                        {formatAmount(summary?.balance_base || 0, defaultCurrency)}
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    )}
                                </div>

                                {activeTab === "transactions" && (
                                    <TransactionGroupedList
                                        transactions={transactions}
                                        defaultCurrency={defaultCurrency}
                                        showTransferHint={showTransferHint}
                                        quickType={quickType}
                                        selectedTransactionId={focusedTransactionId}
                                        onQuickTypeChange={setQuickType}
                                        onTransactionClick={(transaction) => {
                                            setFocusedTransactionId(String(transaction.id));
                                            setSelectedTransaction(transaction);
                                            setShowDetailSheet(true);
                                        }}
                                    />
                                )}

                                {activeTab === "stats" && (
                                    <div className="d-flex flex-column gap-3">
                                        <div className="d-flex gap-2">
                                            {(["expense", "income"] as const).map((mode) => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    className={`btn flex-fill rounded-pill ${statsMetric === mode ? "btn-danger" : "btn-light"}`}
                                                    onClick={() => setStatsMetric(mode)}
                                                >
                                                    {mode === "expense" ? t("finance.summary.expense") : t("finance.summary.income")}
                                                </button>
                                            ))}
                                        </div>

                                        <Card className="border-0 shadow-sm" style={{ borderRadius: CARD_RADIUS }}>
                                            <Card.Body>
                                                {categoryBreakdown.length > 0 ? (
                                                    <ReactApexChart options={categoryChartOptions} series={categoryChartSeries} type="donut" height={280} />
                                                ) : (
                                                    <div className="text-center text-muted py-5">{t("finance.pwa.empty.stats_body")}</div>
                                                )}
                                            </Card.Body>
                                        </Card>

                                        <ReportsPanel accounts={accounts} budgets={budgets} categories={categories} members={members} compact />
                                    </div>
                                )}

                                {activeTab === "accounts" && (
                                    <div className="d-flex flex-column gap-3">
                                        <div className="row g-2">
                                            <div className="col-4"><Card className="border-0 shadow-sm h-100" style={{ borderRadius: CARD_RADIUS }}><Card.Body className="p-3"><div className="small text-muted">{t("finance.pwa.account_totals.assets")}</div><div className="fw-bold text-info mt-1">{formatAmount(totalAssets, defaultCurrency)}</div></Card.Body></Card></div>
                                            <div className="col-4"><Card className="border-0 shadow-sm h-100" style={{ borderRadius: CARD_RADIUS }}><Card.Body className="p-3"><div className="small text-muted">{t("finance.pwa.account_totals.liabilities")}</div><div className="fw-bold text-danger mt-1">{formatAmount(totalLiabilities, defaultCurrency)}</div></Card.Body></Card></div>
                                            <div className="col-4"><Card className="border-0 shadow-sm h-100" style={{ borderRadius: CARD_RADIUS }}><Card.Body className="p-3"><div className="small text-muted">{t("finance.pwa.account_totals.total")}</div><div className="fw-bold mt-1">{formatAmount(totalAssets - totalLiabilities, defaultCurrency)}</div></Card.Body></Card></div>
                                        </div>
                                        {canManageFinanceStructures && (
                                            <div className="d-flex justify-content-between align-items-center gap-3">
                                                <div className="small text-muted">
                                                    {limits.accounts.limit && limits.accounts.limit !== -1
                                                        ? `${accounts.length}/${limits.accounts.limit} accounts`
                                                        : t("finance.shared.unlimited")}
                                                </div>
                                                <Button
                                                    variant={accountCreateDisabled ? "light" : "primary"}
                                                    className="rounded-pill"
                                                    disabled={accountCreateDisabled}
                                                    data-testid="finance-account-add"
                                                    onClick={() => {
                                                        if (accountCreateDisabled) {
                                                            notify.info("Plan quota reached for accounts. Upgrade to add more accounts.");
                                                            return;
                                                        }
                                                        setSelectedAccount(null);
                                                        setAccountModal(true);
                                                    }}
                                                >
                                                    {t("finance.accounts.modal.add_title")}
                                                </Button>
                                            </div>
                                        )}
                                        <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
                                            {accounts.map((account, index) => (
                                                <button
                                                    key={account.id}
                                                    type="button"
                                                    data-testid={`finance-account-row-${account.id}`}
                                                    className={`btn w-100 text-start bg-transparent border-0 rounded-0 px-3 py-3 ${index < accounts.length - 1 ? "border-bottom" : ""}`}
                                                    onClick={() => {
                                                        if (!permissions.manageShared && !(account.scope === "private" && String(account.owner_member_id || "") === String(activeMemberId || ""))) {
                                                            return;
                                                        }
                                                        setSelectedAccount(account);
                                                        setAccountModal(true);
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between gap-3 align-items-start">
                                                        <div>
                                                            <div className="fw-semibold text-dark">{account.name}</div>
                                                            <div className="small text-muted mt-1">{account.owner_member?.full_name || t("finance.shared.shared")} · {account.scope === "shared" ? t("finance.shared.shared") : t("finance.shared.private")}</div>
                                                        </div>
                                                        <div className="fw-bold text-dark">{formatAmount(Number(account.current_balance || 0), account.currency_code)}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "more" && moreView === "menu" && (
                                    <div className="d-flex flex-column gap-3">
                                        <button type="button" className="btn text-start bg-white border-0 shadow-sm px-3 py-3" style={{ borderRadius: CARD_RADIUS }} onClick={() => setMoreView("budgets")}>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <div className="fw-semibold text-dark">{t("finance.budgets.title")}</div>
                                                    <div className="small text-muted mt-1">{t("finance.pwa.more.budgets_hint")}</div>
                                                </div>
                                                <i className="ri-arrow-right-s-line fs-4 text-muted"></i>
                                            </div>
                                        </button>
                                        <button type="button" className="btn text-start bg-white border-0 shadow-sm px-3 py-3" style={{ borderRadius: CARD_RADIUS }} onClick={() => setMoreView("reports")}>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <div className="fw-semibold text-dark">{t("finance.reports.title")}</div>
                                                    <div className="small text-muted mt-1">{t("finance.pwa.more.reports_hint")}</div>
                                                </div>
                                                <i className="ri-arrow-right-s-line fs-4 text-muted"></i>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {activeTab === "more" && moreView === "budgets" && (
                                    <div className="d-flex flex-column gap-3">
                                        {canManageFinanceStructures && (
                                            <div className="d-flex justify-content-between align-items-center gap-3">
                                                <div className="small text-muted">
                                                    {limits.budgets.limit && limits.budgets.limit !== -1
                                                        ? `${budgets.filter((budget) => budget.is_active !== false).length}/${limits.budgets.limit} budgets`
                                                        : t("finance.shared.unlimited")}
                                                </div>
                                                <Button
                                                    variant={budgetCreateDisabled ? "light" : "primary"}
                                                    className="rounded-pill"
                                                    disabled={budgetCreateDisabled}
                                                    data-testid="finance-budget-add"
                                                    onClick={() => {
                                                        if (budgetCreateDisabled) {
                                                            notify.info("Plan quota reached for budgets. Upgrade to add more budgets.");
                                                            return;
                                                        }
                                                        setSelectedBudget(null);
                                                        setBudgetModal(true);
                                                    }}
                                                >
                                                    {t("finance.budgets.modal.add_title")}
                                                </Button>
                                            </div>
                                        )}
                                        {budgets.map((budget) => (
                                            <Card key={budget.id} className="border-0 shadow-sm" style={{ borderRadius: CARD_RADIUS }} data-testid={`finance-budget-card-${budget.id}`}>
                                                <Card.Body className="p-3">
                                                    <div className="d-flex align-items-start justify-content-between gap-3">
                                                        <div>
                                                            <div className="fw-semibold text-dark">{budget.name}</div>
                                                            <div className="small text-muted mt-1">{budget.period_month} · {budget.scope === "shared" ? t("finance.shared.shared") : t("finance.shared.private")}</div>
                                                        </div>
                                                        {(permissions.manageShared || (budget.scope === "private" && String(budget.owner_member_id || "") === String(activeMemberId || ""))) && (
                                                            <button
                                                                type="button"
                                                                data-testid={`finance-budget-edit-${budget.id}`}
                                                                className="btn btn-light rounded-circle border-0"
                                                                onClick={() => {
                                                                    setSelectedBudget(budget);
                                                                    setBudgetModal(true);
                                                                }}
                                                            >
                                                                <i className="ri-pencil-line"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="d-flex justify-content-between mt-3 small text-muted">
                                                        <span>{t("finance.budgets.fields.allocated_amount")}</span>
                                                        <span>{formatAmount(Number(budget.allocated_amount || 0), defaultCurrency)}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mt-1 small text-muted">
                                                        <span>{t("finance.budgets.fields.remaining")}</span>
                                                        <span className={Number(budget.remaining_amount) < 0 ? "text-danger fw-semibold" : ""}>{formatAmount(Number(budget.remaining_amount || 0), defaultCurrency)}</span>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {activeTab === "more" && moreView === "reports" && (
                                    <ReportsPanel accounts={accounts} budgets={budgets} categories={categories} members={members} compact />
                                )}
                            </>
                        )}
                    </div>

                    {permissions.create && (
                        <FinanceComposerFab
                            showComposer={showComposer}
                            onToggle={() => setShowComposer((prev) => !prev)}
                            onSelect={openNewTransaction}
                        />
                    )}

                    <FinanceBottomNav
                        activeTab={activeTab}
                        onChangeTab={(tab) => {
                            setActiveTab(tab);
                            if (tab !== "more") {
                                setMoreView("menu");
                            }
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default FinanceIndex;
