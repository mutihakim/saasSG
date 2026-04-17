import React, { useEffect, useMemo, useState } from "react";
import { Accordion, Badge, Spinner, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import MathGameLayout from "../components/MathGameLayout";
import { createGamesApi, MathGameOperator, MathMasteredPair } from "../data/api/gamesApi";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type Props = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

type OperatorOption = {
    value: MathGameOperator | "all";
    label: string;
};

const operatorSymbol: Record<MathGameOperator, string> = {
    "+": "+",
    "-": "-",
    "*": "x",
    "/": "/",
};

const operatorOrder: MathGameOperator[] = ["+", "-", "*", "/"];

const MathGameMasteredPage: React.FC<Props> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const gamesApi = useMemo(() => createGamesApi(tenantRoute), [tenantRoute]);

    const operatorOptions = useMemo<OperatorOption[]>(() => [
        { value: "all", label: t("tenant.games.layout.menu.mastered") },
        { value: "+", label: `${t("tenant.games.math.operator.addition")} (+)` },
        { value: "-", label: `${t("tenant.games.math.operator.subtraction")} (-)` },
        { value: "*", label: `${t("tenant.games.math.operator.multiplication")} (x)` },
        { value: "/", label: `${t("tenant.games.math.operator.division")} (/)` },
    ], [t]);

    const [isLoading, setIsLoading] = useState(true);
    const [selectedOperator, setSelectedOperator] = useState<OperatorOption>(operatorOptions[0]);
    const [pairs, setPairs] = useState<MathMasteredPair[]>([]);
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    useEffect(() => {
        setSelectedOperator((prev) => (
            operatorOptions.find((option) => option.value === prev.value) ?? operatorOptions[0]
        ));
    }, [operatorOptions]);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);

            try {
                const data = await gamesApi.fetchMathMastery(selectedOperator.value === "all" ? undefined : selectedOperator.value);
                if (!cancelled) {
                    setPairs(data);
                    setActiveAccordion(null);
                }
            } catch {
                if (!cancelled) {
                    setPairs([]);
                    notify.error(t("tenant.games.mastered.load_error_toast"));
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
    }, [gamesApi, selectedOperator.value, t]);

    const grouped = useMemo(() => {
        const byOperator = new Map<MathGameOperator, Map<number, MathMasteredPair[]>>();

        for (const pair of pairs) {
            if (!byOperator.has(pair.operator)) {
                byOperator.set(pair.operator, new Map<number, MathMasteredPair[]>());
            }

            const byA = byOperator.get(pair.operator)!;
            if (!byA.has(pair.angka_pilihan)) {
                byA.set(pair.angka_pilihan, []);
            }

            byA.get(pair.angka_pilihan)!.push(pair);
        }

        Array.from(byOperator.values()).forEach((operatorMap) => {
            Array.from(operatorMap.values()).forEach((rows) => {
                rows.sort((a: MathMasteredPair, b: MathMasteredPair) => a.angka_random - b.angka_random);
            });
        });

        return byOperator;
    }, [pairs]);

    return (
        <MathGameLayout
            title={t("tenant.games.mastered.title")}
            menuKey="mastered"
            memberName={member?.full_name ?? member?.name ?? undefined}
        >
            <div className="game-setup-card h-100">
                {/* Header dengan Selector & Ringkasan */}
                <div className="px-3 px-sm-4 pt-3 pb-2 border-bottom border-light d-flex align-items-center justify-content-between gap-3 flex-wrap">
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                        <div style={{ minWidth: "180px" }}>
                            <div className="small text-muted mb-1">{t("tenant.games.mastered.operator_group")}</div>
                            <Select
                                classNamePrefix="react-select"
                                value={selectedOperator}
                                options={operatorOptions}
                                onChange={(option) => setSelectedOperator(option ?? operatorOptions[0])}
                                isSearchable={false}
                            />
                        </div>
                        <div className="ms-auto text-end">
                            <div className="small text-muted">{t("tenant.games.mastered.total_pairs")}</div>
                            <div className="fs-2 fw-bold text-success lh-1">{pairs.length}</div>
                        </div>
                    </div>
                </div>

                {/* Konten Utama — scrollable */}
                <div className="game-setup-content game-setup-inner-content">
                    {isLoading ? (
                        <div className="d-flex align-items-center gap-2 text-muted py-4">
                            <Spinner size="sm" animation="border" />
                            <span>{t("tenant.games.mastered.loading")}</span>
                        </div>
                    ) : pairs.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="fs-1 mb-2">🏆</div>
                            <div className="text-muted small">{t("tenant.games.mastered.empty")}</div>
                        </div>
                    ) : (
                        <div className="math-game__details">
                            {operatorOrder
                                .filter((op) => grouped.has(op))
                                .map((op) => {
                                    const byA = grouped.get(op)!;
                                    return (
                                        <div key={op} className="mb-4">
                                            <div className="d-flex align-items-center gap-2 mb-3">
                                                <Badge bg="info-subtle" text="info" className="fs-6 px-3">{operatorSymbol[op]}</Badge>
                                                <h6 className="fw-bold mb-0">
                                                    {operatorOptions.find((item) => item.value === op)?.label ?? op}
                                                </h6>
                                            </div>

                                            <Accordion
                                                activeKey={activeAccordion ?? undefined}
                                                onSelect={(eventKey) => setActiveAccordion(Array.isArray(eventKey) ? (eventKey[0] ?? null) : (eventKey ?? null))}
                                                className="custom-accordionwithicon"
                                            >
                                                {Array.from(byA.keys())
                                                    .sort((a, b) => a - b)
                                                    .map((angkaA) => {
                                                        const eventKey = `${op}-${angkaA}`;
                                                        const rows = byA.get(angkaA) ?? [];

                                                        return (
                                                            <Accordion.Item eventKey={eventKey} key={eventKey}>
                                                                <Accordion.Header>
                                                                    {t("tenant.games.mastered.accordion.angka_a", { value: angkaA })}
                                                                    <span className="ms-2 text-muted small">
                                                                        ({t("tenant.games.vocabulary.mastered.word_count", { count: rows.length })})
                                                                    </span>
                                                                </Accordion.Header>
                                                                <Accordion.Body>
                                                                    <div className="table-responsive">
                                                                        <Table size="sm" className="align-middle mb-0">
                                                                            <thead className="table-light">
                                                                                <tr>
                                                                                    <th>#</th>
                                                                                    <th className="text-center">{t("tenant.games.mastered.table.angka_b")}</th>
                                                                                    <th className="text-center">{t("tenant.games.mastered.table.max_streak")}</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {rows.map((row, index) => (
                                                                                    <tr key={`${row.operator}-${row.angka_pilihan}-${row.angka_random}`}>
                                                                                        <td>{index + 1}</td>
                                                                                        <td className="text-center fw-semibold fs-5">{row.angka_random}</td>
                                                                                        <td className="text-center">
                                                                                            <Badge bg="success-subtle" text="success">{row.max_streak_benar}x</Badge>
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
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>
        </MathGameLayout>
    );
};

(MathGameMasteredPage as any).layout = null;

export default MathGameMasteredPage;
