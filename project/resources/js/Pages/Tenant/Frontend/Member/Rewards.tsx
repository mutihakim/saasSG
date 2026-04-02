import React from 'react';
import { Container, Badge } from 'react-bootstrap';

import PremiumRewards from '../Components/PremiumRewards';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const RewardsPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="Reward Store" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="warning-subtle" text="warning" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-trophy-line me-1"></i>PRD Modul B
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Reward Store & Leaderboard</h2>
                    <p className="text-white-50">Tukarkan poin dengan hadiah pilihan & lihat siapa yang memimpin</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <PremiumRewards rewards={demo.rewards} leaderboard={demo.leaderboard} />
            </Container>
        </section>
    </MemberLayout>
);

export default RewardsPage;
