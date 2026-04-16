type QueryValue = string | number | boolean | Array<string | number> | undefined | null;

export const syncMasterDataQuery = (params: Record<string, QueryValue>) => {
    const url = new URL(window.location.href);
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || value === false) {
            return;
        }

        if (Array.isArray(value)) {
            value
                .map((item) => String(item).trim())
                .filter((item) => item !== "")
                .forEach((item) => searchParams.append(key, item));

            return;
        }

        searchParams.set(key, String(value));
    });

    const queryString = searchParams.toString();
    const nextUrl = `${url.pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.replaceState(window.history.state, "", nextUrl);
};
