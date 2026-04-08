import React from "react";
import { Button, Card, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { notify } from "../../../../common/notify";
import { FinanceAccount, FinanceLimits } from "../types";

import { CARD_RADIUS, formatAmount } from "./pwa/types";

type AccountsTabProps = {
    accounts: FinanceAccount[];
    defaultCurrency: string;
    activeMemberId?: number | null;
    permissions: {
        manageShared: boolean;
    };
    canManageFinanceStructures: boolean;
    accountCreateDisabled: boolean;
    limits: FinanceLimits;
    totalAssets: number;
    totalLiabilities: number;
    onCreate: () => void;
    onEdit: (account: FinanceAccount) => void;
};

const getAccessBadge = (entity: any, activeMemberId?: number | null) => {
    if (!activeMemberId || !entity) return null;
    if (String(entity.owner_member_id) === String(activeMemberId)) {
        return { label: "Owner", bg: "primary", icon: "ri-star-fill" };
    }
    const accessList = entity.member_access || entity.memberAccess || [];
    const myAccess = accessList.find((m: any) => String(m.id) === String(activeMemberId));
    if (myAccess) {
        if (myAccess.pivot?.can_manage || myAccess.can_manage) return { label: "Manage", bg: "warning", icon: "ri-shield-user-fill" };
        if (myAccess.pivot?.can_use || myAccess.can_use) return { label: "Use", bg: "success", icon: "ri-check-double-line" };
        if (myAccess.pivot?.can_view || myAccess.can_view) return { label: "View", bg: "secondary", icon: "ri-eye-line" };
    }
    return null;
};

const getAccountRibbon = (account: FinanceAccount) => {
    if (account.is_active === false) {
        return { label: "INACTIVE", tone: "danger" };
    }

    return null;
};

const getAccountVisual = (type: FinanceAccount["type"]) => {
    switch (type) {
        case "cash":
            return { accent: "#16a34a", gradient: "linear-gradient(135deg, rgba(22,163,74,0.14) 0%, rgba(255,255,255,0.98) 70%)", border: "rgba(22,163,74,0.16)", icon: "ri-coins-line" };
        case "bank":
            return { accent: "#2563eb", gradient: "linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(255,255,255,0.98) 72%)", border: "rgba(37,99,235,0.16)", icon: "ri-bank-line" };
        case "ewallet":
            return { accent: "#0891b2", gradient: "linear-gradient(135deg, rgba(8,145,178,0.16) 0%, rgba(255,255,255,0.98) 72%)", border: "rgba(8,145,178,0.16)", icon: "ri-wallet-3-line" };
        case "credit_card":
            return { accent: "#7c3aed", gradient: "linear-gradient(135deg, rgba(124,58,237,0.16) 0%, rgba(255,255,255,0.98) 72%)", border: "rgba(124,58,237,0.16)", icon: "ri-bank-card-line" };
        case "paylater":
            return { accent: "#f97316", gradient: "linear-gradient(135deg, rgba(249,115,22,0.16) 0%, rgba(255,255,255,0.98) 72%)", border: "rgba(249,115,22,0.16)", icon: "ri-secure-payment-line" };
        default:
            return { accent: "#475569", gradient: "linear-gradient(135deg, rgba(71,85,105,0.14) 0%, rgba(255,255,255,0.98) 70%)", border: "rgba(71,85,105,0.16)", icon: "ri-bank-card-line" };
    }
};

const AccountsTab = ({
    accounts,
    defaultCurrency,
    activeMemberId,
    permissions,
    canManageFinanceStructures,
    accountCreateDisabled,
    limits,
    totalAssets,
    totalLiabilities,
    onCreate,
    onEdit,
}: AccountsTabProps) => {
    const { t } = useTranslation();

    return (
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

                            onCreate();
                        }}
                    >
                        {t("finance.accounts.modal.add_title")}
                    </Button>
                </div>
            )}
            <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
                {accounts.map((account, index) => (
                    <div
                        key={account.id}
                        className={`position-relative overflow-hidden ribbon-box ribbon-fill right ${index < accounts.length - 1 ? "border-bottom" : ""}`}
                        style={{
                            background: getAccountVisual(account.type).gradient,
                            borderBottomColor: index < accounts.length - 1 ? "rgba(226,232,240,0.8)" : undefined,
                        }}
                    >
                        {(() => {
                            const ribbon = getAccountRibbon(account);
                            if (!ribbon) return null;
                            return (
                                <div className={`ribbon ribbon-${ribbon.tone} ribbon-shape`}>{ribbon.label}</div>
                            );
                        })()}
                        <button
                            type="button"
                            data-testid={`finance-account-row-${account.id}`}
                            className="btn w-100 text-start bg-transparent border-0 rounded-0 px-3 py-3"
                            onClick={() => {
                                if (!permissions.manageShared && String(account.owner_member_id || "") !== String(activeMemberId || "")) {
                                    return;
                                }

                                onEdit(account);
                            }}
                        >
                            <div className="d-flex justify-content-between gap-3 align-items-start">
                                <div className="text-start d-flex gap-2">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                                        style={{
                                            width: 38,
                                            height: 38,
                                            background: "rgba(255,255,255,0.82)",
                                            color: getAccountVisual(account.type).accent,
                                            border: `1px solid ${getAccountVisual(account.type).border}`,
                                        }}
                                    >
                                        <i className={getAccountVisual(account.type).icon}></i>
                                    </div>
                                    <div className="min-w-0">
                                    <div className="fw-semibold text-dark d-flex align-items-center flex-wrap gap-2">
                                        {account.name}
                                        {(() => {
                                            const badge = getAccessBadge(account, activeMemberId);
                                            if (!badge) return null;
                                            return (
                                                <Badge bg={badge.bg} className="rounded-pill shadow-sm" style={{ fontSize: '0.6rem' }}>
                                                    <i className={`${badge.icon} me-1`}></i>{badge.label}
                                                </Badge>
                                            );
                                        })()}
                                    </div>
                                    <div className="small mt-1" style={{ color: "#64748b" }}>{account.owner_member?.full_name || t("finance.shared.shared")} · {account.scope === "shared" ? t("finance.shared.shared") : t("finance.shared.private")}</div>
                                    </div>
                                </div>
                                <div className="fw-bold" style={{ color: getAccountVisual(account.type).accent }}>{formatAmount(Number(account.current_balance || 0), account.currency_code)}</div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center gap-3 mt-2 pt-2 border-top">
                                <div className="small text-muted text-uppercase fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "0.65rem", letterSpacing: "0.4px" }}>
                                    <i className="ri-flag-2-line text-warning"></i>
                                    Goal Locked
                                </div>
                                <div
                                    className={`fw-semibold small ${Number(account.goal_reserved_total || 0) > 0 ? "text-warning" : "text-muted"}`}
                                    style={{ minWidth: 72, textAlign: "right" }}
                                >
                                    {formatAmount(Number(account.goal_reserved_total || 0), account.currency_code)}
                                </div>
                            </div>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccountsTab;
