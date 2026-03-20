export interface RoleMasterApiResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string | null;
}

export interface RoleMasterRow {
    Id: number;
    Role: string;
    Status: "Y" | "N";
    CreatedOn?: string;
}

export interface RoleMasterParams {
    status?: "Y" | "N" | "";
}

export const getRoleMasterList = async (
    params: RoleMasterParams = {}
): Promise<RoleMasterRow[]> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    const adminCode = localStorage.getItem("ADCODE");
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const query = new URLSearchParams({
        status: params.status ?? "Y",
    });

    const response = await fetch(`${baseUrl}/api/Admin/RoleMasterList?${query.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch role master list");
    }

    const result: RoleMasterApiResponse = await response.json();

    if (result.responseCode !== 101) {
        throw new Error(result.responseMessage || "Failed to fetch role master list");
    }

    return result.data ? JSON.parse(result.data) : [];
};