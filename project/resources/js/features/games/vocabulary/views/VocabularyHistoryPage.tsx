import React, { useEffect, useMemo, useState } from "react";
import { Badge, Card, Col, Row, Spinner, Table } from "react-bootstrap";

import VocabularyLayout from "../components/VocabularyLayout";
import { createVocabularyApi, type VocabularyLanguage, type VocabularySessionHistoryItem } from "../data/api/vocabularyApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type PageProps = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

const formatDateTime = (value: string | null) => {
    if (!value) {
        return "-";
    }

    try {
        return new Date(value).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "-";
    }
};

const VocabularyHistoryPage: React.FC<PageProps> = ({ member }) => {
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createVocabularyApi(tenantRoute), [tenantRoute]);

    const [isLoading, setIsLoading] = useState(true);
    const [language, setLanguage] = useState<"all" | VocabularyLanguage>("all");
    const [history, setHistory] = useState<VocabularySessionHistoryItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            try {
                const rows = await api.fetchHistory({
                    limit: 50,
                    language: language === "all" ? undefined : language,
                });
                if (!cancelled) {
                    setHistory(rows);
                }
            } catch {
                if (!cancelled) {
                    setHistory([]);
                    notify.error("Gagal memuat riwayat vocabulary.");
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

    const metrics = useMemo(() => {
        const totalSessions = history.length;
        const avgScore = totalSessions > 0
            ? Math.round(history.reduce((sum, item) => sum + Number(item.score_percent || 0), 0) / totalSessions)
            : 0;
        const bestStreak = history.reduce((max, item) => Math.max(max, Number(item.best_streak || 0)), 0);
        const totalCorrect = history.reduce((sum, item) => sum + Number(item.correct_count || 0), 0);
        const totalWrong = history.reduce((sum, item) => sum + Number(item.wrong_count || 0), 0);

        return { totalSessions, avgScore, bestStreak, totalCorrect, totalWrong };
    }, [history]);

    return (
        <VocabularyLayout
            title="Riwayat Vocabulary"
            menuKey="history"
            memberName={member?.full_name ?? member?.name ?? undefined}
            allowPageScroll
        >
            <div className="container-fluid py-3">
                <Row className="g-3 mb-3">
                    <Col sm={6} xl={3}>
                        <Card className="border-0 shadow-sm h-100"><Card.Body><div className="small text-muted">Total Sesi</div><div className="fs-3 fw-bold">{metrics.totalSessions}</div></Card.Body></Card>
                    </Col>
                    <Col sm={6} xl={3}>
                        <Card className="border-0 shadow-sm h-100"><Card.Body><div className="small text-muted">Rata-rata Skor</div><div className="fs-3 fw-bold text-primary">{metrics.avgScore}%</div></Card.Body></Card>
                    </Col>
                    <Col sm={6} xl={3}>
                        <Card className="border-0 shadow-sm h-100"><Card.Body><div className="small text-muted">Best Streak</div><div className="fs-3 fw-bold text-success">{metrics.bestStreak}x</div></Card.Body></Card>
                    </Col>
                    <Col sm={6} xl={3}>
                        <Card className="border-0 shadow-sm h-100"><Card.Body><div className="small text-muted">Benar / Salah</div><div className="fs-5 fw-bold"><span className="text-success">{metrics.totalCorrect}</span><span className="text-muted mx-1">/</span><span className="text-danger">{metrics.totalWrong}</span></div></Card.Body></Card>
                    </Col>
                </Row>

                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-transparent border-0 pb-0 d-flex justify-content-between align-items-center gap-2 flex-wrap">
                        <h5 className="fw-semibold mb-0">Riwayat Sesi Vocabulary</h5>
                        <div className="d-flex gap-2">
                            <button type="button" className={`btn btn-sm ${language === "all" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setLanguage("all")}>Semua</button>
                            <button type="button" className={`btn btn-sm ${language === "english" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setLanguage("english")}>Inggris</button>
                            <button type="button" className={`btn btn-sm ${language === "arabic" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setLanguage("arabic")}>Arab</button>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        {isLoading ? (
                            <div className="d-flex align-items-center gap-2 text-muted">
                                <Spinner size="sm" animation="border" />
                                <span>Memuat riwayat...</span>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-muted small">Belum ada sesi vocabulary yang tersimpan.</div>
                        ) : (
                            <div className="table-responsive">
                                <Table size="sm" className="align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Waktu</th>
                                            <th>Bahasa</th>
                                            <th>Kategori</th>
                                            <th className="text-center">Hari</th>
                                            <th className="text-center">Progress</th>
                                            <th className="text-center">Skor</th>
                                            <th className="text-center">Durasi</th>
                                            <th className="text-center">Streak</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((row) => {
                                            const answered = Number(row.correct_count || 0) + Number(row.wrong_count || 0);
                                            const isMemoryTest = row.mode === "memory_test";
                                            return (
                                                <tr key={row.id}>
                                                    <td>{formatDateTime(row.finished_at)}</td>
                                                    <td>
                                                        <div className="d-flex flex-column gap-1">
                                                            <Badge bg="secondary-subtle" text="secondary">{row.language === "english" ? "Inggris" : "Arab"}</Badge>
                                                            {isMemoryTest && <Badge bg="info-subtle" text="info" className="x-small">Memory Test</Badge>}
                                                        </div>
                                                    </td>
                                                    <td>{row.category}</td>
                                                    <td className="text-center">{row.day}</td>
                                                    <td className="text-center">{answered}/{row.question_count}</td>
                                                    <td className="text-center fw-semibold">{Math.round(row.score_percent)}%</td>
                                                    <td className="text-center">{row.duration_seconds}s</td>
                                                    <td className="text-center">{row.best_streak}x</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div>
        </VocabularyLayout>
    );
};

(VocabularyHistoryPage as any).layout = null;

export default VocabularyHistoryPage;
