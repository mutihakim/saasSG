import React from "react";
import { Badge, Card, Nav } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceAccount, FinancePocket } from "../../Finance/types";
import { GroupedWalletAccount, WalletPermissions } from "../types";
import { formatCurrency } from "./pwa/types";

type Props = {
    groupedWallets: GroupedWalletAccount[];
    expandedAccountId: string | null;
    setExpandedAccountId: React.Dispatch<React.SetStateAction<string | null>>;
    permissions: WalletPermissions;
    onOpenAccountDetail: (account: FinanceAccount) => void;
    onOpenWalletDetail: (wallet: FinancePocket) => void;
    onAddWallet: (accountId: string) => void;
};

const getAccountVisual = (type: FinanceAccount["type"]) => {
    switch (type) {
        case "cash":
            return { icon: "ri-coins-line", accent: "#16a34a", bg: "rgba(22, 163, 74, 0.10)" };
        case "bank":
            return { icon: "ri-bank-line", accent: "#2563eb", bg: "rgba(37, 99, 235, 0.10)" };
        case "ewallet":
            return { icon: "ri-wallet-3-line", accent: "#0891b2", bg: "rgba(8, 145, 178, 0.10)" };
        case "credit_card":
            return { icon: "ri-bank-card-line", accent: "#7c3aed", bg: "rgba(124, 58, 237, 0.10)" };
        case "paylater":
            return { icon: "ri-secure-payment-line", accent: "#f97316", bg: "rgba(249, 115, 22, 0.10)" };
        default:
            return { icon: "ri-bank-card-line", accent: "#475569", bg: "rgba(71, 85, 105, 0.10)" };
    }
};

const getBalanceTone = (value: number | string | null | undefined) => {
    const amount = Number(value || 0);
    return amount < 0 ? { color: "#dc2626" } : { color: "#1d4ed8" };
};

