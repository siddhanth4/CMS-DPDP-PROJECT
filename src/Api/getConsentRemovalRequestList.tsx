export interface ConsentRemoveRequestApiResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string | null; // backend returns stringified JSON
}

export interface ConsentRemoveRequestQueryParams {
    status?: string;
    pageNumber?: number;
    pageSize?: number;
    sortColumn?: string;
    sortOrder?: "ASC" | "DESC";
    startDate?: string;
    endDate?: string;
    searchColumn?: string;
    searchString?: string;
}

export interface ConsentRemoveRequestRowRaw {
    Id: number;
    FormId: number;
    IPAddress: string;
    MobileNo: string;
    EmailId: string;
    FormResponse: string; // stringified JSON
    Status: "Y" | "N";
    CreatedOn?: string;
    Consent: "Y" | "N";
    ConsentResolved: "Y" | "N";
    TotalCount?: number;
}

export interface ConsentRemoveRequestRowParsed
    extends Omit<ConsentRemoveRequestRowRaw, "FormResponse"> {
    FormResponse: any;
}

export const fetchConsentRemoveRequestList = async (
    params: ConsentRemoveRequestQueryParams
): Promise<ConsentRemoveRequestApiResponse> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    const adminCode = localStorage.getItem("ADCODE");
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const query = new URLSearchParams({
        status: params.status ?? "",
        PageNumber: String(params.pageNumber ?? 1),
        PageSize: String(params.pageSize ?? 10),
        SortColumn: params.sortColumn ?? "",
        SortOrder: params.sortOrder ?? "DESC",
        StartDate: params.startDate ?? "",
        EndDate: params.endDate ?? "",
        SearchColumn: params.searchColumn ?? "",
        SearchString: params.searchString ?? "",
    });

    const url = `${baseUrl}/api/Form/ConsentRemoveRequestList?${query.toString()}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch consent remove request list");
    }

    return response.json();
};