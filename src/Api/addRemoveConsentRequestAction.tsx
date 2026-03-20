export interface AddConsentRemoveRequestActionResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string | null;
}

export interface AddConsentRemoveRequestActionPayload {
    ResponseId: number | string;
    ConsentActionRemark?: string;
    Status: "Y" | "N"; // ✅ NEW
}

export const addConsentRemoveRequestAction = async (
    payload: AddConsentRemoveRequestActionPayload
): Promise<AddConsentRemoveRequestActionResponse> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
    const apiKey = import.meta.env.VITE_API_KEY as string | undefined;

    const adminCode = localStorage.getItem("ADCODE");
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const formData = new FormData();
    formData.append("ResponseId", String(payload.ResponseId));
    formData.append("ConsentActionRemark", payload.ConsentActionRemark ?? "");

    // ✅ NEW FIELD
    formData.append("Status", payload.Status);

    const response = await fetch(`${baseUrl}/api/Form/addConsentRemoveRequestAction`, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
        body: formData,
    });

    const json = (await response.json()) as AddConsentRemoveRequestActionResponse;

    if (!response.ok) {
        throw new Error(json?.responseMessage || `Request failed: ${response.status}`);
    }

    if (json.responseCode !== 101) {
        throw new Error(json.responseMessage || "Consent action failed");
    }

    return json;
};