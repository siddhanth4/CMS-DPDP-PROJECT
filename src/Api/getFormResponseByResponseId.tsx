export interface GetFormResponseByResponseIdApiResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string | null; // backend sends JSON string
}

export interface FormResponseRowRaw {
    Id: number;
    FormId: number;
    IPAddress: string;
    MobileNo: string;
    EmailId: string;
    FormResponse: string; // backend sends JSON string
    Status: "Y" | "N";
    CreatedOn?: string;
}

export interface FormResponseByResponseIdParsed extends Omit<FormResponseRowRaw, "FormResponse"> {
    FormResponse: any; // parsed JSON object
}

export const getFormResponseByResponseId = async (
    id: number
): Promise<FormResponseByResponseIdParsed | null> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    const adminCode = localStorage.getItem("ADCODE");
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const res = await fetch(`${baseUrl}/api/Form/getFormResponseById?Id=${id}`, {
        method: "GET",
        headers: {
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
    });

    if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
    }

    const result: GetFormResponseByResponseIdApiResponse = await res.json();

    if (result.responseCode !== 101) {
        throw new Error(result.responseMessage || "API failed");
    }

    const rows: FormResponseRowRaw[] = result.data ? JSON.parse(result.data) : [];
    if (!rows.length) return null;

    const first = rows[0];

    let parsedResponse: any = null;
    try {
        parsedResponse = first.FormResponse ? JSON.parse(first.FormResponse) : null;
    } catch {
        parsedResponse = null;
    }

    return {
        ...first,
        FormResponse: parsedResponse,
    };
};