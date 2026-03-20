export type OrganizationRow = {
    Id: number;
    TTime: string;
    OrgCode: number;
    TType: string;
    Username: string;
    Mpwd: string;
    OwnerName: string;
    MobileNo: string;
    OrgName: string;
    LogoImg: string;
    Status: "Y" | "N";
    Address: string;
    Area: string;
    City: string;
    State: string;
    PinCode: string;
    TotalCount: number;
};

export type OrganizationApiResult = {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string; // stringified JSON array
};

export type OrganizationQueryParams = {
    status?: string;
    PageNumber?: number;
    PageSize?: number;
    SortColumn?: string;
    SortOrder?: "ASC" | "DESC";
    StartDate?: string;
    EndDate?: string;
    SearchColumn?: string;
    SearchString?: string;
};

export const getOrganizations = async (
    params: OrganizationQueryParams
): Promise<{ rows: OrganizationRow[]; total: number }> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const query = new URLSearchParams({
        status: params.status ?? "Y",
        PageNumber: String(params.PageNumber ?? 1),
        PageSize: String(params.PageSize ?? 10),
        SortColumn: params.SortColumn ?? "",
        SortOrder: params.SortOrder ?? "DESC",
        StartDate: params.StartDate ?? "",
        EndDate: params.EndDate ?? "",
        SearchColumn: params.SearchColumn ?? "",
        SearchString: params.SearchString ?? "",
    });

    const res = await fetch(`${baseUrl}/api/Organization/organizations?${query.toString()}`, {
        method: "GET",
        headers: {
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": "2",
        },
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    const result: OrganizationApiResult = await res.json();

    if (result.responseCode !== 101) {
        throw new Error(result.responseMessage || "Failed to fetch organizations");
    }

    const rows: OrganizationRow[] = result.data ? JSON.parse(result.data) : [];

    // total records for pagination (prefer TotalCount if backend provides it)
    const total =
        rows.length > 0 && typeof rows[0].TotalCount === "number"
            ? rows[0].TotalCount
            : result.noOfRecord ?? rows.length;

    return { rows, total };
};
