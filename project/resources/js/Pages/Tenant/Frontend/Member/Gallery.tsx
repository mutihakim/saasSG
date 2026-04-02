import React from 'react';
import { Container, Badge } from 'react-bootstrap';

import PremiumGallery from '../Components/PremiumGallery';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const GalleryPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="Galeri Foto" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="info-subtle" text="info" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-image-2-line me-1"></i>Galeri Keluarga
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Album Foto Keluarga</h2>
                    <p className="text-white-50">Momen wisata, kuliner, tumbuh kembang, dan kebersamaan keluarga</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <PremiumGallery gallery={demo.gallery} />
            </Container>
        </section>
    </MemberLayout>
);

export default GalleryPage;
