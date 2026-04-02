import React from 'react';
import { Container, Badge } from 'react-bootstrap';

import PremiumBlog from '../Components/PremiumBlog';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const BlogPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="Blog & Dokumentasi" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="success-subtle" text="success" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-article-line me-1"></i>Blog Keluarga
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Blog & Dokumentasi Keluarga</h2>
                    <p className="text-white-50">Wisata, kuliner, resep MPASI, review tempat, dan catatan parenting</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <PremiumBlog blogs={demo.blogs} />
            </Container>
        </section>
    </MemberLayout>
);

export default BlogPage;
