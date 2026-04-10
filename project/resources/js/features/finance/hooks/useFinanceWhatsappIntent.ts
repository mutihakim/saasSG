import axios from "axios";
import { useCallback, useEffect } from "react";

import { TransactionDraftMeta, TransactionDraftPayload } from "../components/transactionModalTypes";
import { FinanceBatchDraft, FinanceTransaction } from "../types";

import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type Args = {
    activeMemberId?: number | null;
    defaultCurrency: string;
    tenantRoute: TenantRouteLike;
    clearWhatsappQuery: () => void;
    setBatchDraft: React.Dispatch<React.SetStateAction<FinanceBatchDraft | null>>;
    setBatchModal: React.Dispatch<React.SetStateAction<boolean>>;
    setTransactionDraft: React.Dispatch<React.SetStateAction<TransactionDraftPayload | null>>;
    setTransactionDraftMeta: React.Dispatch<React.SetStateAction<TransactionDraftMeta>>;
    setSelectedTransaction: React.Dispatch<React.SetStateAction<FinanceTransaction | null>>;
    setTransactionPresetType: React.Dispatch<React.SetStateAction<"pemasukan" | "pengeluaran">>;
    setTransactionModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export const useFinanceWhatsappIntent = ({
    activeMemberId,
    defaultCurrency,
    tenantRoute,
    clearWhatsappQuery,
    setBatchDraft,
    setBatchModal,
    setTransactionDraft,
    setTransactionDraftMeta,
    setSelectedTransaction,
    setTransactionPresetType,
    setTransactionModal,
}: Args) => {
    const loadWhatsappIntent = useCallback(async () => {
        if (typeof window === "undefined") {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const source = params.get("source");
        const action = params.get("action");
        const intent = params.get("intent");

        if (source !== "wa" || !intent) {
            return;
        }

        try {
            const response = await axios.get(tenantRoute.apiTo(`/finance/whatsapp-intents/${intent}`));
            const payload = response.data?.data?.intent;
            if (!payload) {
                return;
            }

            const mediaPreviewUrl = payload.media?.id
                ? tenantRoute.apiTo(`/finance/whatsapp-media/${payload.media.id}/preview`)
                : null;
            const mediaItems = Array.isArray(payload.media_items) ? payload.media_items : [];

            if (action === "batch-review") {
                setBatchDraft({
                    ...payload,
                    media_preview_url: mediaPreviewUrl,
                    media_items: mediaItems,
                });
                setBatchModal(true);
                return;
            }

            const extracted = payload.extracted_payload || {};
            setTransactionDraft({
                owner_member_id: payload.member_id || activeMemberId || "",
                type: extracted.type || "pengeluaran",
                amount: extracted.amount || "",
                currency_code: extracted.currency_code || defaultCurrency,
                category_id: extracted.category_id ? String(extracted.category_id) : "",
                transaction_date: extracted.transaction_date || new Date().toISOString().slice(0, 10),
                description: extracted.description || extracted.notes || "",
                notes: extracted.notes || "",
                merchant_name: extracted.merchant || "",
            });
            setTransactionDraftMeta({
                source: "whatsapp",
                confidenceScore: payload.confidence_score,
                mediaPreviewUrl,
                mediaItems,
            });
            setSelectedTransaction(null);
            setTransactionPresetType(extracted.type === "pemasukan" ? "pemasukan" : "pengeluaran");
            setTransactionModal(true);
        } catch (error: unknown) {
            const parsed = parseApiError(error, "Failed to open WhatsApp draft");
            notify.error({ title: parsed.title, detail: parsed.detail });
            clearWhatsappQuery();
        }
    }, [
        activeMemberId,
        clearWhatsappQuery,
        defaultCurrency,
        setBatchDraft,
        setBatchModal,
        setSelectedTransaction,
        setTransactionDraft,
        setTransactionDraftMeta,
        setTransactionModal,
        setTransactionPresetType,
        tenantRoute,
    ]);

    useEffect(() => {
        void loadWhatsappIntent();
    }, [loadWhatsappIntent]);
};
