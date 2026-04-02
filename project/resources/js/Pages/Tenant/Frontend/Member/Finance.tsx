import React from 'react';
import { Container, Badge } from 'react-bootstrap';

import PremiumFinance from '../Components/PremiumFinance';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const FinancePage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="Keuangan Keluarga" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="success-subtle" text="success" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-money-dollar-circle-line me-1"></i>PRD Modul C
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Financial Hub Keluarga</h2>
                    <p className="text-white-50">Pemasukan, pengeluaran, anggaran, tabungan target, dan dompet anak</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <PremiumFinance finance={demo.finance} />
            </Container>
        </section>
    </MemberLayout>
);

export default FinancePage;
