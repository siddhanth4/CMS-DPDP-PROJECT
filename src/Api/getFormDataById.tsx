export interface GetFormApiResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string | null; // NOTE: backend sends JSON string
}

export interface FormRowRaw {
    Id: number;
    OrgCode: number;
    AdCode: number;
    IPAddress: string;
    FormData: string;     // NOTE: backend sends JSON string
    Status: "Y" | "N";
    CreatedBy: number;
    CreatedOn?: string;
}

export interface FormRowParsed extends Omit<FormRowRaw, "FormData"> {
    FormData: any; // parsed JSON object
}

export const getFormById = async (id: number): Promise<FormRowParsed | null> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    const adminCode = localStorage.getItem("ADCODE"); // <-- saved after login
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const res = await fetch(`${baseUrl}/api/Form/getForm?id=${id}`, {
        method: "GET",
        headers: {
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    const result: GetFormApiResponse = await res.json();

    if (result.responseCode !== 101) {
        throw new Error(result.responseMessage || "API failed");
    }

    const rows: FormRowRaw[] = result.data ? JSON.parse(result.data) : [];
    if (!rows.length) return null;

    const first = rows[0];

    let schema: any = null;
    try {
        schema = first.FormData ? JSON.parse(first.FormData) : null;
    } catch {
        schema = null;
    }

    return { ...first, FormData: schema };
};
