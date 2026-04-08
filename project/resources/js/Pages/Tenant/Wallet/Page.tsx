import { Head } from "@inertiajs/react";
import React from "react";

import WalletIndex from "./Index";

const WalletPage = (props: any) => (
    <>
        <Head title="Wallet" />
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(180deg, #17b6b1 0%, #bfeee9 15%, #f6f8fb 15%, #f6f8fb 100%)",
                padding: "0 0 max(18px, env(safe-area-inset-bottom))",
                touchAction: "pan-y",
            }}
        >
            <WalletIndex {...props} />
        </div>
    </>
);

export default WalletPage;
