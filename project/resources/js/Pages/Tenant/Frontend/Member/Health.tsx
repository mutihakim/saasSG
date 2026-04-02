import React from 'react';
import { Container, Badge } from 'react-bootstrap';

import PremiumGrowthTracker from '../Components/PremiumGrowthTracker';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const HealthPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="Kesehatan & Growth Tracker" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="success-subtle" text="success" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-seedling-line me-1"></i>PRD Modul E
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Kesehatan & Tumbuh Kembang</h2>
                    <p className="text-white-50">Growth tracker, imunisasi, dan rekam medis anak</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <PremiumGrowthTracker growth_tracker={demo.growth_tracker} />
            </Container>
        </section>
    </MemberLayout>
);

export default HealthPage;
