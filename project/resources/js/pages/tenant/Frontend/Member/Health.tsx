import React from 'react';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

import PremiumGrowthTracker from '@/features/frontend/components/PremiumGrowthTracker';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const HealthPage: React.FC<Props> = ({ demo }) => (
    <MemberPage title="Kesehatan Keluarga" parentLabel="Kesehatan & Catatan">
        <PremiumGrowthTracker growth_tracker={demo.growth_tracker} />
    </MemberPage>
);

(HealthPage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default HealthPage;

