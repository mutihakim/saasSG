import React from "react";
import { Badge, Card, Nav } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceAccount, FinancePocket } from "../../Finance/types";
import { GroupedWalletAccount, WalletPermissions } from "../types";

import { formatCurrency } from "./pwa/types";

type Props = {
    groupedWallets: GroupedWalletAccount[];
    setExpandedAccountId: React.Dispatch<React.SetStateAction<string | null>>;
    activeMemberId?: number | null;
    permissions: WalletPermissions;
    onOpenAccountDetail: (account: FinanceAccount) => void;
    onOpenWalletDetail: (wallet: FinancePocket) => void;
    onAddWallet: (accountId: string) => void;
};

const getAccountVisual = (type: FinanceAccount["type"]) => {
    switch (type) {
        case "cash":
            return { icon: "ri-coins-line", accent: "#16a34a", bg: "rgba(22, 163, 74, 0.08)", gradient: "linear-gradient(135deg, rgba(22,163,74,0.12) 0%, rgba(255,255,255,0.98) 74%)", border: "rgba(22,163,74,0.14)" };
        case "bank":
            return { icon: "ri-bank-line", accent: "#2563eb", bg: "rgba(37, 99, 235, 0.08)", gradient: "linear-gradient(135deg, rgba(37,99,235,0.14) 0%, rgba(255,255,255,0.98) 74%)", border: "rgba(37,99,235,0.14)" };
        case "ewallet":
            return { icon: "ri-wallet-3-line", accent: "#0891b2", bg: "rgba(8, 145, 178, 0.08)", gradient: "linear-gradient(135deg, rgba(8,145,178,0.12) 0%, rgba(255,255,255,0.98) 74%)", border: "rgba(8,145,178,0.14)" };
        case "credit_card":
            return { icon: "ri-bank-card-line", accent: "#7c3aed", bg: "rgba(124, 58, 237, 0.08)", gradient: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(255,255,255,0.98) 74%)", border: "rgba(124,58,237,0.14)" };
        case "paylater":
            return { icon: "ri-secure-payment-line", accent: "#f97316", bg: "rgba(249, 115, 22, 0.08)", gradient: "linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(255,255,255,0.98) 74%)", border: "rgba(249,115,22,0.14)" };
        default:
            return { icon: "ri-bank-card-line", accent: "#475569", bg: "rgba(71, 85, 105, 0.08)", gradient: "linear-gradient(135deg, rgba(71,85,105,0.10) 0%, rgba(255,255,255,0.98) 74%)", border: "rgba(71,85,105,0.14)" };
    }
};

