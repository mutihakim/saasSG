import React from "react";

import { ExitConfirmModal } from "@/components/pwa";

const GamesExitConfirm: React.FC = () => (
    <ExitConfirmModal
        eventName="games:request-exit"
        title="Keluar dari Game?"
        message="Progress game yang belum tersimpan akan hilang."
        continueLabel="Lanjut Main"
        exitLabel="Keluar"
    />
);

export default GamesExitConfirm;
