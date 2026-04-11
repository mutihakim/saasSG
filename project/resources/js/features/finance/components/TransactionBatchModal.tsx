import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";

import { FinanceBatchDraft } from "../types";

import AttachmentPreviewModal from "./pwa/AttachmentPreviewModal";

import MiniCalculator from "@/components/ui/MiniCalculator";
import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";

type BatchEntryItem = {
    description: string;
    amount: string;
    category_id: string;
    budget_id: string;
    notes: string;
};

interface TransactionBatchModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: (transactions: any[]) => void;
    categories: any[];
    accounts: any[];
    budgets: any[];
    pockets: any[];
    members: any[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
    defaultCurrency: string;
    draft?: FinanceBatchDraft | null;
}

const canUseForOwner = (item: any, ownerMemberId: string) => {
    if (!item) return false;
    if (item.scope === "shared") return true;
    const ownerId = String(ownerMemberId || "");
    if (String(item.owner_member_id || "") === ownerId) return true;

    const accessList = (item.member_access || item.memberAccess || []) as Array<{
        id?: string | number | null;
        can_use?: boolean | number | string;
        can_manage?: boolean | number | string;
        pivot?: { can_use?: boolean | number | string; can_manage?: boolean | number | string } | null;
    }>;
    const hasManageOrUse = (value: boolean | number | string | undefined) =>
        value === true || value === 1 || value === "1" || value === "true";

    return accessList.some((access) => {
        if (String(access?.id || "") !== ownerId) return false;

        return (
            hasManageOrUse(access?.can_manage)
            || hasManageOrUse(access?.can_use)
            || hasManageOrUse(access?.pivot?.can_manage)
            || hasManageOrUse(access?.pivot?.can_use)
        );
    });
};

const toPeriodMonth = (value: string) => String(value || "").slice(0, 7);

const createEmptyItem = (): BatchEntryItem => ({
    description: "",
    amount: "",
    category_id: "",
    budget_id: "",
    notes: "",
});

