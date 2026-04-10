import axios from "axios";
import { useCallback } from "react";

import { FinanceTransaction } from "../types";

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type Args = {
    tenantRoute: TenantRouteLike;
};

export const useFinanceWhatsappSubmission = ({ tenantRoute }: Args) => {
    const resolveIntentToken = useCallback(() => {
        if (typeof window === "undefined") {
            return null;
        }

        return new URLSearchParams(window.location.search).get("intent");
    }, []);

    const submitWhatsappSingleTransaction = useCallback(async (transaction?: FinanceTransaction) => {
        const intentToken = resolveIntentToken();
        if (!intentToken || !transaction?.id) {
            return transaction;
        }

        try {
            const submittedResponse = await axios.post(tenantRoute.apiTo(`/finance/whatsapp-intents/${intentToken}/submitted`), {
                linked_resource_type: "finance_transaction",
                submitted_count: 1,
                transaction_ids: [String(transaction.id)],
            });

            const submittedTransactions = Array.isArray(submittedResponse.data?.data?.transactions)
                ? submittedResponse.data.data.transactions
                : [];

            return submittedTransactions[0] || transaction;
        } catch {
            return transaction;
        }
    }, [resolveIntentToken, tenantRoute]);

    const submitWhatsappBatchTransactions = useCallback(async (createdTransactions: FinanceTransaction[]) => {
        const intentToken = resolveIntentToken();
        if (!intentToken) {
            return createdTransactions;
        }

        try {
            const submittedResponse = await axios.post(tenantRoute.apiTo(`/finance/whatsapp-intents/${intentToken}/submitted`), {
                linked_resource_type: "finance_transaction_batch",
                submitted_count: createdTransactions.length || 1,
                transaction_ids: createdTransactions
                    .map((transaction) => String(transaction?.id || ""))
                    .filter((id) => id !== ""),
            });

            const submittedTransactions = Array.isArray(submittedResponse.data?.data?.transactions)
                ? submittedResponse.data.data.transactions
                : [];

            return submittedTransactions.length > 0 ? submittedTransactions : createdTransactions;
        } catch {
            return createdTransactions;
        }
    }, [resolveIntentToken, tenantRoute]);

    return {
        submitWhatsappSingleTransaction,
        submitWhatsappBatchTransactions,
    };
};
