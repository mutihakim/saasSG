import React from 'react';
import { Container, Badge } from 'react-bootstrap';

import PremiumProjects from '../Components/PremiumProjects';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const ProjectsPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="Papan Proyek" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" id="page-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="warning-subtle" text="warning" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-kanban-view me-1"></i>PRD Modul A
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Papan Proyek & Tugas Keluarga</h2>
                    <p className="text-white-50">Kelola proyek besar dengan Kanban board dan daftar belanja bersama</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <PremiumProjects projects={demo.projects} kanban={demo.kanban} shopping_list={demo.shopping_list} />
            </Container>
        </section>
    </MemberLayout>
);

export default ProjectsPage;