const WalletAccountsTab = ({
    groupedWallets,
    permissions,
    onOpenAccountDetail,
    onOpenWalletDetail,
    onAddWallet,
}: Omit<Props, 'expandedAccountId' | 'setExpandedAccountId'>) => {
    const { t } = useTranslation();
    const [activeAccountId, setActiveAccountId] = React.useState<string | null>(
        groupedWallets.length > 0 ? groupedWallets[0].account.id : null
    );

    const activeGroup = groupedWallets.find(g => g.account.id === activeAccountId);
    
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
    const orderedWallets = [...accountWallets].sort((left, right) => {
        if (left.is_system === right.is_system) {
            return left.name.localeCompare(right.name);
        }
        return left.is_system ? -1 : 1;
    });

    return (
        <div className="d-flex flex-column">
            {/* Account Tabs */}
            <div 
                className="overflow-auto pb-2 mb-3 no-scrollbar" 
                style={{ 
                    whiteSpace: 'nowrap', 
                    marginInline: '-12px', 
                    paddingInline: '12px',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none'
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
                                        background: isActive ? accVisual.accent : 'rgba(255,255,255,0.8)',
                                        color: isActive ? '#fff' : '#475569',
                                        boxShadow: isActive ? `0 4px 12px ${accVisual.accent}40` : '0 2px 6px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s ease',
                                        fontSize: '0.82rem',
                                        fontWeight: 600
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

            {/* Account Summary & Detail Link */}
            <Card 
                className="border-0 rounded-4 mb-4" 
                style={{ 
                    background: 'rgba(255,255,255,0.95)', 
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)'
                }}
            >
                <Card.Body className="p-3">
                    <div
                        className="d-flex justify-content-between align-items-center mb-3 cursor-pointer"
                        onClick={() => onOpenAccountDetail(account)}
                        style={{ transition: 'opacity 0.15s ease' }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                        <div className="d-flex align-items-center gap-2">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                style={{ width: 36, height: 36, background: visual.bg, color: visual.accent }}
                            >
                                <i className={visual.icon} />
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold fs-14">{account.name}</h6>
                                <span className="small text-muted" style={{ fontSize: '0.7rem' }}>
                                    {t(`wallet.account_types.${account.type}`)}
                                </span>
                            </div>
                        </div>
                        <div className="fw-bold" style={{ fontSize: '0.85rem', color: balanceTone.color }}>
                            {formatCurrency(account.current_balance, account.currency_code)}
                        </div>
                    </div>

                    <div className="row g-2">
                        <div className="col-6">
                            <div className="bg-light rounded-3 p-2 text-center h-100">
                                <div className="text-muted" style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase' }}>Masuk</div>
                                <div className="fw-bold text-success mt-1" style={{ fontSize: '0.8rem' }}>{formatCurrency(account.period_inflow, account.currency_code)}</div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="bg-light rounded-3 p-2 text-center h-100">
                                <div className="text-muted" style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase' }}>Keluar</div>
                                <div className="fw-bold text-danger mt-1" style={{ fontSize: '0.8rem' }}>{formatCurrency(account.period_outflow, account.currency_code)}</div>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Wallet Grid */}
            <div className="row g-3">
                {orderedWallets.map((wallet) => (
                    <div className="col-6" key={wallet.id}>
                        <button
                            type="button"
                            className="w-100 border-0 p-0 text-start position-relative overflow-hidden shadow-sm"
                            onClick={() => onOpenWalletDetail(wallet)}
                            style={{
                                background: wallet.background_color || 'rgba(255,255,255,0.95)',
                                borderRadius: 20,
                                transition: 'transform 0.2s ease',
                                height: '100%',
                                minHeight: '120px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div className="p-3 w-100">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center bg-white bg-opacity-25"
                                        style={{ width: 28, height: 28 }}
                                    >
                                        <i className={wallet.icon_key || "ri-wallet-3-line"} style={{ fontSize: '0.9rem' }} />
                                    </div>
                                    <div className="d-flex align-items-center gap-1">
                                        {/* Purpose Badge */}
                                        {wallet.purpose_type && (
                                            <Badge
                                                bg={wallet.purpose_type === 'spending' ? 'danger' : wallet.purpose_type === 'saving' ? 'warning' : 'success'}
                                                className="rounded-pill px-2 py-1 shadow-sm"
                                                style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.03em' }}
                                            >
                                                <i className={`${wallet.purpose_type === 'spending' ? 'ri-shopping-bag-line' : wallet.purpose_type === 'saving' ? 'ri-safe-2-line' : 'ri-money-dollar-circle-line'} me-1`} style={{ fontSize: '0.55rem' }} />
                                                {wallet.purpose_type === 'spending' ? 'SPEND' : wallet.purpose_type === 'saving' ? 'SAVE' : 'INCOME'}
                                            </Badge>
                                        )}
                                        {wallet.is_system && (
                                            <Badge bg="white" text="dark" className="bg-opacity-50 border-0 fw-bold" style={{ fontSize: '0.5rem', letterSpacing: '0.05em' }}>MAIN</Badge>
                                        )}
                                    </div>
                                </div>
                                <div 
                                    className="fw-bold text-truncate mb-1" 
                                    style={{ fontSize: '0.82rem', color: '#1e293b' }}
                                >
                                    {wallet.name}
                                </div>
                                <div className="fw-bold mt-auto" style={{ fontSize: '0.85rem', color: getBalanceTone(wallet.current_balance).color }}>
                                    {formatCurrency(wallet.current_balance, wallet.currency_code)}
                                </div>
                            </div>
                            
                            {/* Decorative element */}
                            <div className="position-absolute top-0 end-0 m-n3 bg-white bg-opacity-10 rounded-circle" style={{ width: 80, height: 80 }} />
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
                                background: 'rgba(15, 23, 42, 0.03)',
                                border: '2px dashed rgba(15, 23, 42, 0.08)',
                                borderRadius: 20,
                                minHeight: '120px',
                                color: '#64748b'
                            }}
                        >
                            <div className="rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                <i className="ri-add-line fs-5"></i>
                            </div>
                            <span className="fw-bold" style={{ fontSize: '0.75rem' }}>Tambah Dompet</span>
                        </button>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .nav-pills-custom .nav-link:not(.active):hover {
                    background: rgba(255,255,255,1) !important;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.05) !important;
                }
            `}} />
        </div>
    );
};


export default WalletAccountsTab;
