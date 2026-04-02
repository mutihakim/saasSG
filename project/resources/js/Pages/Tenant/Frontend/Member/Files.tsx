import React from 'react';
import { Container, Badge } from 'react-bootstrap';

import PremiumFileManager from '../Components/PremiumFileManager';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const FilesPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="File Manager" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="warning-subtle" text="warning" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-folder-3-line me-1"></i>Dokumen Keluarga
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">File Manager Keluarga</h2>
                    <p className="text-white-50">Kelola dokumen penting: KTP, sertifikat, rapor, BPKB, asuransi</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <PremiumFileManager files={demo.files} />
            </Container>
        </section>
    </MemberLayout>
);

export default FilesPage;
