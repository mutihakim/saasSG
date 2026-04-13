import React, { useEffect, useMemo, useState } from "react";
import { Accordion, Badge, Card, Col, Row, Spinner, Table } from "react-bootstrap";

import VocabularyLayout from "../components/VocabularyLayout";
import { createVocabularyApi, type VocabularyLanguage, type VocabularyMasteredItem } from "../data/api/vocabularyApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type PageProps = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

const VocabularyMasteredPage: React.FC<PageProps> = ({ member }) => {
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createVocabularyApi(tenantRoute), [tenantRoute]);

    const [isLoading, setIsLoading] = useState(true);
    const [language, setLanguage] = useState<"all" | VocabularyLanguage>("all");
    const [rows, setRows] = useState<VocabularyMasteredItem[]>([]);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            try {
                const data = await api.fetchMastered({
                    limit: 500,
                    language: language === "all" ? undefined : language,
                });
                if (!cancelled) {
                    setRows(data);
                    setActiveAccordion(null);
                }
            } catch {
                if (!cancelled) {
                    setRows([]);
                    notify.error("Gagal memuat kata yang sudah dikuasai.");
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [api, language]);

    const grouped = useMemo(() => {
        const groups = new Map<string, VocabularyMasteredItem[]>();

        for (const row of rows) {
            const key = `${row.word.kategori}|||${row.word.hari}`;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)?.push(row);
        }

        Array.from(groups.values()).forEach((items) => {
            items.sort((a: VocabularyMasteredItem, b: VocabularyMasteredItem) => (
                a.word.bahasa_indonesia.localeCompare(b.word.bahasa_indonesia)
            ));
        });

        return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [rows]);

    return (
        <VocabularyLayout
            title="Kosakata Dikuasai"
            menuKey="mastered"
            memberName={member?.full_name ?? member?.name ?? undefined}
            allowPageScroll
        >
            <div className="container-fluid py-3">
                <Row className="g-3 h-100">
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Body>
                                <div className="small text-muted mb-2">Bahasa</div>
                                <div className="d-flex flex-wrap gap-2">
                                    <button type="button" className={`btn btn-sm ${language === "all" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setLanguage("all")}>Semua</button>
                                    <button type="button" className={`btn btn-sm ${language === "english" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setLanguage("english")}>Inggris</button>
                                    <button type="button" className={`btn btn-sm ${language === "arabic" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setLanguage("arabic")}>Arab</button>
                                </div>

                                <div className="mt-4 p-3 rounded-3 bg-success-subtle">
                                    <div className="small text-muted">Total Kata Mastered</div>
                                    <div className="fs-1 fw-bold text-success lh-1 mt-1">{rows.length}</div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={8}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-transparent border-0 pb-0">
                                <h5 className="fw-semibold mb-0">Detail Kosakata Dikuasai</h5>
                            </Card.Header>
                            <Card.Body className="d-flex flex-column">
                                {isLoading ? (
                                    <div className="d-flex align-items-center gap-2 text-muted">
                                        <Spinner size="sm" animation="border" />
                                        <span>Memuat data...</span>
                                    </div>
                                ) : rows.length === 0 ? (
                                    <div className="text-muted small">Belum ada kosakata yang mencapai status mastered.</div>
                                ) : (
                                    <div className="overflow-auto pe-1">
                                        <Accordion activeKey={activeAccordion ?? undefined} onSelect={(eventKey) => setActiveAccordion(Array.isArray(eventKey) ? (eventKey[0] ?? null) : (eventKey ?? null))}>
                                            {grouped.map(([key, items]) => {
                                                const [category, day] = key.split("|||");
                                                return (
                                                    <Accordion.Item eventKey={key} key={key}>
                                                        <Accordion.Header>
                                                            {category} • Hari {day} <span className="ms-2 text-muted small">({items.length} kata)</span>
                                                        </Accordion.Header>
                                                        <Accordion.Body>
                                                            <div className="table-responsive">
                                                                <Table size="sm" className="align-middle mb-0">
                                                                    <thead className="table-light">
                                                                        <tr>
                                                                            <th>#</th>
                                                                            <th>Indonesia</th>
                                                                            <th>{language === "arabic" ? "Arab" : "Terjemahan"}</th>
                                                                            <th className="text-center">Benar</th>
                                                                            <th className="text-center">Max Streak</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {items.map((item, index) => (
                                                                            <tr key={`${item.word_id}-${item.language}`}>
                                                                                <td>{index + 1}</td>
                                                                                <td className="fw-semibold">{item.word.bahasa_indonesia}</td>
                                                                                <td>{item.language === "arabic" ? item.word.bahasa_arab : item.word.bahasa_inggris}</td>
                                                                                <td className="text-center">{item.jumlah_benar}</td>
                                                                                <td className="text-center">
                                                                                    <Badge bg="success-subtle" text="success">{item.max_streak}x</Badge>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </Table>
                                                            </div>
                                                        </Accordion.Body>
                                                    </Accordion.Item>
                                                );
                                            })}
                                        </Accordion>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </VocabularyLayout>
    );
};

(VocabularyMasteredPage as any).layout = null;

export default VocabularyMasteredPage;
