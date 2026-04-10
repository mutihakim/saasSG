import React from "react";
import { Alert, Badge, Button, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceWallet } from "../types";
import { FinanceWish } from "../types";

import { formatCurrency } from "./pwa/types";

type Props = {
    wishes: FinanceWish[];
    canCreateGoal: boolean;
    filteredWallets: FinanceWallet[];
    onApproveReject: (wish: FinanceWish, action: "approve" | "reject") => void;
    onConvert: (wish: FinanceWish) => void;
    onEdit: (wish: FinanceWish) => void;
    onDelete: (wish: FinanceWish) => void;
};

const FinanceWishesTab = ({ wishes, canCreateGoal, onApproveReject, onConvert, onEdit, onDelete }: Props) => {
    const { t } = useTranslation();

    return (
        <div className="d-flex flex-column gap-3">
            {wishes.map((wish) => (
                <Card key={wish.id} className="border-0 shadow-sm rounded-4 overflow-hidden">
                    <Card.Body className="p-3">
                        <div className="d-flex justify-content-between gap-3">
                            <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <div className="fw-semibold">{wish.title}</div>
                                    <Badge bg={wish.priority === "high" ? "warning" : wish.priority === "medium" ? "info" : "secondary"}>
                                        {t(`wallet.priority.${wish.priority}`)}
                                    </Badge>
                                    <Badge bg="light" text="dark">{t(`wallet.wish_status.${wish.status}`)}</Badge>
                                </div>
                                {wish.description && <div className="text-muted small mb-2">{wish.description}</div>}
                                <div className="small text-muted">{formatCurrency(wish.estimated_amount)}</div>
                            </div>
                            {wish.image_url && (
                                <img src={wish.image_url} alt={wish.title} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 16 }} />
                            )}
                        </div>
                        <div className="d-flex flex-wrap gap-2 mt-3">
                            {wish.status === "pending" && (
                                <>
                                    <Button size="sm" variant="success" className="rounded-pill" onClick={() => onApproveReject(wish, "approve")}>{t("wallet.actions.approve")}</Button>
                                    <Button size="sm" variant="outline-secondary" className="rounded-pill" onClick={() => onApproveReject(wish, "reject")}>{t("wallet.actions.reject")}</Button>
                                </>
                            )}
                            {wish.status !== "converted" && canCreateGoal && (
                                <Button size="sm" variant="primary" className="rounded-pill" onClick={() => onConvert(wish)}>
                                    {t("wallet.actions.convert_goal")}
                                </Button>
                            )}
                            <Button size="sm" variant="light" className="rounded-pill" onClick={() => onEdit(wish)}>{t("wallet.actions.edit")}</Button>
                            <Button size="sm" variant="outline-danger" className="rounded-pill" onClick={() => onDelete(wish)}>{t("wallet.actions.delete")}</Button>
                        </div>
                    </Card.Body>
                </Card>
            ))}
            {wishes.length === 0 && <Alert variant="light" className="rounded-4 border-0 shadow-sm">{t("wallet.empty_wishes")}</Alert>}
        </div>
    );
};

export default FinanceWishesTab;
