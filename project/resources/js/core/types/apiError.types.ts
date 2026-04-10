import i18n from "@/i18n";

export type ParsedApiError = {
    title: string;
    detail?: string;
};

export function parseApiError(err: any, fallback: string): ParsedApiError {
    const t = i18n.t.bind(i18n);
    const status = err?.response?.status as number | undefined;
    const data = err?.response?.data;
    const code = data?.error?.code ?? data?.code;

    let message = data?.error?.message ?? data?.message ?? fallback;
    const fields = data?.error?.details?.fields ?? data?.errors;
    const hint = data?.error?.details?.hint;

    let title = message;
    let detail = hint;

    if (code) {
        const translatedTitle = t(`api.error.${code}.title`, { defaultValue: "" });
        if (translatedTitle) {
            title = translatedTitle;
        }

        const translatedDetail = t(`api.error.${code}.detail`, { defaultValue: "" });
        if (translatedDetail) {
            detail = translatedDetail;
        }
    }

    if (fields && typeof fields === "object") {
        const firstFieldEntry = Object.entries(fields)[0];
        const firstFieldMessage = Array.isArray(firstFieldEntry[1]) ? firstFieldEntry[1][0] : firstFieldEntry[1];

        if (firstFieldMessage) {
            return {
                title,
                detail: String(firstFieldMessage),
            };
        }
    }

    if (detail) {
        return {
            title,
            detail,
        };
    }

    if (status === 401) {
        return {
            title: t("api.error.unauthenticated.title", { defaultValue: "Authentication required" }),
            detail: t("api.error.unauthenticated.detail", { defaultValue: "Your session has expired. Please sign in again and retry." }),
        };
    }

    if (status === 403) {
        return {
            title: t("api.error.forbidden.title", { defaultValue: "Access denied" }),
            detail: t("api.error.forbidden.detail", { defaultValue: "You do not have permission to perform this action in the active tenant." }),
        };
    }

    if (status === 409) {
        return {
            title: t("api.error.conflict.title", { defaultValue: "Conflict detected" }),
            detail: message || t("api.error.conflict.detail", { defaultValue: "The data was modified by another user. Please refresh and try again." }),
        };
    }

    return {
        title,
        detail: t("api.error.generic.detail", { defaultValue: "Please try again in a few moments." }),
    };
}
