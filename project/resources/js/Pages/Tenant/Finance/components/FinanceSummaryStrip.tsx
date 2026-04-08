import React from "react";
import { Button, Card, Form } from "react-bootstrap";
import Select, { StylesConfig } from "react-select";

import { FinanceFilterDraft, FinancePocket } from "../types";
import { CARD_RADIUS, formatAmount } from "./pwa/types";
import { SummarySkeleton, TransactionSkeleton } from "./pwa/FinanceSkeletons";

type TypeOption = {
    value: string;
    label: string;
};

type WalletFilterOption = {
    value: string;
    label: string;
    kind: "all" | "member" | "account" | "wallet";
    ownerMemberId: string;
    accountId: string;
    pocketId: string;
    indentLevel: number;
    isSystem?: boolean;
};

type Props = {
    errorState: string | null;
    loading: boolean;
    summaryLoading: boolean;
    loadFinance: () => Promise<unknown>;
    summary?: {
        total_income_base?: number;
        total_expense_base?: number;
        balance_base?: number;
    } | null;
    defaultCurrency: string;
    filters: Pick<FinanceFilterDraft, "type" | "owner_member_id" | "bank_account_id" | "pocket_id">;
    setDraftFilters: React.Dispatch<React.SetStateAction<FinanceFilterDraft>>;
    setFilters: React.Dispatch<React.SetStateAction<FinanceFilterDraft>>;
    pockets: FinancePocket[];
    t: (key: string) => string;
};

