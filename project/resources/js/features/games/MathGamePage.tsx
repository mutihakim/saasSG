import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Col, ProgressBar, Row, Spinner, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Select from "react-select";

import FeedbackPopup from "./components/FeedbackPopup";
import MathGameLayout from "./components/MathGameLayout";
import {
    createGamesApi,
    MathConfigResponse,
    MathFinishPayload,
    MathGameMode,
    MathGameOperator,
    MathPairStats,
} from "./data/api/gamesApi";
import useMathGame from "./hooks/useMathGame";
import useVoiceFeedback from "./hooks/useVoiceFeedback";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";

type SetupState = {
    operator: MathGameOperator;
    mode: MathGameMode;
    numberRangeStart: number;
    numberRange: number;
    randomRange: number;
    questionCount: number;
    timeLimit: number;
};

type MathGamePageProps = {
    member?: {
        full_name?: string | null;
        name?: string | null;
    } | null;
};

type Option<T> = {
    value: T;
    label: string;
};

const pairKey = (operator: MathGameOperator, angkaPilihan: number, angkaRandom: number) => (
    `${operator}|${angkaPilihan}|${angkaRandom}`
);

const buildRangeOptions = (options: number[]) => (
    options.filter((num) => (num - 1) % 10 === 0)
);

const buildNumberGrid = (rangeStart: number) => (
    Array.from({ length: 10 }, (_, index) => rangeStart + index)
);

const findOption = <T,>(options: Array<Option<T>>, value: T): Option<T> | null => (
    options.find((option) => option.value === value) ?? null
);

const modeLabelKey = (mode: MathGameMode) => (
    mode === "mencariB" ? "tenant.games.math.mode.find_variable" : "tenant.games.math.mode.find_result"
);

