// src/Api/Admin/adminLogin.ts

export type AdminLoginPayload = {
    UserName: string;
    Password: string;
};

export type AdminLoginData = {
    adCode: number;
    orgCode: number;
    fullName: string;
    mobileNo: string;
    emailId: string;
    status: "Y" | "N";
};

export type AdminLoginApiResult = {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: AdminLoginData | null;
};

export const adminLogin = async (
    payload: AdminLoginPayload
): Promise<AdminLoginData> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const fd = new FormData();
    fd.append("UserName", payload.UserName);
    fd.append("Password", payload.Password);

    const res = await fetch(`${baseUrl}/api/Admin/AdminLogin`, {
        method: "POST",
        headers: {
            // ✅ don't set Content-Type for FormData
            "X-API-KEY": apiKey,

        },
        body: fd,
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    const result: AdminLoginApiResult = await res.json();

    if (result.responseCode !== 101 || !result.data) {
        throw new Error(result.responseMessage || "Admin login failed");
    }

    return result.data;
};
