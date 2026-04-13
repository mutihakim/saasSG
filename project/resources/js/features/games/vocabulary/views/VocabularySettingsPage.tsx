import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Spinner } from "react-bootstrap";

import VocabularyLayout from "../components/VocabularyLayout";
import { createVocabularyApi, type VocabularyLanguage, type VocabularyMode, type VocabularySetting, type VocabularyTranslationDirection } from "../data/api/vocabularyApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type PageProps = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

const VocabularySettingsPage: React.FC<PageProps> = ({ member }) => {
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createVocabularyApi(tenantRoute), [tenantRoute]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<VocabularyLanguage>("english");
    const [settingsMap, setSettingsMap] = useState<Record<VocabularyLanguage, VocabularySetting | null>>({
        english: null,
        arabic: null,
    });

    const [defaultMode, setDefaultMode] = useState<VocabularyMode>("learn");
    const [masteredThreshold, setMasteredThreshold] = useState(8);
    const [defaultTimeLimit, setDefaultTimeLimit] = useState(8);
    const [autoTts, setAutoTts] = useState(true);
    const [translationDirection, setTranslationDirection] = useState<VocabularyTranslationDirection>("id_to_target");

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            try {
                const [configResponse, rows] = await Promise.all([
                    api.fetchConfig(),
                    api.fetchSettings(),
                ]);

                if (cancelled) {
                    return;
                }

                const nextMap: Record<VocabularyLanguage, VocabularySetting | null> = {
                    english: null,
                    arabic: null,
                };

                for (const row of rows) {
                    nextMap[row.language] = row;
                }

                setSettingsMap(nextMap);

                const initial = nextMap.english ?? {
                    language: "english",
                    default_mode: "learn",
                    mastered_threshold: configResponse.config.default_mastered_threshold ?? 8,
                    default_time_limit: configResponse.config.default_time_limit ?? 8,
                    auto_tts: true,
                    translation_direction: "id_to_target",
                };

                setDefaultMode(initial.default_mode);
                setMasteredThreshold(initial.mastered_threshold);
                setDefaultTimeLimit(initial.default_time_limit);
                setAutoTts(initial.auto_tts);
                setTranslationDirection(initial.translation_direction);
            } catch {
                notify.error("Gagal memuat pengaturan vocabulary.");
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [api]);

    useEffect(() => {
        const current = settingsMap[selectedLanguage];
        if (!current) {
            setDefaultMode("learn");
            setMasteredThreshold(8);
            setDefaultTimeLimit(8);
            setAutoTts(true);
            setTranslationDirection("id_to_target");
            return;
        }

        setDefaultMode(current.default_mode);
        setMasteredThreshold(current.mastered_threshold);
        setDefaultTimeLimit(current.default_time_limit);
        setAutoTts(current.auto_tts);
        setTranslationDirection(current.translation_direction);
    }, [selectedLanguage, settingsMap]);

    const handleSave = async () => {
        setIsSaving(true);

        const payload: VocabularySetting = {
            language: selectedLanguage,
            default_mode: defaultMode,
            mastered_threshold: masteredThreshold,
            default_time_limit: defaultTimeLimit,
            auto_tts: autoTts,
            translation_direction: translationDirection,
        };

        try {
            await api.updateSettings(payload);
            setSettingsMap((prev) => ({ ...prev, [selectedLanguage]: payload }));
            notify.success("Pengaturan vocabulary berhasil disimpan.");
        } catch {
            notify.error("Gagal menyimpan pengaturan vocabulary.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <VocabularyLayout
            title="Pengaturan Vocabulary"
            menuKey="settings"
            memberName={member?.full_name ?? member?.name ?? undefined}
            allowPageScroll
        >
            {isLoading ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : (
                <div className="container-fluid py-3">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <Card className="border-0 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                                        <h5 className="fw-semibold mb-0">Pengaturan Default Vocabulary</h5>
                                        <div className="d-flex gap-2">
                                            <Button variant={selectedLanguage === "english" ? "primary" : "outline-primary"} size="sm" onClick={() => setSelectedLanguage("english")}>Inggris</Button>
                                            <Button variant={selectedLanguage === "arabic" ? "primary" : "outline-primary"} size="sm" onClick={() => setSelectedLanguage("arabic")}>Arab</Button>
                                        </div>
                                    </div>

                                    <Form>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-semibold mb-2">Mode Default</Form.Label>
                                            <div className="d-flex gap-3">
                                                <Form.Check type="radio" id="vocab-mode-learn" name="vocab-mode" label="Learn" checked={defaultMode === "learn"} onChange={() => setDefaultMode("learn")} />
                                                <Form.Check type="radio" id="vocab-mode-practice" name="vocab-mode" label="Practice" checked={defaultMode === "practice"} onChange={() => setDefaultMode("practice")} />
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-semibold mb-2">Batas Mastered</Form.Label>
                                            <Form.Text className="text-muted d-block mb-2">Jumlah streak benar berturut-turut agar kata ditandai dikuasai.</Form.Text>
                                            <div className="d-flex flex-wrap gap-2">
                                                {[2, 3, 5, 8, 10, 12, 15].map((value) => (
                                                    <Button key={value} variant={masteredThreshold === value ? "primary" : "outline-primary"} size="sm" onClick={() => setMasteredThreshold(value)}>
                                                        {value}
                                                    </Button>
                                                ))}
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-semibold mb-2">Timer Default per Soal</Form.Label>
                                            <Form.Text className="text-muted d-block mb-2">Batas waktu menjawab saat Practice Mode.</Form.Text>
                                            <div className="d-flex flex-wrap gap-2">
                                                {[3, 5, 8, 10, 15, 20].map((value) => (
                                                    <Button key={value} variant={defaultTimeLimit === value ? "primary" : "outline-primary"} size="sm" onClick={() => setDefaultTimeLimit(value)}>
                                                        {value} dtk
                                                    </Button>
                                                ))}
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-semibold mb-2">Arah Terjemahan</Form.Label>
                                            <div className="d-flex flex-column gap-2">
                                                <Form.Check
                                                    type="radio"
                                                    id="vocab-direction-id-to-target"
                                                    name="vocab-direction"
                                                    label="Indonesia -> Bahasa pilihan"
                                                    checked={translationDirection === "id_to_target"}
                                                    onChange={() => setTranslationDirection("id_to_target")}
                                                />
                                                <Form.Check
                                                    type="radio"
                                                    id="vocab-direction-target-to-id"
                                                    name="vocab-direction"
                                                    label="Bahasa pilihan -> Indonesia"
                                                    checked={translationDirection === "target_to_id"}
                                                    onChange={() => setTranslationDirection("target_to_id")}
                                                />
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Check
                                                id="vocab-settings-auto-tts"
                                                label="Aktifkan auto TTS saat latihan"
                                                checked={autoTts}
                                                onChange={(e) => setAutoTts(e.target.checked)}
                                            />
                                        </Form.Group>

                                        <div className="d-flex justify-content-end">
                                            <Button onClick={() => void handleSave()} disabled={isSaving}>
                                                {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </VocabularyLayout>
    );
};

(VocabularySettingsPage as any).layout = null;

export default VocabularySettingsPage;
