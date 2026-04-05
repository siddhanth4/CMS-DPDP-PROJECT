import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "bootstrap";
import { useOrganizationAuth } from "../Context/organizationContext";
import { Skeleton } from "../Components/loader";
import { addUpdateOrganization } from "../Api/Organization/addOrganization";
import { PopupAlert } from "../Components/alert";

/* ================= ADD ORG MODAL TYPES ================= */

type AddOrgForm = {
    OrgCode: string;
    OwnerName: string;
    MobileNo: string;
    OrgName: string;
    FullName: string;
    AdminUsername: string;
    AdminPassword: string;
    PinCode: string;
    State: string;
    City: string;
    Area: string;
    Address: string;
    Status: string;
    LogoImg: File | null;
};

const initialAddOrg: AddOrgForm = {
    OrgCode: "",
    OwnerName: "",
    MobileNo: "",
    OrgName: "",
    FullName: "",
    AdminUsername: "",
    AdminPassword: "",
    PinCode: "",
    State: "",
    City: "",
    Area: "",
    Address: "",
    Status: "",
    LogoImg: null,
};

type AddOrgTouched = Record<keyof AddOrgForm, boolean>;

const initialTouched: AddOrgTouched = {
    OrgCode: false,
    OwnerName: false,
    MobileNo: false,
    OrgName: false,
    FullName: false,
    AdminUsername: false,
    AdminPassword: false,
    PinCode: false,
    State: false,
    City: false,
    Area: false,
    Address: false,
    Status: false,
    LogoImg: false,
};

/* ================= HELPERS ================= */
function useDebouncedValue<T>(value: T, delayMs: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(t);
    }, [value, delayMs]);
    return debounced;
}

const avatar2 = (name: string) => (name?.slice(0, 2) || "OR").toUpperCase();

const SortIcon = ({ active, order }: { active: boolean; order: "ASC" | "DESC" }) => {
    if (!active) return <i className="bi bi-arrow-down-up ms-2 text-secondary" />;
    return order === "ASC" ? <i className="bi bi-sort-up ms-2" /> : <i className="bi bi-sort-down ms-2" />;
};

