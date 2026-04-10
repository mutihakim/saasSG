import React from "react";
import { Button, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { FinanceFilters, TransactionKind } from "./types";

import { currentMonthValue } from "@/core/constants/month";


interface FinanceFilterPanelProps {
    show: boolean;
    onClose: () => void;
    onApply: () => void;
    draft: FinanceFilters;
    setDraft: React.Dispatch<React.SetStateAction<FinanceFilters>>;
    members: any[];
    accounts: any[];
    categories: any[];
    permissions: {
        manageShared: boolean;
    };
}

const FinanceFilterPanel = ({
    show,
    onClose,
    onApply,
    draft,
    setDraft,
    members,
    accounts,
    categories,
    permissions,
}: FinanceFilterPanelProps) => {
    const { t } = useTranslation();

    return (
        <>
            {show && (
                <button
                    type="button"
                    aria-label="Close filter overlay"
                    className="position-fixed top-0 start-0 w-100 h-100 border-0"
                    style={{ background: "rgba(15, 23, 42, 0.28)", zIndex: 1050 }}
                    onClick={onClose}
                />
            )}
            <div
                className="position-fixed top-0 end-0 h-100 bg-white shadow-lg"
                style={{
                    width: "min(100%, 430px)",
                    zIndex: 1051,
                    transform: show ? "translateX(0)" : "translateX(108%)",
                    transition: "transform 220ms ease",
                    borderTopLeftRadius: 28,
                    borderBottomLeftRadius: 28,
                    paddingTop: "max(16px, env(safe-area-inset-top))",
                    paddingBottom: "max(20px, env(safe-area-inset-bottom))",
                }}
            >
                <div className="d-flex align-items-center justify-content-between px-3 pb-3 border-bottom">
                    <div>
                        <div className="fw-semibold fs-5 text-dark">{t("finance.pwa.filters.title")}</div>
                        <div className="small text-muted">{t("finance.pwa.filters.subtitle")}</div>
                    </div>
                    <button type="button" className="btn btn-light rounded-circle border-0" onClick={onClose}>
                        <i className="ri-close-line fs-5"></i>
                    </button>
                </div>
                <div className="px-3 pt-3 pb-4 overflow-auto" style={{ height: "calc(100% - 86px)" }}>
                    <div className="d-flex flex-column gap-3">
                        {permissions.manageShared && (
                            <div>
                                <Form.Label className="small fw-semibold text-uppercase text-muted mb-2">{t("finance.pwa.filters.member")}</Form.Label>
                                <Form.Select
                                    value={draft.owner_member_id}
                                    onChange={(e) => setDraft((prev) => ({ ...prev, owner_member_id: e.target.value }))}
                                    className="rounded-4"
                                >
                                    <option value="">{t("finance.pwa.filters.all_members")}</option>
                                    {members.map((member) => (
                                        <option key={member.id} value={String(member.id)}>{member.full_name}</option>
                                    ))}
                                </Form.Select>
                            </div>
                        )}

                        <div>
                            <Form.Label className="small fw-semibold text-uppercase text-muted mb-2">{t("finance.pwa.filters.account")}</Form.Label>
                            <Form.Select
                                value={draft.bank_account_id}
                                onChange={(e) => setDraft((prev) => ({ ...prev, bank_account_id: e.target.value }))}
                                className="rounded-4"
                            >
                                <option value="">{t("finance.pwa.filters.all_accounts")}</option>
                                {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>{account.name}</option>
                                ))}
                            </Form.Select>
                        </div>

                        <div>
                            <Form.Label className="small fw-semibold text-uppercase text-muted mb-2">{t("finance.pwa.filters.category")}</Form.Label>
                            <Form.Select
                                value={draft.category_id}
                                onChange={(e) => setDraft((prev) => ({ ...prev, category_id: e.target.value }))}
                                className="rounded-4"
                            >
                                <option value="">{t("finance.pwa.filters.all_categories")}</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={String(category.id)}>{category.name}</option>
                                ))}
                            </Form.Select>
                        </div>

                        <div>
                            <div className="small fw-semibold text-uppercase text-muted mb-2">{t("finance.pwa.filters.kind")}</div>
                            <div className="d-flex gap-2">
                                {(["all", "external", "internal_transfer"] as TransactionKind[]).map((kind) => (
                                    <button
                                        key={kind}
                                        type="button"
                                        className={`btn btn-sm flex-fill rounded-pill ${draft.transaction_kind === kind ? "btn-info text-white" : "btn-light"}`}
                                        onClick={() => setDraft((prev) => ({ ...prev, transaction_kind: kind }))}
                                    >
                                        {t(`finance.pwa.filters.kind_${kind}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="small fw-semibold text-uppercase text-muted mb-2">{t("finance.pwa.filters.period")}</div>
                            <div className="d-flex gap-2 mb-2">
                                <button
                                    type="button"
                                    className={`btn btn-sm flex-fill rounded-pill ${!draft.use_custom_range ? "btn-danger" : "btn-light"}`}
                                    onClick={() => setDraft((prev) => ({ ...prev, use_custom_range: false }))}
                                >
                                    {t("finance.pwa.filters.monthly")}
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm flex-fill rounded-pill ${draft.use_custom_range ? "btn-danger" : "btn-light"}`}
                                    onClick={() => setDraft((prev) => ({ ...prev, use_custom_range: true }))}
                                >
                                    {t("finance.pwa.filters.custom_range")}
                                </button>
                            </div>
                            {!draft.use_custom_range ? (
                                <Form.Control
                                    type="month"
                                    value={draft.month}
                                    onChange={(e) => setDraft((prev) => ({ ...prev, month: e.target.value }))}
                                    className="rounded-4"
                                />
                            ) : (
                                <div className="row g-2">
                                    <div className="col-6">
                                        <Form.Control
                                            type="date"
                                            value={draft.date_from}
                                            onChange={(e) => setDraft((prev) => ({ ...prev, date_from: e.target.value }))}
                                            className="rounded-4"
                                        />
                                    </div>
                                    <div className="col-6">
                                        <Form.Control
                                            type="date"
                                            value={draft.date_to}
                                            onChange={(e) => setDraft((prev) => ({ ...prev, date_to: e.target.value }))}
                                            className="rounded-4"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 d-flex gap-2">
                            <Button
                                variant="light"
                                className="flex-fill rounded-pill"
                                onClick={() => setDraft((prev) => ({
                                    ...prev,
                                    owner_member_id: "",
                                    bank_account_id: "",
                                    category_id: "",
                                    transaction_kind: "all",
                                    month: currentMonthValue(),
                                    date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
                                    date_to: new Date().toISOString().slice(0, 10),
                                    use_custom_range: false,
                                }))}
                            >
                                {t("finance.pwa.filters.reset")}
                            </Button>
                            <Button variant="danger" className="flex-fill rounded-pill" onClick={onApply}>
                                {t("finance.reports.actions.apply")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FinanceFilterPanel;