const TransactionBatchModal = ({
    show,
    onClose,
    onSuccess,
    categories,
    accounts,
    budgets,
    pockets,
    members,
    activeMemberId,
    canManageShared = false,
    defaultCurrency,
    draft = null,
}: TransactionBatchModalProps) => {
    const tenantRoute = useTenantRoute();
    const [loading, setLoading] = useState(false);
    const [ownerMemberId, setOwnerMemberId] = useState(activeMemberId ? String(activeMemberId) : "");
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
    const [pocketId, setPocketId] = useState("");
    const [merchantName, setMerchantName] = useState("");
    const [sharedNotes, setSharedNotes] = useState("");
    const [items, setItems] = useState<BatchEntryItem[]>([createEmptyItem()]);
    const [showCalculator, setShowCalculator] = useState(false);
    const [activeCalculatorIndex, setActiveCalculatorIndex] = useState<number | null>(null);
    const [previewItem, setPreviewItem] = useState<{ url: string; title?: string | null; mimeType?: string | null } | null>(null);

    useEffect(() => {
        if (!show) {
            return;
        }

        const nextOwner = draft?.member_id
            ? String(draft.member_id)
            : activeMemberId
                ? String(activeMemberId)
                : members[0]
                    ? String(members[0].id)
                    : "";
        const firstPocket = pockets.find((pocket) => canUseForOwner(pocket, nextOwner));
        const draftItems = (draft?.items ?? []).map((item) => ({
            description: item.description || "",
            amount: item.amount !== null && item.amount !== undefined ? String(item.amount) : "",
            category_id: item.payload?.category_id ? String(item.payload.category_id) : "",
            budget_id: item.payload?.budget_id ? String(item.payload.budget_id) : "",
            notes: item.payload?.notes ? String(item.payload.notes) : "",
        }));

        setOwnerMemberId(nextOwner);
        setTransactionDate(String(draft?.extracted_payload?.transaction_date || new Date().toISOString().slice(0, 10)));
        setPocketId(firstPocket ? String(firstPocket.id) : "");
        setMerchantName(String(draft?.extracted_payload?.merchant || ""));
        setSharedNotes(String(draft?.extracted_payload?.notes || ""));
        setItems(draftItems.length > 0 ? draftItems : [createEmptyItem()]);
        setShowCalculator(false);
        setActiveCalculatorIndex(null);
        setPreviewItem(null);
    }, [accounts, activeMemberId, draft, members, pockets, show]);

    const visiblePockets = useMemo(() => pockets.filter((pocket) => canUseForOwner(pocket, ownerMemberId)), [ownerMemberId, pockets]);
    const selectedPocket = useMemo(() => visiblePockets.find((pocket) => String(pocket.id) === String(pocketId)) ?? null, [pocketId, visiblePockets]);
    const selectedAccount = useMemo(() => accounts.find((account) => String(account.id) === String(selectedPocket?.real_account_id || "")) ?? null, [accounts, selectedPocket]);
    const visibleBudgets = useMemo(() => budgets.filter((budget) => canUseForOwner(budget, ownerMemberId)), [budgets, ownerMemberId]);
    const filteredBudgets = useMemo(() => {
        if (!selectedPocket) {
            return visibleBudgets;
        }

        const lockedDefault = selectedPocket.default_budget_key
            ? visibleBudgets.find((budget) => String(budget.budget_key || budget.code || budget.id) === String(selectedPocket.default_budget_key))
            : null;
        const mapped = visibleBudgets.filter((budget) => budget.wallet_id && String(budget.wallet_id) === String(selectedPocket.id));
        const unallocated = visibleBudgets.filter((budget) => !budget.wallet_id);
        const remaining = visibleBudgets.filter((budget) => budget !== lockedDefault && !mapped.includes(budget) && !unallocated.includes(budget));

        return [lockedDefault, ...mapped, ...unallocated, ...remaining].filter(Boolean) as any[];
    }, [selectedPocket, visibleBudgets]);
    const walletDefaultBudgetForMonth = useMemo(
        () => (selectedPocket?.default_budget_key
            ? visibleBudgets.find((budget) =>
                String(budget.budget_key || budget.code || budget.id) === String(selectedPocket.default_budget_key)
                && String(budget.period_month) === toPeriodMonth(transactionDate)
                && budget.is_active !== false,
            )
            : null),
        [selectedPocket, transactionDate, visibleBudgets],
    );
    const pocketOptions = useMemo(() => visiblePockets.map((pocket) => ({
        value: String(pocket.id),
        label: `${pocket.name} · ${pocket.real_account?.name || pocket.realAccount?.name || pocket.currency_code}`,
    })), [visiblePockets]);
    const budgetOptions = useMemo(() => filteredBudgets.map((budget) => ({
        value: String(budget.id),
        label: `${budget.name} · ${budget.period_month}`,
    })), [filteredBudgets]);
    const categoryOptions = useMemo(() => categories
        .filter((category) => !category.sub_type || category.sub_type === "all" || category.sub_type === "pengeluaran")
        .map((category) => ({
            value: String(category.id),
            label: category.name,
        })), [categories]);
    const memberOptions = useMemo(() => members.map((member) => ({
        value: String(member.id),
        label: member.full_name,
    })), [members]);

    useEffect(() => {
        if (!show) {
            return;
        }

        const selectedStillVisible = visiblePockets.some((pocket) => String(pocket.id) === String(pocketId));
        if (!selectedStillVisible) {
            setPocketId(visiblePockets[0] ? String(visiblePockets[0].id) : "");
        }
    }, [pocketId, show, visiblePockets]);

    useEffect(() => {
        if (!show) {
            return;
        }

        setItems((prev) => {
            const walletDefaultBudget = selectedPocket?.default_budget_key
                ? visibleBudgets.find((budget) =>
                    String(budget.budget_key || budget.code || budget.id) === String(selectedPocket.default_budget_key)
                    && String(budget.period_month) === toPeriodMonth(transactionDate)
                    && budget.is_active !== false
                )
                : null;

            return prev.map((item) => {
                const budgetStillValid = visibleBudgets.some((budget) => String(budget.id) === String(item.budget_id));

                if (selectedPocket?.budget_lock_enabled && walletDefaultBudget) {
                    return { ...item, budget_id: String(walletDefaultBudget.id) };
                }

                if (!item.budget_id && walletDefaultBudget) {
                    return { ...item, budget_id: String(walletDefaultBudget.id) };
                }

                if (item.budget_id && !budgetStillValid) {
                    return { ...item, budget_id: walletDefaultBudget ? String(walletDefaultBudget.id) : "" };
                }

                return item;
            });
        });
    }, [selectedPocket, show, transactionDate, visibleBudgets]);

    const updateItem = (index: number, key: keyof BatchEntryItem, value: string) => {
        setItems((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
    };

    const addItem = () => {
        setItems((prev) => [...prev, createEmptyItem()]);
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index));
        setActiveCalculatorIndex((prev) => {
            if (prev === null) {
                return prev;
            }

            if (prev === index) {
                setShowCalculator(false);

                return null;
            }

            return prev > index ? prev - 1 : prev;
        });
    };

    const openCalculator = (index: number) => {
        setActiveCalculatorIndex(index);
        setShowCalculator(true);
    };

    const handleSubmit = async () => {
        const validItems = items.filter((item) => item.description.trim() !== "" && Number(item.amount || 0) > 0);
        if (!ownerMemberId || !pocketId || validItems.length === 0) {
            notify.error("Lengkapi wallet, tanggal, dan minimal satu item transaksi.");
            return;
        }

        setLoading(true);

        try {
            const created: any[] = [];
            const sourceId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `bulk-${Date.now()}`;

            for (const item of validItems) {
                const response = await axios.post(tenantRoute.apiTo("/finance/transactions"), {
                    type: "pengeluaran",
                    owner_member_id: Number(ownerMemberId),
                    transaction_date: transactionDate,
                    amount: Number(item.amount || 0),
                    currency_code: selectedAccount?.currency_code || selectedPocket?.currency_code || defaultCurrency,
                    exchange_rate: 1,
                    category_id: item.category_id ? Number(item.category_id) : null,
                    wallet_id: pocketId,
                    budget_id: item.budget_id || null,
                    description: item.description,
                    notes: [sharedNotes, item.notes].filter(Boolean).join("\n").trim(),
                    merchant_name: merchantName || null,
                    tags: [],
                    source_type: "finance_bulk",
                    source_id: sourceId,
                });

                created.push(response.data?.data?.transaction);
            }

            notify.success("Bulk transaksi berhasil disimpan.");
            onSuccess(created);
            onClose();
        } catch (error: any) {
            const parsed = parseApiError(error, "Gagal menyimpan bulk transaksi.");
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} fullscreen>
            <Modal.Header closeButton className="border-bottom-0 pb-0">
                <div className="w-100">
                    <Modal.Title>{draft ? "Bulk Entry from WhatsApp" : "Bulk Entry"}</Modal.Title>
                    <div className="small text-muted mt-2">
                        {draft
                            ? "Review hasil ekstraksi AI, lalu simpan dengan form bulk yang sama seperti input manual."
                            : "Tambah beberapa item dalam satu sesi, lalu simpan sebagai satu grup bulk."}
                    </div>
                </div>
            </Modal.Header>
            <Modal.Body className="bg-white" style={{ paddingBottom: 112 }}>
                {draft && (
                    <Alert variant="info" className="rounded-4 border-0">
                        Draft ini berasal dari WhatsApp. Deskripsi, nominal, dan kategori awal sudah diprefill oleh AI.
                        {((draft.media_items?.length ?? 0) > 0 || draft.media_preview_url) && (
                            <div className="mt-2 d-flex gap-2 flex-wrap">
                                {(draft.media_items && draft.media_items.length > 0
                                    ? draft.media_items
                                    : draft.media_preview_url
                                        ? [{ id: 0, preview_url: draft.media_preview_url, mime_type: "image/*" }]
                                        : []
                                ).map((mediaItem, index) => (
                                    <button
                                        key={`${mediaItem.id}-${index}`}
                                        type="button"
                                        className="btn btn-sm btn-soft-primary"
                                        onClick={() => setPreviewItem({
                                            url: mediaItem.preview_url,
                                            title: index === 0 ? "Preview attachment" : `Lampiran ${index + 1}`,
                                            mimeType: mediaItem.mime_type || null,
                                        })}
                                    >
                                        <i className={`${String(mediaItem.mime_type || "").startsWith("image/") ? "ri-image-line" : "ri-attachment-2"} me-1`} />
                                        {index === 0 ? "Preview attachment" : `Lampiran ${index + 1}`}
                                    </button>
                                ))}
                            </div>
                        )}
                    </Alert>
                )}
                <div className="mb-4 d-grid gap-3">
                    {canManageShared && (
                        <Row className="g-3">
                            <Col xs={12}>
                                <Form.Label>Owner</Form.Label>
                                <Form.Select value={ownerMemberId} onChange={(event) => setOwnerMemberId(event.target.value)}>
                                    <option value="">Pilih owner</option>
                                    {memberOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Row>
                    )}
                    <Row className="g-3">
                        <Col xs={8}>
                            <Form.Label>Wallet</Form.Label>
                            <Form.Select value={pocketId} onChange={(event) => setPocketId(event.target.value)}>
                                <option value="">Pilih wallet</option>
                                {pocketOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                            {selectedAccount && (
                                <Form.Text className="text-muted">
                                    Akun: {selectedAccount.name} · {selectedAccount.currency_code}
                                </Form.Text>
                            )}
                        </Col>
                        <Col xs={4}>
                            <Form.Label>Tanggal</Form.Label>
                            <Form.Control type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} />
                        </Col>
                    </Row>
                    <Row className="g-3">
                        <Col xs={6}>
                            <Form.Label>Label Grup / Merchant</Form.Label>
                            <Form.Control value={merchantName} onChange={(event) => setMerchantName(event.target.value)} placeholder="Contoh: Belanja Mingguan" />
                        </Col>
                        <Col xs={6}>
                            <Form.Label>Catatan Grup</Form.Label>
                            <Form.Control as="textarea" rows={1} style={{ minHeight: "38px" }} value={sharedNotes} onChange={(event) => setSharedNotes(event.target.value)} placeholder="Opsional." />
                        </Col>
                    </Row>
                </div>

                <div className="d-grid gap-3">
                    {items.map((item, index) => (
                        <div key={`batch-item-${index}`} className="rounded-4 border p-3 bg-white shadow-sm">
                            <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                                <div className="small text-muted">Item {index + 1}</div>
                                <Button type="button" size="sm" variant="light" onClick={() => removeItem(index)} disabled={items.length === 1}>
                                    Hapus
                                </Button>
                            </div>
                            <Row className="g-3">
                                <Col xs={7}>
                                    <Form.Label>Deskripsi</Form.Label>
                                    <Form.Control value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} />
                                </Col>
                                <Col xs={5}>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <Form.Label className="mb-0">Nominal</Form.Label>
                                        <Button type="button" variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => openCalculator(index)}>
                                            Kalkulator
                                        </Button>
                                    </div>
                                    <InputGroup>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            inputMode="decimal"
                                            pattern="[0-9]*"
                                            value={item.amount}
                                            onChange={(event) => updateItem(index, "amount", event.target.value)}
                                            readOnly={showCalculator && activeCalculatorIndex === index}
                                        />
                                        <Button type="button" variant="outline-secondary" onClick={() => openCalculator(index)}>
                                            <i className="ri-calculator-line" aria-hidden="true" />
                                        </Button>
                                    </InputGroup>
                                </Col>
                                <Col xs={7}>
                                    <Form.Label>Budget</Form.Label>
                                    <Form.Select
                                        value={item.budget_id}
                                        onChange={(event) => updateItem(index, "budget_id", event.target.value)}
                                        disabled={Boolean(selectedPocket?.budget_lock_enabled && walletDefaultBudgetForMonth)}
                                    >
                                        <option value="">Pilih budget</option>
                                        {budgetOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    {budgetOptions.length === 0 && (
                                        <Form.Text className="text-danger">
                                            Tidak ada budget tersedia untuk owner/wallet/periode ini.
                                        </Form.Text>
                                    )}
                                    {selectedPocket?.budget_lock_enabled && walletDefaultBudgetForMonth && (
                                        <Form.Text className="text-muted">
                                            Budget dikunci oleh wallet batch ini.
                                        </Form.Text>
                                    )}
                                </Col>
                                <Col xs={5}>
                                    <Form.Label>Kategori</Form.Label>
                                    <Form.Select value={item.category_id} onChange={(event) => updateItem(index, "category_id", event.target.value)}>
                                        <option value="">Pilih kategori</option>
                                        {categoryOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col xs={12}>
                                    <Form.Label>Catatan Item</Form.Label>
                                    <Form.Control size="sm" value={item.notes} onChange={(event) => updateItem(index, "notes", event.target.value)} />
                                </Col>
                            </Row>
                        </div>
                    ))}
                </div>

                <div className="mt-3">
                    <Button type="button" variant="light" className="rounded-pill" onClick={addItem}>
                        <i className="ri-add-line me-1" />
                        Tambah Item
                    </Button>
                </div>
            </Modal.Body>
            <Modal.Footer className="border-top bg-white position-sticky bottom-0">
                <Button variant="light" onClick={onClose} disabled={loading}>Batal</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Menyimpan..." : draft ? "Simpan Draft WhatsApp" : "Simpan Bulk"}
                </Button>
            </Modal.Footer>
            <MiniCalculator
                show={showCalculator}
                onClose={() => {
                    setShowCalculator(false);
                    setActiveCalculatorIndex(null);
                }}
                onCommit={(value) => {
                    if (activeCalculatorIndex === null) {
                        return;
                    }

                    updateItem(activeCalculatorIndex, "amount", value);
                    setShowCalculator(false);
                    setActiveCalculatorIndex(null);
                }}
                value={activeCalculatorIndex === null ? "" : items[activeCalculatorIndex]?.amount ?? ""}
                currencyCode={selectedAccount?.currency_code ?? selectedPocket?.currency_code ?? defaultCurrency}
                title="Hitung nominal item"
            />
            <AttachmentPreviewModal
                show={previewItem !== null}
                item={previewItem}
                onClose={() => setPreviewItem(null)}
            />
        </Modal>
    );
};

export default TransactionBatchModal;
