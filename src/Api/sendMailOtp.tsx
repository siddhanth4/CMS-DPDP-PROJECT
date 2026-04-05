export interface SendOtpMailResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: any;
}

export type SendOtpMailPayload = {
    ToEmail: string;
    OTP: string;              // "741852"
    ExpiryMinutes?: number;   // default 5
};

export const sendOtpMail = async (
    payload: SendOtpMailPayload
): Promise<SendOtpMailResponse> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    // if your backend requires admin header for this API also
    const adminCode = localStorage.getItem("ADCODE");
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const formData = new FormData();
    formData.append("ToEmail", payload.ToEmail);
    formData.append("OTP", payload.OTP);
    formData.append("ExpiryMinutes", String(payload.ExpiryMinutes ?? 5));

    const res = await fetch(`${baseUrl}/api/Form/SendOTPMail`, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey,

            // ❌ don't set Content-Type when using FormData
        },
        body: formData,
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    const json: SendOtpMailResponse = await res.json();

    // if API returns responseCode != 101 treat as error
    if (json.responseCode !== 101) {
        throw new Error(json.responseMessage || "OTP mail failed");
    }

    return json;
};