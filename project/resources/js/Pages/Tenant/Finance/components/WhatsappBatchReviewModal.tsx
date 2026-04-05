import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

import AttachmentPreviewModal from "./pwa/AttachmentPreviewModal";

type BatchItem = {
    sort_order: number;
    description: string;
    amount: number | null;
    currency_code: string | null;
    payload?: Record<string, any> | null;
};

interface Props {
    show: boolean;
    onClose: () => void;
    onSuccess: (transactions: any[]) => void;
    draft: {
        token: string;
        member_id?: number | null;
        member?: {
            full_name?: string | null;
        } | null;
        confidence_score?: number | null;
        extracted_payload?: Record<string, any> | null;
        items?: BatchItem[];
        media_preview_url?: string | null;
        media_items?: Array<{
            id: number;
            preview_url: string;
            mime_type?: string | null;
        }>;
    } | null;
    categories: any[];
    accounts: any[];
    budgets: any[];
    members: any[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
}

const canUseForOwner = (item: any, ownerMemberId: string) => {
    if (!item) return false;
    if (item.scope === "shared") return true;
    return String(item.owner_member_id || "") === String(ownerMemberId || "");
};

const WhatsappBatchReviewModal = ({
    show,
    onClose,
    onSuccess,
    draft,
    categories,
    accounts,
    budgets,
    members,
    activeMemberId,
    canManageShared = false,
}: Props) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const [loading, setLoading] = useState(false);
    const [ownerMemberId, setOwnerMemberId] = useState(activeMemberId ? String(activeMemberId) : "");
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
    const [bankAccountId, setBankAccountId] = useState("");
    const [items, setItems] = useState<BatchItem[]>([]);
    const [previewItem, setPreviewItem] = useState<{ url: string; title?: string | null; mimeType?: string | null } | null>(null);

    useEffect(() => {
        if (!show || !draft) return;
        const nextOwner = draft.member_id ? String(draft.member_id) : (activeMemberId ? String(activeMemberId) : members[0] ? String(members[0].id) : "");
        const nextItems = (draft.items ?? []).map((item) => ({
            ...item,
            payload: {
                ...(item.payload ?? {}),
                category_id: item.payload?.category_id ? String(item.payload.category_id) : "",
                budget_id: "",
            },
        }));
        const firstAccount = accounts.find((account) => canUseForOwner(account, nextOwner));

        setOwnerMemberId(nextOwner);
        setTransactionDate(String(draft.extracted_payload?.transaction_date || new Date().toISOString().slice(0, 10)));
        setBankAccountId(firstAccount ? String(firstAccount.id) : "");
        setItems(nextItems);
    }, [accounts, activeMemberId, draft, members, show]);

    const visibleAccounts = useMemo(() => accounts.filter((account) => canUseForOwner(account, ownerMemberId)), [accounts, ownerMemberId]);
    const visibleBudgets = useMemo(() => budgets.filter((budget) => canUseForOwner(budget, ownerMemberId)), [budgets, ownerMemberId]);
    const categoryOptions = useMemo(() => categories
        .filter((category) => !category.sub_type || category.sub_type === "all" || category.sub_type === "pengeluaran")
        .map((category) => ({ value: String(category.id), label: category.name })), [categories]);
    const budgetOptions = useMemo(() => visibleBudgets.map((budget) => ({
        value: String(budget.id),
        label: `${budget.name} · ${budget.period_month}`,
    })), [visibleBudgets]);
    const accountOptions = useMemo(() => visibleAccounts.map((account) => ({
        value: String(account.id),
        label: `${account.name} · ${account.currency_code}`,
    })), [visibleAccounts]);
    const memberOptions = useMemo(() => members.map((member) => ({ value: String(member.id), label: member.full_name })), [members]);

    useEffect(() => {
        if (!show) return;

        const selectedStillVisible = visibleAccounts.some((account) => String(account.id) === String(bankAccountId));
        if (!selectedStillVisible) {
            setBankAccountId(visibleAccounts[0] ? String(visibleAccounts[0].id) : "");
        }
    }, [bankAccountId, show, visibleAccounts]);

    const updateItem = (index: number, key: string, value: any) => {
        setItems((prev) => prev.map((item, itemIndex) => itemIndex === index
            ? { ...item, payload: { ...(item.payload ?? {}), [key]: value }, ...(key === "description" || key === "amount" ? { [key]: value } : {}) }
            : item));
    };

