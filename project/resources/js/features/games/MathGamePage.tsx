import { router } from "@inertiajs/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, ProgressBar, Row, Spinner, Table } from "react-bootstrap";

import FeedbackPopup from "./components/FeedbackPopup";
import {
    createGamesApi,
    MathConfigResponse,
    MathGameMode,
    MathGameOperator,
    MathPairStats,
    MathSessionHistoryItem,
} from "./data/api/gamesApi";
import useMathGame from "./hooks/useMathGame";
import useVoiceFeedback from "./hooks/useVoiceFeedback";

import MemberPage from "@/components/layouts/MemberPage";
import { useTenantRoute } from "@/core/config/routes";
import TenantMemberLayout from "@/layouts/TenantMemberLayout";

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

const pairKey = (operator: MathGameOperator, angkaPilihan: number, angkaRandom: number) => (
    `${operator}|${angkaPilihan}|${angkaRandom}`
);

const operatorMeta: Record<MathGameOperator, { label: string; symbol: string; softClass: string; textClass: string; iconClass: string }> = {
    "+": { label: "Penjumlahan", symbol: "+", softClass: "btn-soft-success", textClass: "text-success", iconClass: "ri-add-line" },
    "-": { label: "Pengurangan", symbol: "-", softClass: "btn-soft-warning", textClass: "text-warning", iconClass: "ri-subtract-line" },
    "*": { label: "Perkalian", symbol: "x", softClass: "btn-soft-danger", textClass: "text-danger", iconClass: "ri-close-line" },
    "/": { label: "Pembagian", symbol: "/", softClass: "btn-soft-info", textClass: "text-info", iconClass: "ri-divide-line" },
};

const buildRangeOptions = (options: number[]) => (
    options.filter((num) => (num - 1) % 10 === 0)
);

const buildNumberGrid = (rangeStart: number) => (
    Array.from({ length: 10 }, (_, index) => rangeStart + index)
);

const formatAttemptProblem = (attempt: { question: { mode: MathGameMode; a: number; b: number; operator: MathGameOperator; answer: number; result: number } }) => (
    attempt.question.mode === "mencariC"
        ? `${attempt.question.a} ${attempt.question.operator} ${attempt.question.b} = ${attempt.question.answer}`
        : `${attempt.question.a} ${attempt.question.operator} ${attempt.question.answer} = ${attempt.question.result}`
);

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

