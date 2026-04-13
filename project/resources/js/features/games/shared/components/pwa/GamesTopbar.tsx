import React from "react";

import { ModuleTopbar } from "@/components/pwa";

type Props = {
    title: string;
    preventExit?: boolean;
    action?: React.ReactNode;
};

const GamesTopbar: React.FC<Props> = ({ title, preventExit, action }) => (
    <ModuleTopbar
        title={title}
        badgeText={preventExit ? "Game Active" : undefined}
        action={action}
    />
);

export default GamesTopbar;
