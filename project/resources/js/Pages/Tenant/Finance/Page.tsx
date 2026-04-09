import { Head } from '@inertiajs/react';
import React from 'react';

import FinanceIndex from './Index';
import { FinancePageProps } from './types';

const FinancePage: React.FC<FinancePageProps> = (props) => {
    return (
        <>
            <Head title={props.financeRoute?.title ?? "Finance"} />
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
