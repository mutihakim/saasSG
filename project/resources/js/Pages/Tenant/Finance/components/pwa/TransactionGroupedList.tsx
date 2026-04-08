import React, { useMemo, useState } from "react";
import { Alert, Card, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceTransaction } from "../../types";
import BulkTransactionCard from "./BulkTransactionCard";
import TransactionCard from "./TransactionCard";
import { CARD_RADIUS, FINANCE_TOPBAR_STICKY_OFFSET, SURFACE_BG, formatAmount, formatDateLabel } from "./types";
import { buildTransactionEntries, getSignedAmountBase } from "./transactionListUtils";

type TransactionGroupTarget = {
    sourceId: string;
    summary: string;
    transactions: FinanceTransaction[];
};

interface TransactionGroupedListProps {
    transactions: FinanceTransaction[];
    defaultCurrency: string;
    showTransferHint: boolean;
    selectedTransactionId?: string | null;
    hasMore?: boolean;
    isLoadingMore?: boolean;
    loadMoreRef?: React.RefObject<HTMLDivElement | null>;
    onTransactionClick: (transaction: FinanceTransaction) => void;
    onAddItemToGroup: (transaction: FinanceTransaction) => void;
    onDeleteGroup: (group: TransactionGroupTarget) => void;
}

const TransactionGroupedList = ({
    transactions,
    defaultCurrency,
    showTransferHint,
    selectedTransactionId,
    hasMore = false,
    isLoadingMore = false,
    loadMoreRef,
    onTransactionClick,
    onAddItemToGroup,
    onDeleteGroup,
}: TransactionGroupedListProps) => {
    const { t } = useTranslation();
    const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>([]);

    const groupedTransactions = useMemo(() => transactions.reduce((acc, transaction) => {
        const key = String(transaction.transaction_date || "").slice(0, 10);
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(transaction);
        return acc;
    }, {} as Record<string, FinanceTransaction[]>), [transactions]);

    const groups = Object.entries(groupedTransactions).sort((a, b) => b[0].localeCompare(a[0])) as [string, FinanceTransaction[]][];

    const toggleExpanded = (sourceId: string) => {
        setExpandedGroupIds((prev) => prev.includes(sourceId)
            ? prev.filter((item) => item !== sourceId)
            : [...prev, sourceId]);
    };

    return (
        <div>
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
                    const entries = buildTransactionEntries(items, defaultCurrency, t);

                    return (
                        <div key={key} className="mb-3">
                            <div className="position-sticky z-2 py-2" style={{ top: FINANCE_TOPBAR_STICKY_OFFSET, background: SURFACE_BG }}>
                                <div className="d-flex align-items-center justify-content-between px-1">
                                    <div className="fw-semibold text-dark">{formatDateLabel(key)}</div>
                                    <div className="small text-muted">
                                        {formatAmount(items.reduce((sum, item) => sum + getSignedAmountBase(item), 0), defaultCurrency)}
                                    </div>
                                </div>
                            </div>
                            <div className="d-grid" style={{ gap: 8 }}>
                                {entries.map((entry) => {
                                    if (entry.kind === "transaction") {
                                        return (
                                            <TransactionCard
                                                key={entry.transaction.id}
                                                transaction={entry.transaction}
                                                defaultCurrency={defaultCurrency}
                                                selected={selectedTransactionId === String(entry.transaction.id)}
                                                onClick={onTransactionClick}
                                            />
                                        );
                                    }

                                    return (
                                        <BulkTransactionCard
                                            key={`bulk-${entry.sourceId}`}
                                            entry={entry}
                                            defaultCurrency={defaultCurrency}
                                            expanded={expandedGroupIds.includes(entry.sourceId)}
                                            onToggle={() => toggleExpanded(entry.sourceId)}
                                            onAddItemToGroup={onAddItemToGroup}
                                            onDeleteGroup={onDeleteGroup}
                                            onTransactionClick={onTransactionClick}
                                            selectedTransactionId={selectedTransactionId}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}

            <div ref={loadMoreRef} className="py-3 text-center">
                {isLoadingMore ? (
                    <div className="d-inline-flex align-items-center gap-2 small text-muted">
                        <Spinner animation="border" size="sm" />
                        Memuat transaksi berikutnya...
                    </div>
                ) : hasMore ? (
                    <div className="small text-muted">Gulir ke bawah untuk memuat transaksi berikutnya</div>
                ) : transactions.length > 0 ? (
                    <div className="small text-muted">Semua transaksi untuk filter ini sudah dimuat</div>
                ) : null}
            </div>
        </div>
    );
};

export default TransactionGroupedList;
