import React from 'react';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

import PremiumFileManager from '@/features/frontend/components/PremiumFileManager';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const FilesPage: React.FC<Props> = ({ demo }) => (
    <MemberPage title="Dokumen Penting" parentLabel="Konten">
        <PremiumFileManager files={demo.files} />
    </MemberPage>
);

(FilesPage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default FilesPage;