const MathGamePage: React.FC<MathGamePageProps> = ({ member }) => {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const gamesApi = useMemo(() => createGamesApi(tenantRoute), [tenantRoute]);

    const {
        questions,
        attempts,
        currentQuestion,
        currentIndex,
        userAnswer,
        isCorrect,
        timeRemaining,
        isFinished,
        isLocked,
        allPairsMastered,
        startedAt,
        finishedAt,
        submitAnswer,
        inputDigit,
        deleteDigit,
        startGame,
        reset,
        result,
        getCurrentStreak,
    } = useMathGame();

    const { speak, isEnabled: voiceEnabled } = useVoiceFeedback();

    const praiseMessages = useMemo(() => [
        t("tenant.games.math.voice.praise.0"),
        t("tenant.games.math.voice.praise.1"),
        t("tenant.games.math.voice.praise.2"),
        t("tenant.games.math.voice.praise.3"),
        t("tenant.games.math.voice.praise.4"),
        t("tenant.games.math.voice.praise.5"),
        t("tenant.games.math.voice.praise.6"),
        t("tenant.games.math.voice.praise.7"),
    ], [t]);

    const encouragementMessages = useMemo(() => [
        t("tenant.games.math.voice.encouragement.0"),
        t("tenant.games.math.voice.encouragement.1"),
        t("tenant.games.math.voice.encouragement.2"),
        t("tenant.games.math.voice.encouragement.3"),
        t("tenant.games.math.voice.encouragement.4"),
    ], [t]);

    const operatorMeta = useMemo<Record<MathGameOperator, { label: string; softClass: string; textClass: string; iconClass: string }>>(() => ({
        "+": {
            label: t("tenant.games.math.operator.addition"),
            softClass: "btn-soft-success",
            textClass: "text-success",
            iconClass: "ri-add-circle-fill",
        },
        "-": {
            label: t("tenant.games.math.operator.subtraction"),
            softClass: "btn-soft-warning",
            textClass: "text-warning",
            iconClass: "ri-subtract-fill",
        },
        "*": {
            label: t("tenant.games.math.operator.multiplication"),
            softClass: "btn-soft-danger",
            textClass: "text-danger",
            iconClass: "ri-close-circle-fill",
        },
        "/": {
            label: t("tenant.games.math.operator.division"),
            softClass: "btn-soft-info",
            textClass: "text-info",
            iconClass: "ri-divide-fill",
        },
    }), [t]);

    const [feedbackState, setFeedbackState] = useState<{
        show: boolean;
        isCorrect: boolean;
        message: string;
        correctAnswer?: number | null;
    }>({ show: false, isCorrect: false, message: "" });

    const praiseIndexRef = useRef(0);
    const encouragementIndexRef = useRef(0);

    const [mathConfig, setMathConfig] = useState<MathConfigResponse | null>(null);
    const [setup, setSetup] = useState<SetupState | null>(null);
    const [screen, setScreen] = useState<"operator" | "setup">("operator");
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const [summaryStats, setSummaryStats] = useState<Record<string, MathPairStats>>({});

    const syncedAttemptCountRef = useRef(0);
    const submittedSessionRef = useRef(false);
    const masteredToastShownRef = useRef(false);

    const getNextPraise = useCallback(() => {
        const msg = praiseMessages[praiseIndexRef.current % praiseMessages.length];
        praiseIndexRef.current = (praiseIndexRef.current + 1) % praiseMessages.length;
        return msg;
    }, [praiseMessages]);

    const getNextEncouragement = useCallback(() => {
        const msg = encouragementMessages[encouragementIndexRef.current % encouragementMessages.length];
        encouragementIndexRef.current = (encouragementIndexRef.current + 1) % encouragementMessages.length;
        return msg;
    }, [encouragementMessages]);

    const loadConfig = useCallback(async () => {
        setIsLoading(true);
        setLoadFailed(false);

        try {
            const cfg = await gamesApi.fetchMathConfig();
            const defaults: SetupState = {
                operator: cfg.operators[0]?.value ?? "+",
                mode: cfg.modes[0]?.value ?? "mencariC",
                numberRangeStart: cfg.number_options[0] ?? 1,
                numberRange: cfg.number_options[0] ?? 1,
                randomRange: cfg.number_options[0] ?? 1,
                questionCount: cfg.question_count_options[3] ?? cfg.question_count_options[0] ?? 10,
                timeLimit: cfg.time_limit_options[1] ?? cfg.time_limit_options[0] ?? 15,
            };

            setMathConfig(cfg);
            setSetup(defaults);
        } catch {
            setLoadFailed(true);
            notify.error(t("tenant.games.math.load_error_toast"));
        } finally {
            setIsLoading(false);
        }
    }, [gamesApi, t]);

    useEffect(() => {
        void loadConfig();
    }, [loadConfig]);

    const runStartGame = useCallback(async (state: SetupState) => {
        setIsStarting(true);

        try {
            const mastery = await gamesApi.fetchMathMastery(state.operator);
            const keys = mastery.map((pair) => pairKey(pair.operator, pair.angka_pilihan, pair.angka_random));

            setFeedbackState((prev) => ({ ...prev, show: false }));
            setSummaryStats({});
            masteredToastShownRef.current = false;

            syncedAttemptCountRef.current = 0;
            submittedSessionRef.current = false;

            startGame({
                operator: state.operator,
                mode: state.mode,
                numberRange: state.numberRange,
                randomRange: state.randomRange,
                questionCount: state.questionCount,
                timeLimit: state.timeLimit,
            }, {
                masteredPairs: keys,
            });
        } catch {
            notify.error(t("tenant.games.math.start_failed_toast"));
        } finally {
            setIsStarting(false);
        }
    }, [gamesApi, startGame, t]);

    useEffect(() => {
        if (attempts.length === 0 || !setup) {
            return;
        }

        const latestAttempt = attempts[attempts.length - 1];
        if (latestAttempt && latestAttempt.isCorrect !== null) {
            let message: string;
            let correctAnswer: number | null = null;

            if (latestAttempt.isCorrect) {
                message = getNextPraise();
            } else {
                message = getNextEncouragement();
                correctAnswer = latestAttempt.question.answer;
            }

            if (voiceEnabled) {
                speak(message);
            }

            setFeedbackState({
                show: true,
                isCorrect: latestAttempt.isCorrect,
                message,
                correctAnswer,
            });
        }

        let cancelled = false;

        void (async () => {
            for (let i = syncedAttemptCountRef.current; i < attempts.length; i += 1) {
                if (cancelled) {
                    return;
                }

                const attempt = attempts[i];

                try {
                    await gamesApi.submitMathAttempt({
                        operator: setup.operator,
                        angka_pilihan: attempt.question.angkaPilihan,
                        angka_random: attempt.question.angkaRandom,
                        is_correct: attempt.isCorrect,
                        current_streak: attempt.streakAfter,
                    });
                } catch {
                    // Keep game playable even if network request fails.
                }

                syncedAttemptCountRef.current = i + 1;
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [attempts, gamesApi, getNextEncouragement, getNextPraise, setup, speak, voiceEnabled]);

    const finishSession = useCallback(async (payload: MathFinishPayload) => {
        try {
            await gamesApi.finishMathSession(payload);
        } catch {
            notify.error(t("tenant.games.math.finish_failed_toast"));
        }
    }, [gamesApi, t]);

    const persistPartialSessionOnLeave = useCallback(() => {
        if (!setup || submittedSessionRef.current || attempts.length === 0) {
            return;
        }

        submittedSessionRef.current = true;

        const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
        const wrongCount = attempts.length - correctCount;
        const bestStreak = attempts.reduce((max, attempt) => Math.max(max, attempt.streakAfter), 0);

        void finishSession({
            operator: setup.operator,
            game_mode: setup.mode,
            number_range: setup.numberRange,
            random_range: setup.randomRange,
            question_count: setup.questionCount,
            time_limit: setup.timeLimit,
            correct_count: correctCount,
            wrong_count: wrongCount,
            best_streak: bestStreak,
            duration_seconds: startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0,
            started_at: startedAt ? new Date(startedAt).toISOString() : undefined,
            finished_at: new Date().toISOString(),
            summary: {
                attempts: attempts.map((attempt) => ({
                    operator: attempt.question.operator,
                    angka_pilihan: attempt.question.angkaPilihan,
                    angka_random: attempt.question.angkaRandom,
                    correct: attempt.isCorrect,
                    timed_out: attempt.timedOut,
                })),
            },
        });
    }, [attempts, finishSession, setup, startedAt]);

    useEffect(() => {
        if (!isFinished || !setup || questions.length === 0 || submittedSessionRef.current) {
            return;
        }

        submittedSessionRef.current = true;

        void finishSession({
            operator: setup.operator,
            game_mode: setup.mode,
            number_range: setup.numberRange,
            random_range: setup.randomRange,
            question_count: result.totalQuestions,
            time_limit: setup.timeLimit,
            correct_count: result.correctCount,
            wrong_count: result.wrongCount,
            best_streak: result.bestStreak,
            duration_seconds: result.duration,
            started_at: startedAt ? new Date(startedAt).toISOString() : undefined,
            finished_at: finishedAt ? new Date(finishedAt).toISOString() : undefined,
            summary: {
                attempts: attempts.map((attempt) => ({
                    operator: attempt.question.operator,
                    angka_pilihan: attempt.question.angkaPilihan,
                    angka_random: attempt.question.angkaRandom,
                    correct: attempt.isCorrect,
                    timed_out: attempt.timedOut,
                })),
            },
        });
    }, [attempts, finishSession, finishedAt, isFinished, questions.length, result, setup, startedAt]);

    useEffect(() => {
        if (!isFinished || attempts.length === 0) {
            return;
        }

        const uniquePairs = Array.from(new Map(attempts.map((attempt) => [
            attempt.question.pairKey,
            {
                operator: attempt.question.operator,
                angka_pilihan: attempt.question.angkaPilihan,
                angka_random: attempt.question.angkaRandom,
            },
        ])).values());

        void gamesApi.fetchMathStats(uniquePairs)
            .then(setSummaryStats)
            .catch(() => setSummaryStats({}));
    }, [attempts, gamesApi, isFinished]);

    useEffect(() => {
        const hasRunningSession = questions.length > 0;
        if (!allPairsMastered || hasRunningSession || masteredToastShownRef.current) {
            return;
        }

        notify.info(t("tenant.games.math.mastered_info_toast"));
        masteredToastShownRef.current = true;
    }, [allPairsMastered, questions.length, t]);

    const hasRunningSession = questions.length > 0;
    const isSessionActive = hasRunningSession && !isFinished && Boolean(currentQuestion);
    const currentQuestionNumber = Math.min(currentIndex + 1, questions.length || 1);
    const timerProgress = setup && setup.timeLimit > 0
        ? Math.max(0, Math.min(100, Math.round((timeRemaining / setup.timeLimit) * 100)))
        : 0;

    const handleFeedbackDone = useCallback(() => {
        setFeedbackState((prev) => ({ ...prev, show: false }));
    }, []);

    const handleOperatorSelect = (operator: MathGameOperator) => {
        setSetup((prev) => (prev ? { ...prev, operator } : prev));
        setScreen("setup");
    };

    const rangeOptions = useMemo(() => buildRangeOptions(mathConfig?.number_options ?? []), [mathConfig?.number_options]);
    const numberGrid = useMemo(() => buildNumberGrid(setup?.numberRangeStart ?? 1), [setup?.numberRangeStart]);
    const activeOperatorMeta = setup ? operatorMeta[setup.operator] : operatorMeta["+"];

    const modeOptions = useMemo<Option<MathGameMode>[]>(() => (
        (mathConfig?.modes ?? []).map((item) => ({
            value: item.value,
            label: t(modeLabelKey(item.value)),
        }))
    ), [mathConfig?.modes, t]);

    const rangeSelectOptions = useMemo<Option<number>[]>(() => (
        rangeOptions.map((num) => ({ value: num, label: `${num} - ${num + 9}` }))
    ), [rangeOptions]);

    const questionCountOptions = useMemo<Option<number>[]>(() => (
        (mathConfig?.question_count_options ?? []).map((count) => ({ value: count, label: String(count) }))
    ), [mathConfig?.question_count_options]);

    const timeLimitOptions = useMemo<Option<number>[]>(() => (
        (mathConfig?.time_limit_options ?? []).map((seconds) => ({
            value: seconds,
            label: t("tenant.games.math.setup.time_seconds", { seconds }),
        }))
    ), [mathConfig?.time_limit_options, t]);

    const handleInputDigit = useCallback((digit: string) => {
        if (!currentQuestion || isLocked || isFinished) {
            return;
        }

        const newAnswer = `${userAnswer}${digit}`;
        inputDigit(digit);

        const correctAnswerLength = currentQuestion.answer.toString().length;
        if (newAnswer.length >= correctAnswerLength) {
            submitAnswer({ answer: newAnswer });
        }
    }, [currentQuestion, inputDigit, isFinished, isLocked, submitAnswer, userAnswer]);

    const getAnswerVariant = () => {
        if (isCorrect === true) {
            return "success";
        }

        if (isCorrect === false) {
            return "danger";
        }

        return "light";
    };

    return (
        <MathGameLayout
            title={t("tenant.games.math.title")}
            menuKey="main"
            memberName={member?.full_name ?? member?.name ?? undefined}
            isSessionActive={isSessionActive}
            onLeavingSession={persistPartialSessionOnLeave}
        >
            <FeedbackPopup
                key={attempts.length}
                show={feedbackState.show}
                isCorrect={feedbackState.isCorrect}
                message={feedbackState.message}
                correctAnswer={feedbackState.correctAnswer}
                onDone={handleFeedbackDone}
                duration={2000}
            />

            <div className="math-game-layout__scroll">
                <div className="math-game">
                    <Row className="justify-content-center">
                        <Col xxl={10}>
                            {isLoading && (
                                <Card className="border-0 shadow-sm">
                                    <Card.Body className="d-flex align-items-center gap-2 py-4">
                                        <Spinner animation="border" size="sm" />
                                        <span>{t("tenant.games.math.loading_config")}</span>
                                    </Card.Body>
                                </Card>
                            )}

                            {!isLoading && loadFailed && (
                                <Card className="border-0 shadow-sm">
                                    <Card.Body className="py-4 text-center">
                                        <p className="text-muted mb-3">{t("tenant.games.math.load_failed")}</p>
                                        <Button variant="primary" onClick={() => void loadConfig()}>{t("tenant.games.math.reload")}</Button>
                                    </Card.Body>
                                </Card>
                            )}

                            {!isLoading && !loadFailed && setup && !hasRunningSession && screen === "operator" && (
                                <div className="text-center">
                                    <h2 className="fw-bold mb-2">{t("tenant.games.math.operator.heading")}</h2>
                                    <p className="text-muted mb-4">{t("tenant.games.math.operator.subheading")}</p>

                                    <Row className="g-3 g-md-4 justify-content-center">
                                        {(mathConfig?.operators ?? []).map((item) => {
                                            const meta = operatorMeta[item.value];
                                            return (
                                                <Col xs={6} md={3} key={item.value}>
                                                    <Button
                                                        type="button"
                                                        variant=""
                                                        className={`math-game__tile card-animate border-0 ${meta.softClass}`}
                                                        aria-label={meta.label}
                                                        onClick={() => handleOperatorSelect(item.value)}
                                                    >
                                                        <i className={`${meta.iconClass} fs-1 ${meta.textClass}`} />
                                                        <span className="small fw-semibold d-block mt-2">{meta.label}</span>
                                                    </Button>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                </div>
                            )}

                            {!isLoading && !loadFailed && setup && !hasRunningSession && screen === "setup" && (
                                <Card className="border-0 shadow-sm">
                                    <Card.Header className="bg-transparent border-0 pb-0">
                                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                            <Button variant="light" size="sm" onClick={() => setScreen("operator")}>
                                                <i className="ri-arrow-left-line me-1" />
                                                {t("tenant.games.math.setup.back_operator")}
                                            </Button>
                                            <div>
                                                <h5 className={`mb-1 fw-bold ${activeOperatorMeta.textClass}`}>
                                                    {t("tenant.games.math.setup.title_prefix", { operator: activeOperatorMeta.label })}
                                                </h5>
                                                <p className="text-muted mb-0 small">{t("tenant.games.math.setup.subtitle")}</p>
                                            </div>
                                            <span className="badge bg-light text-muted">{t("tenant.games.math.setup.badge")}</span>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3">
                                            <Col md={12}>
                                                <label className="form-label">{t("tenant.games.math.setup.mode")}</label>
                                                <Select
                                                    classNamePrefix="react-select"
                                                    value={findOption(modeOptions, setup.mode)}
                                                    options={modeOptions}
                                                    isSearchable={false}
                                                    onChange={(option) => {
                                                        if (!option) {
                                                            return;
                                                        }
                                                        setSetup((prev) => (prev ? { ...prev, mode: option.value } : prev));
                                                    }}
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <label className="form-label">{t("tenant.games.math.setup.number_a")}</label>
                                                <Select
                                                    classNamePrefix="react-select"
                                                    value={findOption(rangeSelectOptions, setup.numberRangeStart)}
                                                    options={rangeSelectOptions}
                                                    isSearchable={false}
                                                    onChange={(option) => {
                                                        if (!option) {
                                                            return;
                                                        }
                                                        setSetup((prev) => (
                                                            prev
                                                                ? { ...prev, numberRangeStart: option.value, numberRange: option.value }
                                                                : prev
                                                        ));
                                                    }}
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <label className="form-label">{t("tenant.games.math.setup.number_b")}</label>
                                                <Select
                                                    classNamePrefix="react-select"
                                                    value={findOption(rangeSelectOptions, setup.randomRange)}
                                                    options={rangeSelectOptions}
                                                    isSearchable={false}
                                                    onChange={(option) => {
                                                        if (!option) {
                                                            return;
                                                        }
                                                        setSetup((prev) => (prev ? { ...prev, randomRange: option.value } : prev));
                                                    }}
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <label className="form-label">{t("tenant.games.math.setup.question_count")}</label>
                                                <Select
                                                    classNamePrefix="react-select"
                                                    value={findOption(questionCountOptions, setup.questionCount)}
                                                    options={questionCountOptions}
                                                    isSearchable={false}
                                                    onChange={(option) => {
                                                        if (!option) {
                                                            return;
                                                        }
                                                        setSetup((prev) => (prev ? { ...prev, questionCount: option.value } : prev));
                                                    }}
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <label className="form-label">{t("tenant.games.math.setup.time_limit")}</label>
                                                <Select
                                                    classNamePrefix="react-select"
                                                    value={findOption(timeLimitOptions, setup.timeLimit)}
                                                    options={timeLimitOptions}
                                                    isSearchable={false}
                                                    onChange={(option) => {
                                                        if (!option) {
                                                            return;
                                                        }
                                                        setSetup((prev) => (prev ? { ...prev, timeLimit: option.value } : prev));
                                                    }}
                                                />
                                            </Col>
                                        </Row>

                                        <p className="text-muted text-center mb-3 mt-4">{t("tenant.games.math.setup.number_grid_help")}</p>
                                        <div className="row row-cols-5 g-3 justify-content-center">
                                            {numberGrid.map((num) => (
                                                <div className="col" key={num}>
                                                    <Button
                                                        type="button"
                                                        variant=""
                                                        className={`math-game__number-tile w-100 ${activeOperatorMeta.softClass}`}
                                                        disabled={isStarting}
                                                        onClick={() => void runStartGame({ ...setup, numberRange: num })}
                                                    >
                                                        {num}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {isSessionActive && currentQuestion && setup && (
                                <Card className="border-0 shadow-sm">
                                    <Card.Header className="bg-transparent border-0 pb-0">
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <Badge bg="soft-primary" text="primary">
                                                    {t("tenant.games.math.session.question_counter", {
                                                        current: currentQuestionNumber,
                                                        total: questions.length,
                                                    })}
                                                </Badge>
                                                <Badge bg="soft-info" text="info">
                                                    {t("tenant.games.math.session.mode_badge", {
                                                        mode: t(modeLabelKey(setup.mode)),
                                                    })}
                                                </Badge>
                                                <Badge bg="soft-success" text="success">
                                                    <i className="ri-fire-line me-1" />
                                                    {t("tenant.games.math.session.streak", { count: getCurrentStreak() })}
                                                </Badge>
                                            </div>
                                            <Badge bg={timeRemaining <= 5 ? "danger" : "warning"}>
                                                {t("tenant.games.math.session.seconds_left", { seconds: timeRemaining })}
                                            </Badge>
                                        </div>
                                        <ProgressBar now={timerProgress} variant={timeRemaining <= 5 ? "danger" : "warning"} style={{ height: 6 }} />
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="rounded-3 border bg-light-subtle p-4 text-center mb-3">
                                            <div className="text-muted small mb-2">{t("tenant.games.math.session.question_label")}</div>
                                            <div className="display-6 fw-bold mb-0">{currentQuestion.display}</div>
                                        </div>

                                        <div className="rounded-3 border p-3 text-center mb-3">
                                            <div className="text-muted small mb-2">{t("tenant.games.math.session.answer_label")}</div>
                                            <div className={`math-game__answer-box display-6 fw-bold text-${getAnswerVariant()} d-inline-block px-3 pb-1`}>
                                                {userAnswer || t("tenant.games.math.session.answer_placeholder")}
                                            </div>
                                        </div>

                                        <div className="math-game__numpad d-grid gap-2 mx-auto">
                                            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                                                <Button
                                                    key={digit}
                                                    variant="outline-primary"
                                                    size="lg"
                                                    className="math-game__numpad-button"
                                                    onClick={() => handleInputDigit(digit)}
                                                    disabled={isLocked}
                                                >
                                                    {digit}
                                                </Button>
                                            ))}
                                            <Button variant="outline-warning" size="lg" className="math-game__numpad-button" onClick={deleteDigit} disabled={isLocked}>
                                                <i className="ri-delete-back-line" />
                                            </Button>
                                            <Button variant="outline-primary" size="lg" className="math-game__numpad-button" onClick={() => handleInputDigit("0")} disabled={isLocked}>
                                                0
                                            </Button>
                                            <Button variant="success" size="lg" className="math-game__numpad-button" onClick={() => submitAnswer()} disabled={isLocked}>
                                                {t("tenant.games.math.session.numpad.submit")}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {isFinished && hasRunningSession && (
                                <Card className="border-0 shadow-sm">
                                    <Card.Header className="bg-transparent border-0 pb-0">
                                        <h5 className="fw-bold mb-0">{t("tenant.games.math.summary.title")}</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row className="g-3 mb-3">
                                            <Col sm={4}>
                                                <div className="rounded-3 bg-primary-subtle p-3 text-center h-100">
                                                    <div className="fs-3 fw-bold text-primary">{Math.round((result.correctCount / Math.max(1, result.totalQuestions)) * 100)}%</div>
                                                    <div className="small text-muted">{t("tenant.games.math.summary.accuracy")}</div>
                                                </div>
                                            </Col>
                                            <Col sm={4}>
                                                <div className="rounded-3 bg-success-subtle p-3 text-center h-100">
                                                    <div className="fs-3 fw-bold text-success">{result.correctCount}</div>
                                                    <div className="small text-muted">{t("tenant.games.math.summary.correct_answers")}</div>
                                                </div>
                                            </Col>
                                            <Col sm={4}>
                                                <div className="rounded-3 bg-info-subtle p-3 text-center h-100">
                                                    <div className="fs-3 fw-bold text-info">{result.bestStreak}</div>
                                                    <div className="small text-muted">{t("tenant.games.math.summary.best_streak")}</div>
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="math-game__summary-table table-responsive mb-3">
                                            <Table size="sm" className="align-middle mb-0">
                                                <thead className="table-light position-sticky top-0">
                                                    <tr>
                                                        <th>{t("tenant.games.math.summary.table.no")}</th>
                                                        <th>{t("tenant.games.math.summary.table.problem")}</th>
                                                        <th>{t("tenant.games.math.summary.table.your_answer")}</th>
                                                        <th>{t("tenant.games.math.summary.table.status")}</th>
                                                        <th className="text-center">{t("tenant.games.math.summary.table.success_rate")}</th>
                                                        <th className="text-center">{t("tenant.games.math.summary.table.streak")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attempts.map((attempt, index) => {
                                                        const stats = summaryStats[attempt.question.pairKey];
                                                        const total = (stats?.jumlah_benar ?? 0) + (stats?.jumlah_salah ?? 0);
                                                        const successRate = total > 0 ? Math.round(((stats?.jumlah_benar ?? 0) / total) * 100) : 0;
                                                        const statusVariant = attempt.isCorrect ? "success" : attempt.timedOut ? "warning" : "danger";
                                                        const statusLabel = attempt.isCorrect
                                                            ? t("tenant.games.math.summary.status.correct")
                                                            : attempt.timedOut
                                                                ? t("tenant.games.math.summary.status.late")
                                                                : t("tenant.games.math.summary.status.wrong");

                                                        const problemText = attempt.question.mode === "mencariC"
                                                            ? `${attempt.question.a} ${attempt.question.operator} ${attempt.question.b} = ${attempt.question.answer}`
                                                            : `${attempt.question.a} ${attempt.question.operator} ${attempt.question.answer} = ${attempt.question.result}`;

                                                        return (
                                                            <tr key={`${attempt.question.pairKey}-${index}`}>
                                                                <td className="fw-semibold">{index + 1}</td>
                                                                <td>{problemText}</td>
                                                                <td>{attempt.userAnswer ?? "-"}</td>
                                                                <td>
                                                                    <Badge bg={`${statusVariant}-subtle`} text={statusVariant}>
                                                                        {statusLabel}
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-center">{successRate}%</td>
                                                                <td className="text-center">{stats?.current_streak_benar ?? attempt.streakAfter}x</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>
                                        </div>

                                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                                            <Button variant="light" onClick={() => { reset(); setScreen("setup"); }}>
                                                {t("tenant.games.math.summary.change_setup")}
                                            </Button>
                                            <Button variant="primary" onClick={() => setup && void runStartGame(setup)}>
                                                {t("tenant.games.math.summary.play_again")}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    </Row>
                </div>
            </div>
        </MathGameLayout>
    );
};

export default MathGamePage;
