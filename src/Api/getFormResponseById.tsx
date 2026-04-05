// Api/getFormResponsesByFormId.ts
export interface GetFormResponseApiResult {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string | null;
}

export interface FormResponseRaw {
    Id: number;
    FormId: number;
    IPAddress: string;
    MobileNo: string;
    EmailId: string;
    FormResponse: string;
    Status: "Y" | "N";
    CreatedOn: string;
}

export interface FormResponseParsed extends Omit<FormResponseRaw, "FormResponse"> {
    FormResponse: any;
}

export const getFormResponsesByFormId = async (formId: number): Promise<FormResponseParsed[]> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    const adminCode = localStorage.getItem("ADCODE"); // <-- saved after login
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const res = await fetch(`${baseUrl}/api/Form/FormsResponseListByFormId?FormId=${formId}`, {
        method: "GET",
        headers: {
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    const result: GetFormResponseApiResult = await res.json();

    if (result.responseCode !== 101) {
        throw new Error(result.responseMessage || "API failed");
    }

    const rows: FormResponseRaw[] = result.data ? JSON.parse(result.data) : [];

    return rows.map((r) => {
        let parsed: any = r.FormResponse;
        try {
            parsed = typeof r.FormResponse === "string" ? JSON.parse(r.FormResponse) : r.FormResponse;
        } catch {
            parsed = r.FormResponse;
        }
        return { ...r, FormResponse: parsed };
    });
};
