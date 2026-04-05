import React, { useMemo, useState } from "react";
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
    onAddItemToGroup: (transaction: any) => void;
    onDeleteGroup: (group: { sourceId: string; summary: string; transactions: any[] }) => void;
}

type RenderEntry =
    | { kind: "transaction"; transaction: any }
    | {
        kind: "bulk";
        sourceId: string;
        summary: string;
        ownerName: string;
        count: number;
        totalAmount: number;
        currencyCode: string;
        transactions: any[];
    };

const TransactionGroupedList = ({
    transactions,
    defaultCurrency,
    showTransferHint,
    quickType,
    selectedTransactionId,
    onQuickTypeChange,
    onTransactionClick,
    onAddItemToGroup,
    onDeleteGroup,
}: TransactionGroupedListProps) => {
    const { t } = useTranslation();
    const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>([]);

    const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
        if (quickType === "all") {
            return true;
        }

        return transaction.type === quickType;
    }), [quickType, transactions]);

    const groupedTransactions = useMemo(() => filteredTransactions.reduce((acc, transaction) => {
        const key = String(transaction.transaction_date || "").slice(0, 10);
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(transaction);
        return acc;
    }, {} as Record<string, any[]>), [filteredTransactions]);

    const groups = Object.entries(groupedTransactions).sort((a, b) => b[0].localeCompare(a[0])) as [string, any[]][];

    const buildEntries = (items: any[]): RenderEntry[] => {
        const bulkBuckets = new Map<string, any[]>();
        const singles: any[] = [];

        items.forEach((transaction) => {
            if (transaction.source_type === "finance_bulk" && transaction.source_id) {
                const key = String(transaction.source_id);
                if (!bulkBuckets.has(key)) {
                    bulkBuckets.set(key, []);
                }
                bulkBuckets.get(key)!.push(transaction);
                return;
            }

            singles.push(transaction);
        });

        const bulkEntries: RenderEntry[] = Array.from(bulkBuckets.entries()).map(([sourceId, groupItems]) => {
            const sortedGroupItems = [...groupItems].sort((a, b) => String(b.created_at || b.id || "").localeCompare(String(a.created_at || a.id || "")));
            const first = sortedGroupItems[0];
            const summary = first?.merchant_name || first?.notes || first?.description || `Bulk Entry`;

            return {
                kind: "bulk",
                sourceId,
                summary,
                ownerName: first?.owner_member?.full_name || "-",
                count: sortedGroupItems.length,
                totalAmount: sortedGroupItems.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
                currencyCode: first?.currency_code || defaultCurrency,
                transactions: sortedGroupItems,
            };
        });

        const singleEntries: RenderEntry[] = singles.map((transaction) => ({
            kind: "transaction",
            transaction,
        }));

        return [...bulkEntries, ...singleEntries].sort((a, b) => {
            const left = a.kind === "bulk" ? a.transactions[0] : a.transaction;
            const right = b.kind === "bulk" ? b.transactions[0] : b.transaction;
            return String(right.created_at || right.id || "").localeCompare(String(left.created_at || left.id || ""));
        });
    };

    const isExpanded = (sourceId: string) => expandedGroupIds.includes(sourceId);

    const toggleExpanded = (sourceId: string) => {
        setExpandedGroupIds((prev) => prev.includes(sourceId)
            ? prev.filter((item) => item !== sourceId)
            : [...prev, sourceId]);
    };

    const renderSingleTransaction = (transaction: any, compact = false) => {
        const incoming = transaction.type === "pemasukan" || transaction.transfer_direction === "in";
        const amountClass = incoming ? "text-info" : "text-danger";
        const prefix = incoming ? "+" : "-";
        const itemAccent = transaction.category?.color || (transaction.type === "transfer" ? "#8d92ff" : incoming ? "#47b4ff" : "#ff7a6b");

        return (
            <div
                key={transaction.id}
                id={`finance-transaction-${transaction.id}`}
                className={`px-3 ${compact ? "py-2" : "py-3"}`}
                style={{
                    transition: "background-color 140ms ease, box-shadow 140ms ease",
                    WebkitTapHighlightColor: "transparent",
                    backgroundColor: selectedTransactionId === String(transaction.id) ? "#f7fbff" : "transparent",
                }}
                data-active={selectedTransactionId === String(transaction.id) ? "true" : "false"}
                data-testid={`finance-transaction-row-${transaction.id}`}
            >
                <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className="d-flex align-items-start gap-3 flex-grow-1 overflow-hidden">
                        <button
                            type="button"
                            className="btn p-0 d-flex align-items-start gap-3 flex-grow-1 text-start border-0 bg-transparent overflow-hidden"
                            onClick={() => onTransactionClick(transaction)}
                        >
                            <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                style={{
                                    width: compact ? 38 : 46,
                                    height: compact ? 38 : 46,
                                    background: `${itemAccent}1a`,
                                    color: itemAccent,
                                }}
                            >
                                <i className={transaction.category?.icon || (transaction.type === "transfer" ? "ri-repeat-line" : "ri-wallet-3-line")}></i>
                            </div>
                            <div className="flex-grow-1 overflow-hidden">
                                <div className="fw-semibold text-dark text-truncate">
                                    {transaction.description || transaction.category?.name || t("finance.shared.untitled")}
                                </div>
                                <div className="small text-muted text-truncate mt-1">
                                    {[transaction.owner_member?.full_name || "-", transaction.bank_account?.name || null].filter(Boolean).join(" · ")}
                                </div>
                            </div>
                        </button>
                    </div>
                    <div className="text-end flex-shrink-0 d-flex align-items-start gap-2">
                        <div>
                            <div className={`fw-bold ${amountClass}`}>
                                {prefix} {formatAmount(Number(transaction.amount || 0), transaction.currency_code || defaultCurrency)}
                            </div>
                            {transaction.budget_status === "over_budget" && (
                                <Badge bg="warning-subtle" text="warning" className="mt-2 rounded-pill px-2 py-1">
                                    {t("finance.budgets.status.over")}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                groups.map(([key, items]) => {
                    const entries = buildEntries(items);

                    return (
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
                                {entries.map((entry, index) => {
                                    if (entry.kind === "transaction") {
                                        return (
                                            <div key={entry.transaction.id} className={index < entries.length - 1 ? "border-bottom" : ""}>
                                                {renderSingleTransaction(entry.transaction)}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={`bulk-${entry.sourceId}`} className={index < entries.length - 1 ? "border-bottom" : ""}>
                                            <button
                                                type="button"
                                                className="btn w-100 text-start px-3 py-3 bg-transparent border-0 rounded-0"
                                                onClick={() => toggleExpanded(entry.sourceId)}
                                            >
                                                <div className="d-flex align-items-start justify-content-between gap-3">
                                                    <div className="d-flex align-items-start gap-3 flex-grow-1 overflow-hidden">
                                                        <div
                                                            className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                                                            style={{
                                                                width: 46,
                                                                height: 46,
                                                                background: "rgba(15, 118, 110, 0.12)",
                                                                color: "#0f766e",
                                                            }}
                                                        >
                                                            <i className="ri-stack-line"></i>
                                                        </div>
                                                        <div className="flex-grow-1 overflow-hidden">
                                                            <div className="fw-semibold text-dark text-truncate">{entry.summary}</div>
                                                            <div className="small text-muted text-truncate mt-1">
                                                                {entry.count} item · {entry.ownerName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-end flex-shrink-0">
                                                        <div className="fw-bold text-danger">
                                                            - {formatAmount(entry.totalAmount, entry.currencyCode)}
                                                        </div>
                                                        <div className="small text-muted mt-1">
                                                            {isExpanded(entry.sourceId) ? "Sembunyikan" : "Lihat detail"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                            {isExpanded(entry.sourceId) && (
                                                <div className="bg-light border-top">
                                                    <div className="px-3 py-2 border-bottom bg-white">
                                                        <div className="small text-muted text-truncate">Kelola item di grup ini</div>
                                                    </div>
                                                    {entry.transactions.map((transaction, childIndex) => (
                                                        <div key={transaction.id} className={childIndex < entry.transactions.length - 1 ? "border-bottom" : ""}>
                                                            {renderSingleTransaction(transaction, true)}
                                                        </div>
                                                    ))}
                                                    <div className="px-3 py-3 border-top bg-white">
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                type="button"
                                                                className="btn btn-light rounded-pill flex-fill"
                                                                onClick={() => onAddItemToGroup(entry.transactions[0])}
                                                            >
                                                                <i className="ri-add-line me-1"></i>
                                                                Tambah Item ke Grup Ini
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger rounded-pill flex-fill"
                                                                onClick={() => onDeleteGroup({
                                                                    sourceId: entry.sourceId,
                                                                    summary: entry.summary,
                                                                    transactions: entry.transactions,
                                                                })}
                                                            >
                                                                <i className="ri-delete-bin-line me-1"></i>
                                                                Hapus Grup
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default TransactionGroupedList;
