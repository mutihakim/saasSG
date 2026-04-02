import React from 'react';
import { Container, Badge } from 'react-bootstrap';

import PremiumWAHub from '../Components/PremiumWAHub';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const WAPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="WhatsApp Hub" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="success-subtle" text="success" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-whatsapp-line me-1"></i>PRD Modul I
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Integrasi WhatsApp Pintar</h2>
                    <p className="text-white-50">Kelola seluruh keluarga via pesan WhatsApp yang sudah Anda gunakan</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <PremiumWAHub wa_logs={demo.wa_logs} wa_commands={demo.wa_commands} />
            </Container>
        </section>
    </MemberLayout>
);

export default WAPage;
