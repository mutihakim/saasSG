import { Head } from '@inertiajs/react';
import React from 'react';

import FinanceIndex from './Index';

interface Props {
    categories: any[];
    currencies: any[];
    defaultCurrency: string;
    paymentMethods: any[];
    members: any[];
    accounts: any[];
    budgets: any[];
    activeMemberId?: number | null;
    permissions: {
        create: boolean;
        update: boolean;
        delete: boolean;
        manageShared: boolean;
        managePrivateStructures: boolean;
    };
    limits: {
        accounts: { current: number; limit: number | null };
        budgets: { current: number; limit: number | null };
    };
}

const FinancePage: React.FC<Props> = (props) => {
    return (
        <>
            <Head title="Finance" />
            <div
                style={{
                    minHeight: "100vh",
                    background: "linear-gradient(180deg, #25c2de 0%, #b7f4ff 20%, #f6f8fb 20%, #f6f8fb 100%)",
                    padding: "0 0 max(18px, env(safe-area-inset-bottom))",
                    touchAction: "pan-y",
                }}
            >
                <FinanceIndex {...props} />
            </div>
        </>
    );
};

export default FinancePage;
