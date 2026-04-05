import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "bootstrap";
import { useProject } from "../Context/projectContext";
import { Skeleton } from "../Components/loader";
import { addUpdateAdmin, type AddUpdateAdminPayload } from "../Api/Admin/addUpdateAdmin";
import { PopupAlert } from "../Components/alert";
import { getAdminMenus } from "../Api/Admin/getAdminMenuList";

/* ================= TYPES ================= */

type PermissionRow = {
    pageId: number;
    key: string;
    label: string;
    enabled: boolean;
    route?: string;
    icon?: string;
};

const AdminTableSkeleton = ({ rows = 8 }: { rows?: number }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i}>
                    <td>
                        <div className="d-flex align-items-center gap-3">
                            <Skeleton width={36} height={36} radius={18} />
                            <div style={{ width: "100%" }}>
                                <Skeleton width="60%" height={14} />
                                <div style={{ height: 6 }} />
                                <Skeleton width="35%" height={12} />
                            </div>
                        </div>
                    </td>

                    <td><Skeleton width="70%" height={14} /></td>
                    <td><Skeleton width="75%" height={14} /></td>
                    <td><Skeleton width="80%" height={14} /></td>
                    <td><Skeleton width="55%" height={14} /></td>
                    <td><Skeleton width={70} height={18} radius={999} /></td>

                    <td className="text-end">
                        <div className="d-inline-flex gap-2">
                            <Skeleton width={78} height={30} radius={10} />
                            <Skeleton width={88} height={30} radius={10} />
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
};

type RangeFilter = "All" | "Today" | "Last 7 days" | "Last 30 days";
type SortFilter = "Newest first" | "Oldest first";

const avatarText = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
    return (a + b).toUpperCase();
};

/* ================= ADD USER TYPES ================= */

type AdminForm = {
    AdCode: number;
    FullName: string;
    MobileNo: string;
    EmailId: string;
    AdminUsername: string;
    AdminPassword: string;
    Type: string;     // role name
    RoleId: number;   // selected role id
    Status: "Y" | "N";
    Address: string;
};

const initialAdminForm: AdminForm = {
    AdCode: 0,
    FullName: "",
    MobileNo: "",
    EmailId: "",
    AdminUsername: "",
    AdminPassword: "",
    Type: "",
    RoleId: 0,
    Status: "Y",
    Address: "",
};

