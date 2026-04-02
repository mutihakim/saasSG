import React from 'react';
import { Container, Badge } from 'react-bootstrap';

import PremiumCalendar from '../Components/PremiumCalendar';
import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const CalendarPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => (
    <MemberLayout title="Kalender Bersama" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
        <section className="section nft-hero" id="page-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
            <div className="bg-overlay"></div>
            <Container>
                <div className="text-center">
                    <Badge bg="primary-subtle" text="primary" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                        <i className="ri-calendar-2-line me-1"></i>PRD Modul A
                    </Badge>
                    <h2 className="text-white fw-bold mb-2">Kalender & Agenda Keluarga</h2>
                    <p className="text-white-50">Jadwal bersama, rutinitas harian, dan menu makan mingguan</p>
                </div>
            </Container>
        </section>
        <section className="section">
            <Container>
                <PremiumCalendar calendar={demo.calendar} routines={demo.routines} menus={demo.menus} />
            </Container>
        </section>
    </MemberLayout>
);

export default CalendarPage;
