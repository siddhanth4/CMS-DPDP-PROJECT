// src/Api/Organization/organizationLogin.ts

export type OrgLoginPayload = {
    UserName: string;
    Password: string;
};

export type OrgLoginData = {
    orgCode: number;
    orgName: string;
    ownerName: string;
    mobileNo: string;
    status: "Y" | "N";
};

export type OrgLoginApiResult = {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: OrgLoginData | null;
};

export const organizationLogin = async (
    payload: OrgLoginPayload
): Promise<OrgLoginData> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const fd = new FormData();
    fd.append("UserName", payload.UserName);
    fd.append("Password", payload.Password);

    const res = await fetch(`${baseUrl}/api/Organization/organizationLogin`, {
        method: "POST",
        headers: {
            // ✅ DO NOT set Content-Type here (browser will set boundary)
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": "2",
        },
        body: fd,
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    const result: OrgLoginApiResult = await res.json();

    if (result.responseCode !== 101 || !result.data) {
        throw new Error(result.responseMessage || "Login failed");
    }

    return result.data;
};
