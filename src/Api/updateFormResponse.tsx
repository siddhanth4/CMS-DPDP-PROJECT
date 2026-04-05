export interface UpdateFormResponseApi {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: {
        responseId: number;
    } | null;
}

export interface UpdateFormResponsePayload {
    ResponseId: number | string;
    FormId: number | string;
    IPAddress: string;
    Status: "Y" | "N";
    FormResponse: any;
    MobileNo?: string;
    EmailId?: string;
}

export const updateFormResponseData = async (
    payload: UpdateFormResponsePayload
): Promise<UpdateFormResponseApi> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
    const apiKey = import.meta.env.VITE_API_KEY as string | undefined;

    const adminCode = localStorage.getItem("ADCODE");
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const formData = new FormData();
    formData.append("ResponseId", String(payload.ResponseId));
    formData.append("FormId", String(payload.FormId));
    formData.append("IPAddress", payload.IPAddress ?? "");
    formData.append("Status", payload.Status ?? "Y");

    formData.append(
        "FormResponse",
        typeof payload.FormResponse === "string"
            ? payload.FormResponse
            : JSON.stringify(payload.FormResponse ?? {})
    );

    formData.append("MobileNo", payload.MobileNo ?? "");
    formData.append("EmailId", payload.EmailId ?? "");

    const response = await fetch(`${baseUrl}/api/Home/updateFormResponse`, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
        body: formData,
    });

    const json = (await response.json()) as UpdateFormResponseApi;

    if (!response.ok) {
        throw new Error(json?.responseMessage || `Request failed: ${response.status}`);
    }

    if (json.responseCode !== 101) {
        throw new Error(json.responseMessage || "Failed to update form response");
    }

    return json;
};