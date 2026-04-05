// src/Api/Admin/getAdminMenus.ts

export type AdminMenusParams = {
    adCode?: number | string; // optional (if not passed, will use localStorage)
};

export interface AdminMenuItem {
    Id: number;
    PageId: number;
    PageKey: string;
    Icon: string;
    PageName: string;
    Route: string;
    SortOrder: number;
}

interface AdminMenusApiResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string | null; // stringified JSON
}

export const getAdminMenus = async (
    params?: AdminMenusParams
): Promise<AdminMenuItem[]> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    // ✅ take adCode from argument OR localStorage
    const adCode =
        params?.adCode ??
        localStorage.getItem("ADCODE");

    if (!adCode) throw new Error("Admin code not found. Please login again.");

    const query = new URLSearchParams({ adCode: String(adCode) }).toString();

    const res = await fetch(`${baseUrl}/api/Admin/AdminMenus?${query}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
        },
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`AdminMenus failed (${res.status}) ${txt}`);
    }

    const result: AdminMenusApiResponse = await res.json();

    if (!result.responseStatus || !result.data) return [];

    const list: AdminMenuItem[] = JSON.parse(result.data);

    // ✅ sort by SortOrder
    return list.sort((a, b) => a.SortOrder - b.SortOrder);
};
