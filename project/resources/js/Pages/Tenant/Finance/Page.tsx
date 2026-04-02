import React from 'react';
import { Head } from '@inertiajs/react';
import TenantMemberLayout from '../../../Layouts/TenantMemberLayout';
import FinanceIndex from './Index';

interface Props {
    categories: any[];
    currencies: any[];
    defaultCurrency: string;
    paymentMethods: any[];
    permissions: {
        create: boolean;
        update: boolean;
        delete: boolean;
    };
}

const FinancePage: React.FC<Props> = (props) => (
    <>
        <Head title="Finance" />
        <TenantMemberLayout>
            <FinanceIndex {...props} />
        </TenantMemberLayout>
    </>
);

export default FinancePage;
