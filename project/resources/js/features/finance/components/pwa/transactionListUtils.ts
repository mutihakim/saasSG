import { TFunction } from "i18next";

import { FinanceAttachment, FinanceTransaction } from "../../types";

export type BulkTransactionGroup = {
    kind: "bulk";
    sourceId: string;
    summary: string;
    ownerName: string;
    count: number;
    totalAmount: number;
    currencyCode: string;
    transactions: FinanceTransaction[];
    firstTransaction: FinanceTransaction;
};

export type SingleTransactionEntry = {
    kind: "transaction";
    transaction: FinanceTransaction;
};

export type TransactionListEntry = SingleTransactionEntry | BulkTransactionGroup;

const FALLBACK_ACCENTS = {
    expense: "#ef6b73",
    income: "#28b4a9",
    transfer: "#6d83f2",
    neutral: "#7c8aa5",
};

export const isIncomingTransaction = (transaction: FinanceTransaction) =>
    transaction.type === "pemasukan" || transaction.transfer_direction === "in";

export const getTransactionAccent = (transaction: FinanceTransaction) => {
    if (transaction.category?.color) {
        return transaction.category.color;
    }

    if (transaction.type === "transfer") {
        return FALLBACK_ACCENTS.transfer;
    }

    return isIncomingTransaction(transaction) ? FALLBACK_ACCENTS.income : FALLBACK_ACCENTS.expense;
};

export const toSoftAccent = (color: string, alphaHex = "14") => {
    if (/^#[0-9a-f]{6}$/i.test(color)) {
        return `${color}${alphaHex}`;
    }

    if (/^#[0-9a-f]{3}$/i.test(color)) {
        const expanded = color.split("").map((part, index) => index === 0 ? part : part + part).join("");
        return `${expanded}${alphaHex}`;
    }

    return "rgba(124, 138, 165, 0.12)";
};

export const getTransactionTitle = (transaction: FinanceTransaction, t: TFunction) =>
    transaction.description || transaction.category?.name || t("finance.shared.untitled");

export const getOwnerName = (transaction: FinanceTransaction) =>
    transaction.owner_member?.full_name
    || transaction.ownerMember?.full_name
    || "-";

export const getAccountName = (transaction: FinanceTransaction) =>
    transaction.bank_account?.name
    || transaction.bankAccount?.name
    || "-";

export const getSignedAmount = (transaction: FinanceTransaction) => {
    if (isIncomingTransaction(transaction)) {
        return Number(transaction.amount || 0);
    }

    if (transaction.type === "pengeluaran" || transaction.transfer_direction === "out") {
        return -Number(transaction.amount || 0);
    }

    return 0;
};

export const getSignedAmountBase = (transaction: FinanceTransaction) => {
    if (isIncomingTransaction(transaction)) {
        return Number(transaction.amount_base || 0);
    }

    if (transaction.type === "pengeluaran" || transaction.transfer_direction === "out") {
        return -Number(transaction.amount_base || 0);
    }

    return 0;
};

export const getAttachmentKindLabel = (attachment?: FinanceAttachment | null) => {
    const mime = String(attachment?.mime_type || "").toLowerCase();
    if (!mime) {
        return null;
    }

    if (mime.includes("webp")) {
        return "WEBP";
    }
    if (mime.includes("jpeg") || mime.includes("jpg")) {
        return "JPG";
    }
    if (mime.includes("png")) {
        return "PNG";
    }
    if (mime.includes("pdf")) {
        return "PDF";
    }

    const subtype = mime.split("/")[1];
    return subtype ? subtype.toUpperCase() : null;
};

export const getPrimaryAttachment = (transaction: FinanceTransaction) =>
    Array.isArray(transaction.attachments) && transaction.attachments.length > 0
        ? transaction.attachments[0]
        : null;

export const buildTransactionEntries = (items: FinanceTransaction[], defaultCurrency: string, t: TFunction): TransactionListEntry[] => {
    const bulkBuckets = new Map<string, FinanceTransaction[]>();
    const singles: FinanceTransaction[] = [];

    items.forEach((transaction) => {
        if (transaction.source_type === "finance_bulk" && transaction.source_id) {
            const key = String(transaction.source_id);
            if (!bulkBuckets.has(key)) {
                bulkBuckets.set(key, []);
            }
            bulkBuckets.get(key)?.push(transaction);
            return;
        }

        singles.push(transaction);
    });

    const bulkEntries: BulkTransactionGroup[] = Array.from(bulkBuckets.entries()).map(([sourceId, groupItems]) => {
        const sortedGroupItems = [...groupItems].sort((a, b) => String(b.created_at || b.id || "").localeCompare(String(a.created_at || a.id || "")));
        const first = sortedGroupItems[0];
        const summary = first?.merchant_name || first?.notes || first?.description || t("finance.transactions.bulk_entry", { defaultValue: "Bulk Entry" });

        return {
            kind: "bulk",
            sourceId,
            summary,
            ownerName: getOwnerName(first),
            count: sortedGroupItems.length,
            totalAmount: sortedGroupItems.reduce((sum, transaction) => sum + getSignedAmount(transaction), 0),
            currencyCode: first?.currency_code || defaultCurrency,
            transactions: sortedGroupItems,
            firstTransaction: first,
        };
    });

    const singleEntries: SingleTransactionEntry[] = singles.map((transaction) => ({
        kind: "transaction",
        transaction,
    }));

    return [...bulkEntries, ...singleEntries].sort((a, b) => {
        const left = a.kind === "bulk" ? a.firstTransaction : a.transaction;
        const right = b.kind === "bulk" ? b.firstTransaction : b.transaction;
        const dateCompare = String(right.transaction_date || "").localeCompare(String(left.transaction_date || ""));
        if (dateCompare !== 0) {
            return dateCompare;
        }
        const createdCompare = String(right.created_at || "").localeCompare(String(left.created_at || ""));
        if (createdCompare !== 0) {
            return createdCompare;
        }
        return String(right.created_at || right.id || "").localeCompare(String(left.created_at || left.id || ""));
    });
};
