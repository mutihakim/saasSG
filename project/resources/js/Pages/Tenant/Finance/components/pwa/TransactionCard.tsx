import React from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceTransaction } from "../../types";
import { formatAmount } from "./types";
import { getTransactionAccent, getTransactionTitle, isIncomingTransaction, toSoftAccent } from "./transactionListUtils";
import TransactionAttachmentBadge from "./TransactionAttachmentBadge";
import TransactionMetaStack from "./TransactionMetaStack";

type Props = {
    transaction: FinanceTransaction;
    defaultCurrency: string;
    selected: boolean;
    onClick: (transaction: FinanceTransaction) => void;
    compact?: boolean;
};

const TransactionCard = ({
    transaction,
    defaultCurrency,
    selected,
    onClick,
    compact = false,
}: Props) => {
    const { t } = useTranslation();
    const incoming = isIncomingTransaction(transaction);
    const accent = getTransactionAccent(transaction);
    const amountClass = incoming ? "text-success" : "text-danger";
    const prefix = incoming ? "+" : "-";
    const title = getTransactionTitle(transaction, t);

    return (
        <div
            id={`finance-transaction-${transaction.id}`}
            data-active={selected ? "true" : "false"}
            data-testid={`finance-transaction-row-${transaction.id}`}
            style={{
                borderRadius: compact ? 18 : 22,
                background: "#fff",
                boxShadow: selected
                    ? "0 14px 34px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(59, 130, 246, 0.08)"
                    : compact
                        ? "0 8px 20px rgba(15, 23, 42, 0.06)"
                        : "0 12px 30px rgba(15, 23, 42, 0.07)",
                transition: "transform 160ms ease, box-shadow 160ms ease",
                transform: selected ? "translateY(-1px)" : "translateY(0)",
            }}
        >
            <button
                type="button"
                className="btn w-100 text-start border-0 bg-transparent"
                onClick={() => onClick(transaction)}
                style={{
                    padding: compact ? "0.64rem 0.78rem" : "0.72rem 0.82rem",
                    borderRadius: compact ? 18 : 22,
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                <div className="d-flex align-items-start" style={{ gap: compact ? 8 : 10 }}>
                    <div
                        className="position-relative d-inline-flex align-items-center justify-content-center rounded-circle"
                        style={{
                            width: compact ? 36 : 40,
                            height: compact ? 36 : 40,
                            background: toSoftAccent(accent),
                            color: accent,
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                            flexShrink: 0,
                            marginTop: compact ? 2 : 3,
                        }}
                    >
                        <i
                            className={transaction.category?.icon || (transaction.type === "transfer" ? "ri-repeat-line" : "ri-wallet-3-line")}
                            style={{ fontSize: compact ? 14 : 16 }}
                        />
                        <TransactionAttachmentBadge transaction={transaction} compact={compact} />
                    </div>
                    <div
                        className="d-flex flex-column flex-grow-1"
                        style={{
                            minWidth: 0,
                            gap: compact ? 3 : 4,
                        }}
                    >
                        <div
                            className="fw-bold text-dark"
                            style={{
                                fontSize: compact ? 13 : 14,
                                lineHeight: 1.15,
                                width: "100%",
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                            }}
                        >
                            {title}
                        </div>
                        <div
                            className="d-flex align-items-center justify-content-between"
                            style={{ gap: compact ? 8 : 10, minWidth: 0 }}
                        >
                            <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                                <TransactionMetaStack transaction={transaction} compact={compact} />
                            </div>
                            <div className="text-end flex-shrink-0 align-self-center">
                                <div
                                    className={`fw-bold ${amountClass}`}
                                    style={{ fontSize: compact ? 12 : 13, lineHeight: 1.1, whiteSpace: "nowrap" }}
                                >
                                    {prefix} {formatAmount(Number(transaction.amount || 0), transaction.currency_code || defaultCurrency)}
                                </div>
                                {transaction.budget_status === "over_budget" && (
                                    <Badge
                                        bg="warning-subtle"
                                        text="warning"
                                        className="rounded-pill mt-1"
                                        style={{ padding: compact ? "0.18rem 0.42rem" : "0.22rem 0.48rem", fontSize: compact ? 9 : 10 }}
                                    >
                                        {t("finance.budgets.status.over")}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
};

export default TransactionCard;
