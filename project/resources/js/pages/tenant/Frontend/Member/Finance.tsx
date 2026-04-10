import React from 'react';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

import PremiumFinance from '@/features/frontend/components/PremiumFinance';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const FinancePage: React.FC<Props> = ({ demo }) => (
    <MemberPage title="Keuangan Keluarga" parentLabel="Keuangan">
        <PremiumFinance finance={demo.finance} />
    </MemberPage>
);

(FinancePage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default FinancePage;

