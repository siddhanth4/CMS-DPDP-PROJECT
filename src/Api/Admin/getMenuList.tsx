export type MenuListParams = {
    status: "Y" | "N";
};

export interface MenuItem {
    Id: number;
    PageKey: string;
    Icon: string;
    PageName: string;
    Route: string;
    SortOrder: number;
    Status: "Y" | "N";
    TTime: string;
}

interface MenuListApiResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string | null; // ⚠️ stringified JSON
}

export const getMenuList = async (
    params: MenuListParams
): Promise<MenuItem[]> => {
    try {
        const query = new URLSearchParams({
            status: params.status,
        }).toString();

        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/Admin/MenuList?${query}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-KEY": import.meta.env.VITE_API_KEY,

                },
            }
        );

        const result: MenuListApiResponse = await response.json();

        if (!result.responseStatus || !result.data) {
            return [];
        }

        // ✅ Parse stringified JSON
        const parsed: MenuItem[] = JSON.parse(result.data);

        // ✅ Sort by SortOrder (just in case)
        return parsed.sort((a, b) => a.SortOrder - b.SortOrder);
    } catch (error) {
        console.error("MenuList API Error:", error);
        return [];
    }
};
