import axios from "axios";
import React, { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

import FinancePlanningTopbar from "../components/pwa/FinancePlanningTopbar";
import useFinancePlanningState from "../hooks/useFinancePlanningState";
import useFinanceStructuresData from "../hooks/useFinanceStructuresData";
import { FinanceWishConvertFormState, FinancePlanningPageProps, FinanceWish, FinanceWishFormState } from "../types";

import { currentMonthValue } from "@/core/constants/month";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";
import FinanceShellLayout from "@/layouts/FinanceShellLayout";

const FinanceWishesTab = React.lazy(() => import("../components/FinanceWishesTab"));
const WishDialogs = React.lazy(() => import("../components/WishDialogs"));

const TabLoadingFallback = () => (
    <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
            <span className="visually-hidden">Loading...</span>
        </div>
        <div className="text-muted small mt-2">Memuat...</div>
    </div>
);

const WishesPage = ({
    accounts: seededAccounts,
    wallets: seededPockets,
    budgets: seededBudgets,
    goals: seededGoals,
    wishes: seededWishes,
    summary: seededSummary,
    monthlyReview: seededMonthlyReview,
    permissions,
    limits,
    financeRoute,
}: FinancePlanningPageProps) => {
    const { t } = useTranslation();
    const page = useFinancePlanningState(
        seededAccounts[0]?.id ?? null,
        "wishes"
    );

    const {
        tenantRoute,
        wallets,
        setWishes,
        filteredWishes,
        filteredWallets,
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
        periodMonth: financeRoute?.period_month ?? currentMonthValue(),
        preloaded: financeRoute?.preloaded,
    });

    const [wishForm, setWishForm] = useState<FinanceWishFormState>({
        title: "",
        description: "",
        estimated_amount: "",
        priority: "medium",
        image_url: "",
        notes: "",
        row_version: 1,
    });

    const resetWishForm = (wish?: FinanceWish | null) => {
        page.setSelectedWish(wish ?? null);
        setWishForm({
            title: wish?.title || "",
            description: wish?.description || "",
            estimated_amount: wish?.estimated_amount ? String(wish.estimated_amount) : "",
            priority: wish?.priority || "medium",
            image_url: wish?.image_url || "",
            notes: wish?.notes || "",
            row_version: wish?.row_version || 1,
        });
    };

    const handleSaveWish = async () => {
        page.setSavingWish(true);
        try {
            const response = await axios({
                method: page.selectedWish ? "patch" : "post",
                url: page.selectedWish ? tenantRoute.apiTo(`/finance/wishes/${page.selectedWish.id}`) : tenantRoute.apiTo("/finance/wishes"),
                data: {
                    ...wishForm,
                    estimated_amount: wishForm.estimated_amount ? Number(wishForm.estimated_amount) : null,
                },
            });

            const savedWish = response.data?.data?.wish;
            setWishes((prev) => [savedWish, ...prev.filter((item) => item.id !== savedWish.id)]);
            notify.success(t(page.selectedWish ? "wallet.messages.wish_updated" : "wallet.messages.wish_created"));
            page.setShowWishModal(false);
            await syncForTab("wishes", { force: true });
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.wish_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            page.setSavingWish(false);
        }
    };

    const handleDeleteWish = async (wish: FinanceWish) => {
        if (!window.confirm(t("wallet.messages.wish_delete_confirm"))) return;
        try {
            await axios.delete(tenantRoute.apiTo(`/finance/wishes/${wish.id}`));
            notify.success(t("wallet.messages.wish_deleted"));
            await syncForTab("wishes", { force: true });
        } catch {
            notify.error(t("wallet.messages.wish_delete_failed"));
        }
    };

    const handleWishStatus = async (wish: FinanceWish, action: "approve" | "reject") => {
        try {
            await axios.post(tenantRoute.apiTo(`/finance/wishes/${wish.id}/${action}`));
            notify.success(t(action === "approve" ? "wallet.messages.wish_approved" : "wallet.messages.wish_rejected"));
            await syncForTab("wishes", { force: true });
        } catch {
            notify.error(t("wallet.messages.wish_save_failed"));
        }
    };

    const handleConvertWish = async () => {
        if (!page.selectedWish) return;
        page.setConvertingWish(true);
        try {
            await axios.post(tenantRoute.apiTo(`/finance/wishes/${page.selectedWish.id}/convert`), {
                wallet_id: page.convertForm.wallet_id,
                target_amount: page.convertForm.target_amount ? Number(page.convertForm.target_amount) : undefined,
                target_date: page.convertForm.target_date || undefined,
                notes: page.convertForm.notes || undefined,
            });
            notify.success(t("wallet.messages.wish_converted"));
            page.setShowConvertModal(false);
            await syncForTab("wishes", { force: true });
        } catch {
            notify.error(t("wallet.messages.wish_convert_failed"));
        } finally {
            page.setConvertingWish(false);
        }
    };

    return (
        <FinanceShellLayout
            activeSection="planning"
            planningView="wishes"
            topbar={(
                <FinancePlanningTopbar
                    title={financeRoute?.title ?? "Wishes"}
                    entityLabel={financeRoute?.entity_label ?? t("wallet.entity_label")}
                    searchOpen={page.searchOpen}
                    searchValue={page.search}
                    onToggleSearch={() => page.setSearchOpen((prev) => !prev)}
                    onSearchChange={page.setSearch}
                />
            )}
            fab={permissions.create && (
                <div className="position-fixed end-0 z-3" style={{ bottom: "calc(92px + env(safe-area-inset-bottom))", right: 20 }}>
                    <button
                        type="button"
                        className="btn btn-primary rounded-circle shadow-lg d-inline-flex align-items-center justify-content-center"
                        style={{ width: 58, height: 58 }}
                        onClick={() => {
                            resetWishForm(null);
                            page.setShowWishModal(true);
                        }}
                    >
                        <i className="ri-add-line fs-3" />
                    </button>
                </div>
            )}
        >
            <>
                <Suspense fallback={<TabLoadingFallback />}>
                    <FinanceWishesTab
                        wishes={filteredWishes}
                        canCreateGoal={permissions.create && (limits.goals === null || limits.goals === -1 || seededGoals.length < limits.goals)}
                        filteredWallets={filteredWallets}
                        onApproveReject={handleWishStatus}
                        onConvert={(wish) => {
                            page.setSelectedWish(wish);
                            page.setConvertForm({
                                wallet_id: filteredWallets.find((wallet) => !wallet.is_system)?.id || filteredWallets[0]?.id || "",
                                target_amount: wish.estimated_amount ? String(wish.estimated_amount) : "",
                                target_date: "",
                                notes: wish.notes || "",
                            } as FinanceWishConvertFormState);
                            page.setShowConvertModal(true);
                        }}
                        onEdit={(wish) => {
                            resetWishForm(wish);
                            page.setShowWishModal(true);
                        }}
                        onDelete={(wish) => void handleDeleteWish(wish)}
                    />
                </Suspense>

                {(page.showWishModal || page.showConvertModal) && (
                    <Suspense fallback={null}>
                        <WishDialogs
                            selectedWish={page.selectedWish}
                            showWishModal={page.showWishModal}
                            setShowWishModal={page.setShowWishModal}
                            wishForm={wishForm}
                            setWishForm={setWishForm}
                            handleSaveWish={handleSaveWish}
                            savingWish={page.savingWish}
                            showConvertModal={page.showConvertModal}
                            setShowConvertModal={page.setShowConvertModal}
                            convertForm={page.convertForm}
                            setConvertForm={page.setConvertForm}
                            handleConvertWish={handleConvertWish}
                            convertingWish={page.convertingWish}
                            wallets={wallets}
                        />
                    </Suspense>
                )}
            </>
        </FinanceShellLayout>
    );
};

export default WishesPage;
