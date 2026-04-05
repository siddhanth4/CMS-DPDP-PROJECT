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
    Status: string;   // "Y" | "N"
    FormData: any;    // your form schema object
}

export const addFormData = async (
    payload: AddFormPayload
): Promise<AddFormResponse> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    const adminCode = localStorage.getItem("ADCODE"); // <-- saved after login
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const formData = new FormData();

    formData.append("IPAddress", payload.IPAddress);
    formData.append("Status", payload.Status);

    // 🔥 Important: backend expects string
    formData.append("FormData", JSON.stringify(payload.FormData));

    const response = await fetch(`${baseUrl}/api/Form/addForm`, {
        method: "POST",
        headers: {
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,

        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
};
