import axios from "axios";

import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { TransactionFormData } from "../components/transactionModalTypes";

type TenantRouteLike = {
    apiTo: (path?: string) => string;
};

type Args = {
    formData: TransactionFormData;
    isEdit: boolean;
    tenantRoute: TenantRouteLike;
    transaction?: any;
    removedAttachmentIds: Array<string | number>;
    pendingFiles: File[];
    t: (key: string, options?: any) => string;
    onSuccess: (transaction?: any) => void;
    onClose: () => void;
    setLoading: (value: boolean) => void;
};

export const submitTransaction = async ({
    formData,
    isEdit,
    tenantRoute,
    transaction,
    removedAttachmentIds,
    pendingFiles,
    t,
    onSuccess,
    onClose,
    setLoading,
}: Args) => {
    if (!formData.amount || !formData.transaction_date || !formData.bank_account_id) {
        notify.error(t("finance.notifications.missing_fields"));
        return;
    }

    setLoading(true);

    try {
        const payload: any = {
            ...formData,
            owner_member_id: formData.owner_member_id ? parseInt(formData.owner_member_id, 10) : null,
            amount: parseFloat(formData.amount),
            exchange_rate: parseFloat(formData.exchange_rate || "1"),
            category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
            budget_id: formData.type === "pengeluaran" && formData.budget_id ? formData.budget_id : null,
            payment_method: formData.payment_method || null,
        };

        if (!isEdit) {
            delete payload.row_version;
        }

        const response = await axios({
            method: isEdit ? "patch" : "post",
            url: isEdit
                ? tenantRoute.apiTo(`/finance/transactions/${transaction.id}`)
                : tenantRoute.apiTo("/finance/transactions"),
            data: payload,
        });

        const savedTransaction = response.data?.data?.transaction;
        const transactionId = savedTransaction?.id || transaction?.id;

        if (transactionId && removedAttachmentIds.length > 0) {
            for (const attachmentId of removedAttachmentIds) {
                await axios.delete(tenantRoute.apiTo(`/finance/transactions/${transactionId}/attachments/${attachmentId}`));
            }
        }

        if (transactionId && pendingFiles.length > 0) {
            const formPayload = new FormData();
            pendingFiles.forEach((file) => {
                formPayload.append("attachments[]", file);
            });

            await axios.post(
                tenantRoute.apiTo(`/finance/transactions/${transactionId}/attachments`),
                formPayload,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
        }

        const refreshedResponse = transactionId
            ? await axios.get(tenantRoute.apiTo(`/finance/transactions/${transactionId}`))
            : null;
        const finalTransaction = refreshedResponse?.data?.data?.transaction || savedTransaction;

        notify.success(t(isEdit ? "finance.messages.success_update" : "finance.messages.success_save"));
        onSuccess(finalTransaction);
        onClose();
    } catch (error: any) {
        const parsed = parseApiError(error, t("finance.notifications.transaction_save_failed"));
        notify.error({ title: parsed.title, detail: parsed.detail });
    } finally {
        setLoading(false);
    }
};