const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export default function AddAdmin() {
    const {
        adminList,
        adminsTotal,
        adminsLoading,
        adminsError,
        refreshAdmins,
        adminParams,
        menus,
        menusLoading,
        menusError,
        refreshMenus,
        roles,
        rolesLoading,
        rolesError,
        refreshRoles,
    } = useProject();

    const [search, setSearch] = useState("");
    const [range, setRange] = useState<RangeFilter>("All");
    const [sort, setSort] = useState<SortFilter>("Newest first");

    useEffect(() => {
        refreshAdmins({ PageNumber: 1, PageSize: 10, status: "Y" });
        refreshMenus({ status: "Y" });
        refreshRoles({ status: "Y" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const modalElRef = useRef<HTMLDivElement | null>(null);
    const modalInstanceRef = useRef<Modal | null>(null);

    const addModalElRef = useRef<HTMLDivElement | null>(null);
    const addModalInstanceRef = useRef<Modal | null>(null);

    const [adminForm, setAdminForm] = useState<AdminForm>(initialAdminForm);
    const [addTriedSubmit, setAddTriedSubmit] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const [errorOpen, setErrorOpen] = useState(false);
    const [popupMsg, setPopupMsg] = useState("");
    const [activeTab, setActiveTab] = useState<"details" | "permissions">("details");

    const [permissions, setPermissions] = useState<PermissionRow[]>([]);

    const page = adminParams.PageNumber ?? 1;
    const pageSize = adminParams.PageSize ?? 10;

    const selectedRoleName = useMemo(() => {
        return roles.find((r) => Number(r.Id) === Number(adminForm.RoleId))?.Role ?? adminForm.Type ?? "";
    }, [roles, adminForm.RoleId, adminForm.Type]);

    const isSubAdmin = selectedRoleName.trim().toUpperCase() === "SUB ADMIN";

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil((adminsTotal || 0) / pageSize)),
        [adminsTotal, pageSize]
    );

    const goToPage = (p: number) => {
        const next = Math.max(1, Math.min(totalPages, p));
        refreshAdmins({ PageNumber: next, PageSize: pageSize, status: adminParams.status });
    };

    const buildDefaultPermissions = () => {
        return menus
            .filter((m) => m.Status === "Y")
            .map((m) => ({
                pageId: m.Id,
                key: m.PageKey,
                label: m.PageName,
                enabled: true,
                route: m.Route,
                icon: m.Icon,
            }));
    };

    const loadPermissionsForAdmin = async (adCode: number) => {
        const assigned = await getAdminMenus({ adCode });
        const assignedPageIds = new Set(assigned.map((x) => Number(x.PageId)));

        setPermissions(
            menus
                .filter((m) => m.Status === "Y")
                .map((m) => ({
                    pageId: m.Id,
                    key: m.PageKey,
                    label: m.PageName,
                    enabled: assignedPageIds.has(Number(m.Id)),
                    route: m.Route,
                    icon: m.Icon,
                }))
        );
    };

    const openCreateAdminModal = () => {
        setSaveError("");
        setAddTriedSubmit(false);

        const firstRole = roles.find((r) => r.Status === "Y");

        setAdminForm({
            ...initialAdminForm,
            RoleId: firstRole?.Id ?? 0,
            Type: firstRole?.Role ?? "",
        });

        setPermissions(buildDefaultPermissions());
        setActiveTab("details");

        requestAnimationFrame(() => {
            addModalInstanceRef.current?.show();
            const btn = document.querySelector<HTMLButtonElement>("#tab-user-details");
            btn?.click();
        });
    };
    const openUpdateAdminModal = async (row: any) => {
        setSaveError("");
        setAddTriedSubmit(false);
        setActiveTab("details");

        // ✅ first try with RoleId from admin list response
        const matchedRoleById = roles.find(
            (r) => Number(r.Id) === Number(row.RoleId)
        );

        // ✅ fallback only if RoleId is missing / invalid
        const matchedRoleByName = roles.find(
            (r) => r.Role?.trim().toLowerCase() === String(row.TType ?? "").trim().toLowerCase()
        );

        const matchedRole = matchedRoleById ?? matchedRoleByName;

        setAdminForm({
            AdCode: Number(row.AdCode) || 0,
            FullName: row.FullName ?? "",
            MobileNo: row.MobileNo ?? "",
            EmailId: row.EmailId ?? "",
            AdminUsername: row.Username ?? "",
            AdminPassword: "",
            Type: matchedRole?.Role ?? row.TType ?? "",
            RoleId: Number(matchedRole?.Id ?? row.RoleId ?? 0),
            Status: row.Status === "Y" ? "Y" : "N",
            Address: row.Address ?? "",
        });

        requestAnimationFrame(() => {
            addModalInstanceRef.current?.show();
            const btn = document.querySelector<HTMLButtonElement>("#tab-user-details");
            btn?.click();
        });

        if (menus.length === 0) {
            await refreshMenus({ status: "Y" });
        }

        const selectedRoleName = (matchedRole?.Role ?? row.TType ?? "").trim().toUpperCase();

        if (selectedRoleName === "SUB ADMIN") {
            await loadPermissionsForAdmin(Number(row.AdCode));
        } else {
            setPermissions(buildDefaultPermissions());
        }
    };

    useEffect(() => {
        if (!menus || menus.length === 0) return;

        setPermissions((prev) => {
            const prevMap = new Map(prev.map((x) => [x.pageId, x.enabled]));
            return menus
                .filter((m) => m.Status === "Y")
                .map((m) => ({
                    pageId: m.Id,
                    key: m.PageKey,
                    label: m.PageName,
                    enabled: prevMap.get(m.Id) ?? true,
                    route: m.Route,
                    icon: m.Icon,
                }));
        });
    }, [menus]);

    useEffect(() => {
        if (!isSubAdmin && activeTab === "permissions") {
            setActiveTab("details");
            const btn = document.querySelector<HTMLButtonElement>("#tab-user-details");
            btn?.click();
        }
    }, [isSubAdmin, activeTab]);

    useEffect(() => {
        if (adminForm.RoleId && roles.length > 0) {
            const role = roles.find((r) => Number(r.Id) === Number(adminForm.RoleId));
            if (role && role.Role !== adminForm.Type) {
                setAdminForm((prev) => ({ ...prev, Type: role.Role }));
            }
        }
    }, [adminForm.RoleId, roles]); // eslint-disable-line react-hooks/exhaustive-deps

    const togglePermission = (pageId: number) => {
        setPermissions((prev) =>
            prev.map((p) => (p.pageId === pageId ? { ...p, enabled: !p.enabled } : p))
        );
    };

    useEffect(() => {
        if (!modalElRef.current) return;

        modalInstanceRef.current = new Modal(modalElRef.current, {
            backdrop: true,
            keyboard: true,
            focus: true,
        });

        return () => {
            modalInstanceRef.current?.dispose();
            modalInstanceRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!addModalElRef.current) return;

        addModalInstanceRef.current = new Modal(addModalElRef.current, {
            backdrop: "static",
            keyboard: true,
            focus: true,
        });

        return () => {
            addModalInstanceRef.current?.dispose();
            addModalInstanceRef.current = null;
        };
    }, []);

    useEffect(() => {
        const el = addModalElRef.current;
        if (!el) return;

        const onHidden = () => {
            const firstRole = roles.find((r) => r.Status === "Y");

            setSaveError("");
            setSaving(false);
            setAddTriedSubmit(false);
            setAdminForm({
                ...initialAdminForm,
                RoleId: firstRole?.Id ?? 0,
                Type: firstRole?.Role ?? "",
            });
            setPermissions(buildDefaultPermissions());
            setActiveTab("details");
        };

        el.addEventListener("hidden.bs.modal", onHidden);
        return () => el.removeEventListener("hidden.bs.modal", onHidden);
    }, [menus, roles]);

    const closeAddUserModal = () => addModalInstanceRef.current?.hide();

    const filteredAdmins = useMemo(() => {
        let rows = [...adminList];

        const s = search.trim().toLowerCase();
        if (s) {
            rows = rows.filter(
                (x) =>
                    x.FullName?.toLowerCase().includes(s) ||
                    x.Username?.toLowerCase().includes(s) ||
                    x.MobileNo?.toLowerCase().includes(s) ||
                    (x.EmailId ?? "").toLowerCase().includes(s) ||
                    x.TType?.toLowerCase().includes(s)
            );
        }

        rows.sort((a, b) => {
            const da = new Date(a.UpdatedOn ?? a.TTime ?? "").getTime() || 0;
            const db = new Date(b.UpdatedOn ?? b.TTime ?? "").getTime() || 0;
            return sort === "Newest first" ? db - da : da - db;
        });

        return rows;
    }, [adminList, search, sort]);

    const adminErrors = useMemo(() => {
        const e: Partial<Record<keyof AdminForm, string>> = {};

        if (!adminForm.FullName.trim() || adminForm.FullName.trim().length < 2) {
            e.FullName = "Enter full name (min 2 chars).";
        }

        if (!adminForm.MobileNo.trim()) {
            e.MobileNo = "Enter mobile number.";
        } else if (!/^\d{10}$/.test(adminForm.MobileNo.trim())) {
            e.MobileNo = "Enter 10 digit mobile number.";
        }

        if (!adminForm.EmailId.trim()) {
            e.EmailId = "Enter email.";
        } else if (!isEmailValid(adminForm.EmailId)) {
            e.EmailId = "Enter a valid email.";
        }

        if (!adminForm.AdminUsername.trim()) {
            e.AdminUsername = "Enter username.";
        }

        if (adminForm.AdCode === 0) {
            if (!adminForm.AdminPassword.trim()) {
                e.AdminPassword = "Enter password.";
            } else if (adminForm.AdminPassword.trim().length < 6) {
                e.AdminPassword = "Password must be at least 6 characters.";
            }
        } else if (adminForm.AdminPassword.trim() && adminForm.AdminPassword.trim().length < 6) {
            e.AdminPassword = "Password must be at least 6 characters.";
        }

        if (!adminForm.RoleId) {
            e.RoleId = "Select role.";
        }

        if (!adminForm.Status) {
            e.Status = "Select status.";
        }

        return e;
    }, [adminForm]);

    const adminHasError = useMemo(() => {
        return Object.values(adminErrors).some(Boolean);
    }, [adminErrors]);

    const showEmailError = addTriedSubmit || (!!adminForm.EmailId && !!adminErrors.EmailId);
    const showPasswordError =
        addTriedSubmit ||
        (!!adminForm.AdminPassword && !!adminErrors.AdminPassword) ||
        (adminForm.AdCode === 0 && addTriedSubmit && !!adminErrors.AdminPassword);

    const canOpenPermissionsTab = isSubAdmin && !adminHasError && !saving;
    const canGoNext = canOpenPermissionsTab;
    const canSaveDirect = !adminHasError && !saving;

    const onAddUserReset = () => {
        const firstRole = roles.find((r) => r.Status === "Y");

        setSaveError("");
        setAddTriedSubmit(false);
        setAdminForm({
            ...initialAdminForm,
            RoleId: firstRole?.Id ?? 0,
            Type: firstRole?.Role ?? "",
        });
        setPermissions(buildDefaultPermissions());
        setActiveTab("details");

        requestAnimationFrame(() => {
            const btn = document.querySelector<HTMLButtonElement>("#tab-user-details");
            btn?.click();
        });
    };

    const onAddUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddTriedSubmit(true);
        setSaveError("");

        if (adminHasError) return;

        setPopupMsg(
            adminForm.AdCode === 0
                ? "Are you sure you want to create this admin?"
                : "Are you sure you want to update this admin?"
        );
        setConfirmOpen(true);
    };

    const getDashboardPermission = () => {
        const dashboardMenu = menus.find(
            (m) =>
                m.Status === "Y" &&
                (
                    m.PageKey?.trim().toLowerCase() === "dashboard" ||
                    m.PageName?.trim().toLowerCase() === "dashboard" ||
                    m.Route?.trim().toLowerCase().includes("dashboard")
                )
        );

        if (!dashboardMenu) return [];

        return [
            {
                PageId: dashboardMenu.Id,
                CanView: "Y",
            },
        ];
    };

    const doSaveAdmin = async () => {
        const role = roles.find((r) => Number(r.Id) === Number(adminForm.RoleId));

        const menusArray = isSubAdmin
            ? permissions.map((p) => ({
                PageId: p.pageId,
                CanView: p.enabled ? "Y" : "N",
            }))
            : getDashboardPermission(); // ✅ non-sub-admin gets dashboard only

        const payload: AddUpdateAdminPayload = {
            AdCode: adminForm.AdCode,
            MobileNo: adminForm.MobileNo,
            FullName: adminForm.FullName,
            AdminUsername: adminForm.AdminUsername,
            AdminPassword: adminForm.AdminPassword,
            Status: adminForm.Status,
            Type: role?.Role ?? adminForm.Type,
            EmailId: adminForm.EmailId,
            Address: adminForm.Address,
            RoleId: Number(adminForm.RoleId),
            MenusJson: JSON.stringify(menusArray),
        };

        try {
            setSaving(true);

            await addUpdateAdmin(payload);
            await refreshAdmins({ PageNumber: 1, PageSize: 10, status: "Y" });

            closeAddUserModal();

            setPopupMsg(
                adminForm.AdCode === 0
                    ? "Admin created successfully."
                    : "Admin updated successfully."
            );
            setSuccessOpen(true);
        } catch (err: any) {
            setPopupMsg(err?.message || "Failed to save admin.");
            setErrorOpen(true);
        } finally {
            setSaving(false);
        }
    };

    const goToPermissionsTab = () => {
        if (!canOpenPermissionsTab) {
            setAddTriedSubmit(true);
            return;
        }
        const btn = document.querySelector<HTMLButtonElement>("#tab-permissions");
        btn?.click();
        setActiveTab("permissions");
    };

    const goToDetailsTab = () => {
        const btn = document.querySelector<HTMLButtonElement>("#tab-user-details");
        btn?.click();
        setActiveTab("details");
    };

    return (
        <>
            <div className="container-fluid app-shell">
                <div className="row g-0">
                    <div className="panel mb-3">
                        <div className="panel-head p-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div>
                                <div className="h5 mb-1">Admin</div>
                            </div>

                            <div className="d-flex gap-2 align-items-center">


                                <button className="btn btn-outline-secondary btn-sm" type="button" onClick={openCreateAdminModal}>
                                    <i className="bi bi-person-plus" /> Add Admin
                                </button>
                            </div>
                        </div>

                        <div className="p-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div className="input-group" style={{ maxWidth: 520 }}>
                                <span className="input-group-text search">
                                    <i className="bi bi-search" />
                                </span>
                                <input
                                    className="form-control search"
                                    placeholder="Search submissions (name, email, status)"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="d-flex gap-2">
                                <select
                                    className="form-select search"
                                    style={{ maxWidth: 190 }}
                                    value={range}
                                    onChange={(e) => setRange(e.target.value as RangeFilter)}
                                >
                                    <option>All</option>
                                    <option>Today</option>
                                    <option>Last 7 days</option>
                                    <option>Last 30 days</option>
                                </select>

                                <select
                                    className="form-select search"
                                    style={{ maxWidth: 190 }}
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value as SortFilter)}
                                >
                                    <option>Newest first</option>
                                    <option>Oldest first</option>
                                </select>

                                <select
                                    className="form-select search"
                                    style={{ maxWidth: 140 }}
                                    value={pageSize}
                                    onChange={(e) =>
                                        refreshAdmins({ PageNumber: 1, PageSize: Number(e.target.value), status: adminParams.status })
                                    }
                                >
                                    <option value={5}>5 / page</option>
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-head p-3 d-flex align-items-center justify-content-between">
                            <div className="fw-bold">Admin List</div>
                            <span className="badge badge-soft rounded-pill">Total: {adminsTotal}</span>
                        </div>

                        <div className="p-3">
                            <div className="table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: 240 }}>Admin</th>
                                            <th>Username</th>
                                            <th>Mobile</th>
                                            <th>Email</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th className="text-end" style={{ minWidth: 240 }}>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {adminsLoading && <AdminTableSkeleton rows={8} />}

                                        {!adminsLoading &&
                                            !adminsError &&
                                            filteredAdmins.map((row) => (
                                                <tr key={row.Id}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="avatar">{avatarText(row.FullName || row.Username)}</div>
                                                            <div>
                                                                <div className="fw-semibold">{row.FullName}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="text-secondary">{row.Username}</td>
                                                    <td className="text-secondary">{row.MobileNo}</td>
                                                    <td className="text-secondary">{row.EmailId ?? "-"}</td>
                                                    <td className="text-secondary">{row.TType}</td>

                                                    <td>
                                                        <span
                                                            className={
                                                                row.Status === "Y"
                                                                    ? "badge text-bg-success rounded-pill"
                                                                    : "badge text-bg-secondary rounded-pill"
                                                            }
                                                        >
                                                            {row.Status === "Y" ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>

                                                    <td className="text-end">
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm me-2"
                                                            type="button"
                                                            onClick={() => openUpdateAdminModal(row)}
                                                        >
                                                            <i className="bi bi-pencil" /> Edit
                                                        </button>

                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            type="button"
                                                            onClick={() => console.log("Delete Admin", row.Id)}
                                                        >
                                                            <i className="bi bi-trash" /> Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}

                                        {!adminsLoading && !adminsError && filteredAdmins.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="text-center text-secondary py-5">
                                                    No admins found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="d-flex justify-content-end mt-3">
                                <nav aria-label="Admin pagination">
                                    <ul className="pagination pagination-soft mb-0">
                                        <li className={`page-item ${page <= 1 || adminsLoading ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => goToPage(page - 1)} type="button">
                                                Previous
                                            </button>
                                        </li>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                                            .map((p) => (
                                                <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => goToPage(p)}
                                                        type="button"
                                                        disabled={adminsLoading}
                                                    >
                                                        {p}
                                                    </button>
                                                </li>
                                            ))}

                                        <li className={`page-item ${page >= totalPages || adminsLoading ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => goToPage(page + 1)} type="button">
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>

                            <div className="text-secondary small mt-2 text-end">
                                Page {page} of {totalPages} • Showing {filteredAdmins.length} records
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div ref={addModalElRef} className="modal fade" id="addUserModal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div
                        className="modal-content"
                        style={{
                            border: "1px solid var(--stroke)",
                            background: "color-mix(in oklab, var(--bs-body-bg) 92%, transparent 8%)",
                        }}
                    >
                        <div className="modal-header" style={{ borderBottom: "1px solid var(--stroke)" }}>
                            <div className="d-flex align-items-center gap-2">
                                <h5 className="modal-title mb-0">
                                    {adminForm.AdCode === 0 ? "Add User" : "Update User"}
                                </h5>
                                <span className="badge rounded-pill text-bg-secondary">Admin</span>
                            </div>

                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                        </div>

                        <div className="modal-body p-0">
                            <div className="px-3 px-md-4 pt-3">
                                <ul className="nav nav-tabs" role="tablist">
                                    <li className="nav-item" role="presentation">
                                        <button
                                            className={`nav-link ${activeTab === "details" ? "active" : ""}`}
                                            id="tab-user-details"
                                            data-bs-toggle="tab"
                                            data-bs-target="#pane-user-details"
                                            type="button"
                                            role="tab"
                                            aria-controls="pane-user-details"
                                            aria-selected={activeTab === "details"}
                                            onClick={() => setActiveTab("details")}
                                        >
                                            <i className="bi bi-person-lines-fill me-2" />
                                            Admin Details
                                        </button>
                                    </li>

                                    {isSubAdmin && (
                                        <li className="nav-item" role="presentation">
                                            <button
                                                className={`nav-link ${activeTab === "permissions" ? "active" : ""}`}
                                                id="tab-permissions"
                                                data-bs-toggle={canOpenPermissionsTab ? "tab" : undefined}
                                                data-bs-target={canOpenPermissionsTab ? "#pane-permissions" : undefined}
                                                type="button"
                                                role="tab"
                                                aria-controls="pane-permissions"
                                                aria-selected={activeTab === "permissions"}
                                                onClick={(e) => {
                                                    if (!canOpenPermissionsTab) {
                                                        e.preventDefault();
                                                        setAddTriedSubmit(true);
                                                        return;
                                                    }
                                                    setActiveTab("permissions");
                                                }}
                                            >
                                                <i className="bi bi-shield-lock me-2" />
                                                Permissions
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div style={{ borderTop: "1px solid var(--stroke)" }} />

                            <div className="tab-content">
                                <div
                                    className={`tab-pane fade ${activeTab === "details" ? "show active" : ""}`}
                                    id="pane-user-details"
                                    role="tabpanel"
                                    aria-labelledby="tab-user-details"
                                >
                                    <div className="px-3 px-md-4 py-3 d-flex align-items-center justify-content-between">
                                        <div className="fw-bold">Admin Details</div>
                                    </div>
                                    <div style={{ borderTop: "1px solid var(--stroke)" }} />

                                    <div className="p-3 p-md-4">
                                        <form
                                            id="addUserForm"
                                            noValidate
                                            onSubmit={onAddUserSubmit}
                                            onReset={onAddUserReset}
                                        >
                                            <div className="row g-3">
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label fw-semibold">Full Name <span className="req">*</span></label>
                                                    <input
                                                        className={`form-control ${addTriedSubmit && adminErrors.FullName ? "is-invalid" : ""}`}
                                                        value={adminForm.FullName}
                                                        onChange={(e) => setAdminForm((p) => ({ ...p, FullName: e.target.value }))}
                                                        placeholder="Enter full name"
                                                    />
                                                    <div className="invalid-feedback">{adminErrors.FullName}</div>
                                                </div>

                                                <div className="col-12 col-md-6">
                                                    <label className="form-label fw-semibold">Mobile <span className="req">*</span></label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        className={`form-control ${addTriedSubmit && adminErrors.MobileNo ? "is-invalid" : ""}`}
                                                        value={adminForm.MobileNo}
                                                        onChange={(e) => {
                                                            const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                            setAdminForm((p) => ({ ...p, MobileNo: value }));
                                                        }}
                                                        placeholder="Enter 10 digit mobile"
                                                    />
                                                    <div className="invalid-feedback">{adminErrors.MobileNo}</div>
                                                </div>

                                                <div className="col-12 col-md-6">
                                                    <label className="form-label fw-semibold">Email <span className="req">*</span></label>
                                                    <input
                                                        type="email"
                                                        inputMode="email"
                                                        autoComplete="email"
                                                        className={`form-control ${showEmailError ? "is-invalid" : ""}`}
                                                        value={adminForm.EmailId}
                                                        onChange={(e) => setAdminForm((p) => ({ ...p, EmailId: e.target.value }))}
                                                        placeholder="Enter email"
                                                    />
                                                    <div className="invalid-feedback">{adminErrors.EmailId}</div>
                                                </div>

                                                <div className="col-12 col-md-6">
                                                    <label className="form-label fw-semibold">Role <span className="req">*</span></label>
                                                    <select
                                                        className={`form-select ${addTriedSubmit && adminErrors.RoleId ? "is-invalid" : ""}`}
                                                        value={adminForm.RoleId || ""}
                                                        onChange={(e) => {
                                                            const roleId = Number(e.target.value);
                                                            const selectedRole = roles.find((r) => Number(r.Id) === roleId);

                                                            setAdminForm((p) => ({
                                                                ...p,
                                                                RoleId: roleId,
                                                                Type: selectedRole?.Role ?? "",
                                                            }));
                                                        }}
                                                        disabled={rolesLoading}
                                                    >
                                                        <option value="">Select role</option>
                                                        {roles
                                                            .filter((r) => r.Status === "Y")
                                                            .map((role) => (
                                                                <option key={role.Id} value={role.Id}>
                                                                    {role.Role}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <div className="invalid-feedback">{adminErrors.RoleId}</div>
                                                    {rolesError && <div className="text-danger small mt-1">{rolesError}</div>}
                                                </div>

                                                <div className="col-12 col-md-6">
                                                    <label className="form-label fw-semibold">Username <span className="req">*</span></label>
                                                    <input
                                                        className={`form-control ${addTriedSubmit && adminErrors.AdminUsername ? "is-invalid" : ""}`}
                                                        value={adminForm.AdminUsername}
                                                        onChange={(e) => setAdminForm((p) => ({ ...p, AdminUsername: e.target.value }))}
                                                        placeholder="Enter username"
                                                    />
                                                    <div className="invalid-feedback">{adminErrors.AdminUsername}</div>
                                                </div>

                                                <div className="col-12 col-md-6">
                                                    <label className="form-label fw-semibold">
                                                        Password{" "}
                                                        {adminForm.AdCode === 0 ? (
                                                            <span className="req">*</span>
                                                        ) : (
                                                            <span className="text-secondary small">(leave blank to keep same)</span>
                                                        )}
                                                    </label>
                                                    <input
                                                        type="password"
                                                        className={`form-control ${showPasswordError ? "is-invalid" : ""}`}
                                                        value={adminForm.AdminPassword}
                                                        onChange={(e) => setAdminForm((p) => ({ ...p, AdminPassword: e.target.value }))}
                                                        placeholder={adminForm.AdCode === 0 ? "Enter password" : "Leave blank to keep same"}
                                                    />
                                                    <div className="invalid-feedback">{adminErrors.AdminPassword}</div>
                                                </div>

                                                <div className="col-12 col-md-6">
                                                    <label className="form-label fw-semibold">Status <span className="req">*</span></label>
                                                    <select
                                                        className={`form-select ${addTriedSubmit && adminErrors.Status ? "is-invalid" : ""}`}
                                                        value={adminForm.Status}
                                                        onChange={(e) => setAdminForm((p) => ({ ...p, Status: e.target.value as "Y" | "N" }))}
                                                    >
                                                        <option value="Y">Active</option>
                                                        <option value="N">Inactive</option>
                                                    </select>
                                                    <div className="invalid-feedback">{adminErrors.Status}</div>
                                                </div>

                                                <div className="col-12">
                                                    <label className="form-label fw-semibold">Address</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={2}
                                                        value={adminForm.Address}
                                                        onChange={(e) => setAdminForm((p) => ({ ...p, Address: e.target.value }))}
                                                        placeholder="Enter address"
                                                    />
                                                </div>

                                                {saveError && (
                                                    <div className="col-12">
                                                        <div className="alert alert-danger mb-0">{saveError}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                {isSubAdmin && (
                                    <div
                                        className={`tab-pane fade ${activeTab === "permissions" ? "show active" : ""}`}
                                        id="pane-permissions"
                                        role="tabpanel"
                                        aria-labelledby="tab-permissions"
                                    >
                                        <div className="px-3 px-md-4 py-3 d-flex align-items-center justify-content-between">
                                            <div className="fw-bold">Permissions</div>
                                            <span className="text-secondary small">
                                                Enable / Disable access for this admin
                                            </span>
                                        </div>
                                        <div style={{ borderTop: "1px solid var(--stroke)" }} />

                                        <div className="p-3 p-md-4">
                                            <div className="panel" style={{ border: "1px solid var(--stroke)", borderRadius: 16 }}>
                                                <div className="p-3">
                                                    <div
                                                        className="d-flex text-secondary small fw-semibold pb-2"
                                                        style={{ borderBottom: "1px solid var(--stroke)" }}
                                                    >
                                                        <div style={{ flex: 1 }}>Page Name</div>
                                                        <div style={{ width: 140 }} className="text-end">
                                                            Access
                                                        </div>
                                                    </div>

                                                    <div className="pt-2">
                                                        {menusLoading && (
                                                            <div className="text-secondary p-3">Loading menu pages...</div>
                                                        )}

                                                        {!menusLoading && !menusError && permissions.length === 0 && (
                                                            <div className="text-secondary p-3">No pages found.</div>
                                                        )}

                                                        {permissions.map((p) => (
                                                            <div
                                                                key={p.key}
                                                                className="d-flex align-items-center py-2"
                                                                style={{ borderBottom: "1px dashed color-mix(in oklab, var(--stroke) 70%, transparent 30%)" }}
                                                            >
                                                                <div style={{ flex: 1 }}>
                                                                    <div className="fw-semibold d-flex align-items-center gap-2">
                                                                        {p.icon ? <i className={p.icon} /> : <i className="bi bi-file-earmark" />}
                                                                        {p.label}
                                                                    </div>
                                                                </div>

                                                                <div style={{ width: 140 }} className="d-flex justify-content-end">
                                                                    <div className="form-check form-switch m-0">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            role="switch"
                                                                            checked={p.enabled}
                                                                            onChange={() => togglePermission(p.pageId)}
                                                                            id={`perm-${p.pageId}`}
                                                                        />
                                                                        <label className="form-check-label small text-secondary" htmlFor={`perm-${p.pageId}`}>
                                                                            {p.enabled ? "Enabled" : "Disabled"}
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="pt-3 d-flex flex-wrap gap-2 justify-content-end">
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary btn-sm"
                                                            onClick={() => setPermissions((prev) => prev.map((x) => ({ ...x, enabled: true })))}
                                                        >
                                                            Enable All
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-secondary btn-sm"
                                                            onClick={() => setPermissions((prev) => prev.map((x) => ({ ...x, enabled: false })))}
                                                        >
                                                            Disable All
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: "1px solid var(--stroke)" }} />
                            <div className="p-3 px-md-4 d-flex flex-wrap gap-2 justify-content-end">
                                {activeTab === "details" ? (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={onAddUserReset}
                                            style={{ borderRadius: 14 }}
                                        >
                                            Reset
                                        </button>

                                        {!isSubAdmin ? (
                                            <>
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={closeAddUserModal}
                                                    style={{ borderRadius: 14 }}
                                                >
                                                    Close
                                                </button>

                                                <button
                                                    type="submit"
                                                    form="addUserForm"
                                                    className="btn btn-brand px-4"
                                                    disabled={!canSaveDirect}
                                                >
                                                    {saving
                                                        ? "Saving..."
                                                        : adminForm.AdCode === 0
                                                            ? "Create Admin"
                                                            : "Update Admin"}
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn btn-brand px-4"
                                                onClick={goToPermissionsTab}
                                                disabled={!canGoNext}
                                            >
                                                Next
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={goToDetailsTab}
                                            style={{ borderRadius: 14 }}
                                        >
                                            <i className="bi bi-arrow-left me-2" /> Back
                                        </button>

                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={closeAddUserModal}
                                            style={{ borderRadius: 14 }}
                                        >
                                            Close
                                        </button>

                                        <button
                                            type="submit"
                                            form="addUserForm"
                                            className="btn btn-brand px-4"
                                            disabled={saving || adminHasError}
                                        >
                                            {saving
                                                ? "Saving..."
                                                : adminForm.AdCode === 0
                                                    ? "Create Admin"
                                                    : "Update Admin"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PopupAlert
                open={confirmOpen}
                type="warning"
                title="Confirm"
                message={popupMsg}
                confirmMode
                confirmText="Yes, Save"
                cancelText="No"
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => {
                    setConfirmOpen(false);
                    doSaveAdmin();
                }}
                onCancel={() => setConfirmOpen(false)}
            />

            <PopupAlert
                open={successOpen}
                type="success"
                title="Success"
                message={popupMsg}
                onClose={() => setSuccessOpen(false)}
                autoCloseMs={2000}
            />

            <PopupAlert
                open={errorOpen}
                type="danger"
                title="Error"
                message={popupMsg}
                onClose={() => setErrorOpen(false)}
            />
        </>
    );
}