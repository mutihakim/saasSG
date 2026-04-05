import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import Select from "react-select";

import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";

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
    members: any[];
    activeMemberId?: number | null;
    canManageShared?: boolean;
    defaultCurrency: string;
}

const canUseForOwner = (item: any, ownerMemberId: string) => {
    if (!item) return false;
    if (item.scope === "shared") return true;
    return String(item.owner_member_id || "") === String(ownerMemberId || "");
};

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
    members,
    activeMemberId,
    canManageShared = false,
    defaultCurrency,
}: TransactionBatchModalProps) => {
    const tenantRoute = useTenantRoute();
    const [loading, setLoading] = useState(false);
    const [ownerMemberId, setOwnerMemberId] = useState(activeMemberId ? String(activeMemberId) : "");
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
    const [bankAccountId, setBankAccountId] = useState("");
    const [merchantName, setMerchantName] = useState("");
    const [sharedNotes, setSharedNotes] = useState("");
    const [items, setItems] = useState<BatchEntryItem[]>([createEmptyItem()]);

    useEffect(() => {
        if (!show) {
            return;
        }

        const nextOwner = activeMemberId ? String(activeMemberId) : members[0] ? String(members[0].id) : "";
        const firstAccount = accounts.find((account) => canUseForOwner(account, nextOwner));
        setOwnerMemberId(nextOwner);
        setTransactionDate(new Date().toISOString().slice(0, 10));
        setBankAccountId(firstAccount ? String(firstAccount.id) : "");
        setMerchantName("");
        setSharedNotes("");
        setItems([createEmptyItem()]);
    }, [accounts, activeMemberId, members, show]);

    const visibleAccounts = useMemo(() => accounts.filter((account) => canUseForOwner(account, ownerMemberId)), [accounts, ownerMemberId]);
    const visibleBudgets = useMemo(() => budgets.filter((budget) => canUseForOwner(budget, ownerMemberId)), [budgets, ownerMemberId]);
    const accountOptions = useMemo(() => visibleAccounts.map((account) => ({
        value: String(account.id),
        label: `${account.name} · ${account.currency_code}`,
    })), [visibleAccounts]);
    const budgetOptions = useMemo(() => visibleBudgets.map((budget) => ({
        value: String(budget.id),
        label: `${budget.name} · ${budget.period_month}`,
    })), [visibleBudgets]);
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

        const selectedStillVisible = visibleAccounts.some((account) => String(account.id) === String(bankAccountId));
        if (!selectedStillVisible) {
            setBankAccountId(visibleAccounts[0] ? String(visibleAccounts[0].id) : "");
        }
    }, [bankAccountId, show, visibleAccounts]);

    const updateItem = (index: number, key: keyof BatchEntryItem, value: string) => {
        setItems((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
    };

    const addItem = () => {
        setItems((prev) => [...prev, createEmptyItem()]);
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index));
    };

    const handleSubmit = async () => {
        const validItems = items.filter((item) => item.description.trim() !== "" && Number(item.amount || 0) > 0);
        if (!ownerMemberId || !bankAccountId || validItems.length === 0) {
            notify.error("Lengkapi akun, tanggal, dan minimal satu item transaksi.");
            return;
        }

        const selectedAccount = visibleAccounts.find((account) => String(account.id) === String(bankAccountId));
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
                    currency_code: selectedAccount?.currency_code || defaultCurrency,
                    exchange_rate: 1,
                    category_id: item.category_id ? Number(item.category_id) : null,
                    bank_account_id: bankAccountId,
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
                    <Modal.Title>Bulk Entry</Modal.Title>
                    <div className="small text-muted mt-2">Tambah beberapa item dalam satu sesi, lalu simpan sebagai satu grup bulk.</div>
                </div>
            </Modal.Header>
            <Modal.Body className="bg-white" style={{ paddingBottom: 112 }}>
                <div className="mb-4 d-grid gap-3">
                    <Row className="g-3">
                        {canManageShared ? (
                            <>
                                <Col xs={12} md={8}>
                                    <Form.Label>Owner</Form.Label>
                                    <Select
                                        options={memberOptions}
                                        value={memberOptions.find((option) => option.value === ownerMemberId)}
                                        onChange={(option: any) => setOwnerMemberId(option?.value ?? "")}
                                        classNamePrefix="react-select"
                                    />
                                </Col>
                                <Col xs={12} md={4}>
                                    <Form.Label>Tanggal</Form.Label>
                                    <Form.Control type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} />
                                </Col>
                            </>
                        ) : (
                            <Col xs={12}>
                                <Form.Label>Tanggal</Form.Label>
                                <Form.Control type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} />
                            </Col>
                        )}
                    </Row>
                    <Row className="g-3">
                        <Col xs={12} md={8}>
                            <Form.Label>Akun</Form.Label>
                            <Select
                                options={accountOptions}
                                value={accountOptions.find((option) => option.value === bankAccountId)}
                                onChange={(option: any) => setBankAccountId(option?.value ?? "")}
                                classNamePrefix="react-select"
                            />
                        </Col>
                        <Col xs={12} md={4}>
                            <Form.Label>Label Grup / Merchant</Form.Label>
                            <Form.Control value={merchantName} onChange={(event) => setMerchantName(event.target.value)} placeholder="Contoh: Belanja Mingguan" />
                        </Col>
                    </Row>
                    <Row className="g-3">
                        <Col xs={12}>
                            <Form.Label>Catatan Grup</Form.Label>
                            <Form.Control as="textarea" rows={2} value={sharedNotes} onChange={(event) => setSharedNotes(event.target.value)} placeholder="Opsional, akan ditambahkan ke semua item." />
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
                                <Col xs={8}>
                                    <Form.Label>Deskripsi</Form.Label>
                                    <Form.Control value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} />
                                </Col>
                                <Col xs={4}>
                                    <Form.Label>Nominal</Form.Label>
                                    <Form.Control type="number" step="0.01" value={item.amount} onChange={(event) => updateItem(index, "amount", event.target.value)} />
                                </Col>
                                <Col xs={7}>
                                    <Form.Label>Budget</Form.Label>
                                    <Select
                                        options={budgetOptions}
                                        value={budgetOptions.find((option) => option.value === item.budget_id)}
                                        onChange={(option: any) => updateItem(index, "budget_id", option?.value ?? "")}
                                        classNamePrefix="react-select"
                                        isClearable
                                    />
                                </Col>
                                <Col xs={5}>
                                    <Form.Label>Kategori</Form.Label>
                                    <Select
                                        options={categoryOptions}
                                        value={categoryOptions.find((option) => option.value === item.category_id)}
                                        onChange={(option: any) => updateItem(index, "category_id", option?.value ?? "")}
                                        classNamePrefix="react-select"
                                        isClearable
                                    />
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
                    {loading ? "Menyimpan..." : "Simpan Bulk"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TransactionBatchModal;
