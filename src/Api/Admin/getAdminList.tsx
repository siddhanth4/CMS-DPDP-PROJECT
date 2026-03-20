// src/Api/Admin/getAdminList.ts

export type AdminListParams = {
    status: "Y" | "N";
    PageNumber: number;
    PageSize: number;
    SortColumn?: string;
    SortOrder?: "ASC" | "DESC";
    StartDate?: string;
    EndDate?: string;
    SearchColumn?: string;
    SearchString?: string;
};

export interface AdminRow {
    Id: number;
    TTime: string;
    AdCode: number;
    OrgCode: number;
    Username: string;
    FullName: string;
    MobileNo: string;
    EmailId: string | null;
    Address: string;
    TType: string;
    RoleId: number; // ✅ add this
    Status: "Y" | "N";
    UpdatedOn: string | null;
    UpdatedBy: number | null;
    TotalCount: number;
}

interface AdminListApiResponse {
    responseCode: number;
    responseStatus: boolean;
    responseErrorType: string;
    responseMessage: string;
    noOfRecord: number;
    data: string | null;
}

export const getAdminList = async (
    params: AdminListParams
): Promise<{ rows: AdminRow[]; total: number }> => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
    if (!apiKey) throw new Error("Missing VITE_API_KEY");

    const adminCode = localStorage.getItem("ADCODE");
    if (!adminCode) throw new Error("Admin code not found. Please login again.");

    const query = new URLSearchParams({
        status: params.status,
        PageNumber: String(params.PageNumber),
        PageSize: String(params.PageSize),
        SortColumn: params.SortColumn ?? "",
        SortOrder: params.SortOrder ?? "DESC",
        StartDate: params.StartDate ?? "",
        EndDate: params.EndDate ?? "",
        SearchColumn: params.SearchColumn ?? "",
        SearchString: params.SearchString ?? "",
    });

    const res = await fetch(`${baseUrl}/api/Admin/AdminList?${query.toString()}`, {
        method: "GET",
        headers: {
            "X-API-KEY": apiKey,
            "X-ADMIN-CODE": adminCode,
        },
    });

    if (!res.ok) throw new Error(`Request failed: ${res.status}`);

    const result: AdminListApiResponse = await res.json();

    if (result.responseCode !== 101) {
        throw new Error(result.responseMessage || "Failed to fetch admin list");
    }

    const parsed: AdminRow[] = result.data ? JSON.parse(result.data) : [];

    return {
        rows: parsed,
        total: parsed?.[0]?.TotalCount ?? result.noOfRecord ?? 0,
    };
};