const getBalanceTone = (value: number | string | null | undefined) => {
    const amount = Number(value || 0);
    return amount < 0 ? { color: "#dc2626" } : { color: "#1d4ed8" };
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

const getWalletRibbon = (wallet: FinancePocket) => {
    if (wallet.is_active === false) {
        return { label: "INACTIVE", tone: "danger" };
    }

    if (wallet.budget_lock_enabled) {
        return { label: "LOCKED", tone: "warning" };
    }

    return null;
};

const getAccountRibbon = (account: FinanceAccount) => {
    if (account.is_active === false) {
        return { label: "INACTIVE", tone: "danger" };
    }

    return null;
};

const getPurposeBadge = (purposeType?: FinancePocket["purpose_type"]) => {
    switch (purposeType) {
        case "income":
            return { bg: "success", icon: "ri-arrow-left-down-line", label: "Income" };
        case "saving":
            return { bg: "warning", icon: "ri-safe-2-line", label: "Saving" };
        case "spending":
            return { bg: "danger", icon: "ri-shopping-bag-line", label: "Spending" };
        default:
            return null;
    }
};

const getAccountStatTone = (tone: "success" | "danger" | "warning") => {
    switch (tone) {
        case "success":
            return {
                border: "rgba(22,163,74,0.22)",
                label: "#15803d",
                value: "#166534",
            };
        case "danger":
            return {
                border: "rgba(239,68,68,0.22)",
                label: "#b91c1c",
                value: "#991b1b",
            };
        case "warning":
            return {
                border: "rgba(245,158,11,0.24)",
                label: "#b45309",
                value: "#92400e",
            };
        default:
            return {
                border: "rgba(148,163,184,0.22)",
                label: "#475569",
                value: "#334155",
            };
    }
};

const WalletAccountsTab = ({
    groupedWallets,
    permissions,
    activeMemberId,
    onOpenAccountDetail,
    onOpenWalletDetail,
    onAddWallet,
}: Omit<Props, "expandedAccountId" | "setExpandedAccountId">) => {
    const { t } = useTranslation();
    const [activeAccountId, setActiveAccountId] = React.useState<string | null>(
        groupedWallets.length > 0 ? groupedWallets[0].account.id : null
    );

    const activeGroup = groupedWallets.find((group) => group.account.id === activeAccountId);

    if (!activeGroup && groupedWallets.length > 0 && activeAccountId === null) {
        setActiveAccountId(groupedWallets[0].account.id);
    }

    if (groupedWallets.length === 0) {
        return (
            <div className="text-center py-5 text-muted">
                <i className="ri-wallet-3-line fs-1 d-block mb-2"></i>
                {t("wallet.no_accounts", { defaultValue: "Belum ada akun terdaftar." })}
            </div>
        );
    }

    const { account, wallets: accountWallets } = activeGroup || groupedWallets[0];
    const visual = getAccountVisual(account.type);
    const balanceTone = getBalanceTone(account.current_balance);
    const incomeTone = getAccountStatTone("success");
    const outcomeTone = getAccountStatTone("danger");
    const goalTone = getAccountStatTone("warning");
    const orderedWallets = [...accountWallets].sort((left, right) => {
        if (left.is_system === right.is_system) {
            return left.name.localeCompare(right.name);
        }

        return left.is_system ? -1 : 1;
    });

    return (
        <div className="d-flex flex-column">
            <div
                className="overflow-auto pb-2 mb-3 no-scrollbar"
                style={{
                    whiteSpace: "nowrap",
                    marginInline: "-12px",
                    paddingInline: "12px",
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                }}
            >
                <Nav variant="pills" className="nav-pills-custom gap-2 flex-nowrap">
                    {groupedWallets.map(({ account: acc }) => {
                        const accVisual = getAccountVisual(acc.type);
                        const isActive = activeAccountId === acc.id;

                        return (
                            <Nav.Item key={acc.id}>
                                <Nav.Link
                                    active={isActive}
                                    onClick={() => setActiveAccountId(acc.id)}
                                    className="rounded-pill px-3 py-2 border-0 d-flex align-items-center gap-2"
                                    style={{
                                        background: isActive ? accVisual.accent : "rgba(255,255,255,0.84)",
                                        color: isActive ? "#fff" : "#475569",
                                        boxShadow: isActive ? `0 4px 12px ${accVisual.accent}40` : "0 2px 6px rgba(0,0,0,0.03)",
                                        transition: "all 0.2s ease",
                                        fontSize: "0.82rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    <i className={accVisual.icon} />
                                    <span>{acc.name}</span>
                                </Nav.Link>
                            </Nav.Item>
                        );
                    })}
                </Nav>
            </div>

            <Card
                className="border-0 rounded-4 mb-4 overflow-hidden position-relative card ribbon-box ribbon-fill right"
                style={{
                    background: visual.gradient,
                    border: `1px solid ${visual.border}`,
                    boxShadow: `0 10px 22px ${visual.accent}14, 0 6px 16px rgba(15, 23, 42, 0.05)`,
                    backdropFilter: "blur(10px)",
                }}
            >
                {(() => {
                    const ribbon = getAccountRibbon(account);
                    if (!ribbon) return null;
                    return <div className={`ribbon ribbon-${ribbon.tone} ribbon-shape`}>{ribbon.label}</div>;
                })()}
                <Card.Body className="p-3">
                    <div
                        className="d-flex justify-content-between align-items-start mb-3 cursor-pointer"
                        onClick={() => onOpenAccountDetail(account)}
                        style={{ transition: "opacity 0.15s ease" }}
                        onMouseEnter={(event) => (event.currentTarget.style.opacity = "0.85")}
                        onMouseLeave={(event) => (event.currentTarget.style.opacity = "1")}
                    >
                        <div className="d-flex align-items-center gap-2">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                style={{ width: 42, height: 42, background: "rgba(255,255,255,0.76)", color: visual.accent, border: `1px solid ${visual.border}` }}
                            >
                                <i className={visual.icon} />
                            </div>
                            <div>
                                <div className="d-flex align-items-center flex-wrap gap-2">
                                    <h6 className="mb-0 fw-bold fs-14">{account.name}</h6>
                                    {(() => {
                                        const badge = getAccessBadge(account, activeMemberId);
                                        if (!badge) return null;
                                        return (
                                            <Badge bg={badge.bg} className="rounded-pill shadow-sm" style={{ fontSize: "0.55rem" }}>
                                                <i className={`${badge.icon} me-1`}></i>{badge.label}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                                <span className="small d-block mt-1" style={{ fontSize: "0.72rem", color: "#475569" }}>
                                    {t(`wallet.account_types.${account.type}`)}
                                </span>
                            </div>
                        </div>
                        <div className="text-end">
                            <div className="small text-uppercase fw-semibold" style={{ color: "#64748b", fontSize: "0.6rem", letterSpacing: "0.5px" }}>
                                Balance
                            </div>
                            <div className="fw-bold mt-1" style={{ fontSize: "1rem", color: balanceTone.color }}>
                                {formatCurrency(account.current_balance, account.currency_code)}
                            </div>
                        </div>
                    </div>

                    <div className="row g-2">
                        <div className="col-6">
                            <div
                                className="rounded-pill px-3 py-2 text-center h-100 d-flex flex-column justify-content-center"
                                style={{
                                    background: "transparent",
                                    border: `1px solid ${incomeTone.border}`,
                                }}
                            >
                                <div className="d-flex align-items-center justify-content-center gap-1" style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: incomeTone.label }}>
                                    <i className="ri-arrow-down-line" />
                                    Masuk
                                </div>
                                <div className="fw-bold mt-1" style={{ fontSize: "0.8rem", color: incomeTone.value }}>{formatCurrency(account.period_inflow, account.currency_code)}</div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div
                                className="rounded-pill px-3 py-2 text-center h-100 d-flex flex-column justify-content-center"
                                style={{
                                    background: "transparent",
                                    border: `1px solid ${outcomeTone.border}`,
                                }}
                            >
                                <div className="d-flex align-items-center justify-content-center gap-1" style={{ fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: outcomeTone.label }}>
                                    <i className="ri-arrow-up-line" />
                                    Keluar
                                </div>
                                <div className="fw-bold mt-1" style={{ fontSize: "0.8rem", color: outcomeTone.value }}>{formatCurrency(account.period_outflow, account.currency_code)}</div>
                            </div>
                        </div>
                        <div className="col-12">
                            <div
                                className="rounded-pill px-3 py-2 d-flex align-items-center justify-content-between h-100"
                                style={{
                                    background: "transparent",
                                    border: `1px solid ${goalTone.border}`,
                                }}
                            >
                                <div className="d-flex align-items-center gap-2" style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", color: goalTone.label }}>
                                    <i className="ri-flag-2-line" />
                                    Goal Locked
                                </div>
                                <div
                                    className="fw-bold"
                                    style={{
                                        fontSize: "0.82rem",
                                        color: Number(account.goal_reserved_total || 0) > 0 ? goalTone.value : "#64748b",
                                    }}
                                >
                                    {formatCurrency(account.goal_reserved_total || 0, account.currency_code)}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            <div className="row g-3">
                {orderedWallets.map((wallet) => (
                    <div className="col-6" key={wallet.id}>
                        <button
                            type="button"
                            className="w-100 border-0 p-0 text-start position-relative overflow-hidden shadow-sm card ribbon-box ribbon-fill right"
                            onClick={() => onOpenWalletDetail(wallet)}
                            style={{
                                background: wallet.background_color || "rgba(255,255,255,0.95)",
                                borderRadius: 20,
                                transition: "transform 0.2s ease",
                                height: "100%",
                                minHeight: 120,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                            }}
                        >
                            {(() => {
                                const ribbon = getWalletRibbon(wallet);
                                if (!ribbon) return null;
                                return <div className={`ribbon ribbon-${ribbon.tone} ribbon-shape`}>{ribbon.label}</div>;
                            })()}
                            {Number(wallet.goal_reserved_total || 0) > 0 && (
                                <div
                                    className="position-absolute d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
                                    style={{
                                        right: 10,
                                        bottom: 10,
                                        zIndex: 2,
                                        background: "rgba(255,255,255,0.88)",
                                        boxShadow: "0 4px 10px rgba(15,23,42,0.08)",
                                        border: "1px solid rgba(255,255,255,0.65)",
                                        backdropFilter: "blur(8px)",
                                    }}
                                >
                                    <i className="ri-flag-2-line text-warning" style={{ fontSize: "0.72rem" }} />
                                    <span className="fw-bold text-warning" style={{ fontSize: "0.68rem", lineHeight: 1 }}>
                                        {formatCurrency(wallet.goal_reserved_total || 0, wallet.currency_code)}
                                    </span>
                                </div>
                            )}
                            <div className="p-3 w-100">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center bg-white bg-opacity-25"
                                        style={{ width: 30, height: 30 }}
                                    >
                                        <i className={wallet.icon_key || "ri-wallet-3-line"} style={{ fontSize: "0.95rem" }} />
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                        {(() => {
                                            const purposeBadge = getPurposeBadge(wallet.purpose_type);
                                            if (!purposeBadge) return null;
                                            return (
                                                <Badge
                                                    bg={purposeBadge.bg}
                                                    className="rounded-pill p-0 d-inline-flex align-items-center justify-content-center shadow-sm"
                                                    title={purposeBadge.label}
                                                    aria-label={purposeBadge.label}
                                                    style={{ width: 22, height: 22 }}
                                                >
                                                    <i className={purposeBadge.icon} style={{ fontSize: "0.75rem" }}></i>
                                                </Badge>
                                            );
                                        })()}
                                        {(() => {
                                            const badge = getAccessBadge(wallet, activeMemberId);
                                            if (!badge) return null;
                                            return (
                                                <Badge
                                                    bg={badge.bg}
                                                    className="rounded-pill p-0 d-inline-flex align-items-center justify-content-center shadow-sm"
                                                    title={badge.label}
                                                    aria-label={badge.label}
                                                    style={{ width: 22, height: 22 }}
                                                >
                                                    <i className={badge.icon} style={{ fontSize: "0.75rem" }}></i>
                                                </Badge>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                    <div
                                        className="fw-bold text-truncate"
                                        style={{ fontSize: "0.82rem", color: "#1e293b" }}
                                    >
                                        {wallet.name}
                                    </div>
                                    {wallet.is_system && (
                                        <i
                                            className="ri-pushpin-2-fill text-dark flex-shrink-0"
                                            title="Main wallet"
                                            aria-label="Main wallet"
                                            style={{ fontSize: "0.82rem", opacity: 0.68 }}
                                        />
                                    )}
                                </div>
                                <div
                                    className="fw-bold mt-auto"
                                    style={{ fontSize: "0.86rem", color: getBalanceTone(wallet.current_balance).color }}
                                >
                                    {formatCurrency(wallet.current_balance, wallet.currency_code)}
                                </div>
                            </div>
                        </button>
                    </div>
                ))}

                {permissions.create && (
                    <div className="col-6">
                        <button
                            type="button"
                            className="w-100 border-0 p-3 text-center d-flex flex-column align-items-center justify-content-center gap-2"
                            onClick={() => onAddWallet(account.id)}
                            style={{
                                background: "rgba(15, 23, 42, 0.03)",
                                border: "2px dashed rgba(15, 23, 42, 0.08)",
                                borderRadius: 20,
                                minHeight: 120,
                                color: "#64748b",
                            }}
                        >
                            <div
                                className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center"
                                style={{ width: 32, height: 32 }}
                            >
                                <i className="ri-add-line fs-5"></i>
                            </div>
                            <span className="fw-bold" style={{ fontSize: "0.75rem" }}>Tambah Dompet</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletAccountsTab;
