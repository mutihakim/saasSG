import React from "react";
import { Alert, Badge, Button, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { CARD_RADIUS, FINANCE_TOPBAR_STICKY_OFFSET, QuickType, SURFACE_BG, formatAmount, formatDateLabel } from "./types";

interface TransactionGroupedListProps {
    transactions: any[];
    defaultCurrency: string;
    showTransferHint: boolean;
    quickType: QuickType;
    selectedTransactionId?: string | null;
    onQuickTypeChange: (value: QuickType) => void;
    onTransactionClick: (transaction: any) => void;
}

const TransactionGroupedList = ({
    transactions,
    defaultCurrency,
    showTransferHint,
    quickType,
    selectedTransactionId,
    onQuickTypeChange,
    onTransactionClick,
}: TransactionGroupedListProps) => {
    const { t } = useTranslation();

    const filteredTransactions = transactions.filter((transaction) => {
        if (quickType === "all") {
            return true;
        }

        return transaction.type === quickType;
    });

    const groupedTransactions = filteredTransactions.reduce((acc, transaction) => {
        const key = String(transaction.transaction_date || "").slice(0, 10);
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(transaction);
        return acc;
    }, {} as Record<string, any[]>);

    const groups = Object.entries(groupedTransactions as Record<string, any[]>).sort((a, b) => b[0].localeCompare(a[0])) as [string, any[]][];

    return (
        <div>
            <div className="d-flex gap-2 overflow-auto pb-2 mb-3">
                {([
                    { value: "all", label: t("finance.pwa.quick_filters.all") },
                    { value: "pemasukan", label: t("finance.pwa.quick_filters.income") },
                    { value: "pengeluaran", label: t("finance.pwa.quick_filters.expense") },
                ] as { value: QuickType; label: string }[]).map((item) => (
                    <Button
                        key={item.value}
                        variant={quickType === item.value ? "dark" : "light"}
                        className="rounded-pill px-3 flex-shrink-0"
                        onClick={() => onQuickTypeChange(item.value)}
                    >
                        {item.label}
                    </Button>
                ))}
            </div>

            {showTransferHint && (
                <Alert variant="info" className="border-0 shadow-sm" style={{ borderRadius: CARD_RADIUS }}>
                    {t("finance.pwa.transfer_excluded_hint")}
                </Alert>
            )}

            {groups.length === 0 ? (
                <Card className="border-0 shadow-sm" style={{ borderRadius: CARD_RADIUS }}>
                    <Card.Body className="text-center py-5">
                        <div className="fw-semibold mb-2">{t("finance.pwa.empty.transactions_title")}</div>
                        <div className="text-muted small">{t("finance.pwa.empty.transactions_body")}</div>
                    </Card.Body>
                </Card>
            ) : (
                groups.map(([key, items]) => (
                    <div key={key} className="mb-4">
                        <div className="position-sticky z-2 py-2" style={{ top: FINANCE_TOPBAR_STICKY_OFFSET, background: SURFACE_BG }}>
                            <div className="d-flex align-items-center justify-content-between px-1">
                                <div className="fw-semibold text-dark">{formatDateLabel(key)}</div>
                                <div className="small text-muted">
                                                            {formatAmount(items.reduce((sum: number, item: any) => sum + Number(item.amount_base || 0), 0), defaultCurrency)}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
                            {items.map((transaction, index) => {
                                const incoming = transaction.type === "pemasukan" || transaction.transfer_direction === "in";
                                const amountClass = incoming ? "text-info" : "text-danger";
                                const prefix = incoming ? "+" : "-";
                                const accent = transaction.type === "transfer" ? "#8d92ff" : incoming ? "#47b4ff" : "#ff7a6b";

                                return (
                                    <button
                                        key={transaction.id}
                                        id={`finance-transaction-${transaction.id}`}
                                        type="button"
                                        className={`btn w-100 text-start px-3 py-3 bg-transparent border-0 rounded-0 ${index < items.length - 1 ? "border-bottom" : ""}`}
                                        style={{
                                            transition: "background-color 140ms ease, box-shadow 140ms ease",
                                            WebkitTapHighlightColor: "transparent",
                                            backgroundColor: selectedTransactionId === String(transaction.id) ? "#f7fbff" : "transparent",
                                        }}
                                        onClick={() => onTransactionClick(transaction)}
                                        data-active={selectedTransactionId === String(transaction.id) ? "true" : "false"}
                                        data-testid={`finance-transaction-row-${transaction.id}`}
                                    >
                                        <div className="d-flex align-items-start justify-content-between gap-3">
                                            <div className="d-flex align-items-start gap-3 flex-grow-1 overflow-hidden">
                                                <div
                                                    className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                    style={{
                                                        width: 46,
                                                        height: 46,
                                                        background: `${accent}1a`,
                                                        color: accent,
                                                    }}
                                                >
                                                    <i className={transaction.category?.icon || (transaction.type === "transfer" ? "ri-repeat-line" : "ri-wallet-3-line")}></i>
                                                </div>
                                                <div className="flex-grow-1 overflow-hidden">
                                                    <div className="fw-semibold text-dark text-truncate">
                                                        {transaction.description || transaction.category?.name || t("finance.shared.untitled")}
                                                    </div>
                                                    <div className="small text-muted text-truncate mt-1">
                                                        {transaction.category?.name || t("finance.shared.uncategorized")}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-end flex-shrink-0">
                                                <div className={`fw-bold ${amountClass}`}>
                                                    {prefix} {formatAmount(Number(transaction.amount || 0), transaction.currency_code || defaultCurrency)}
                                                </div>
                                                <div className="small text-muted mt-1">{transaction.owner_member?.full_name || "-"}</div>
                                                {transaction.budget_status === "over_budget" && (
                                                    <Badge bg="warning-subtle" text="warning" className="mt-2 rounded-pill px-2 py-1">
                                                        {t("finance.budgets.status.over")}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default TransactionGroupedList;
