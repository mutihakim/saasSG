import React, { useEffect, useMemo, useState } from "react";
import { Accordion, Badge, Spinner, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import LanguageFilterTabs, { type LanguageFilterValue } from "../../shared/components/LanguageFilterTabs";
import VocabularyLayout from "../components/VocabularyLayout";
import { createVocabularyApi, type VocabularyMasteredItem } from "../data/api/vocabularyApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type PageProps = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

const VocabularyMasteredPage: React.FC<PageProps> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const api = useMemo(() => createVocabularyApi(tenantRoute), [tenantRoute]);

    const [isLoading, setIsLoading] = useState(true);
    const [language, setLanguage] = useState<LanguageFilterValue>(null);
    const [rows, setRows] = useState<VocabularyMasteredItem[]>([]);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            try {
                const data = await api.fetchMastered({
                    limit: 500,
                    language: language ?? undefined,
                });
                if (!cancelled) {
                    setRows(data);
                    setActiveAccordion(null);
                }
            } catch {
                if (!cancelled) {
                    setRows([]);
                    notify.error(t("tenant.games.vocabulary.mastered.load_error"));
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
    }, [api, language, t]);

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

    const languageLabel = language === "english"
        ? t("tenant.games.vocabulary.setup.language_en")
        : language === "arabic"
            ? t("tenant.games.vocabulary.setup.language_ar")
            : language === "mandarin"
                ? t("tenant.games.vocabulary.setup.language_zh")
                : t("tenant.games.vocabulary.mastered.table.translation");

    const translationFor = (item: VocabularyMasteredItem) => {
        if (item.language === "arabic") {
            return item.word.bahasa_arab;
        }

        if (item.language === "mandarin") {
            return item.word.bahasa_mandarin;
        }

        return item.word.bahasa_inggris;
    };

    return (
        <VocabularyLayout
            title={t("tenant.games.vocabulary.mastered.title")}
            menuKey="mastered"
            memberName={member?.full_name ?? member?.name ?? undefined}
        >
            <div className="game-setup-card h-100">
                {/* Header ringkasan — sticky di atas dalam container putih */}
                <div className="px-3 px-sm-4 pt-3 pb-2 border-bottom border-light d-flex align-items-center justify-content-between gap-3 flex-wrap">
                    <div>
                        <div className="small text-muted">{t("tenant.games.vocabulary.mastered.total")}</div>
                        <div className="fs-2 fw-bold text-success lh-1">{rows.length}</div>
                    </div>
                    <LanguageFilterTabs
                        selected={language}
                        onChange={setLanguage}
                    />
                </div>

                {/* Konten utama — scrollable */}
                <div className="game-setup-content game-setup-inner-content">
                    {isLoading ? (
                        <div className="d-flex align-items-center gap-2 text-muted py-4">
                            <Spinner size="sm" animation="border" />
                            <span>{t("tenant.games.vocabulary.loading")}</span>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="fs-1 mb-2">🏆</div>
                            <div className="text-muted small">{t("tenant.games.vocabulary.mastered.empty")}</div>
                        </div>
                    ) : (
                        <Accordion
                            activeKey={activeAccordion ?? undefined}
                            onSelect={(eventKey) => setActiveAccordion(
                                Array.isArray(eventKey) ? (eventKey[0] ?? null) : (eventKey ?? null)
                            )}
                        >
                            {grouped.map(([key, items]) => {
                                const [category, day] = key.split("|||");
                                return (
                                    <Accordion.Item eventKey={key} key={key}>
                                        <Accordion.Header>
                                            {category} • {t("tenant.games.vocabulary.setup.day_value", { day })}
                                            <span className="ms-2 text-muted small">
                                                ({t("tenant.games.vocabulary.mastered.word_count", { count: items.length })})
                                            </span>
                                        </Accordion.Header>
                                        <Accordion.Body>
                                            <div className="table-responsive">
                                                <Table size="sm" className="align-middle mb-0">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>#</th>
                                                            <th>{t("tenant.games.vocabulary.mastered.table.indonesian")}</th>
                                                            <th>{languageLabel}</th>
                                                            <th className="text-center">{t("tenant.games.vocabulary.mastered.table.correct")}</th>
                                                            <th className="text-center">{t("tenant.games.vocabulary.mastered.table.max_streak")}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map((item, index) => (
                                                            <tr key={`${item.word_id}-${item.language}`}>
                                                                <td>{index + 1}</td>
                                                                <td className="fw-semibold">{item.word.bahasa_indonesia}</td>
                                                                <td>{translationFor(item) ?? "-"}</td>
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
                    )}
                </div>
            </div>
        </VocabularyLayout>
    );
};

(VocabularyMasteredPage as any).layout = null;

export default VocabularyMasteredPage;
