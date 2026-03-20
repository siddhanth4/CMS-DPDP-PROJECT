import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchGetFormData, type FormsApiResponse, type FormQueryParams } from "../Api/getFormData";
import { getPublicIP } from "../Api/ipAddress";
import { getFormById } from "../Api/getFormDataById";
import type { FormRowParsed } from "../Api/getFormDataById";/* ================= TYPES ================= */
import { getFormResponsesByFormId } from "../Api/getFormResponseById";
import type { FormResponseParsed } from "../Api/getFormResponseById";
import type { AdminLoginData } from "../Api/Admin/adminLogin";
import { useNavigate } from "react-router-dom";
import { getAdminList } from "../Api/Admin/getAdminList";
import { getMenuList, type MenuItem, type MenuListParams } from "../Api/Admin/getMenuList";
import { getAdminMenus, type AdminMenuItem } from "../Api/Admin/getAdminMenuList";
import { getFormResponseByResponseId } from "../Api/getFormResponseByResponseId";
import type { FormResponseByResponseIdParsed } from "../Api/getFormResponseByResponseId";
import {
  fetchConsentRemoveRequestList, type ConsentRemoveRequestApiResponse, type ConsentRemoveRequestQueryParams, type ConsentRemoveRequestRowParsed, type ConsentRemoveRequestRowRaw,
} from "../Api/getConsentRemovalRequestList";
import { getRoleMasterList, type RoleMasterRow, type RoleMasterParams, } from "../Api/Admin/getRoleMasterList";

interface FormRecord {
  Id: number;
  OrgCode: number;
  AdCode: number;
  IPAddress: string;
  FormData: string;
  Status: string;
  CreatedBy: number;
  CreatedOn: string;
  TotalCount: number;
  TotalSubmission: number
}

interface ParsedFormRecord extends Omit<FormRecord, "FormData"> {
  FormData: any; // parsed schema
}
/* ================= ADMIN TYPES ================= */
type AdminAuthData = AdminLoginData;

// ✅ ADMIN LIST TYPES (from getAdminList.ts)
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
  Status: "Y" | "N";
  UpdatedOn: string | null;
  UpdatedBy: number | null;
  TotalCount: number;
}


interface ProjectContextType {

  admin: AdminAuthData | null;
  isAdminAuthenticated: boolean;
  loginAdmin: (data: AdminAuthData) => void;
  logoutAdmin: () => void;
  adminAuthLoading: boolean;
  // ✅ Admin List (Saved)
  adminList: AdminRow[];
  adminsTotal: number;
  adminsLoading: boolean;
  adminsError: string;

  adminParams: AdminListParams;
  setAdminParams: React.Dispatch<React.SetStateAction<AdminListParams>>;
  refreshAdmins: (overrideParams?: Partial<AdminListParams>) => Promise<void>;


  // ✅ Menu List
  menus: MenuItem[];
  menusLoading: boolean;
  menusError: string;

  menuParams: MenuListParams;
  setMenuParams: React.Dispatch<React.SetStateAction<MenuListParams>>;
  refreshMenus: (overrideParams?: Partial<MenuListParams>) => Promise<void>;

  // ✅ AdminMenus (adCode based)
  adminMenus: AdminMenuItem[];
  adminMenusLoading: boolean;
  adminMenusError: string;
  refreshAdminMenus: () => Promise<void>;

  forms: ParsedFormRecord[];
  totalCount: number;
  initialized: boolean;

  loading: boolean;
  error: string;

  params: FormQueryParams;
  setParams: React.Dispatch<React.SetStateAction<FormQueryParams>>;
  refreshForms: (overrideParams?: Partial<FormQueryParams>) => Promise<void>;
  publicIP: string;
  ipLoading: boolean;
  ipError: string;
  refreshIP: () => Promise<void>;

  selectedForm: FormRowParsed | null;
  selectedFormLoading: boolean;
  selectedFormError: string;
  fetchFormById: (id: number) => Promise<void>;

  // ✅ Form Response (Saved)
  formResponses: FormResponseParsed[];
  formResponsesLoading: boolean;
  formResponsesError: string;
  fetchFormResponsesByFormId: (formId: number) => Promise<void>;

