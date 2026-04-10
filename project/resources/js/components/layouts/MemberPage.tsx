import { Head } from '@inertiajs/react';
import React from 'react';

import TenantPageTitle from './TenantPageTitle';

interface Props {
    title: string;
    parentLabel: string;
    children: React.ReactNode;
}

export default function MemberPage({ title, parentLabel, children }: Props) {
    return (
        <>
            <Head title={title} />
            <TenantPageTitle title={title} parentLabel={parentLabel} />
            <div className="pb-4 pt-2">
                {children}
            </div>
        </>
    );
}
