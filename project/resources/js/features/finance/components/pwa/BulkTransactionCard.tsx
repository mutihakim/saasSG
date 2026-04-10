import React from "react";
import { Badge, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceTransaction } from "../../types";

import TransactionCard from "./TransactionCard";
import { BulkTransactionGroup, getTransactionAccent, toSoftAccent } from "./transactionListUtils";
import { formatAmount } from "./types";

type Props = {
    entry: BulkTransactionGroup;
    defaultCurrency: string;
    expanded: boolean;
    onToggle: () => void;
    onAddItemToGroup: (transaction: FinanceTransaction) => void;
    onDeleteGroup: (group: { sourceId: string; summary: string; transactions: FinanceTransaction[] }) => void;
    onTransactionClick: (transaction: FinanceTransaction) => void;
    selectedTransactionId?: string | null;
};

const BulkTransactionCard = ({
    entry,
    defaultCurrency,
    expanded,
    onToggle,
    onAddItemToGroup,
    onDeleteGroup,
    onTransactionClick,
    selectedTransactionId,
}: Props) => {
    const { t } = useTranslation();
    const accent = getTransactionAccent(entry.firstTransaction);
    const positive = entry.totalAmount >= 0;

    return (
        <div
            style={{
                borderRadius: 22,
                background: "#fff",
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.07)",
                overflow: "visible",
            }}
        >
            <div
                className="position-relative"
                style={{
                    padding: "0.68rem 0.78rem 1.9rem",
                    borderRadius: expanded ? "22px 22px 0 0" : 22,
                }}
            >
                <button
                    type="button"
                    className="btn w-100 text-start border-0 bg-transparent p-0"
                    onClick={onToggle}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                >
                    <div className="d-flex align-items-start" style={{ gap: 8 }}>
                        <div className="position-relative" style={{ width: 40, height: 40, flexShrink: 0, marginTop: 3 }}>
                        <span
                            className="position-absolute rounded-circle"
                            style={{
                                width: 30,
                                height: 30,
                                top: 5,
                                left: 1,
                                background: toSoftAccent(accent, "0f"),
                            }}
                        />
                        <span
                            className="position-absolute rounded-circle"
                            style={{
                                width: 33,
                                height: 33,
                                top: 3,
                                left: 4,
                                background: toSoftAccent(accent, "16"),
                            }}
                        />
                        <span
                            className="position-absolute d-inline-flex align-items-center justify-content-center rounded-circle"
                            style={{
                                width: 36,
                                height: 36,
                                top: 2,
                                left: 6,
                                background: toSoftAccent(accent, "22"),
                                color: accent,
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                            }}
                        >
                            <i className="ri-stack-line" style={{ fontSize: 15 }} />
                        </span>
                        </div>
                        <div
                            className="d-flex flex-column flex-grow-1"
                            style={{
                                minWidth: 0,
                                gap: 4,
                            }}
                        >
                            <div
                                className="fw-bold text-dark"
                                style={{
                                    fontSize: 14,
                                    lineHeight: 1.15,
                                    width: "100%",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                }}
                            >
                                {entry.summary}
                            </div>
                            <div
                                className="d-flex align-items-center justify-content-between"
                                style={{ gap: 10, minWidth: 0 }}
                            >
                                <div className="d-flex flex-column" style={{ minWidth: 0, flex: "1 1 auto", gap: 3 }}>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            lineHeight: 1.15,
                                            fontWeight: 600,
                                            color: "#2563eb",
                                            whiteSpace: "normal",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {entry.ownerName}
                                    </div>
                                    <div
                                        className="text-muted"
                                        style={{ fontSize: 11, lineHeight: 1.15, minWidth: 0, whiteSpace: "normal", wordBreak: "break-word" }}
                                    >
                                        {t("finance.transactions.bulk_entry", { defaultValue: "Bulk Entry" })}
                                    </div>
                                </div>
                                <div className="text-end flex-shrink-0 align-self-center">
                                    <div className={`fw-bold ${positive ? "text-success" : "text-danger"}`} style={{ fontSize: 13, lineHeight: 1.1, whiteSpace: "nowrap" }}>
                                        {positive ? "+" : "-"} {formatAmount(Math.abs(entry.totalAmount), entry.currencyCode || defaultCurrency)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </button>

                <button
                    type="button"
                    className="btn btn-link position-absolute start-50 translate-middle-x p-0 text-decoration-none d-flex align-items-center gap-2"
                    onClick={onToggle}
                    aria-label={expanded ? t("common.collapse") : t("common.expand")}
                    style={{ bottom: 7, color: "#64748b", zIndex: 2 }}
                >
                    {!expanded && (
                        <Badge
                            bg="secondary-subtle"
                            text="secondary"
                            className="rounded-pill"
                            style={{ padding: "0.18rem 0.48rem", fontSize: 10 }}
                        >
                            {entry.count} item
                        </Badge>
                    )}
                    <span
                        className="d-inline-flex align-items-center justify-content-center rounded-circle"
                        style={{
                            width: 28,
                            height: 28,
                            background: "#fff",
                            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
                            border: "1px solid rgba(148, 163, 184, 0.12)",
                        }}
                    >
                        <i className={expanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
                    </span>
                </button>
            </div>

            {expanded && (
                <>
                    <div style={{ background: "linear-gradient(180deg, rgba(248,250,252,0.96), rgba(248,250,252,0.72))", borderRadius: "0 0 22px 22px" }}>
                        <div className="px-2 px-sm-3 pb-2 pt-1">
                            <div className="d-grid" style={{ gap: 8 }}>
                                {entry.transactions.map((transaction) => (
                                    <TransactionCard
                                        key={transaction.id}
                                        transaction={transaction}
                                        defaultCurrency={defaultCurrency}
                                        selected={selectedTransactionId === String(transaction.id)}
                                        onClick={onTransactionClick}
                                        compact
                                    />
                                ))}
                            </div>
                            <div className="d-flex gap-2 mt-2">
                                <Button
                                    type="button"
                                    variant="light"
                                    className="flex-grow-1 rounded-pill"
                                    onClick={() => onAddItemToGroup(entry.transactions[0])}
                                    style={{
                                        border: "1px dashed rgba(124, 138, 165, 0.42)",
                                        background: "rgba(255,255,255,0.85)",
                                        color: "#475569",
                                        paddingBlock: "0.68rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    <i className="ri-add-line me-2" />
                                    Tambah Item ke Grup Ini
                                </Button>
                                <Button
                                    type="button"
                                    variant="light"
                                    className="rounded-pill flex-shrink-0"
                                    onClick={() => onDeleteGroup({
                                        sourceId: entry.sourceId,
                                        summary: entry.summary,
                                        transactions: entry.transactions,
                                    })}
                                    aria-label={t("finance.shared.delete")}
                                    style={{
                                        minWidth: 110,
                                        border: "1px dashed rgba(239, 68, 68, 0.3)",
                                        background: "rgba(254, 242, 242, 0.92)",
                                        color: "#dc2626",
                                        paddingBlock: "0.68rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    <i className="ri-delete-bin-line me-2" />
                                    Hapus Grup
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default BulkTransactionCard;