const FinanceSummaryStrip = ({
    errorState,
    loading,
    summaryLoading,
    loadFinance,
    summary,
    defaultCurrency,
    filters,
    setDraftFilters,
    setFilters,
    pockets,
    t,
}: Props) => {
    const typeOptions = React.useMemo<TypeOption[]>(() => ([
        { value: "", label: t("finance.pwa.filters.all") },
        { value: "pemasukan", label: t("finance.transactions.types.pemasukan") },
        { value: "pengeluaran", label: t("finance.transactions.types.pengeluaran") },
        { value: "transfer", label: t("finance.transactions.types.transfer") },
    ]), [t]);

    const walletOptions = React.useMemo<WalletFilterOption[]>(() => {
        const options: WalletFilterOption[] = [{
            value: "",
            label: "ALL MEMBERS",
            kind: "all",
            ownerMemberId: "",
            accountId: "",
            pocketId: "",
            indentLevel: 0,
        }];
        const members = new Map<string, {
            id: string;
            name: string;
            accounts: Map<string, {
                id: string;
                name: string;
                pockets: FinancePocket[];
            }>;
        }>();

        [...pockets]
            .sort((left, right) => {
                const leftOwner = left.owner_member?.full_name || t("wallet.labels.unassigned");
                const rightOwner = right.owner_member?.full_name || t("wallet.labels.unassigned");
                const ownerCompare = leftOwner.localeCompare(rightOwner);
                if (ownerCompare !== 0) {
                    return ownerCompare;
                }

                const leftAccount = left.real_account?.name || left.realAccount?.name || left.currency_code;
                const rightAccount = right.real_account?.name || right.realAccount?.name || right.currency_code;
                const accountCompare = leftAccount.localeCompare(rightAccount);
                if (accountCompare !== 0) {
                    return accountCompare;
                }

                if (Boolean(left.is_system) !== Boolean(right.is_system)) {
                    return left.is_system ? -1 : 1;
                }

                return left.name.localeCompare(right.name);
            })
            .forEach((pocket) => {
                const ownerMemberId = String(pocket.owner_member_id || "");
                const ownerLabel = pocket.owner_member?.full_name || t("wallet.labels.unassigned");
                const accountId = String(pocket.real_account?.id || pocket.realAccount?.id || pocket.real_account_id || "");
                const accountLabel = pocket.real_account?.name || pocket.realAccount?.name || pocket.currency_code;

                if (!members.has(ownerMemberId)) {
                    members.set(ownerMemberId, {
                        id: ownerMemberId,
                        name: ownerLabel,
                        accounts: new Map(),
                    });
                }

                const memberEntry = members.get(ownerMemberId);
                if (!memberEntry) {
                    return;
                }

                if (!memberEntry.accounts.has(accountId)) {
                    memberEntry.accounts.set(accountId, {
                        id: accountId,
                        name: accountLabel,
                        pockets: [],
                    });
                }

                memberEntry.accounts.get(accountId)?.pockets.push(pocket);
            });

        Array.from(members.values()).forEach((memberEntry) => {
            options.push({
                value: `member:${memberEntry.id}`,
                label: memberEntry.name,
                kind: "member",
                ownerMemberId: memberEntry.id,
                accountId: "",
                pocketId: "",
                indentLevel: 0,
            });

            Array.from(memberEntry.accounts.values()).forEach((accountEntry) => {
                options.push({
                    value: `account:${accountEntry.id}`,
                    label: accountEntry.name,
                    kind: "account",
                    ownerMemberId: memberEntry.id,
                    accountId: accountEntry.id,
                    pocketId: "",
                    indentLevel: 1,
                });

                accountEntry.pockets.forEach((pocket) => {
                    options.push({
                        value: `wallet:${String(pocket.id)}`,
                        label: pocket.name,
                        kind: "wallet",
                        ownerMemberId: memberEntry.id,
                        accountId: accountEntry.id,
                        pocketId: String(pocket.id),
                        indentLevel: 2,
                        isSystem: Boolean(pocket.is_system),
                    });
                });
            });
        });

        return options;
    }, [pockets, t]);

    const selectedWalletOption = React.useMemo(
        () => {
            if (filters.pocket_id) {
                return walletOptions.find((option) => option.kind === "wallet" && option.pocketId === String(filters.pocket_id)) ?? null;
            }

            if (filters.bank_account_id) {
                return walletOptions.find((option) => option.kind === "account" && option.accountId === String(filters.bank_account_id)) ?? null;
            }

            if (filters.owner_member_id) {
                return walletOptions.find((option) => option.kind === "member" && option.ownerMemberId === String(filters.owner_member_id)) ?? null;
            }

            return walletOptions[0] ?? null;
        },
        [filters.bank_account_id, filters.owner_member_id, filters.pocket_id, walletOptions],
    );

    const selectedTypeOption = React.useMemo(
        () => typeOptions.find((option) => option.value === String(filters.type || "")) ?? typeOptions[0] ?? null,
        [filters.type, typeOptions],
    );

    const sharedSelectStyles = React.useMemo<StylesConfig<any, false>>(() => ({
        control: (base) => ({
            ...base,
            borderRadius: 12,
            minHeight: 38,
            borderColor: "#dee2e6",
            boxShadow: "none",
            backgroundColor: "#fff",
            "&:hover": {
                borderColor: "#cbd5e1",
            },
        }),
        valueContainer: (base) => ({
            ...base,
            minHeight: 38,
            paddingTop: 2,
            paddingBottom: 2,
        }),
        indicatorsContainer: (base) => ({
            ...base,
            minHeight: 38,
        }),
        indicatorSeparator: (base) => ({
            ...base,
            marginTop: 7,
            marginBottom: 7,
        }),
        singleValue: (base) => ({
            ...base,
            color: "#0f172a",
            fontSize: "0.875rem",
        }),
        placeholder: (base) => ({
            ...base,
            color: "#64748b",
            fontSize: "0.875rem",
        }),
        menu: (base) => ({
            ...base,
            borderRadius: 14,
            overflow: "hidden",
            zIndex: 9999,
            boxShadow: "0 18px 48px rgba(15, 23, 42, 0.16)",
            border: "1px solid rgba(226, 232, 240, 0.95)",
        }),
        menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "rgba(37, 99, 235, 0.08)" : "#fff",
            color: "#0f172a",
            paddingTop: 9,
            paddingBottom: 9,
        }),
    }), []);

    if (errorState) {
        return (
            <Card className="border-0 shadow-sm" style={{ borderRadius: CARD_RADIUS, background: "#fff" }}>
                <Card.Body className="text-center py-5">
                    <div className="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                        <i className="ri-error-warning-line fs-2"></i>
                    </div>
                    <div className="fw-semibold text-dark mb-2">{t("finance.pwa.error.title")}</div>
                    <div className="text-muted small mb-3">{errorState}</div>
                    <Button variant="danger" className="rounded-pill px-4" onClick={() => void loadFinance()}>{t("finance.pwa.error.retry")}</Button>
                </Card.Body>
            </Card>
        );
    }

    if (loading && !summary) {
        return <TransactionSkeleton />;
    }

    return (
        <div className="mb-3">
            {summaryLoading ? (
                <SummarySkeleton />
            ) : (
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex gap-2">
                        <Card className="border-0 shadow-sm flex-fill" style={{ borderRadius: CARD_RADIUS }}>
                            <Card.Body className="p-3">
                                <div className="small text-muted">{t("finance.summary.income")}</div>
                                <div className="fw-bold text-info fs-6 mt-1">{formatAmount(summary?.total_income_base || 0, defaultCurrency)}</div>
                            </Card.Body>
                        </Card>
                        <Card className="border-0 shadow-sm flex-fill" style={{ borderRadius: CARD_RADIUS }}>
                            <Card.Body className="p-3">
                                <div className="small text-muted">{t("finance.summary.expense")}</div>
                                <div className="fw-bold text-danger fs-6 mt-1">{formatAmount(summary?.total_expense_base || 0, defaultCurrency)}</div>
                            </Card.Body>
                        </Card>
                        <Card className="border-0 shadow-sm flex-fill" style={{ borderRadius: CARD_RADIUS }}>
                            <Card.Body className="p-3">
                                <div className="small text-muted">{t("finance.summary.net")}</div>
                                <div className={`fw-bold fs-6 mt-1 ${(summary?.balance_base || 0) >= 0 ? "text-success" : "text-danger"}`}>
                                    {formatAmount(summary?.balance_base || 0, defaultCurrency)}
                                </div>
                            </Card.Body>
                        </Card>
                    </div>

                    <div className="d-grid" style={{ gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                        <div>
                            <Form.Label className="small text-muted mb-1">{t("finance.pwa.filters.type")}</Form.Label>
                            <Select<TypeOption, false>
                                inputId="finance-type-quick-filter"
                                isSearchable={false}
                                options={typeOptions}
                                value={selectedTypeOption}
                                onChange={(option) => {
                                    const value = (option?.value ?? "") as FinanceFilterDraft["type"];
                                    setDraftFilters((prev) => ({ ...prev, type: value }));
                                    setFilters((prev) => ({ ...prev, type: value }));
                                }}
                                styles={sharedSelectStyles}
                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                menuPosition="fixed"
                            />
                        </div>
                        <div>
                            <Form.Label className="small text-muted mb-1">{t("finance.pwa.filters.wallet")}</Form.Label>
                            <Select<WalletFilterOption, false>
                                inputId="finance-wallet-quick-filter"
                                isSearchable
                                options={walletOptions}
                                value={selectedWalletOption}
                                onChange={(option) => {
                                    const nextFilters = {
                                        owner_member_id: option?.ownerMemberId ?? "",
                                        bank_account_id: option?.accountId ?? "",
                                        pocket_id: option?.pocketId ?? "",
                                    };

                                    setDraftFilters((prev) => ({ ...prev, ...nextFilters }));
                                    setFilters((prev) => ({ ...prev, ...nextFilters }));
                                }}
                                placeholder={t("finance.pwa.filters.all")}
                                styles={sharedSelectStyles}
                                formatOptionLabel={(option, meta) => (
                                    <div
                                        className="d-flex align-items-center justify-content-between gap-2 py-0"
                                        style={{ paddingLeft: `${option.indentLevel * 16}px` }}
                                    >
                                        <span className={`${option.kind === "wallet" ? "fw-medium" : "fw-semibold"} text-dark`}>
                                            {option.label}
                                        </span>
                                        {option.isSystem && (
                                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                                                Utama
                                            </span>
                                        )}
                                    </div>
                                )}
                                filterOption={(candidate, input) => {
                                    const term = input.trim().toLowerCase();
                                    if (!term) {
                                        return true;
                                    }

                                    return candidate.data.label.toLowerCase().includes(term);
                                }}
                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                menuPosition="fixed"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceSummaryStrip;
