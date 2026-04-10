import React from 'react';

import MemberPage from '../../../../components/layouts/MemberPage';
import TenantMemberLayout from '../../../../layouts/TenantMemberLayout';

import PremiumCalendar from '@/features/frontend/components/PremiumCalendar';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const CalendarPage: React.FC<Props> = ({ demo }) => (
    <MemberPage title="Kalender & Agenda" parentLabel="Perencanaan">
        <PremiumCalendar calendar={demo.calendar} routines={demo.routines} menus={demo.menus} />
    </MemberPage>
);

(CalendarPage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default CalendarPage;

