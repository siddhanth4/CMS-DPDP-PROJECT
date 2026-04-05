export interface AddUpdateAdminPayload {
    AdCode?: number;
    MobileNo: string;
    FullName: string;
    AdminUsername: string;
    AdminPassword: string;
    Status: "Y" | "N";
    Type: string;
    EmailId: string;
    Address: string;
    RoleId: number; // ✅ NEW
    MenusJson?: string;
}

interface AddUpdateAdminResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: {
        // orgCode: number;
        adCode: number;
    };
}

export const addUpdateAdmin = async (
    payload: AddUpdateAdminPayload
): Promise<AddUpdateAdminResponse> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const adminCode = localStorage.getItem("ADCODE"); // <-- saved after login
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    const res = await fetch(`${baseUrl}/api/Admin/addUpdateAdmin`, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
        body: formData,
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`addUpdateAdmin failed (${res.status}) ${txt}`);
    }

    const result: AddUpdateAdminResponse = await res.json();

    if (!result.responseStatus) {
        throw new Error(result.responseMessage || "Operation failed");
    }

    return result;
};
