import React from 'react';
import { Container, Badge } from 'react-bootstrap';

import PremiumWishlist from '../Components/PremiumWishlist';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const LeisurePage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="Wishlist & Liburan" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="danger-subtle" text="danger" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-heart-3-line me-1"></i>PRD Modul G
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Wishlist Keluarga & Vacation Planner</h2>
                    <p className="text-white-50">Destinasi impian, kuliner incaran, dan perencana perjalanan terpadu</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <PremiumWishlist wishlists={demo.wishlists} />
            </Container>
        </section>
    </MemberLayout>
);

export default LeisurePage;
