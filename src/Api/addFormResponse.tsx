export interface AddFormResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: any;
}

export interface AddFormPayload {
    IPAddress: string;
    Status: "Y" | "N";
    FormId: number | string;
    FormResponse: any;
    MobileNo?: string;
    EmailId?: string;
}

export const addFormResponseData = async (
    payload: AddFormPayload
): Promise<AddFormResponse> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
    const apiKey = import.meta.env.VITE_API_KEY as string | undefined;

    const adminCode = localStorage.getItem("ADCODE"); // <-- saved after login
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const formData = new FormData();
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

    const response = await fetch(`${baseUrl}/api/Home/addFormResponse`, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
        body: formData,
    });

    const json = (await response.json()) as AddFormResponse;

    if (!response.ok) {
        throw new Error(json?.responseMessage || `Request failed: ${response.status}`);
    }

    return json;
};
