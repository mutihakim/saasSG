import React from "react";
import { Card, Col, Form, Row } from "react-bootstrap";

import { FinanceWalletFormState } from "../../types";

import { walletColorOptions, walletIconOptions, walletTypeSuggestions } from "./useFinanceWalletWizardState";

type Props = {
    isSystemWallet: boolean;
    formData: FinanceWalletFormState;
    errors: Record<string, string>;
    updateField: (field: keyof FinanceWalletFormState, value: any) => void;
};

const WalletPersonalizationStep = ({ isSystemWallet, formData, errors, updateField }: Props) => (
    <div>
        {!isSystemWallet ? (
            <div className="mb-4">
                <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Konteks Wallet</Form.Label>
                <Row className="g-2">
                    {walletTypeSuggestions.map((option) => (
                        <Col key={option.value} xs={3} className="d-flex">
                            <Card
                                onClick={() => {
                                    updateField("type", option.value);
                                }}
                                className="position-relative w-100 shadow-none border-2"
                                style={{
                                    cursor: "pointer",
                                    border: formData.type === option.value ? "2px solid #0ea5e9" : "1px solid #e2e8f0",
                                    background: formData.type === option.value ? "rgba(14, 165, 233, 0.08)" : "#fff",
                                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                    borderRadius: "14px",
                                }}
                            >
                                <Card.Body className="d-flex flex-column align-items-center text-center px-2 py-3">
                                    <div className="avatar-xs rounded-circle d-flex align-items-center justify-content-center mb-2" style={{ width: 34, height: 34, background: formData.type === option.value ? "#0ea5e9" : "#f1f5f9" }}>
                                        <i className={`${option.icon}`} style={{ color: formData.type === option.value ? "#fff" : "#94a3b8", fontSize: "1rem" }}></i>
                                    </div>
                                    <div className={`fw-bold ${formData.type === option.value ? "text-dark" : "text-muted"}`} style={{ fontSize: "0.72rem", lineHeight: 1.15 }}>
                                        {option.label}
                                    </div>
                                    {formData.type === option.value ? (
                                        <div className="position-absolute top-0 end-0 m-1">
                                            <i className="ri-checkbox-circle-fill text-success fs-6"></i>
                                        </div>
                                    ) : null}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
                <Form.Control
                    className="mt-3"
                    list="wallet-type-suggestions"
                    value={formData.type}
                    onChange={(e) => updateField("type", e.target.value)}
                    placeholder="Tulis konteks wallet. Mis. Travel, Operasional, Sekolah"
                    isInvalid={Boolean(errors.type)}
                    maxLength={50}
                />
                <datalist id="wallet-type-suggestions">
                    {walletTypeSuggestions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </datalist>
                <Form.Text className="text-muted">Konteks wallet bebas. Pilih salah satu kartu di atas atau tulis sendiri.</Form.Text>
                {errors.type ? <div className="text-danger small mt-2">{errors.type}</div> : null}
            </div>
        ) : null}

        <div className="mb-4">
            <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Icon Wallet</Form.Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                {walletIconOptions.map((icon) => (
                    <button
                        key={icon.value}
                        type="button"
                        className="d-flex flex-column align-items-center justify-content-center position-relative border-0"
                        style={{
                            padding: "8px 4px",
                            background: formData.icon_key === icon.value ? "rgba(59, 130, 246, 0.1)" : "#f8f9fa",
                            border: formData.icon_key === icon.value ? "2px solid #3b82f6" : "1px solid #dee2e6",
                            borderRadius: "8px",
                            transition: "all 0.15s ease",
                            minHeight: "56px",
                        }}
                        onClick={() => updateField("icon_key", icon.value)}
                    >
                        <i className={`${icon.value}`} style={{ fontSize: "1.2rem", color: formData.icon_key === icon.value ? "#3b82f6" : "#64748b" }} />
                        <small style={{ fontSize: "0.55rem", color: formData.icon_key === icon.value ? "#3b82f6" : "#94a3b8", marginTop: "2px" }}>{icon.label}</small>
                        {formData.icon_key === icon.value ? (
                            <span
                                style={{
                                    position: "absolute",
                                    top: "-6px",
                                    right: "-6px",
                                    background: "#3b82f6",
                                    color: "#fff",
                                    borderRadius: "50%",
                                    width: "16px",
                                    height: "16px",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                            >
                                ✓
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>
        </div>

        <div className="mb-4">
            <Form.Label className="fw-semibold small text-uppercase text-muted mb-3">Warna Kartu</Form.Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 28px)", gap: "10px", justifyContent: "start" }}>
                {walletColorOptions.map((color) => (
                    <button
                        key={color}
                        type="button"
                        className="position-relative border-0"
                        style={{
                            width: "28px",
                            height: "28px",
                            background: color,
                            border: formData.background_color === color ? "2px solid #2563eb" : "1.5px solid rgba(15,23,42,0.12)",
                            borderRadius: "999px",
                            transition: "all 0.15s ease",
                            transform: formData.background_color === color ? "scale(1.08)" : "scale(1)",
                            boxShadow: formData.background_color === color ? "0 0 0 3px rgba(37, 99, 235, 0.16)" : "none",
                        }}
                        onClick={() => updateField("background_color", color)}
                        aria-label={`Pilih warna ${color}`}
                        title={color}
                    >
                        {formData.background_color === color ? (
                            <span
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    color: "#fff",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                                }}
                            >
                                ✓
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>
        </div>

        {!isSystemWallet ? (
            <div className="mb-3">
                <Form.Label className="fw-semibold small text-uppercase text-muted">Catatan (Opsional)</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Tambahkan catatan untuk wallet ini..."
                />
            </div>
        ) : null}
    </div>
);

export default WalletPersonalizationStep;
