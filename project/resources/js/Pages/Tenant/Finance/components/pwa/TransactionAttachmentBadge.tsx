import React from "react";

import { FinanceTransaction } from "../../types";

import { getPrimaryAttachment } from "./transactionListUtils";

type Props = {
    transaction: FinanceTransaction;
    compact?: boolean;
};

const TransactionAttachmentBadge = ({ transaction, compact = false }: Props) => {
    const attachment = getPrimaryAttachment(transaction);
    if (!attachment) {
        return null;
    }

    return (
        <span
            className="position-absolute d-inline-flex align-items-center justify-content-center rounded-circle"
            style={{
                width: compact ? 16 : 18,
                height: compact ? 16 : 18,
                top: compact ? -2 : -3,
                right: compact ? -1 : -2,
                background: "#ffffff",
                color: "#64748b",
                boxShadow: "0 6px 14px rgba(15, 23, 42, 0.16)",
                border: "1px solid rgba(148, 163, 184, 0.18)",
            }}
            aria-label="Has attachment"
            title="Has attachment"
        >
            <i className="ri-attachment-2" style={{ fontSize: compact ? 10 : 11 }} />
        </span>
    );
};

export default TransactionAttachmentBadge;
