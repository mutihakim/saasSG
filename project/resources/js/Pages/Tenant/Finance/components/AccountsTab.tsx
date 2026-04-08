import React from "react";
import { Button, Card } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { CARD_RADIUS, formatAmount } from "./pwa/types";
import { FinanceAccount, FinanceLimits } from "../types";
import { notify } from "../../../../common/notify";

type AccountsTabProps = {
    accounts: FinanceAccount[];
    defaultCurrency: string;
    activeMemberId?: number | null;
    permissions: {
        manageShared: boolean;
    };
    canManageFinanceStructures: boolean;
    accountCreateDisabled: boolean;
    limits: FinanceLimits;
    totalAssets: number;
    totalLiabilities: number;
    onCreate: () => void;
    onEdit: (account: FinanceAccount) => void;
};

const AccountsTab = ({
    accounts,
    defaultCurrency,
    activeMemberId,
    permissions,
    canManageFinanceStructures,
    accountCreateDisabled,
    limits,
    totalAssets,
    totalLiabilities,
    onCreate,
    onEdit,
}: AccountsTabProps) => {
    const { t } = useTranslation();

    return (
        <div className="d-flex flex-column gap-3">
            <div className="row g-2">
                <div className="col-4"><Card className="border-0 shadow-sm h-100" style={{ borderRadius: CARD_RADIUS }}><Card.Body className="p-3"><div className="small text-muted">{t("finance.pwa.account_totals.assets")}</div><div className="fw-bold text-info mt-1">{formatAmount(totalAssets, defaultCurrency)}</div></Card.Body></Card></div>
                <div className="col-4"><Card className="border-0 shadow-sm h-100" style={{ borderRadius: CARD_RADIUS }}><Card.Body className="p-3"><div className="small text-muted">{t("finance.pwa.account_totals.liabilities")}</div><div className="fw-bold text-danger mt-1">{formatAmount(totalLiabilities, defaultCurrency)}</div></Card.Body></Card></div>
                <div className="col-4"><Card className="border-0 shadow-sm h-100" style={{ borderRadius: CARD_RADIUS }}><Card.Body className="p-3"><div className="small text-muted">{t("finance.pwa.account_totals.total")}</div><div className="fw-bold mt-1">{formatAmount(totalAssets - totalLiabilities, defaultCurrency)}</div></Card.Body></Card></div>
            </div>
            {canManageFinanceStructures && (
                <div className="d-flex justify-content-between align-items-center gap-3">
                    <div className="small text-muted">
                        {limits.accounts.limit && limits.accounts.limit !== -1
                            ? `${accounts.length}/${limits.accounts.limit} accounts`
                            : t("finance.shared.unlimited")}
                    </div>
                    <Button
                        variant={accountCreateDisabled ? "light" : "primary"}
                        className="rounded-pill"
                        disabled={accountCreateDisabled}
                        data-testid="finance-account-add"
                        onClick={() => {
                            if (accountCreateDisabled) {
                                notify.info("Plan quota reached for accounts. Upgrade to add more accounts.");
                                return;
                            }

                            onCreate();
                        }}
                    >
                        {t("finance.accounts.modal.add_title")}
                    </Button>
                </div>
            )}
            <div className="bg-white shadow-sm overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
                {accounts.map((account, index) => (
                    <button
                        key={account.id}
                        type="button"
                        data-testid={`finance-account-row-${account.id}`}
                        className={`btn w-100 text-start bg-transparent border-0 rounded-0 px-3 py-3 ${index < accounts.length - 1 ? "border-bottom" : ""}`}
                        onClick={() => {
                            if (!permissions.manageShared && !(account.scope === "private" && String(account.owner_member_id || "") === String(activeMemberId || ""))) {
                                return;
                            }

                            onEdit(account);
                        }}
                    >
                        <div className="d-flex justify-content-between gap-3 align-items-start">
                            <div>
                                <div className="fw-semibold text-dark">{account.name}</div>
                                <div className="small text-muted mt-1">{account.owner_member?.full_name || t("finance.shared.shared")} · {account.scope === "shared" ? t("finance.shared.shared") : t("finance.shared.private")}</div>
                            </div>
                            <div className="fw-bold text-dark">{formatAmount(Number(account.current_balance || 0), account.currency_code)}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AccountsTab;