export default function AddOrganization() {
    const {
        organizations,
        totalOrganizations,
        orgLoading,
        params,
        setPage,
        setPageSize,
        setSearchString,
        setStatus,
        toggleSort,
        fetchOrganizations,
    } = useOrganizationAuth();

    /* ================== SEARCH (SERVER SIDE) ================== */
    const [searchInput, setSearchInputLocal] = useState(params.searchString || "");
    const debouncedSearch = useDebouncedValue(searchInput, 400);

    type ModalMode = "create" | "edit";

    const [mode, setMode] = useState<ModalMode>("create");
    const [editingId, setEditingId] = useState<number | null>(null);

    // ✅ Popup states
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupType, setPopupType] = useState<"success" | "warning" | "danger">("success");
    const [popupTitle, setPopupTitle] = useState("");
    const [popupMessage, setPopupMessage] = useState("");

    // ✅ Confirm states
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const pendingSubmitRef = useRef<null | (() => Promise<void>)>(null);

    const closePopup = () => setPopupOpen(false);
    const closeConfirm = () => {
        setConfirmOpen(false);
        setConfirmLoading(false);
        pendingSubmitRef.current = null;
    };

    const showPopup = (type: "success" | "warning" | "danger", title: string, message: string) => {
        setPopupType(type);
        setPopupTitle(title);
        setPopupMessage(message);
        setPopupOpen(true);
    };

    const askConfirm = (message: string, onYes: () => Promise<void>) => {
        pendingSubmitRef.current = onYes;
        setPopupType("warning");
        setPopupTitle("Confirm");
        setPopupMessage(message);
        setConfirmOpen(true);
    };

    useEffect(() => {
        setSearchString(debouncedSearch);
        console.log(editingId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    /* ================== PAGINATION CALCS ================== */
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil((totalOrganizations || 0) / params.pageSize));
    }, [totalOrganizations, params.pageSize]);

    const canPrev = params.page > 1;
    const canNext = params.page < totalPages;

    const pageNumbers = useMemo(() => {
        const maxButtons = 7;
        const pages: number[] = [];

        let start = Math.max(1, params.page - Math.floor(maxButtons / 2));
        let end = start + maxButtons - 1;

        if (end > totalPages) {
            end = totalPages;
            start = Math.max(1, end - maxButtons + 1);
        }

        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }, [params.page, totalPages]);

    /* ================== SORT COLUMN MAPPING ================== */
    const COL = {
        OrgName: "OrgName",
        OwnerName: "OwnerName",
        MobileNo: "MobileNo",
        City: "City",
        Status: "Status",
        TTime: "TTime",
    } as const;

    /* ================= MODAL REFS ================= */
    const addModalElRef = useRef<HTMLDivElement | null>(null);
    const addModalInstanceRef = useRef<Modal | null>(null);

    const [addUser, setAddUser] = useState<AddOrgForm>(initialAddOrg);
    const [addTriedSubmit, setAddTriedSubmit] = useState(false);
    const [touched, setTouched] = useState<AddOrgTouched>(initialTouched);
    const [logoPreview, setLogoPreview] = useState<string>("");

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
            setAddTriedSubmit(false);
            setTouched(initialTouched);
            setAddUser(initialAddOrg);
            setLogoPreview("");
        };

        el.addEventListener("hidden.bs.modal", onHidden);
        return () => el.removeEventListener("hidden.bs.modal", onHidden);
    }, []);

    const openAddUserModal = () => {
        setMode("create");
        setEditingId(null);

        setAddTriedSubmit(false);
        setTouched(initialTouched);
        setAddUser({ ...initialAddOrg, OrgCode: "0", Status: "Y" });
        setLogoPreview("");

        requestAnimationFrame(() => addModalInstanceRef.current?.show());
    };

    const closeAddUserModal = () => addModalInstanceRef.current?.hide();

    const markTouched = (field: keyof AddOrgForm) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const shouldShowError = (field: keyof AddOrgForm) => addTriedSubmit || touched[field];

    /* ================= VALIDATION ================= */
    const addOrgErrors = useMemo(() => {
        const e: Record<keyof AddOrgForm, string> = {
            OrgCode: "",
            OwnerName: "",
            MobileNo: "",
            OrgName: "",
            FullName: "",
            AdminUsername: "",
            AdminPassword: "",
            PinCode: "",
            State: "",
            City: "",
            Area: "",
            Address: "",
            Status: "",
            LogoImg: "",
        };

        if (!addUser.OwnerName.trim()) e.OwnerName = "Owner name required.";
        if (!addUser.OrgName.trim()) e.OrgName = "Organization name required.";
        if (!addUser.FullName.trim()) e.FullName = "Full name required.";
        if (!addUser.AdminUsername.trim()) e.AdminUsername = "Admin username required.";

        if (!addUser.AdminPassword.trim()) {
            e.AdminPassword = "Password required.";
        } else if (addUser.AdminPassword.trim().length < 6) {
            e.AdminPassword = "Password min 6 chars.";
        }

        const mobile = addUser.MobileNo.trim();
        if (!mobile) e.MobileNo = "Mobile number required.";
        else if (!/^\d{10}$/.test(mobile)) e.MobileNo = "Enter 10 digit mobile.";

        const pin = addUser.PinCode.trim();
        if (!pin) e.PinCode = "Pincode required.";
        else if (!/^\d{6}$/.test(pin)) e.PinCode = "Enter 6 digit pincode.";

        if (!addUser.State.trim()) e.State = "State required.";
        if (!addUser.City.trim()) e.City = "City required.";
        if (!addUser.Area.trim()) e.Area = "Area required.";
        if (!addUser.Address.trim()) e.Address = "Address required.";
        if (!addUser.Status.trim()) e.Status = "Select status.";

        if (mode === "create" && !addUser.LogoImg) {
            e.LogoImg = "Logo image required.";
        } else if (addUser.LogoImg && addUser.LogoImg.size > 2 * 1024 * 1024) {
            e.LogoImg = "Logo must be less than 2MB.";
        }

        return e;
    }, [addUser, mode]);

    const addOrgHasError = useMemo(
        () => Object.values(addOrgErrors).some(Boolean),
        [addOrgErrors]
    );

    const isSaveDisabled = useMemo(() => {
        return addOrgHasError || confirmLoading;
    }, [addOrgHasError, confirmLoading]);

    const onAddOrgSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddTriedSubmit(true);
        setTouched({
            OrgCode: true,
            OwnerName: true,
            MobileNo: true,
            OrgName: true,
            FullName: true,
            AdminUsername: true,
            AdminPassword: true,
            PinCode: true,
            State: true,
            City: true,
            Area: true,
            Address: true,
            Status: true,
            LogoImg: true,
        });

        if (addOrgHasError) return;

        askConfirm(
            mode === "create"
                ? "Are you sure you want to save this organization?"
                : "Are you sure you want to update this organization?",
            async () => {
                try {
                    setConfirmLoading(true);

                    await addUpdateOrganization(addUser);

                    closeAddUserModal();
                    await fetchOrganizations();

                    closeConfirm();
                    showPopup(
                        "success",
                        "Success",
                        mode === "create"
                            ? "Organization saved successfully ✅"
                            : "Organization updated successfully ✅"
                    );
                } catch (err: any) {
                    closeConfirm();
                    showPopup("danger", "Failed", err?.message || "Save failed ❌");
                }
            }
        );
    };

    const onAddOrgReset = () => {
        setAddTriedSubmit(false);
        setTouched(initialTouched);
        setAddUser(mode === "create" ? { ...initialAddOrg, OrgCode: "0", Status: "Y" } : {
            ...initialAddOrg,
            OrgCode: addUser.OrgCode,
            Status: addUser.Status || "Y",
        });
        setLogoPreview("");
    };

    const openEditModal = (row: any) => {
        setMode("edit");
        setEditingId(row.Id ?? null);

        setAddTriedSubmit(false);
        setTouched(initialTouched);

        setAddUser({
            OrgCode: String(row.OrgCode ?? "0"),
            OwnerName: row.OwnerName ?? "",
            MobileNo: row.MobileNo ?? "",
            OrgName: row.OrgName ?? "",
            FullName: row.FullName ?? "",
            AdminUsername: row.AdminUsername ?? "",
            AdminPassword: "",
            PinCode: row.PinCode ?? "",
            State: row.State ?? "",
            City: row.City ?? "",
            Area: row.Area ?? "",
            Address: row.Address ?? "",
            Status: row.Status ?? "Y",
            LogoImg: null,
        });

        setLogoPreview(row.LogoImgUrl ?? "");
        requestAnimationFrame(() => addModalInstanceRef.current?.show());
    };

    return (
        <>
            <div className="container-fluid app-shell">
                <div className="row g-0">
                    <div className="panel mb-3">
                        <div className="panel-head p-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div>
                                <div className="h5 mb-1">Organization</div>
                                <div className="text-secondary small">
                                    Total: <b>{totalOrganizations}</b>
                                </div>
                            </div>

                            <div className="d-flex gap-2 align-items-center">
                                <button className="btn btn-outline-secondary btn-sm" type="button">
                                    <i className="bi bi-download" /> Export CSV
                                </button>

                                <button className="btn btn-outline-secondary btn-sm" type="button" onClick={openAddUserModal}>
                                    <i className="bi bi-building-add" /> Add Organization
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
                                    placeholder="Search organization (OrgName / OwnerName / Mobile / City...)"
                                    value={searchInput}
                                    onChange={(e) => setSearchInputLocal(e.target.value)}
                                />
                            </div>

                            <div className="d-flex gap-2 align-items-center">
                                <select
                                    className="form-select search"
                                    style={{ maxWidth: 170 }}
                                    value={params.status}
                                    onChange={(e) => setStatus(e.target.value as "Y" | "N")}
                                >
                                    <option value="Y">Active (Y)</option>
                                    <option value="N">Inactive (N)</option>
                                </select>

                                <select
                                    className="form-select search"
                                    style={{ maxWidth: 170 }}
                                    value={params.pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                >
                                    <option value={10}>PageSize 10</option>
                                    <option value={20}>PageSize 20</option>
                                    <option value={50}>PageSize 50</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-head p-3 d-flex align-items-center justify-content-between">
                            <div className="fw-bold">Organization List</div>
                            {orgLoading ? (
                                <span className="badge rounded-pill text-bg-secondary">Loading...</span>
                            ) : (
                                <span className="badge badge-soft rounded-pill">Rows: {organizations.length}</span>
                            )}
                        </div>

                        <div className="p-3">
                            <div className="table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th
                                                role="button"
                                                style={{ minWidth: 260 }}
                                                onClick={() => toggleSort(COL.OrgName)}
                                                title="Sort by OrgName"
                                            >
                                                Organization
                                                <SortIcon active={params.sortColumn === COL.OrgName} order={params.sortOrder} />
                                            </th>

                                            <th role="button" onClick={() => toggleSort(COL.OwnerName)} title="Sort by OwnerName">
                                                Owner
                                                <SortIcon active={params.sortColumn === COL.OwnerName} order={params.sortOrder} />
                                            </th>

                                            <th role="button" onClick={() => toggleSort(COL.MobileNo)} title="Sort by MobileNo">
                                                Mobile
                                                <SortIcon active={params.sortColumn === COL.MobileNo} order={params.sortOrder} />
                                            </th>

                                            <th role="button" onClick={() => toggleSort(COL.City)} title="Sort by City">
                                                City
                                                <SortIcon active={params.sortColumn === COL.City} order={params.sortOrder} />
                                            </th>

                                            <th role="button" onClick={() => toggleSort(COL.Status)} title="Sort by Status">
                                                Status
                                                <SortIcon active={params.sortColumn === COL.Status} order={params.sortOrder} />
                                            </th>

                                            <th className="text-end" style={{ minWidth: 200 }}>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {orgLoading &&
                                            Array.from({ length: params.pageSize }).map((_, i) => (
                                                <tr key={`sk-${i}`}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div style={{ width: 42, height: 42, borderRadius: 12, overflow: "hidden" }}>
                                                                <Skeleton width={42} height={42} radius={12} />
                                                            </div>

                                                            <div style={{ width: "100%" }}>
                                                                <Skeleton width="60%" height={14} />
                                                                <div style={{ height: 8 }} />
                                                                <Skeleton width="40%" height={12} />
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td><Skeleton width="70%" height={14} /></td>
                                                    <td><Skeleton width="60%" height={14} /></td>
                                                    <td><Skeleton width="60%" height={14} /></td>
                                                    <td><Skeleton width={70} height={24} radius={999} /></td>

                                                    <td className="text-end">
                                                        <div className="d-flex justify-content-end gap-2">
                                                            <Skeleton width={72} height={32} radius={10} />
                                                            <Skeleton width={82} height={32} radius={10} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}

                                        {!orgLoading && organizations.map((o) => (
                                            <tr key={o.Id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="avatar">{avatar2(o.OrgName)}</div>
                                                        <div>
                                                            <div className="fw-semibold">{o.OrgName}</div>
                                                            <div className="text-secondary small">
                                                                OrgCode: {o.OrgCode} • {o.TType}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="text-secondary">{o.OwnerName}</td>
                                                <td className="text-secondary">{o.MobileNo}</td>
                                                <td className="text-secondary">{o.City}, {o.State}</td>

                                                <td>
                                                    <span className={`badge rounded-pill ${o.Status === "Y" ? "text-bg-success" : "text-bg-danger"}`}>
                                                        {o.Status === "Y" ? "Active" : "Inactive"}
                                                    </span>
                                                </td>

                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-outline-secondary btn-sm me-2"
                                                        type="button"
                                                        onClick={() => openEditModal(o)}
                                                    >
                                                        <i className="bi bi-pencil" /> Edit
                                                    </button>

                                                    <button className="btn btn-outline-danger btn-sm" type="button">
                                                        <i className="bi bi-trash" /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {!orgLoading && organizations.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center text-secondary py-5">
                                                    No organizations found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mt-3">
                                <div className="text-secondary small">
                                    Page <b>{params.page}</b> / <b>{totalPages}</b> — Total: <b>{totalOrganizations}</b>
                                </div>

                                <div className="d-flex gap-1 flex-wrap">
                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        disabled={!canPrev || orgLoading}
                                        onClick={() => setPage(params.page - 1)}
                                    >
                                        <i className="bi bi-chevron-left" /> Prev
                                    </button>

                                    {pageNumbers[0] > 1 && (
                                        <>
                                            <button className="btn btn-outline-secondary btn-sm" disabled={orgLoading} onClick={() => setPage(1)}>
                                                1
                                            </button>
                                            {pageNumbers[0] > 2 && <span className="px-2 text-secondary">...</span>}
                                        </>
                                    )}

                                    {pageNumbers.map((p) => (
                                        <button
                                            key={p}
                                            className={`btn btn-sm ${p === params.page ? "btn-brand" : "btn-outline-secondary"}`}
                                            disabled={orgLoading}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </button>
                                    ))}

                                    {pageNumbers[pageNumbers.length - 1] < totalPages && (
                                        <>
                                            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                                                <span className="px-2 text-secondary">...</span>
                                            )}
                                            <button className="btn btn-outline-secondary btn-sm" disabled={orgLoading} onClick={() => setPage(totalPages)}>
                                                {totalPages}
                                            </button>
                                        </>
                                    )}

                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        disabled={!canNext || orgLoading}
                                        onClick={() => setPage(params.page + 1)}
                                    >
                                        Next <i className="bi bi-chevron-right" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ADD / EDIT ORGANIZATION MODAL */}
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
                                    {mode === "create" ? "Add Organization" : "Update Organization"}
                                </h5>

                                <span className="badge rounded-pill text-bg-secondary">Organization</span>
                            </div>

                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                        </div>

                        <div className="modal-body p-0">
                            <div className="px-3 px-md-4 py-3 d-flex align-items-center justify-content-between">
                                <div className="fw-bold">Organization Details</div>
                            </div>
                            <div style={{ borderTop: "1px solid var(--stroke)" }} />

                            <div className="p-3 p-md-4">
                                <form
                                    id="addUserForm"
                                    noValidate
                                    onSubmit={onAddOrgSubmit}
                                    onReset={onAddOrgReset}
                                >
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Owner Name <span className="req">*</span></label>
                                            <input
                                                className={`form-control ${shouldShowError("OwnerName") && addOrgErrors.OwnerName ? "is-invalid" : ""}`}
                                                value={addUser.OwnerName}
                                                onChange={(e) => {
                                                    markTouched("OwnerName");
                                                    setAddUser(p => ({ ...p, OwnerName: e.target.value }));
                                                }}
                                                onBlur={() => markTouched("OwnerName")}
                                                placeholder="Owner name"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.OwnerName}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Mobile No <span className="req">*</span></label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                className={`form-control ${shouldShowError("MobileNo") && addOrgErrors.MobileNo ? "is-invalid" : ""}`}
                                                value={addUser.MobileNo}
                                                onChange={(e) => {
                                                    markTouched("MobileNo");
                                                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                    setAddUser(p => ({ ...p, MobileNo: value }));
                                                }}
                                                onBlur={() => markTouched("MobileNo")}
                                                onKeyDown={(e) => {
                                                    if (!/[0-9]/.test(e.key) && !["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete"].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                placeholder="10 digit mobile"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.MobileNo}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Org Name <span className="req">*</span></label>
                                            <input
                                                className={`form-control ${shouldShowError("OrgName") && addOrgErrors.OrgName ? "is-invalid" : ""}`}
                                                value={addUser.OrgName}
                                                onChange={(e) => {
                                                    markTouched("OrgName");
                                                    setAddUser(p => ({ ...p, OrgName: e.target.value }));
                                                }}
                                                onBlur={() => markTouched("OrgName")}
                                                placeholder="Organization name"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.OrgName}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Full Name <span className="req">*</span></label>
                                            <input
                                                className={`form-control ${shouldShowError("FullName") && addOrgErrors.FullName ? "is-invalid" : ""}`}
                                                value={addUser.FullName}
                                                onChange={(e) => {
                                                    markTouched("FullName");
                                                    setAddUser(p => ({ ...p, FullName: e.target.value }));
                                                }}
                                                onBlur={() => markTouched("FullName")}
                                                placeholder="Full name"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.FullName}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Admin Username <span className="req">*</span></label>
                                            <input
                                                className={`form-control ${shouldShowError("AdminUsername") && addOrgErrors.AdminUsername ? "is-invalid" : ""}`}
                                                value={addUser.AdminUsername}
                                                onChange={(e) => {
                                                    markTouched("AdminUsername");
                                                    setAddUser(p => ({ ...p, AdminUsername: e.target.value }));
                                                }}
                                                onBlur={() => markTouched("AdminUsername")}
                                                placeholder="Admin username"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.AdminUsername}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Admin Password <span className="req">*</span></label>
                                            <input
                                                type="password"
                                                className={`form-control ${shouldShowError("AdminPassword") && addOrgErrors.AdminPassword ? "is-invalid" : ""}`}
                                                value={addUser.AdminPassword}
                                                onChange={(e) => {
                                                    markTouched("AdminPassword");
                                                    setAddUser(p => ({ ...p, AdminPassword: e.target.value }));
                                                }}
                                                onBlur={() => markTouched("AdminPassword")}
                                                placeholder="Min 6 chars"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.AdminPassword}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">PinCode <span className="req">*</span></label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                className={`form-control ${shouldShowError("PinCode") && addOrgErrors.PinCode ? "is-invalid" : ""}`}
                                                value={addUser.PinCode}
                                                onChange={(e) => {
                                                    markTouched("PinCode");
                                                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                    setAddUser(p => ({ ...p, PinCode: value }));
                                                }}
                                                onBlur={() => markTouched("PinCode")}
                                                onKeyDown={(e) => {
                                                    if (!/[0-9]/.test(e.key) && !["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete"].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                placeholder="440034"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.PinCode}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">State <span className="req">*</span></label>
                                            <input
                                                className={`form-control ${shouldShowError("State") && addOrgErrors.State ? "is-invalid" : ""}`}
                                                value={addUser.State}
                                                onChange={(e) => {
                                                    markTouched("State");
                                                    setAddUser(p => ({ ...p, State: e.target.value }));
                                                }}
                                                onBlur={() => markTouched("State")}
                                                placeholder="Maharashtra"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.State}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">City <span className="req">*</span></label>
                                            <input
                                                className={`form-control ${shouldShowError("City") && addOrgErrors.City ? "is-invalid" : ""}`}
                                                value={addUser.City}
                                                onChange={(e) => {
                                                    markTouched("City");
                                                    setAddUser(p => ({ ...p, City: e.target.value }));
                                                }}
                                                onBlur={() => markTouched("City")}
                                                placeholder="Nagpur"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.City}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Area <span className="req">*</span></label>
                                            <input
                                                className={`form-control ${shouldShowError("Area") && addOrgErrors.Area ? "is-invalid" : ""}`}
                                                value={addUser.Area}
                                                onChange={(e) => {
                                                    markTouched("Area");
                                                    setAddUser(p => ({ ...p, Area: e.target.value }));
                                                }}
                                                onBlur={() => markTouched("Area")}
                                                placeholder="Hudkeshwar"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.Area}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Address <span className="req">*</span></label>
                                            <input
                                                className={`form-control ${shouldShowError("Address") && addOrgErrors.Address ? "is-invalid" : ""}`}
                                                value={addUser.Address}
                                                onChange={(e) => {
                                                    markTouched("Address");
                                                    setAddUser(p => ({ ...p, Address: e.target.value }));
                                                }}
                                                onBlur={() => markTouched("Address")}
                                                placeholder="Full address"
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.Address}</div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Status <span className="req">*</span></label>
                                            <select
                                                className={`form-select ${shouldShowError("Status") && addOrgErrors.Status ? "is-invalid" : ""}`}
                                                value={addUser.Status}
                                                onChange={(e) => {
                                                    markTouched("Status");
                                                    setAddUser(p => ({ ...p, Status: e.target.value }));
                                                }}
                                                onBlur={() => markTouched("Status")}
                                            >
                                                <option value="Y">Active (Y)</option>
                                                <option value="N">Inactive (N)</option>
                                            </select>
                                            <div className="invalid-feedback">{addOrgErrors.Status}</div>
                                        </div>

                                        {/* Logo upload */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Logo Image <span className="req">*</span></label>
                                            <input
                                                type="file"
                                                className={`form-control ${shouldShowError("LogoImg") && addOrgErrors.LogoImg ? "is-invalid" : ""}`}
                                                accept="image/*"
                                                onChange={(e) => {
                                                    markTouched("LogoImg");
                                                    const f = e.target.files?.[0] || null;

                                                    if (!f) {
                                                        setAddUser(p => ({ ...p, LogoImg: null }));
                                                        setLogoPreview("");
                                                        return;
                                                    }

                                                    const maxSize = 2 * 1024 * 1024;

                                                    if (f.size > maxSize) {
                                                        showPopup("warning", "Invalid File", "Logo image must be less than 2MB");
                                                        e.target.value = "";
                                                        setAddUser(p => ({ ...p, LogoImg: null }));
                                                        setLogoPreview("");
                                                        return;
                                                    }

                                                    setAddUser(p => ({ ...p, LogoImg: f }));
                                                    setLogoPreview(URL.createObjectURL(f));
                                                }}
                                                onBlur={() => markTouched("LogoImg")}
                                            />
                                            <div className="invalid-feedback">{addOrgErrors.LogoImg}</div>
                                        </div>

                                        {/* Logo preview */}
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold">Selected Image Preview</label>
                                            <div
                                                className="d-flex align-items-center justify-content-center h-100 rounded"
                                                style={{
                                                    minHeight: 120,
                                                    border: "1px dashed #ced4da",
                                                    background: "#f8f9fa",
                                                }}
                                            >
                                                {logoPreview ? (
                                                    <img
                                                        src={logoPreview}
                                                        alt="preview"
                                                        style={{
                                                            maxHeight: 100,
                                                            maxWidth: "100%",
                                                            objectFit: "contain",
                                                            borderRadius: 10,
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-secondary small">No image selected</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-12 d-flex flex-wrap gap-2 justify-content-end pt-2">
                                            <button type="reset" className="btn btn-outline-secondary" style={{ borderRadius: 14 }}>
                                                Reset
                                            </button>
                                            <button className="btn btn-outline-secondary" type="button" onClick={closeAddUserModal} style={{ borderRadius: 14 }}>
                                                Close
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-brand px-4"
                                                disabled={isSaveDisabled}
                                            >
                                                {confirmLoading
                                                    ? "Saving..."
                                                    : mode === "create"
                                                        ? "Save Organization"
                                                        : "Update Organization"}{" "}
                                                <i className="bi bi-check2 ms-2" />
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PopupAlert
                open={confirmOpen}
                type={popupType}
                title={popupTitle}
                message={confirmLoading ? "Please wait..." : popupMessage}
                onClose={closeConfirm}
                confirmMode={true}
                confirmText={confirmLoading ? "Saving..." : "Yes"}
                cancelText="No"
                onConfirm={async () => {
                    if (confirmLoading) return;
                    await pendingSubmitRef.current?.();
                }}
                onCancel={() => closeConfirm()}
            />

            <PopupAlert
                open={popupOpen}
                type={popupType}
                title={popupTitle}
                message={popupMessage}
                onClose={closePopup}
                autoCloseMs={2500}
            />
        </>
    );
}