const MathGamePage: React.FC<MathGamePageProps> = ({ member }) => {
    const tenantRoute = useTenantRoute();
    const gamesApi = useMemo(() => createGamesApi(tenantRoute), [tenantRoute]);
    const childName = member?.full_name ?? member?.name ?? "Siswa";

    const {
        questions,
        attempts,
        currentQuestion,
        currentIndex,
        userAnswer,
        isCorrect,
        score,
        streak,
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

    // Voice feedback (Indonesian TTS for praise/encouragement)
    const { speak, isEnabled: voiceEnabled } = useVoiceFeedback();

    // Praise and encouragement messages (Indonesian)
    const praiseMessages = useMemo(() => [
        "Hebat!",
        "Kamu Jenius!",
        "Pintar Sekali!",
        "Luar Biasa!",
        "Kerja Bagus!",
        "Tepat Sekali!",
        "Jawabanmu Benar!",
        "Super!",
    ], []);

    const encouragementMessages = useMemo(() => [
        "Ayo Coba Lagi!",
        "Jangan Menyerah!",
        "Sedikit Lagi!",
        "Kamu Pasti Bisa!",
        "Hampir Benar!",
    ], []);

    const [feedbackState, setFeedbackState] = useState<{
        show: boolean;
        isCorrect: boolean;
        message: string;
        correctAnswer?: number | null;
    }>({ show: false, isCorrect: false, message: "" });

    const praiseIndexRef = useRef(0);
    const encouragementIndexRef = useRef(0);

    const getNextPraise = useCallback(() => {
        const msg = praiseMessages[praiseIndexRef.current % praiseMessages.length];
        praiseIndexRef.current += 1;
        if (praiseIndexRef.current >= praiseMessages.length) {
            praiseIndexRef.current = 0;
        }
        return msg;
    }, [praiseMessages]);

    const getNextEncouragement = useCallback(() => {
        const msg = encouragementMessages[encouragementIndexRef.current % encouragementMessages.length];
        encouragementIndexRef.current += 1;
        if (encouragementIndexRef.current >= encouragementMessages.length) {
            encouragementIndexRef.current = 0;
        }
        return msg;
    }, [encouragementMessages]);

    const [mathConfig, setMathConfig] = useState<MathConfigResponse | null>(null);
    const [setup, setSetup] = useState<SetupState | null>(null);
    const [screen, setScreen] = useState<"operator" | "setup">("operator");
    const [history, setHistory] = useState<MathSessionHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [masteredKeys, setMasteredKeys] = useState<string[]>([]);
    const [summaryStats, setSummaryStats] = useState<Record<string, MathPairStats>>({});

    const syncedAttemptCountRef = useRef(0);
    const submittedSessionRef = useRef(false);

    const loadHistory = useCallback(async () => {
        try {
            const rows = await gamesApi.fetchMathHistory(10);
            setHistory(rows);
        } catch {
            setHistory([]);
        }
    }, [gamesApi]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [cfg] = await Promise.all([
                    gamesApi.fetchMathConfig(),
                    loadHistory(),
                ]);

                if (cancelled) {
                    return;
                }

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
                if (!cancelled) {
                    setError("Gagal memuat konfigurasi game matematika.");
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
    }, [gamesApi, loadHistory]);

    const runStartGame = useCallback(async (state: SetupState) => {
        setIsStarting(true);
        setError(null);

        try {
            const mastery = await gamesApi.fetchMathMastery(state.operator);
            const keys = mastery.map((pair) => pairKey(pair.operator, pair.angka_pilihan, pair.angka_random));
            setMasteredKeys(keys);
            setFeedbackState((prev) => ({ ...prev, show: false }));
            setSummaryStats({});

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
            setError("Tidak bisa memulai game. Coba lagi.");
        } finally {
            setIsStarting(false);
        }
    }, [gamesApi, startGame]);

    useEffect(() => {
        if (attempts.length === 0 || !setup) {
            return;
        }

        // Show feedback popup and speak when a new attempt is made
        const latestAttempt = attempts[attempts.length - 1];
        if (latestAttempt && latestAttempt.isCorrect !== null) {
            let message: string;
            let correctAnswer: number | null = null;

            if (latestAttempt.isCorrect) {
                message = getNextPraise();
                if (voiceEnabled) {
                    speak(message);
                }
            } else {
                message = getNextEncouragement();
                correctAnswer = latestAttempt.question.answer;
                if (voiceEnabled) {
                    speak(message);
                }
            }

            setFeedbackState({
                show: true,
                isCorrect: latestAttempt.isCorrect,
                message,
                correctAnswer,
            });
        }

        let cancelled = false;

        (async () => {
            for (let i = syncedAttemptCountRef.current; i < attempts.length; i += 1) {
                if (cancelled) {
                    return;
                }

                const attempt = attempts[i];

                try {
                    const stats = await gamesApi.submitMathAttempt({
                        operator: setup.operator,
                        angka_pilihan: attempt.question.angkaPilihan,
                        angka_random: attempt.question.angkaRandom,
                        is_correct: attempt.isCorrect,
                        current_streak: attempt.streakAfter,
                    });

                    if (stats.mastered) {
                        const key = pairKey(setup.operator, attempt.question.angkaPilihan, attempt.question.angkaRandom);
                        setMasteredKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
                    }
                } catch {
                    // skip retry to keep gameplay smooth
                }

                syncedAttemptCountRef.current = i + 1;
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [attempts, gamesApi, getNextEncouragement, getNextPraise, setup, speak, voiceEnabled]);

    useEffect(() => {
        if (!isFinished || !setup || questions.length === 0 || submittedSessionRef.current) {
            return;
        }

        submittedSessionRef.current = true;

        void (async () => {
            try {
                await gamesApi.finishMathSession({
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
                await loadHistory();
            } catch {
                // keep local result even if save fails
            }
        })();
    }, [
        attempts,
        finishedAt,
        gamesApi,
        isFinished,
        loadHistory,
        questions.length,
        result.bestStreak,
        result.correctCount,
        result.duration,
        result.totalQuestions,
        result.wrongCount,
        setup,
        startedAt,
    ]);

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

    const hasRunningSession = questions.length > 0;
    const isSessionActive = hasRunningSession && !isFinished && Boolean(currentQuestion);
    const currentQuestionNumber = Math.min(currentIndex + 1, questions.length || 1);
    const questionProgress = questions.length > 0
        ? Math.round((currentQuestionNumber / questions.length) * 100)
        : 0;
    const timerProgress = setup && setup.timeLimit > 0
        ? Math.max(0, Math.min(100, Math.round((timeRemaining / setup.timeLimit) * 100)))
        : 0;
    const modeLabelMap = useMemo(() => {
        const map = new Map<MathGameMode, string>();
        for (const mode of (mathConfig?.modes ?? [])) {
            map.set(mode.value, mode.label);
        }
        return map;
    }, [mathConfig?.modes]);

    const accuracy = attempts.length > 0
        ? Math.round((score / attempts.length) * 100)
        : 0;
    const scorePercent = questions.length > 0
        ? Math.round((score / questions.length) * 100)
        : 0;

    const handleRetry = () => {
        if (!setup) {
            return;
        }
        void runStartGame(setup);
    };

    const handleBackToHub = () => {
        reset();
        router.visit("/games");
    };

    const handleOpenSetup = () => {
        reset();
        setScreen("setup");
    };

    const getAnswerVariant = () => {
        if (isCorrect === true) {
            return "success";
        }

        if (isCorrect === false) {
            return "danger";
        }

        return "light";
    };

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

    // Auto-check answer when digit length matches (matches reference implementation)
    const handleInputDigit = useCallback((digit: string) => {
        inputDigit(digit);

        // Auto-check if answer length matches correct answer length
        if (currentQuestion && !isLocked && !isFinished) {
            // Get the new answer value after adding the digit
            const newAnswer = userAnswer + digit;
            const newAnswerLength = newAnswer.length;
            const correctAnswerStr = currentQuestion.answer.toString();
            const correctAnswerLength = correctAnswerStr.length;

            // Auto-submit when length matches.
            if (newAnswerLength === correctAnswerLength) {
                submitAnswer({ answer: newAnswer });
            }
        }
    }, [inputDigit, currentQuestion, isLocked, isFinished, userAnswer, submitAnswer]);

    return (
        <MemberPage title="Game Matematika" parentLabel="Hiburan">
            {/* Feedback Popup for Praise/Encouragement */}
            <FeedbackPopup
                key={attempts.length}
                show={feedbackState.show}
                isCorrect={feedbackState.isCorrect}
                message={feedbackState.message}
                correctAnswer={feedbackState.correctAnswer}
                onDone={handleFeedbackDone}
                duration={2000}
            />

            <Row className="g-4 math-game">
                <Col xl={8}>
                    {isLoading && (
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="d-flex align-items-center gap-2 py-4">
                                <Spinner animation="border" size="sm" />
                                <span>Memuat konfigurasi game...</span>
                            </Card.Body>
                        </Card>
                    )}

                    {!isLoading && error && (
                        <Alert variant="danger" className="mb-0">{error}</Alert>
                    )}

                    {!isLoading && setup && !hasRunningSession && screen === "operator" && (
                        <div className="text-center">
                            <h2 className="fw-bold mb-2">Tingkatkan Kemampuan Berhitungmu!</h2>
                            <p className="fs-5 text-muted mb-2">
                                Latihan untuk: <span className="fw-semibold text-info">{childName}</span>
                            </p>
                            <p className="text-muted mb-4">Pilih jenis operasi hitung untuk memulai latihan.</p>

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
                                                <span className="avatar-sm mx-auto mb-2 d-flex align-items-center justify-content-center">
                                                    <span className={`avatar-title rounded ${meta.textClass} bg-white bg-opacity-75`}>
                                                        <i className={`${meta.iconClass} fs-24`} />
                                                    </span>
                                                </span>
                                                <span className="math-game__operator-symbol fw-bold d-block">{meta.symbol}</span>
                                                <span className="small fw-semibold d-block mt-2">{meta.label}</span>
                                            </Button>
                                        </Col>
                                    );
                                })}
                            </Row>

                            <Button variant="light" className="mt-4" onClick={handleBackToHub}>
                                &larr; Kembali ke Menu Anak
                            </Button>
                        </div>
                    )}

                    {!isLoading && setup && !hasRunningSession && screen === "setup" && (
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-transparent border-0 pb-0">
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                    <Button variant="light" size="sm" onClick={() => setScreen("operator")}>
                                        &larr;
                                    </Button>
                                    <div>
                                        <h5 className={`mb-1 fw-bold ${activeOperatorMeta.textClass}`}>Latihan {activeOperatorMeta.label}</h5>
                                        <p className="text-muted mb-0 small">Atur mode, rentang, waktu, lalu klik angka fokus.</p>
                                    </div>
                                    <div className="text-end small">
                                        <div className="text-muted">Siswa:</div>
                                        <div className="fw-bold text-info">{childName}</div>
                                    </div>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {allPairsMastered && (
                                    <Alert variant="success" className="py-2">
                                        Semua pasangan soal untuk konfigurasi ini sudah dikuasai. Coba operator atau rentang lain.
                                    </Alert>
                                )}

                                <Row className="g-3">
                                    <Col md={4}>
                                        <Form.Label>Mode Soal</Form.Label>
                                        <Form.Select
                                            value={setup.mode}
                                            onChange={(event) => setSetup((prev) => (
                                                prev ? { ...prev, mode: event.target.value as MathGameMode } : prev
                                            ))}
                                        >
                                            {mathConfig?.modes.map((item) => (
                                                <option key={item.value} value={item.value}>{item.label}</option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label>Angka Pilihan (A)</Form.Label>
                                        <Form.Select
                                            value={setup.numberRangeStart}
                                            onChange={(event) => setSetup((prev) => (
                                                prev ? { ...prev, numberRangeStart: Number(event.target.value), numberRange: Number(event.target.value) } : prev
                                            ))}
                                        >
                                            {rangeOptions.map((num) => (
                                                <option key={`a-${num}`} value={num}>{num} - {num + 9}</option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Label>Angka Acak (B)</Form.Label>
                                        <Form.Select
                                            value={setup.randomRange}
                                            onChange={(event) => setSetup((prev) => (
                                                prev ? { ...prev, randomRange: Number(event.target.value) } : prev
                                            ))}
                                        >
                                            {rangeOptions.map((num) => (
                                                <option key={`b-${num}`} value={num}>{num} - {num + 9}</option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Jumlah Soal</Form.Label>
                                        <Form.Select
                                            value={setup.questionCount}
                                            onChange={(event) => setSetup((prev) => (
                                                prev ? { ...prev, questionCount: Number(event.target.value) } : prev
                                            ))}
                                        >
                                            {mathConfig?.question_count_options.map((count) => (
                                                <option key={count} value={count}>{count}</option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>Waktu per Soal (detik)</Form.Label>
                                        <Form.Select
                                            value={setup.timeLimit}
                                            onChange={(event) => setSetup((prev) => (
                                                prev ? { ...prev, timeLimit: Number(event.target.value) } : prev
                                            ))}
                                        >
                                            {mathConfig?.time_limit_options.map((seconds) => (
                                                <option key={seconds} value={seconds}>{seconds}</option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                </Row>

                                <p className="text-muted text-center mb-3 mt-4">Klik salah satu angka di bawah ini untuk memulai soal.</p>
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
                                        <Badge bg="soft-primary" text="primary">Soal {currentQuestionNumber}/{questions.length}</Badge>
                                        <Badge bg="soft-info" text="info">Mode {modeLabelMap.get(setup.mode) ?? setup.mode}</Badge>
                                        <Badge bg="soft-success" text="success">
                                            <i className="ri-fire-line me-1" />
                                            Streak: {getCurrentStreak()}
                                        </Badge>
                                    </div>
                                    <Badge bg={timeRemaining <= 5 ? "danger" : "warning"}>
                                        {timeRemaining} detik
                                    </Badge>
                                </div>
                                <ProgressBar now={timerProgress} variant={timeRemaining <= 5 ? "danger" : "warning"} style={{ height: 6 }} />
                            </Card.Header>
                            <Card.Body>
                                <div className="rounded-3 border bg-light-subtle p-4 text-center mb-3">
                                    <div className="text-muted small mb-2">Pertanyaan</div>
                                    <div className="display-6 fw-bold mb-0">{currentQuestion.display}</div>
                                </div>

                                <div className="rounded-3 border p-3 text-center mb-3">
                                    <div className="text-muted small mb-2">Jawaban Kamu</div>
                                    <div className={`math-game__answer-box display-6 fw-bold text-${getAnswerVariant()} d-inline-block px-3 pb-1`}>
                                        {userAnswer || "?"}
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
                                        <i className="ri-check-line" />
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {isFinished && hasRunningSession && (
                        <Card className="border-0 shadow-sm">
                            <Card.Header className="bg-transparent border-0 pb-0">
                                <h5 className="fw-bold mb-0">Hasil Permainan</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3 mb-3">
                                    <Col sm={4}>
                                        <div className="rounded-3 bg-primary-subtle p-3 text-center h-100">
                                            <div className="fs-3 fw-bold text-primary">{Math.round((result.correctCount / Math.max(1, result.totalQuestions)) * 100)}%</div>
                                            <div className="small text-muted">Akurasi</div>
                                        </div>
                                    </Col>
                                    <Col sm={4}>
                                        <div className="rounded-3 bg-success-subtle p-3 text-center h-100">
                                            <div className="fs-3 fw-bold text-success">{result.correctCount}</div>
                                            <div className="small text-muted">Jawaban Benar</div>
                                        </div>
                                    </Col>
                                    <Col sm={4}>
                                        <div className="rounded-3 bg-info-subtle p-3 text-center h-100">
                                            <div className="fs-3 fw-bold text-info">{result.bestStreak}</div>
                                            <div className="small text-muted">Best Streak</div>
                                        </div>
                                    </Col>
                                </Row>

                                <div className="math-game__summary-table table-responsive mb-3">
                                    <Table size="sm" className="align-middle mb-0">
                                        <thead className="table-light position-sticky top-0">
                                            <tr>
                                                <th>#</th>
                                                <th>Soal</th>
                                                <th>Jawabanmu</th>
                                                <th>Status</th>
                                                <th className="text-center">% Benar</th>
                                                <th className="text-center">Streak</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attempts.map((attempt, index) => {
                                                const stats = summaryStats[attempt.question.pairKey];
                                                const total = (stats?.jumlah_benar ?? 0) + (stats?.jumlah_salah ?? 0);
                                                const successRate = total > 0 ? Math.round(((stats?.jumlah_benar ?? 0) / total) * 100) : 0;
                                                const statusVariant = attempt.isCorrect ? "success" : attempt.timedOut ? "warning" : "danger";
                                                const statusLabel = attempt.isCorrect ? "Benar" : attempt.timedOut ? "Telat" : "Salah";

                                                return (
                                                    <tr key={`${attempt.question.pairKey}-${index}`}>
                                                        <td className="fw-semibold">{index + 1}</td>
                                                        <td>{formatAttemptProblem(attempt)}</td>
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
                                    <Button variant="light" onClick={handleOpenSetup}>Ubah Setup</Button>
                                    <Button variant="primary" onClick={handleRetry}>Main Lagi</Button>
                                    <Button variant="outline-secondary" onClick={handleBackToHub}>Kembali ke Hub</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                <Col xl={4}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-transparent border-0 pb-0">
                            <h6 className="fw-bold mb-0">Ringkasan Sesi</h6>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                <Col xs={6}>
                                        <div className="p-3 rounded-3 border h-100">
                                            <div className="text-muted small">Skor</div>
                                            <div className="fs-4 fw-semibold">{scorePercent}</div>
                                        </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="p-3 rounded-3 border h-100">
                                        <div className="text-muted small">Akurasi</div>
                                        <div className="fs-4 fw-semibold">{accuracy}%</div>
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="p-3 rounded-3 border h-100">
                                        <div className="text-muted small">Streak</div>
                                        <div className="fs-4 fw-semibold">{streak}</div>
                                    </div>
                                </Col>
                                <Col xs={6}>
                                    <div className="p-3 rounded-3 border h-100">
                                        <div className="text-muted small">Mastered Pair</div>
                                        <div className="fs-4 fw-semibold">{masteredKeys.length}</div>
                                    </div>
                                </Col>
                            </Row>

                            {hasRunningSession && (
                                <div className="mt-3">
                                    <div className="d-flex justify-content-between small text-muted mb-1">
                                        <span>Progress Soal</span>
                                        <span>{questionProgress}%</span>
                                    </div>
                                    <ProgressBar now={questionProgress} variant="primary" style={{ height: 6 }} />
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-0 pb-0">
                            <h6 className="fw-bold mb-0">Riwayat Terakhir</h6>
                        </Card.Header>
                        <Card.Body>
                            {history.length === 0 ? (
                                <p className="text-muted small mb-0">Belum ada riwayat sesi.</p>
                            ) : (
                                <div className="table-responsive">
                                    <Table size="sm" className="align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Waktu</th>
                                                <th>Mode</th>
                                                <th>Skor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.slice(0, 6).map((row) => (
                                                <tr key={row.id}>
                                                    <td>{formatDateTime(row.finished_at)}</td>
                                                    <td>{modeLabelMap.get(row.game_mode) ?? row.game_mode}</td>
                                                    <td>{Math.round(row.score_percent)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </MemberPage>
    );
};

(MathGamePage as any).layout = (page: React.ReactNode) => <TenantMemberLayout>{page}</TenantMemberLayout>;

export default MathGamePage;
