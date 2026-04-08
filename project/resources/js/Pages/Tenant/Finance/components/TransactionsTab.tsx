import React from "react";

import { FinanceTransaction } from "../types";

import TransactionGroupedList from "./pwa/TransactionGroupedList";

type TransactionGroupTarget = {
    sourceId: string;
    summary: string;
    transactions: FinanceTransaction[];
};

type TransactionsTabProps = {
    transactions: FinanceTransaction[];
    defaultCurrency: string;
    showTransferHint: boolean;
    selectedTransactionId: string | null;
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMoreRef: React.RefObject<HTMLDivElement | null>;
    onAddItemToGroup: (transaction: FinanceTransaction) => void;
    onDeleteGroup: (group: TransactionGroupTarget) => void;
    onTransactionClick: (transaction: FinanceTransaction) => void;
};

const TransactionsTab = ({
    transactions,
    defaultCurrency,
    showTransferHint,
    selectedTransactionId,
    hasMore,
    isLoadingMore,
    loadMoreRef,
    onAddItemToGroup,
    onDeleteGroup,
    onTransactionClick,
}: TransactionsTabProps) => {
    return (
        <TransactionGroupedList
            transactions={transactions}
            defaultCurrency={defaultCurrency}
            showTransferHint={showTransferHint}
            selectedTransactionId={selectedTransactionId}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMoreRef={loadMoreRef}
            onAddItemToGroup={onAddItemToGroup}
            onDeleteGroup={onDeleteGroup}
            onTransactionClick={onTransactionClick}
        />
    );
};

export default TransactionsTab;
