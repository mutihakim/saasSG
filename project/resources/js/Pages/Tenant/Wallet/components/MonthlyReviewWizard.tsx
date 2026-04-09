import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Modal, Nav, ProgressBar, Row, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { parseApiError } from "../../../../common/apiError";
import { notify } from "../../../../common/notify";
import { useTenantRoute } from "../../../../common/tenantRoute";
import {
    MonthlyReviewBudgetDraft,
    MonthlyReviewPreview,
    MonthlyReviewStatus,
    MonthlyReviewSweepDraft,
} from "../types";

import { formatCurrency, monthLabel } from "./pwa/types";

type Props = {
    show: boolean;
    onHide: () => void;
    monthlyReview: MonthlyReviewStatus | null;
    syncAll: () => Promise<void>;
};

const STEPS = [
    { key: 1, label: "Rekonsiliasi" },
    { key: 2, label: "Wallet Sweep" },
    { key: 3, label: "Budget Bulan Depan" },
    { key: 4, label: "Review & Submit" },
] as const;

const MonthlyReviewWizard = ({ show, onHide, monthlyReview, syncAll }: Props) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const [activeStep, setActiveStep] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string>(monthlyReview?.suggested_period_month || monthlyReview?.previous_month || "");
    const [budgetMethod, setBudgetMethod] = useState<"copy_last_month" | "average_3_months" | "zero_based">("copy_last_month");
    const [preview, setPreview] = useState<MonthlyReviewPreview | null>(null);
    const [sweepDrafts, setSweepDrafts] = useState<MonthlyReviewSweepDraft[]>([]);
    const [budgetDrafts, setBudgetDrafts] = useState<MonthlyReviewBudgetDraft[]>([]);

    const selectedMonthLabel = useMemo(() => {
        if (!selectedMonth) {
            return "";
        }

        const [year, month] = selectedMonth.split("-");

        return monthLabel(new Date(Number(year), Number(month) - 1, 1));
    }, [selectedMonth]);

    useEffect(() => {
        if (! show) {
            return;
        }

        setActiveStep(1);
        setSelectedMonth(monthlyReview?.suggested_period_month || monthlyReview?.previous_month || "");
        setBudgetMethod("copy_last_month");
        setPreview(null);
        setSweepDrafts([]);
        setBudgetDrafts([]);
    }, [show, monthlyReview]);

    useEffect(() => {
        if (! show || ! selectedMonth) {
            return;
        }

        void loadPreview(selectedMonth, budgetMethod);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, selectedMonth, budgetMethod]);

    const loadPreview = async (periodMonth: string, method: "copy_last_month" | "average_3_months" | "zero_based") => {
        if (!periodMonth) {
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(tenantRoute.apiTo("/finance/monthly-review/preview"), {
                params: { period_month: periodMonth, budget_method: method },
            });
            const payload = response.data?.data?.preview as MonthlyReviewPreview;
            setPreview(payload);
            setSweepDrafts(payload?.sweep_actions ?? []);
            setBudgetDrafts(payload?.budget_drafts ?? []);
        } catch (error: any) {
            const parsed = parseApiError(error, t("wallet.messages.goal_save_failed", { defaultValue: "Gagal memuat monthly review." }));
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setLoading(false);
        }
    };

    const handleAutoGenerate = (method: "copy_last_month" | "average_3_months" | "zero_based") => {
        setBudgetMethod(method);
        // useEffect akan otomatis trigger loadPreview karena budgetMethod berubah
    };

    const handleSubmit = async () => {
        if (! preview) {
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(tenantRoute.apiTo("/finance/monthly-review/submit"), {
                period_month: preview.period_month,
                budget_method: budgetMethod,
                sweep_actions: sweepDrafts,
                budget_drafts: budgetDrafts.map((draft) => ({
                    ...draft,
                    allocated_amount: Number(draft.allocated_amount || 0),
                })),
            });
            notify.success("Monthly review berhasil ditutup.");
            onHide();
            await syncAll();
        } catch (error: any) {
            const parsed = parseApiError(error, "Gagal menyimpan monthly review.");
            notify.error({ title: parsed.title, detail: parsed.detail });
        } finally {
            setSubmitting(false);
        }
    };

    const totalSweep = sweepDrafts.reduce((carry, item) => carry + Number(item.amount || 0), 0);
    const totalBudget = budgetDrafts.reduce((carry, item) => carry + Number(item.allocated_amount || 0), 0);

    return (
        <Modal show={show} onHide={onHide} fullscreen centered scrollable>
            <Modal.Header closeButton className="border-0 pb-0">
                <div>
                    <div className="text-uppercase small fw-semibold text-primary">Monthly Review</div>
                    <Modal.Title className="mt-1">{selectedMonthLabel || "Tutup Buku"}</Modal.Title>
                    <div className="small text-muted mt-1">
                        Tutup buku bulanan, rapikan sweep wallet, lalu siapkan budget bulan berikutnya.
                    </div>
                </div>
            </Modal.Header>
            <Modal.Body className="pt-3">
                <div className="progress-nav mb-4">
                    <ProgressBar now={(activeStep / STEPS.length) * 100} style={{ height: 2 }} className="mb-3" />
                    <Nav className="nav-pills progress-bar-tab custom-nav justify-content-between">
                        {STEPS.map((step) => (
                            <Nav.Item key={step.key}>
                                <Nav.Link
                                    as="button"
                                    eventKey={String(step.key)}
                                    active={activeStep === step.key}
                                    className="rounded-pill"
                                    onClick={() => setActiveStep(step.key)}
                                >
                                    {step.key}
                                </Nav.Link>
                                <div className="small text-muted mt-2 text-center">{step.label}</div>
                            </Nav.Item>
                        ))}
                    </Nav>
                </div>

                <Card className="border-0 shadow-sm rounded-4 mb-4">
                    <Card.Body className="p-3">
                        <Row className="g-3 align-items-end">
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Periode Ditutup</Form.Label>
                                    <Form.Select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
                                        {(monthlyReview?.eligible_months || []).map((month) => (
                                            <option key={month.period_month} value={month.period_month}>
                                                {month.period_month}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small fw-semibold">Metode Budget</Form.Label>
                                    <Form.Select value={budgetMethod} onChange={(event) => handleAutoGenerate(event.target.value as typeof budgetMethod)}>
                                        <option value="copy_last_month">Copy Last Month</option>
                                        <option value="average_3_months">Average 3 Months</option>
                                        <option value="zero_based">Zero Based</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Button className="w-100 rounded-pill" onClick={() => selectedMonth && void loadPreview(selectedMonth, budgetMethod)} disabled={loading}>
                                    {loading ? <Spinner size="sm" /> : "Refresh Preview"}
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {monthlyReview?.planning_blocked && (
                    <Alert variant="warning" className="rounded-4">
                        Budget bulan ini dan transfer wallet masih dikunci sampai review bulan sebelumnya selesai. Expense dan income harian tetap bisa dicatat.
                    </Alert>
                )}

                {loading && (
                    <div className="py-5 text-center text-muted">
                        <Spinner className="me-2" size="sm" />
                        Memuat monthly review...
                    </div>
                )}

                {!loading && preview && activeStep === 1 && (
                    <div className="d-flex flex-column gap-3">
                        <Card className="border-0 shadow-sm rounded-4">
                            <Card.Body className="p-3">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="fw-semibold">Ringkasan Akun</div>
                                    <Badge bg={preview.status === "closed" ? "success" : "warning"}>{preview.status}</Badge>
                                </div>
                                <Row className="g-3">
                                    {preview.accounts.map((account) => (
                                        <Col md={4} key={account.id}>
                                            <div className="rounded-4 border bg-light p-3 h-100">
                                                <div className="fw-semibold">{account.name}</div>
                                                <div className="small text-muted mb-3">{account.type}</div>
                                                <div className="d-grid gap-2">
                                                    <div className="d-flex justify-content-between"><span className="small text-muted">Total Saldo</span><span className="fw-semibold">{formatCurrency(account.ending_balance, account.currency_code)}</span></div>
                                                    <div className="d-flex justify-content-between"><span className="small text-muted">Telah Dialokasikan</span><span>{formatCurrency(account.allocated_amount, account.currency_code)}</span></div>
                                                    <div className="d-flex justify-content-between"><span className="small text-muted">Belum Dialokasikan</span><span>{formatCurrency(account.unallocated_amount, account.currency_code)}</span></div>
                                                </div>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </Card.Body>
                        </Card>
                    </div>
                )}

                {!loading && preview && activeStep === 2 && (
                    <div className="d-flex flex-column gap-3">
                        {preview.wallets.filter((wallet) => Number(wallet.ending_balance) > 0 && !wallet.is_system).map((wallet) => {
                            const draft = sweepDrafts.find((item) => item.source_pocket_id === wallet.id);

                            return (
                                <Card key={wallet.id} className="border-0 shadow-sm rounded-4">
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                                            <div>
                                                <div className="fw-semibold">{wallet.name}</div>
                                                <div className="small text-muted">{wallet.owner_member_name || "Shared"} · {wallet.real_account_name}</div>
                                            </div>
                                            <div className="text-end">
                                                <div className="small text-muted">Saldo Akhir</div>
                                                <div className="fw-semibold">{formatCurrency(wallet.ending_balance)}</div>
                                            </div>
                                        </div>
                                        <Row className="g-3">
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-semibold">Sweep Option</Form.Label>
                                                    <Form.Select
                                                        value={draft?.action || "rollover"}
                                                        onChange={(event) => setSweepDrafts((prev) => prev.map((item) => item.source_pocket_id === wallet.id ? { ...item, action: event.target.value as MonthlyReviewSweepDraft["action"] } : item))}
                                                    >
                                                        <option value="rollover">rollover</option>
                                                        <option value="sweep_to_wallet">sweep_to_wallet</option>
                                                        <option value="sweep_to_goal">sweep_to_goal</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={3}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-semibold">Amount</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        min={0}
                                                        value={draft?.amount ?? wallet.ending_balance}
                                                        onChange={(event) => setSweepDrafts((prev) => prev.map((item) => item.source_pocket_id === wallet.id ? { ...item, amount: event.target.value } : item))}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={5}>
                                                {draft?.action === "sweep_to_wallet" && (
                                                    <Form.Group>
                                                        <Form.Label className="small fw-semibold">Target Wallet</Form.Label>
                                                        <Form.Select
                                                            value={draft?.target_pocket_id || ""}
                                                            onChange={(event) => setSweepDrafts((prev) => prev.map((item) => item.source_pocket_id === wallet.id ? { ...item, target_pocket_id: event.target.value } : item))}
                                                        >
                                                            <option value="">Pilih wallet</option>
                                                            {preview.wallets.filter((item) => item.id !== wallet.id).map((item) => (
                                                                <option key={item.id} value={item.id}>{item.real_account_name} · {item.name}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                )}
                                                {draft?.action === "sweep_to_goal" && (
                                                    <Form.Group>
                                                        <Form.Label className="small fw-semibold">Target Goal</Form.Label>
                                                        <Form.Select
                                                            value={draft?.goal_id || ""}
                                                            onChange={(event) => setSweepDrafts((prev) => prev.map((item) => item.source_pocket_id === wallet.id ? { ...item, goal_id: event.target.value } : item))}
                                                        >
                                                            <option value="">Pilih goal</option>
                                                            {preview.goals.map((goal) => (
                                                                <option key={goal.id} value={goal.id}>{goal.name} · {goal.pocket_name}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                )}
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {!loading && preview && activeStep === 3 && (
                    <div className="d-flex flex-column gap-3">
                        <Card className="border-0 shadow-sm rounded-4">
                            <Card.Body className="p-3">
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    <Button variant={budgetMethod === "copy_last_month" ? "primary" : "light"} className="rounded-pill" onClick={() => handleAutoGenerate("copy_last_month")}>Copy Last Month</Button>
                                    <Button variant={budgetMethod === "average_3_months" ? "primary" : "light"} className="rounded-pill" onClick={() => handleAutoGenerate("average_3_months")}>Average 3 Months</Button>
                                    <Button variant={budgetMethod === "zero_based" ? "primary" : "light"} className="rounded-pill" onClick={() => handleAutoGenerate("zero_based")}>Zero Based</Button>
                                </div>
                                <Row className="g-3">
                                    {budgetDrafts.map((draft, index) => (
                                        <Col md={6} key={`${draft.budget_key}-${index}`}>
                                            <div className="rounded-4 border bg-light p-3 h-100">
                                                <div className="fw-semibold">{draft.name}</div>
                                                <div className="small text-muted mb-3">{draft.period_month}</div>
                                                <Form.Control
                                                    type="number"
                                                    min={0}
                                                    value={draft.allocated_amount}
                                                    onChange={(event) => setBudgetDrafts((prev) => prev.map((item) => item.budget_key === draft.budget_key ? { ...item, allocated_amount: event.target.value } : item))}
                                                />
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            </Card.Body>
                        </Card>
                    </div>
                )}

                {!loading && preview && activeStep === 4 && (
                    <div className="d-flex flex-column gap-3">
                        <Card className="border-0 shadow-sm rounded-4">
                            <Card.Body className="p-3">
                                <div className="fw-semibold mb-3">Review Summary</div>
                                <Row className="g-3">
                                    <Col md={4}>
                                        <div className="rounded-4 border bg-light p-3 h-100">
                                            <div className="small text-muted">Periode Ditutup</div>
                                            <div className="fw-semibold mt-1">{preview.period_month}</div>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="rounded-4 border bg-light p-3 h-100">
                                            <div className="small text-muted">Total Sweep</div>
                                            <div className="fw-semibold mt-1">{formatCurrency(totalSweep)}</div>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="rounded-4 border bg-light p-3 h-100">
                                            <div className="small text-muted">Budget Next Month</div>
                                            <div className="fw-semibold mt-1">{formatCurrency(totalBudget)}</div>
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                        <Alert variant="info" className="rounded-4 mb-0">
                            Submit akan menutup periode ini, menyimpan snapshot review, membuat draft budget bulan depan, dan mengeksekusi sweep wallet yang Anda pilih.
                        </Alert>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="light" className="rounded-pill" onClick={activeStep === 1 ? onHide : () => setActiveStep((step) => Math.max(1, step - 1))}>
                    {activeStep === 1 ? "Close" : "Back"}
                </Button>
                {activeStep < 4 ? (
                    <Button className="rounded-pill" onClick={() => setActiveStep((step) => Math.min(4, step + 1))} disabled={!preview}>
                        Next
                    </Button>
                ) : (
                    <Button
                        className="rounded-pill"
                        onClick={() => void handleSubmit()}
                        disabled={!preview || submitting || preview.status === "closed"}
                    >
                        {submitting ? <Spinner size="sm" /> : preview?.status === "closed" ? "Tutup Buku Selesai" : "Submit Tutup Buku"}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default MonthlyReviewWizard;