  selectedFormResponseById: FormResponseByResponseIdParsed | null;
  selectedFormResponseByIdLoading: boolean;
  selectedFormResponseByIdError: string;
  fetchFormResponseByResponseId: (id: number) => Promise<void>;


  consentRemoveRequests: ConsentRemoveRequestRowParsed[];
  consentRemoveRequestsTotal: number;
  consentRemoveRequestsLoading: boolean;
  consentRemoveRequestsError: string;

  consentRemoveRequestParams: ConsentRemoveRequestQueryParams;
  setConsentRemoveRequestParams: React.Dispatch<React.SetStateAction<ConsentRemoveRequestQueryParams>>;
  refreshConsentRemoveRequests: (
    overrideParams?: Partial<ConsentRemoveRequestQueryParams>
  ) => Promise<void>;

  roles: RoleMasterRow[];
  rolesLoading: boolean;
  rolesError: string;

  roleParams: RoleMasterParams;
  setRoleParams: React.Dispatch<React.SetStateAction<RoleMasterParams>>;
  refreshRoles: (overrideParams?: Partial<RoleMasterParams>) => Promise<void>;

}

/* ================= CONTEXT ================= */

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [admin, setAdmin] = useState<AdminAuthData | null>(null);
  const navigate = useNavigate();
  const [adminAuthLoading, setAdminAuthLoading] = useState(true);
  // ✅ Admin List state
  const [adminList, setAdminList] = useState<AdminRow[]>([]);
  const [adminsTotal, setAdminListTotal] = useState(0);
  const [adminsLoading, setAdminListLoading] = useState(false);
  const [adminsError, setAdminListError] = useState("");

  // ✅ Admin List params
  const [adminParams, setAdminParams] = useState<AdminListParams>({
    status: "Y",
    PageNumber: 1,
    PageSize: 10,
    SortOrder: "DESC",
    SortColumn: "",
    StartDate: "",
    EndDate: "",
    SearchColumn: "",
    SearchString: "",
  });

  // ✅ Menu List state
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [menusError, setMenusError] = useState("");

  const [menuParams, setMenuParams] = useState<MenuListParams>({
    status: "Y",
  });

  // ✅ AdminMenus state
  const [adminMenus, setAdminMenus] = useState<AdminMenuItem[]>([]);
  const [adminMenusLoading, setAdminMenusLoading] = useState(false);
  const [adminMenusError, setAdminMenusError] = useState("");

  const [initialized, setInitialized] = useState(false);

  const [forms, setForms] = useState<ParsedFormRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ IP state
  const [publicIP, setPublicIP] = useState<string>("");
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError] = useState("");


  const [selectedForm, setSelectedForm] = useState<FormRowParsed | null>(null);
  const [selectedFormLoading, setSelectedFormLoading] = useState(false);
  const [selectedFormError, setSelectedFormError] = useState("");


  const [formResponses, setFormResponses] = useState<FormResponseParsed[]>([]);
  const [formResponsesLoading, setFormResponsesLoading] = useState(false);
  const [formResponsesError, setFormResponsesError] = useState("");


  const [selectedFormResponseById, setSelectedFormResponseById] = useState<FormResponseByResponseIdParsed | null>(null);
  const [selectedFormResponseByIdLoading, setSelectedFormResponseByIdLoading] = useState(false);
  const [selectedFormResponseByIdError, setSelectedFormResponseByIdError] = useState("");

  const [roles, setRoles] = useState<RoleMasterRow[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState("");

  const [roleParams, setRoleParams] = useState<RoleMasterParams>({
    status: "Y",
  });

  const [consentRemoveRequests, setConsentRemoveRequests] = useState<ConsentRemoveRequestRowParsed[]>([]);
  const [consentRemoveRequestsTotal, setConsentRemoveRequestsTotal] = useState(0);
  const [consentRemoveRequestsLoading, setConsentRemoveRequestsLoading] = useState(false);
  const [consentRemoveRequestsError, setConsentRemoveRequestsError] = useState("");

  const [consentRemoveRequestParams, setConsentRemoveRequestParams] =
    useState<ConsentRemoveRequestQueryParams>({
      status: "",
      pageNumber: 1,
      pageSize: 10,
      sortOrder: "DESC",
      sortColumn: "",
      startDate: "",
      endDate: "",
      searchColumn: "",
      searchString: "",
    });

  // restore admin on refresh (same as ORG)
  useEffect(() => {
    const stored = localStorage.getItem("ADMIN_LOGIN");
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch {
        localStorage.removeItem("ADMIN_LOGIN");
      }
    }
    setAdminAuthLoading(false); // ✅ always stop loading
  }, []);


  // ✅ login/logout functions (same like your org context)
  const loginAdmin = (data: AdminAuthData) => {
    localStorage.setItem("ADMIN_LOGIN", JSON.stringify(data));
    localStorage.setItem("ADCODE", String(data.adCode));
    localStorage.setItem("ORG_CODE", String(data.orgCode));
    setAdmin(data);
  };

  const logoutAdmin = () => {
    localStorage.removeItem("ADMIN_LOGIN");
    localStorage.removeItem("ADCODE");
    localStorage.removeItem("ORG_CODE");
    setAdmin(null);

    setAdminMenus([]);          // ✅ clear immediately
    setAdminMenusError("");
    setAdminMenusLoading(false);

    navigate("/admin/AdminLogin");
  };



  // ✅ keep query params in context (so UI can change page/search/sort)
  const [params, setParams] = useState<FormQueryParams>({
    status: "Y",
    pageNumber: 1,
    pageSize: 10,
    sortOrder: "DESC",
    sortColumn: "",
    startDate: "",
    endDate: "",
    searchColumn: "",
    searchString: "",
  });


  const loadMenus = async (p: MenuListParams) => {
    // ✅ Don't call API again if already loaded
    if (menus.length > 0) return;

    try {
      setMenusLoading(true);
      setMenusError("");

      const list = await getMenuList(p);
      setMenus(list);
    } catch (err: any) {
      setMenus([]);
      setMenusError(err?.message || "Failed to fetch menu list");
    } finally {
      setMenusLoading(false);
    }
  };

  const refreshMenus = async (overrideParams?: Partial<MenuListParams>) => {
    const next = { ...menuParams, ...(overrideParams || {}) };
    setMenuParams(next);

    // ✅ only fetch when menus are empty (first time)
    if (menus.length === 0) {
      await loadMenus(next);
    }
  };

  useEffect(() => {
    // ✅ load menus only after admin login/restore
    if (!admin) return;
    if (menus.length > 0) return;

    loadMenus(menuParams);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]); // 👈 only runs when admin becomes available


  // ✅ Load adminMenus for current admin (adCode)
  const loadAdminMenus = async (adCode?: number | string) => {
    if (!adCode) {
      setAdminMenus([]);
      return;
    }

    try {
      setAdminMenusLoading(true);
      setAdminMenusError("");

      const list = await getAdminMenus({ adCode }); // ✅ always use latest adCode
      setAdminMenus(list);
    } catch (err: any) {
      setAdminMenus([]);
      setAdminMenusError(err?.message || "Failed to fetch admin menus");
    } finally {
      setAdminMenusLoading(false);
    }
  };

  // ✅ Auto refresh when login changes (adCode changes)
  useEffect(() => {
    const adCode = admin?.adCode; // from ADMIN_LOGIN object

    if (!adCode) {
      setAdminMenus([]); // logout / no admin
      return;
    }

    // clear old menus (important when switching admin)
    setAdminMenus([]);
    loadAdminMenus(adCode);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin?.adCode]);

  // ✅ Manual refresh (force reload)
  const refreshAdminMenus = async () => {
    const adCode = admin?.adCode ?? localStorage.getItem("ADCODE");
    setAdminMenus([]);
    await loadAdminMenus(adCode ?? undefined);
  };


  // ✅ fetch IP once (or whenever needed)
  const refreshIP = async () => {
    try {
      setIpLoading(true);
      setIpError("");
      const ip = await getPublicIP();
      setPublicIP(ip);
    } catch (err: any) {
      setPublicIP("");
      setIpError(err?.message || "Failed to fetch IP");
    } finally {
      setIpLoading(false);
    }
  };

  const loadAdmins = async (p: AdminListParams) => {
    try {
      setAdminListLoading(true);
      setAdminListError("");

      const { rows, total } = await getAdminList(p);

      setAdminList(rows);
      setAdminListTotal(total);
    } catch (err: any) {
      setAdminList([]);
      setAdminListTotal(0);
      setAdminListError(err?.message || "Failed to fetch admin list");
    } finally {
      setAdminListLoading(false);
    }
  };

  // ✅ refresh with optional override params (same pattern)
  const refreshAdmins = async (overrideParams?: Partial<AdminListParams>) => {
    const next = { ...adminParams, ...(overrideParams || {}) };
    setAdminParams(next);
    await loadAdmins(next);
  };


  const loadForms = async (p: FormQueryParams) => {
    try {
      setLoading(true);
      setError("");

      const result: FormsApiResponse = await fetchGetFormData(p);

      if (result.responseCode === 101) {
        const parsedMain: FormRecord[] = result.data ? JSON.parse(result.data) : [];

        const parsedForms: ParsedFormRecord[] = parsedMain.map((item) => {
          let schema: any = null;
          try {
            schema = item.FormData ? JSON.parse(item.FormData) : null;
          } catch {
            schema = null; // if FormData JSON is broken
          }

          return { ...item, FormData: schema };
        });

        setForms(parsedForms);

        // ✅ total count: take from first row if backend puts TotalCount there
        setTotalCount(parsedMain?.[0]?.TotalCount ?? result.noOfRecord ?? 0);
      } else {
        setForms([]);
        setTotalCount(0);
        setError(result.responseMessage || "Something went wrong");
      }
    } catch (err: any) {
      setForms([]);
      setTotalCount(0);
      setError(err?.message || "Failed to fetch forms");
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  // ✅ refresh with optional override params
  const refreshForms = async (overrideParams?: Partial<FormQueryParams>) => {
    const next = { ...params, ...(overrideParams || {}) };
    setParams(next);           // keep params synced
    await loadForms(next);     // fetch with merged params
  };

  const fetchFormById = async (id: number) => {
    try {
      setSelectedFormLoading(true);
      setSelectedFormError("");

      const data = await getFormById(id);

      if (!data) {
        setSelectedForm(null);
        setSelectedFormError("Form not found");
        return;
      }

      setSelectedForm(data);
    } catch (err: any) {
      setSelectedForm(null);
      setSelectedFormError(err?.message || "Failed to load form");
    } finally {
      setSelectedFormLoading(false);
    }
  };

  const fetchFormResponsesByFormId = async (formId: number) => {
    try {
      setFormResponsesLoading(true);
      setFormResponsesError("");

      const data = await getFormResponsesByFormId(formId);
      setFormResponses(data);
    } catch (err: any) {
      setFormResponses([]);
      setFormResponsesError(err?.message || "Failed to load responses");
    } finally {
      setFormResponsesLoading(false);
    }
  };


  const fetchFormResponseByResponseId = async (id: number) => {
    try {
      setSelectedFormResponseByIdLoading(true);
      setSelectedFormResponseByIdError("");

      const data = await getFormResponseByResponseId(id);

      if (!data) {
        setSelectedFormResponseById(null);
        setSelectedFormResponseByIdError("Form response not found");
        return;
      }

      setSelectedFormResponseById(data);
    } catch (err: any) {
      setSelectedFormResponseById(null);
      setSelectedFormResponseByIdError(err?.message || "Failed to load form response");
    } finally {
      setSelectedFormResponseByIdLoading(false);
    }
  };


  const loadConsentRemoveRequests = async (p: ConsentRemoveRequestQueryParams) => {
    try {
      setConsentRemoveRequestsLoading(true);
      setConsentRemoveRequestsError("");

      const result: ConsentRemoveRequestApiResponse =
        await fetchConsentRemoveRequestList(p);

      if (result.responseCode === 101) {
        const parsedMain: ConsentRemoveRequestRowRaw[] = result.data
          ? JSON.parse(result.data)
          : [];

        const parsedRows: ConsentRemoveRequestRowParsed[] = parsedMain.map((item) => {
          let parsedFormResponse: any = null;

          try {
            parsedFormResponse = item.FormResponse
              ? JSON.parse(item.FormResponse)
              : null;
          } catch {
            parsedFormResponse = null;
          }

          return {
            ...item,
            FormResponse: parsedFormResponse,
          };
        });

        setConsentRemoveRequests(parsedRows);
        setConsentRemoveRequestsTotal(
          parsedMain?.[0]?.TotalCount ?? result.noOfRecord ?? 0
        );
      } else {
        setConsentRemoveRequests([]);
        setConsentRemoveRequestsTotal(0);
        setConsentRemoveRequestsError(result.responseMessage || "Something went wrong");
      }
    } catch (err: any) {
      setConsentRemoveRequests([]);
      setConsentRemoveRequestsTotal(0);
      setConsentRemoveRequestsError(
        err?.message || "Failed to fetch consent remove requests"
      );
    } finally {
      setConsentRemoveRequestsLoading(false);
    }
  };

  const refreshConsentRemoveRequests = async (
    overrideParams?: Partial<ConsentRemoveRequestQueryParams>
  ) => {
    const next = {
      ...consentRemoveRequestParams,
      ...(overrideParams || {}),
    };

    setConsentRemoveRequestParams(next);
    await loadConsentRemoveRequests(next);
  };

  const loadRoles = async (p: RoleMasterParams) => {
    if (roles.length > 0) return;

    try {
      setRolesLoading(true);
      setRolesError("");

      const list = await getRoleMasterList(p);
      setRoles(list);
    } catch (err: any) {
      setRoles([]);
      setRolesError(err?.message || "Failed to fetch role master list");
    } finally {
      setRolesLoading(false);
    }
  };

  const refreshRoles = async (overrideParams?: Partial<RoleMasterParams>) => {
    const next = { ...roleParams, ...(overrideParams || {}) };
    setRoleParams(next);

    try {
      setRolesLoading(true);
      setRolesError("");

      const list = await getRoleMasterList(next);
      setRoles(list);
    } catch (err: any) {
      setRoles([]);
      setRolesError(err?.message || "Failed to fetch role master list");
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    refreshIP();
    loadForms(params);
    loadAdmins(adminParams);
    loadRoles(roleParams);
    // loadConsentRemoveRequests(consentRemoveRequestParams);
  }, []);



  const value = useMemo<ProjectContextType>(
    () => ({

      admin,
      isAdminAuthenticated: !!admin,
      loginAdmin,
      logoutAdmin,
      adminAuthLoading,

      adminList,
      adminsTotal,
      adminsLoading,
      adminsError,
      adminParams,
      setAdminParams,
      refreshAdmins,

      menus,
      menusLoading,
      menusError,
      menuParams,
      setMenuParams,
      refreshMenus,

      adminMenus,
      adminMenusLoading,
      adminMenusError,
      refreshAdminMenus,

      forms,
      totalCount,
      loading,
      initialized,
      error,
      params,
      setParams,
      refreshForms,

      publicIP,
      ipLoading,
      ipError,
      refreshIP,

      // ✅ NEW
      selectedForm,
      selectedFormLoading,
      selectedFormError,
      fetchFormById,

      formResponses,
      formResponsesLoading,
      formResponsesError,
      fetchFormResponsesByFormId,

      selectedFormResponseById,
      selectedFormResponseByIdLoading,
      selectedFormResponseByIdError,
      fetchFormResponseByResponseId,

      consentRemoveRequests,
      consentRemoveRequestsTotal,
      consentRemoveRequestsLoading,
      consentRemoveRequestsError,
      consentRemoveRequestParams,
      setConsentRemoveRequestParams,
      refreshConsentRemoveRequests,

      roles,
      rolesLoading,
      rolesError,
      roleParams,
      setRoleParams,
      refreshRoles,

    }),
    [
      admin,
      adminList,
      adminsTotal,
      adminsLoading,
      adminsError,
      adminParams,
      adminAuthLoading,

      menus,
      menusLoading,
      menusError,
      menuParams,

      adminMenus,
      adminMenusLoading,
      adminMenusError,

      forms,
      totalCount,
      loading,
      initialized,
      error,
      params,
      publicIP,
      ipLoading,
      ipError,
      selectedForm,
      selectedFormLoading,
      selectedFormError,

      selectedFormResponseById,
      selectedFormResponseByIdLoading,
      selectedFormResponseByIdError,

      consentRemoveRequests,
      consentRemoveRequestsTotal,
      consentRemoveRequestsLoading,
      consentRemoveRequestsError,
      consentRemoveRequestParams,

      roles,
      rolesLoading,
      rolesError,
      roleParams,
    ]
  );


  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

/* ================= HOOK ================= */

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used inside ProjectProvider");
  return context;
};
