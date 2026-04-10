import React, { Suspense, lazy } from "react";

type LegacyFinanceRoute = {
    section?: string;
    initial_tab?: string;
};

type LegacyFinancePageProps = {
    financeRoute?: LegacyFinanceRoute;
    [key: string]: unknown;
};

const OverviewPage = lazy(() => import("../../../features/finance/OverviewPage"));
const AccountsPage = lazy(() => import("../../../features/finance/AccountsPage"));
const TransactionsPage = lazy(() => import("../../../features/finance/TransactionsPage"));
const ReportsPage = lazy(() => import("../../../features/finance/ReportsPage"));
const BudgetsPage = lazy(() => import("../../../features/finance/planning/BudgetsPage"));
const GoalsPage = lazy(() => import("../../../features/finance/planning/GoalsPage"));
const WishesPage = lazy(() => import("../../../features/finance/planning/WishesPage"));

const Page = (props: LegacyFinancePageProps) => {
    const section = props.financeRoute?.section ?? "";
    const initialTab = props.financeRoute?.initial_tab ?? "";

    let ResolvedPage: React.ComponentType<any> = OverviewPage;

    if (section === "transactions" || initialTab === "transactions") {
        ResolvedPage = TransactionsPage;
    } else if (section === "reports" || initialTab === "report" || initialTab === "stats") {
        ResolvedPage = ReportsPage;
    } else if (section === "accounts" || initialTab === "accounts") {
        ResolvedPage = AccountsPage;
    } else if (initialTab === "budgets") {
        ResolvedPage = BudgetsPage;
    } else if (initialTab === "wishes") {
        ResolvedPage = WishesPage;
    } else if (initialTab === "goals" || section === "planning") {
        ResolvedPage = GoalsPage;
    }

    return (
        <Suspense
            fallback={(
                <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="spinner-border text-primary" role="status" aria-label="Loading" />
                </div>
            )}
        >
            <ResolvedPage {...props} />
        </Suspense>
    );
};

export default Page;
