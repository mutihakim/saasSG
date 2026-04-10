import React from "react";
import { Card } from "react-bootstrap";

import { CARD_RADIUS } from "./types";

export function SummarySkeleton() {
    return (
        <div className="d-flex gap-2">
            {[0, 1, 2].map((index) => (
                <Card key={index} className="border-0 shadow-sm flex-fill" style={{ borderRadius: CARD_RADIUS }}>
                    <Card.Body className="p-3">
                        <div className="placeholder-glow">
                            <span className="placeholder col-5 mb-2"></span>
                            <span className="placeholder col-8"></span>
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
}

export function TransactionSkeleton() {
    return (
        <div className="d-flex flex-column gap-3">
            {[0, 1, 2].map((group) => (
                <div key={group}>
                    <div className="placeholder-glow mb-2"><span className="placeholder col-4"></span></div>
                    <div className="bg-white shadow-sm p-3" style={{ borderRadius: CARD_RADIUS }}>
                        {[0, 1, 2].map((row) => (
                            <div key={row} className={`${row < 2 ? "border-bottom" : ""} py-3`}>
                                <div className="placeholder-glow d-flex justify-content-between gap-3">
                                    <span className="placeholder col-6"></span>
                                    <span className="placeholder col-3"></span>
                                </div>
                                <div className="placeholder-glow mt-2"><span className="placeholder col-5"></span></div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
