import React from 'react';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

import PremiumGallery from '@/features/frontend/components/PremiumGallery';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const GalleryPage: React.FC<Props> = ({ demo }) => (
    <MemberPage title="Galeri & Album" parentLabel="Konten">
        <PremiumGallery gallery={demo.gallery} />
    </MemberPage>
);

(GalleryPage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default GalleryPage;

