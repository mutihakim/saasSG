import React from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceWallet } from "../types";
import { FinanceWishConvertFormState, FinanceWish, FinanceWishFormState } from "../types";

type Props = {
    selectedWish: FinanceWish | null;
    showWishModal: boolean;
    setShowWishModal: (show: boolean) => void;
    wishForm: FinanceWishFormState;
    setWishForm: React.Dispatch<React.SetStateAction<FinanceWishFormState>>;
    handleSaveWish: () => Promise<void>;
    savingWish: boolean;
    showConvertModal: boolean;
    setShowConvertModal: (show: boolean) => void;
    convertForm: FinanceWishConvertFormState;
    setConvertForm: React.Dispatch<React.SetStateAction<FinanceWishConvertFormState>>;
    handleConvertWish: () => Promise<void>;
    convertingWish: boolean;
    wallets: FinanceWallet[];
};

const WishDialogs = ({
    selectedWish,
    showWishModal,
    setShowWishModal,
    wishForm,
    setWishForm,
    handleSaveWish,
    savingWish,
    showConvertModal,
    setShowConvertModal,
    convertForm,
    setConvertForm,
    handleConvertWish,
    convertingWish,
    wallets,
}: Props) => {
    const { t } = useTranslation();
    
    return (
        <>
            <Modal show={showWishModal} onHide={() => setShowWishModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t(selectedWish ? "wallet.modal.edit_wish" : "wallet.modal.add_wish")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>{t("wallet.fields.wish_title")}</Form.Label>
                        <Form.Control value={wishForm.title} onChange={(e) => setWishForm((prev) => ({ ...prev, title: e.target.value }))} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>{t("wallet.fields.description")}</Form.Label>
                        <Form.Control as="textarea" rows={3} value={wishForm.description} onChange={(e) => setWishForm((prev) => ({ ...prev, description: e.target.value }))} />
                    </Form.Group>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.estimated_amount")}</Form.Label>
                            <Form.Control type="number" step="0.01" inputMode="decimal" pattern="[0-9]*" value={wishForm.estimated_amount} onChange={(e) => setWishForm((prev) => ({ ...prev, estimated_amount: e.target.value }))} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.priority")}</Form.Label>
                            <Form.Select value={wishForm.priority} onChange={(e) => setWishForm((prev) => ({ ...prev, priority: e.target.value as FinanceWishFormState["priority"] }))}>
                                <option value="low">{t("wallet.priority.low")}</option>
                                <option value="medium">{t("wallet.priority.medium")}</option>
                                <option value="high">{t("wallet.priority.high")}</option>
                            </Form.Select>
                        </Col>
                    </Row>
                    <Form.Group className="mt-3">
                        <Form.Label>{t("wallet.fields.image_url")}</Form.Label>
                        <Form.Control value={wishForm.image_url} onChange={(e) => setWishForm((prev) => ({ ...prev, image_url: e.target.value }))} />
                    </Form.Group>
                    <Form.Group className="mt-3">
                        <Form.Label>{t("wallet.fields.notes")}</Form.Label>
                        <Form.Control as="textarea" rows={2} value={wishForm.notes} onChange={(e) => setWishForm((prev) => ({ ...prev, notes: e.target.value }))} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowWishModal(false)}>{t("wallet.actions.cancel")}</Button>
                    <Button variant="primary" onClick={() => void handleSaveWish()} disabled={savingWish || !wishForm.title}>
                        {savingWish ? t("wallet.actions.saving") : t("wallet.actions.save_wish")}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t("wallet.modal.convert_wish")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="small text-muted mb-3">{selectedWish?.title}</div>
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Label>{t("wallet.fields.wallet")}</Form.Label>
                            <Form.Select value={convertForm.wallet_id} onChange={(e) => setConvertForm((prev) => ({ ...prev, wallet_id: e.target.value }))}>
                                {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.target_amount")}</Form.Label>
                            <Form.Control type="number" step="0.01" inputMode="decimal" pattern="[0-9]*" value={convertForm.target_amount} onChange={(e) => setConvertForm((prev) => ({ ...prev, target_amount: e.target.value }))} />
                        </Col>
                        <Col md={6}>
                            <Form.Label>{t("wallet.fields.target_date")}</Form.Label>
                            <Form.Control type="date" value={convertForm.target_date} onChange={(e) => setConvertForm((prev) => ({ ...prev, target_date: e.target.value }))} />
                        </Col>
                    </Row>
                    <Form.Group className="mt-3">
                        <Form.Label>{t("wallet.fields.notes")}</Form.Label>
                        <Form.Control as="textarea" rows={3} value={convertForm.notes} onChange={(e) => setConvertForm((prev) => ({ ...prev, notes: e.target.value }))} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={() => setShowConvertModal(false)}>{t("wallet.actions.cancel")}</Button>
                    <Button variant="primary" onClick={() => void handleConvertWish()} disabled={convertingWish || !convertForm.wallet_id}>
                        {convertingWish ? t("wallet.actions.saving") : t("wallet.actions.convert_goal")}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default WishDialogs;
