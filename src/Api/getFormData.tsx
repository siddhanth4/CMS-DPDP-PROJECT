export interface FormsApiResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string; // NOTE: backend returns stringified JSON
}

export interface FormQueryParams {
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


export const fetchGetFormData = async (
    params: FormQueryParams
): Promise<FormsApiResponse> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    const adminCode = localStorage.getItem("ADCODE"); // <-- saved after login
    if (!adminCode) throw new Error("Admin code not found. Please login again.");


    const query = new URLSearchParams({
        status: params.status ?? "Y",
        PageNumber: String(params.pageNumber ?? 1),
        PageSize: String(params.pageSize ?? 10),
        SortColumn: params.sortColumn ?? "",
        SortOrder: params.sortOrder ?? "DESC",
        StartDate: params.startDate ?? "",
        EndDate: params.endDate ?? "",
        SearchColumn: params.searchColumn ?? "",
        SearchString: params.searchString ?? "",
    });

    const url = `${baseUrl}/api/Form/Forms?${query.toString()}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch forms");
    }

    return response.json();
};