    const handleSubmit = async () => {
        if (!ownerMemberId) {
            notify.error("Owner transaksi WhatsApp tidak ditemukan.");
            return;
        }

        if (!bankAccountId || items.length === 0) {
            notify.error(t("finance.notifications.missing_fields"));
            return;
        }

        setLoading(true);
        try {
            const created: any[] = [];
            const sourceId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `bulk-${Date.now()}`;

            for (const item of items) {
                const response = await axios.post(tenantRoute.apiTo("/finance/transactions"), {
                    type: "pengeluaran",
                    owner_member_id: Number(ownerMemberId),
                    transaction_date: transactionDate,
                    amount: Number(item.amount || 0),
                    currency_code: visibleAccounts.find((account) => String(account.id) === bankAccountId)?.currency_code || "IDR",
                    exchange_rate: 1,
                    category_id: item.payload?.category_id ? Number(item.payload.category_id) : null,
                    bank_account_id: bankAccountId,
                    budget_id: item.payload?.budget_id ? String(item.payload.budget_id) : null,
                    description: item.description,
                    notes: draft?.extracted_payload?.notes || item.payload?.notes || "",
                    merchant_name: draft?.extracted_payload?.merchant || "",
                    tags: [],
                    source_type: "finance_bulk",
                    source_id: sourceId,
                });

                created.push(response.data?.data?.transaction);
            }

            notify.success(t("finance.messages.success_save"));
            onSuccess(created);
            onClose();
        } catch (error: any) {
            const parsed = parseApiError(error, t("finance.notifications.transaction_save_failed"));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} fullscreen>
            <Modal.Header closeButton className="border-bottom-0 pb-0">
                <div className="w-100">
                    <Modal.Title>WhatsApp Shopping Draft</Modal.Title>
                    <div className="small text-muted mt-2">
                        {draft?.confidence_score !== null && draft?.confidence_score !== undefined
                            ? `Confidence ${Math.round((draft?.confidence_score || 0) * 100)}%`
                            : "Review each item before submit."}
                    </div>
                </div>
            </Modal.Header>
            <Modal.Body className="bg-white" style={{ paddingBottom: 112 }}>
                <Alert variant="info" className="rounded-4 border-0">
                    Draft ini berasal dari WhatsApp. Review item belanja, pilih akun, lalu submit ke ledger.
                    {((draft?.media_items?.length ?? 0) > 0 || draft?.media_preview_url) && (
                        <div className="mt-2 d-flex gap-2 flex-wrap">
                            {(draft?.media_items && draft.media_items.length > 0
                                ? draft.media_items
                                : draft?.media_preview_url
                                    ? [{ id: 0, preview_url: draft.media_preview_url, mime_type: "image/*" }]
                                    : []
                            ).map((mediaItem, index) => (
                                <button
                                    key={`${mediaItem.id}-${index}`}
                                    type="button"
                                    className="btn btn-sm btn-soft-primary"
                                    onClick={() => setPreviewItem({
                                        url: mediaItem.preview_url,
                                        title: index === 0
                                            ? t("finance.shared.preview", { defaultValue: "Preview attachment" })
                                            : `Lampiran ${index + 1}`,
                                        mimeType: mediaItem.mime_type || null,
                                    })}
                                >
                                    <i className={`${String(mediaItem.mime_type || "").startsWith("image/") ? "ri-image-line" : "ri-attachment-2"} me-1`} />
                                    {index === 0
                                        ? t("finance.shared.preview", { defaultValue: "Preview attachment" })
                                        : `Lampiran ${index + 1}`}
                                </button>
                            ))}
                        </div>
                    )}
                </Alert>

                <Row className="g-3 mb-4">
                    {canManageShared && (
                        <Col xs={12}>
                            <Form.Label>Owner</Form.Label>
                            <Form.Control
                                value={draft?.member?.full_name || memberOptions.find((option) => option.value === ownerMemberId)?.label || ""}
                                readOnly
                            />
                        </Col>
                    )}
                    <Col xs={12}>
                        <Form.Label>Date</Form.Label>
                        <Form.Control type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
                    </Col>
                    <Col xs={12}>
                        <Form.Label>Account</Form.Label>
                        <Select
                            options={accountOptions}
                            value={accountOptions.find((option) => option.value === bankAccountId)}
                            onChange={(option: any) => setBankAccountId(option?.value ?? "")}
                            classNamePrefix="react-select"
                        />
                        {accountOptions.length === 0 && (
                            <Form.Text className="text-danger">
                                Tidak ada akun yang bisa dipakai untuk member pengirim WhatsApp ini.
                            </Form.Text>
                        )}
                    </Col>
                </Row>

                <div className="d-grid gap-3">
                    {items.map((item, index) => (
                        <div key={`${item.sort_order}-${index}`} className="rounded-4 border p-3 bg-white shadow-sm">
                            <div className="small text-muted mb-2">Item {index + 1}</div>
                            <Row className="g-3">
                                <Col xs={12}>
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        value={item.description}
                                        onChange={(e) => updateItem(index, "description", e.target.value)}
                                    />
                                </Col>
                                <Col xs={12}>
                                    <Form.Label>Amount</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        value={item.amount ?? ""}
                                        onChange={(e) => updateItem(index, "amount", e.target.value)}
                                    />
                                </Col>
                                <Col xs={12}>
                                    <Form.Label>Category</Form.Label>
                                    <Select
                                        options={categoryOptions}
                                        value={categoryOptions.find((option) => option.value === item.payload?.category_id)}
                                        onChange={(option: any) => updateItem(index, "category_id", option?.value ?? "")}
                                        classNamePrefix="react-select"
                                        isClearable
                                    />
                                </Col>
                                <Col xs={12}>
                                    <Form.Label>Budget</Form.Label>
                                    <Select
                                        options={budgetOptions}
                                        value={budgetOptions.find((option) => option.value === item.payload?.budget_id)}
                                        onChange={(option: any) => updateItem(index, "budget_id", option?.value ?? "")}
                                        classNamePrefix="react-select"
                                        isClearable
                                    />
                                </Col>
                            </Row>
                        </div>
                    ))}
                </div>
            </Modal.Body>
            <Modal.Footer className="border-top bg-white position-sticky bottom-0">
                <Button variant="light" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading || !bankAccountId || accountOptions.length === 0} data-testid="finance-whatsapp-batch-save">
                    {loading ? t("finance.shared.processing") : "Submit Shopping Draft"}
                </Button>
            </Modal.Footer>
            <AttachmentPreviewModal
                show={previewItem !== null}
                item={previewItem}
                onClose={() => setPreviewItem(null)}
            />
        </Modal>
    );
};

export default WhatsappBatchReviewModal;
