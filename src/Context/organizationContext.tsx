import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrganizations } from "../Api/Organization/getOrganizationList";
import type { OrganizationRow } from "../Api/Organization/getOrganizationList";

interface OrgLoginData {
    orgCode: number;
    [key: string]: any;
}

type SortOrder = "ASC" | "DESC";

type OrgListParams = {
    status: "Y" | "N";
    page: number;
    pageSize: number;
    sortColumn: string; // backend column name
    sortOrder: SortOrder;
    searchString: string;
    searchColumn: string; // optional if backend uses it
    startDate?: string;
    endDate?: string;
};

interface OrganizationAuthContextType {
    org: OrgLoginData | null;
    isAuthenticated: boolean;
    authLoading: boolean;
    // auth
    login: (data: OrgLoginData) => void;
    logout: () => void;

    // list data
    organizations: OrganizationRow[];
    totalOrganizations: number;
    orgLoading: boolean;
    orgError: string;

    // params
    params: OrgListParams;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setSearchString: (value: string) => void;
    setStatus: (value: "Y" | "N") => void;
    toggleSort: (column: string) => void;

    fetchOrganizations: () => Promise<void>;
}

const OrganizationAuthContext = createContext<OrganizationAuthContextType | undefined>(undefined);

export const OrganizationAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();

    // ---------- AUTH ----------
    const [org, setOrg] = useState<OrgLoginData | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    useEffect(() => {
        const stored = localStorage.getItem("ORG_LOGIN");
        if (stored) setOrg(JSON.parse(stored));
        setAuthLoading(false);
    }, []);

    const login = (data: OrgLoginData) => {
        localStorage.setItem("ORG_LOGIN", JSON.stringify(data));
        localStorage.setItem("ORG_CODE", String(data.orgCode));
        setOrg(data);
    };

    const logout = () => {
        localStorage.removeItem("ORG_LOGIN");
        localStorage.removeItem("ORG_CODE");
        setOrg(null);
        navigate("/organization/organizationLogin");
    };

    // ---------- LIST STATE ----------
    const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
    const [totalOrganizations, setTotalOrganizations] = useState(0);
    const [orgLoading, setOrgLoading] = useState(false);
    const [orgError, setOrgError] = useState("");

    // ---------- LIST PARAMS ----------
    const [params, setParams] = useState<OrgListParams>({
        status: "Y",
        page: 1,
        pageSize: 10,
        sortColumn: "TTime", // change if backend needs different default
        sortOrder: "DESC",
        searchString: "",
        searchColumn: "",
    });

    const setPage = (page: number) => setParams((p) => ({ ...p, page }));
    const setPageSize = (size: number) => setParams((p) => ({ ...p, pageSize: size, page: 1 }));
    const setSearchString = (value: string) => setParams((p) => ({ ...p, searchString: value, page: 1 }));
    const setStatus = (value: "Y" | "N") => setParams((p) => ({ ...p, status: value, page: 1 }));

    const toggleSort = (column: string) => {
        setParams((p) => {
            if (p.sortColumn === column) {
                return { ...p, sortOrder: p.sortOrder === "ASC" ? "DESC" : "ASC", page: 1 };
            }
            return { ...p, sortColumn: column, sortOrder: "ASC", page: 1 };
        });
    };

    const fetchOrganizations = async () => {
        try {
            setOrgError("");
            setOrgLoading(true);

            const result = await getOrganizations({
                status: params.status,
                PageNumber: params.page,
                PageSize: params.pageSize,
                SortColumn: params.sortColumn,
                SortOrder: params.sortOrder,
                SearchColumn: params.searchColumn,
                SearchString: params.searchString,
                StartDate: params.startDate ?? "",
                EndDate: params.endDate ?? "",
            });

            setOrganizations(result.rows);
            setTotalOrganizations(result.total);
        } catch (e: any) {
            setOrgError(e?.message || "Failed to fetch organizations");
            setOrganizations([]);
            setTotalOrganizations(0);
        } finally {
            setOrgLoading(false);
        }
    };

    // fetch whenever params change (page/search/sort)
    useEffect(() => {
        fetchOrganizations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.status, params.page, params.pageSize, params.sortColumn, params.sortOrder, params.searchString, params.searchColumn, params.startDate, params.endDate]);

    const value = useMemo(
        () => ({
            org,
            isAuthenticated: !!org,
            authLoading,
            login,
            logout,
            organizations,
            totalOrganizations,
            orgLoading,
            orgError,
            params,
            setPage,
            setPageSize,
            setSearchString,
            setStatus,
            toggleSort,
            fetchOrganizations,
        }),
        [org, authLoading, organizations, totalOrganizations, orgLoading, orgError, params]
    );

    return <OrganizationAuthContext.Provider value={value}>{children}</OrganizationAuthContext.Provider>;
};

export const useOrganizationAuth = () => {
    const ctx = useContext(OrganizationAuthContext);
    if (!ctx) throw new Error("useOrganizationAuth must be used within OrganizationAuthProvider");
    return ctx;
};
