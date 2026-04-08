import React from "react";

import { FinanceTransaction } from "../../types";

import { getAccountName, getOwnerName } from "./transactionListUtils";

type Props = {
    transaction: FinanceTransaction;
    compact?: boolean;
};

const TransactionMetaStack = ({ transaction, compact = false }: Props) => {
    const ownerName = getOwnerName(transaction);
    const accountName = getAccountName(transaction);

    return (
        <div className="d-flex flex-column" style={{ gap: compact ? 2 : 3, minWidth: 0 }}>
            <div
                style={{
                    fontSize: compact ? 10 : 11,
                    lineHeight: 1.15,
                    fontWeight: 600,
                    color: "#2563eb",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                }}
            >
                {ownerName}
            </div>
            <div
                className="text-muted"
                style={{
                    fontSize: compact ? 10 : 11,
                    lineHeight: 1.15,
                    minWidth: 0,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                }}
            >
                {accountName}
            </div>
        </div>
    );
};

export default TransactionMetaStack;
