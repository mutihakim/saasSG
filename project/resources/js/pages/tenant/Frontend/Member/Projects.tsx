import React from 'react';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

import PremiumProjects from '@/features/frontend/components/PremiumProjects';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const ProjectsPage: React.FC<Props> = ({ demo }) => (
    <MemberPage title="Proyek & Kanban" parentLabel="Perencanaan">
        <PremiumProjects projects={demo.projects} kanban={demo.kanban} shopping_list={demo.shopping_list} />
    </MemberPage>
);

(ProjectsPage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default ProjectsPage;

