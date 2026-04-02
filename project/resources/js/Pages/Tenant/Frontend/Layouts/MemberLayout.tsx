import { Head } from '@inertiajs/react';
import React, { ReactNode, useEffect } from 'react';

import FamilyFooter from './FamilyFooter';
import FamilyNavbar from './FamilyNavbar';

interface Props {
    title: string;
    tenantName: string;
    tenantSlug: string;
    memberName?: string;
    children: ReactNode;
}

/**
 * MemberLayout — wraps every member module page.
 *
 * Uses Velzon's "layout-wrapper landing" shell so the navbar, sections,
 * and footer all look like velzon.appsah.my.id/nft-landing.
 *
 * Navigation via Inertia <Link> in FamilyNavbar means ZERO full-page
 * refreshes — fully SPA.
 */
const MemberLayout: React.FC<Props> = ({ title, tenantName, tenantSlug, memberName, children }) => {
    // Back-to-top button
    useEffect(() => {
        const el = document.getElementById('member-back-top');
        const onScroll = () => {
            if (el) el.style.display = document.documentElement.scrollTop > 100 ? 'block' : 'none';
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const toTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    return (
        <React.Fragment>
            <Head title={`${title} — ${tenantName}`} />

            {/* Velzon landing shell — full viewport width */}
            <div className="layout-wrapper landing" style={{ overflowX: 'hidden' }}>
                <FamilyNavbar
                    tenantName={tenantName}
                    tenantSlug={tenantSlug}
                    mode="member"
                    memberName={memberName}
                />

                {/* push below the fixed-top navbar (Velzon navbar height ~70px) */}
                <div style={{ paddingTop: 70 }}>
                    {children}
                </div>

                <FamilyFooter tenantName={tenantName} tenantSlug={tenantSlug} />

                <button
                    id="member-back-top"
                    onClick={toTop}
                    className="btn btn-danger btn-icon landing-back-top"
                    style={{ display: 'none' }}
                >
                    <i className="ri-arrow-up-line"></i>
                </button>
            </div>
        </React.Fragment>
    );
};

export default MemberLayout;
