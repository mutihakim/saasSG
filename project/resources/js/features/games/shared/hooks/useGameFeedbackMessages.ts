import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

const PRAISE_COUNT = 8;
const ENCOURAGEMENT_COUNT = 5;

const useGameFeedbackMessages = () => {
    const { t } = useTranslation();
    const praiseIndexRef = useRef(0);
    const encouragementIndexRef = useRef(0);

    const praiseMessages = useMemo(
        () => Array.from({ length: PRAISE_COUNT }, (_, index) => t(`tenant.games.feedback.praise.${index}`)),
        [t],
    );
    const encouragementMessages = useMemo(
        () => Array.from({ length: ENCOURAGEMENT_COUNT }, (_, index) => t(`tenant.games.feedback.encouragement.${index}`)),
        [t],
    );

    const getNextFeedbackMessage = useCallback((isCorrect: boolean) => {
        if (isCorrect) {
            const message = praiseMessages[praiseIndexRef.current % praiseMessages.length];
            praiseIndexRef.current = (praiseIndexRef.current + 1) % praiseMessages.length;
            return message;
        }

        const message = encouragementMessages[encouragementIndexRef.current % encouragementMessages.length];
        encouragementIndexRef.current = (encouragementIndexRef.current + 1) % encouragementMessages.length;
        return message;
    }, [encouragementMessages, praiseMessages]);

    return {
        getNextFeedbackMessage,
    };
};

export default useGameFeedbackMessages;
