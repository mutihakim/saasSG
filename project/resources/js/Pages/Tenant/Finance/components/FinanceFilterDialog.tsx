import React from "react";

import { FinanceCategory, FinanceFilterDraft, FinanceMember, FinancePermissions } from "../types";

import FinanceFilterPanel from "./pwa/FinanceFilterPanel";

type Props = {
    showFilters: boolean;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    draftFilters: FinanceFilterDraft;
    setDraftFilters: React.Dispatch<React.SetStateAction<FinanceFilterDraft>>;
    setFilters: React.Dispatch<React.SetStateAction<FinanceFilterDraft>>;
    members: FinanceMember[];
    accounts: React.ComponentProps<typeof FinanceFilterPanel>["accounts"];
    categories: FinanceCategory[];
    permissions: FinancePermissions;
};

const FinanceFilterDialog = ({
    showFilters,
    setShowFilters,
    draftFilters,
    setDraftFilters,
    setFilters,
    members,
    accounts,
    categories,
    permissions,
}: Props) => (
    <FinanceFilterPanel
        show={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={() => {
            setFilters(draftFilters);
            setShowFilters(false);
        }}
        draft={draftFilters}
        setDraft={setDraftFilters}
        members={members}
        accounts={accounts}
        categories={categories}
        permissions={permissions}
    />
);

export default FinanceFilterDialog;
