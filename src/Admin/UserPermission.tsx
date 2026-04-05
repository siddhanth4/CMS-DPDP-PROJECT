import React, { useEffect, useMemo, useState } from "react";
import "../userpermission.css"

/* ========================= TYPES ========================= */
type CrudFlag = "Y" | "N";

export type PermissionNode = {
    id: number;
    parentId: number | null;
    name: string;
    pageName?: string;
    route?: string;
    icon?: string;
    orderBy?: number;
    enabled: CrudFlag;

    m_create: CrudFlag;
    m_view: CrudFlag;
    m_edit: CrudFlag;
    m_delete: CrudFlag;
};

type RoleRow = {
    roleId: number;
    roleName: string;
    description?: string;
    isActive: boolean;
};

type SavePayload = {

    roleId: number;
    permissions: PermissionNode[];
};

/* ========================= DEMO DATA ========================= */
const demoRoles: RoleRow[] = [
    { roleId: 1, roleName: "Admin", description: "All access", isActive: true },
    { roleId: 2, roleName: "Sales", description: "Leads & customer", isActive: true },
    { roleId: 3, roleName: "HR", description: "Employee modules", isActive: true },
    { roleId: 4, roleName: "Viewer", description: "Read only", isActive: true },
];

const demoPermissions: PermissionNode[] = [
    { id: 10, parentId: null, name: "Forms", icon: "bi bi-ui-checks-grid", route: "/forms", enabled: "Y", m_create: "Y", m_view: "Y", m_edit: "Y", m_delete: "N" },
    { id: 11, parentId: 10, name: "All Forms", route: "/forms", icon: "bi bi-list-ul", enabled: "Y", m_create: "Y", m_view: "Y", m_edit: "Y", m_delete: "Y" },
    { id: 12, parentId: 10, name: "Form Builder", route: "/forms/builder", icon: "bi bi-sliders", enabled: "Y", m_create: "Y", m_view: "Y", m_edit: "Y", m_delete: "N" },

    { id: 20, parentId: null, name: "Reports", icon: "bi bi-bar-chart", route: "/reports", enabled: "Y", m_create: "N", m_view: "Y", m_edit: "N", m_delete: "N" },
    { id: 21, parentId: 20, name: "Submission Report", route: "/reports/submissions", icon: "bi bi-file-earmark-text", enabled: "Y", m_create: "N", m_view: "Y", m_edit: "N", m_delete: "N" },

];

/* ========================= HELPERS ========================= */
const deepClone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const yn = (b: boolean): CrudFlag => (b ? "Y" : "N");
const isY = (v: CrudFlag) => v === "Y";

function buildTree(nodes: PermissionNode[]) {
    const map = new Map<number, PermissionNode & { children: PermissionNode[] }>();
    nodes.forEach((n) => map.set(n.id, { ...n, children: [] }));
    const roots: (PermissionNode & { children: PermissionNode[] })[] = [];
    map.forEach((n) => {
        if (n.parentId == null) roots.push(n);
        else map.get(n.parentId)?.children.push(n);
    });
    roots.sort((a, b) => (a.orderBy ?? a.id) - (b.orderBy ?? b.id));
    roots.forEach((r) => r.children.sort((a, b) => (a.orderBy ?? a.id) - (b.orderBy ?? b.id)));
    return { roots, map };
}

function applyToDescendants(all: PermissionNode[], nodeId: number, patch: Partial<PermissionNode>) {
    const { map } = buildTree(all);
    const out = deepClone(all);
    const outMap = new Map<number, PermissionNode>();
    out.forEach((n) => outMap.set(n.id, n));

    const walk = (id: number) => {
        const cur = outMap.get(id);
        if (!cur) return;
        Object.assign(cur, patch);
        const originalNode = map.get(id);
        originalNode?.children?.forEach((ch) => walk(ch.id));
    };

    walk(nodeId);
    return out;
}

function ensureParentEnabledIfChildEnabled(all: PermissionNode[], childId: number) {
    const map = new Map<number, PermissionNode>();
    all.forEach((n) => map.set(n.id, n));
    const out = deepClone(all);
    const outMap = new Map<number, PermissionNode>();
    out.forEach((n) => outMap.set(n.id, n));

    let cur = map.get(childId);
    while (cur?.parentId != null) {
        const parent = outMap.get(cur.parentId);
        if (!parent) break;
        parent.enabled = "Y";
        if (parent.m_view === "N") parent.m_view = "Y";
        cur = map.get(cur.parentId);
    }
    return out;
}

/* ========================= API PLACEHOLDERS ========================= */
async function apiGetRoles(): Promise<RoleRow[]> {
    await new Promise((r) => setTimeout(r, 150));
    return demoRoles;
}

async function apiGetRolePermissions(roleId: number): Promise<PermissionNode[]> {
    await new Promise((r) => setTimeout(r, 150));

    const base = deepClone(demoPermissions);

    if (roleId === 4) {
        return base.map((p) => ({ ...p, enabled: "Y", m_create: "N", m_view: "Y", m_edit: "N", m_delete: "N" }));
    }
    if (roleId === 2) {
        return base.map((p) => {
            if (p.id === 300 || p.parentId === 300) return { ...p, enabled: "N", m_create: "N", m_view: "N", m_edit: "N", m_delete: "N" };
            return p;
        });
    }
    return base;
}

async function apiSaveRolePermissions(payload: SavePayload): Promise<{ ok: boolean; message: string }> {
    console.log("SAVE PAYLOAD", payload);
    await new Promise((r) => setTimeout(r, 300));
    return { ok: true, message: "Permissions saved successfully." };
}

/* ========================= UI COMPONENT ========================= */
const UserRolePermissionPage: React.FC<{ ORG_CODE?: number }> = ({ ORG_CODE = 0 }) => {
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [roleSearch, setRoleSearch] = useState("");
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

    const [loadingPerms, setLoadingPerms] = useState(false);
    const [saving, setSaving] = useState(false);

    const [perms, setPerms] = useState<PermissionNode[]>([]);
    const [permSearch, setPermSearch] = useState("");

    const [toast, setToast] = useState<{ type: "success" | "danger"; msg: string } | null>(null);

    const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});

    console.log(loadingRoles);

    // set default open when perms load
    useEffect(() => {
        if (!perms.length) return;
        const { roots } = buildTree(perms);
        const next: Record<number, boolean> = {};
        roots.forEach((r) => (next[r.id] = true)); // open all modules by default
        setOpenGroups(next);
    }, [perms]);

    const toggleGroup = (id: number) => {
        setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    useEffect(() => {
        (async () => {
            setLoadingRoles(true);
            try {
                const data = await apiGetRoles();
                setRoles(data);
                if (data.length && selectedRoleId == null) setSelectedRoleId(data[0].roleId);
            } catch {
                setToast({ type: "danger", msg: "Failed to load roles." });
            } finally {
                setLoadingRoles(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ORG_CODE]);

    useEffect(() => {
        if (selectedRoleId == null) return;
        (async () => {
            setLoadingPerms(true);
            try {
                const data = await apiGetRolePermissions(selectedRoleId);
                setPerms(data);
            } catch {
                setToast({ type: "danger", msg: "Failed to load permissions." });
            } finally {
                setLoadingPerms(false);
            }
        })();
    }, [ORG_CODE, selectedRoleId]);

    const filteredRoles = useMemo(() => {
        const s = roleSearch.trim().toLowerCase();
        if (!s) return roles;
        return roles.filter(
            (r) =>
                r.roleName.toLowerCase().includes(s) ||
                (r.description ?? "").toLowerCase().includes(s) ||
                String(r.roleId).includes(s)
        );
    }, [roles, roleSearch]);


    const permSearchLower = permSearch.trim().toLowerCase();
    const visibleIds = useMemo(() => {
        if (!permSearchLower) return new Set<number>(perms.map((p) => p.id));
        const map = new Map<number, PermissionNode>();
        perms.forEach((p) => map.set(p.id, p));

        const keep = new Set<number>();
        perms.forEach((p) => {
            const hit =
                p.name.toLowerCase().includes(permSearchLower) ||
                (p.route ?? "").toLowerCase().includes(permSearchLower) ||
                (p.pageName ?? "").toLowerCase().includes(permSearchLower);
            if (hit) {
                keep.add(p.id);
                let cur = p;
                while (cur.parentId != null) {
                    keep.add(cur.parentId);
                    const parent = map.get(cur.parentId);
                    if (!parent) break;
                    cur = parent;
                }
            }
        });
        return keep;
    }, [perms, permSearchLower]);

    const selectedRole = useMemo(
        () => roles.find((r) => r.roleId === selectedRoleId) ?? null,
        [roles, selectedRoleId]
    );



    const setNode = (id: number, patch: Partial<PermissionNode>) => {
        setPerms((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    };

    const toggleEnabled = (id: number, checked: boolean, cascade: boolean) => {
        const patch: Partial<PermissionNode> = checked
            ? { enabled: "Y", m_view: "Y" }
            : { enabled: "N", m_create: "N", m_view: "N", m_edit: "N", m_delete: "N" };

        if (cascade) setPerms((prev) => applyToDescendants(prev, id, patch));
        else setPerms((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

        if (checked) setPerms((prev) => ensureParentEnabledIfChildEnabled(prev, id));
    };

    const toggleCrud = (
        id: number,
        key: "m_create" | "m_view" | "m_edit" | "m_delete",
        checked: boolean,
        cascade: boolean
    ) => {
        const patch: Partial<PermissionNode> = { [key]: yn(checked) } as any;

        if (checked) {
            patch.enabled = "Y";
            if (key !== "m_view") patch.m_view = "Y";
        } else {
            if (key === "m_view") {
                patch.enabled = "N";
                patch.m_create = "N";
                patch.m_edit = "N";
                patch.m_delete = "N";
            }
        }

        if (cascade) setPerms((prev) => applyToDescendants(prev, id, patch));
        else setNode(id, patch);

        if (checked) setPerms((prev) => ensureParentEnabledIfChildEnabled(prev, id));
    };

    const bulkSetAll = (mode: "full" | "readonly" | "none") => {
        if (mode === "full") {
            setPerms((prev) => prev.map((p) => ({ ...p, enabled: "Y", m_create: "Y", m_view: "Y", m_edit: "Y", m_delete: "Y" })));
        }
        if (mode === "readonly") {
            setPerms((prev) => prev.map((p) => ({ ...p, enabled: "Y", m_create: "N", m_view: "Y", m_edit: "N", m_delete: "N" })));
        }
        if (mode === "none") {
            setPerms((prev) => prev.map((p) => ({ ...p, enabled: "N", m_create: "N", m_view: "N", m_edit: "N", m_delete: "N" })));
        }
    };

    const onSave = async () => {
        if (selectedRoleId == null) {
            setToast({ type: "danger", msg: "Please select a role." });
            return;
        }
        setSaving(true);
        setToast(null);
        try {
            const payload: SavePayload = { roleId: selectedRoleId, permissions: perms };
            const res = await apiSaveRolePermissions(payload);
            setToast({ type: res.ok ? "success" : "danger", msg: res.message });
        } catch {
            setToast({ type: "danger", msg: "Save failed." });
        } finally {
            setSaving(false);
        }
    };

    const { roots: moduleRoots } = useMemo(() => buildTree(perms), [perms]);

    const renderRows = (node: PermissionNode & { children?: PermissionNode[] }, level: number) => {
        if (!visibleIds.has(node.id)) return null;

        const indentPx = level * 18;

        return (
            <React.Fragment key={node.id}>
                <div className="up-row">
                    <div className="up-pagecell" style={{ ["--indent" as any]: `${indentPx}px` }}>
                        <div className="up-indent" />
                        <i className={node.icon ?? "bi bi-dot"} />
                        <div style={{ minWidth: 0 }}>
                            <div className="name">{node.name}</div>
                            <div className="route">
                                {node.route ?? ""} {node.pageName ? `• ${node.pageName}` : ""}
                            </div>
                        </div>
                    </div>

                    <div className="up-enable">
                        <div className="form-check form-switch m-0">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={isY(node.enabled)}
                                onChange={(e) => toggleEnabled(node.id, e.target.checked, true)}
                                id={`en_${node.id}`}
                            />
                        </div>
                    </div>

                    <div className="up-crud">
                        <div className="form-check m-0 up-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={isY(node.m_create)}
                                disabled={!isY(node.enabled)}
                                onChange={(e) => toggleCrud(node.id, "m_create", e.target.checked, false)}
                                id={`c_${node.id}`}
                            />
                        </div>

                        <div className="form-check m-0 up-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={isY(node.m_view)}
                                disabled={!isY(node.enabled)}
                                onChange={(e) => toggleCrud(node.id, "m_view", e.target.checked, false)}
                                id={`v_${node.id}`}
                            />
                        </div>

                        <div className="form-check m-0 up-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={isY(node.m_edit)}
                                disabled={!isY(node.enabled)}
                                onChange={(e) => toggleCrud(node.id, "m_edit", e.target.checked, false)}
                                id={`e_${node.id}`}
                            />
                        </div>

                        <div className="form-check m-0 up-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={isY(node.m_delete)}
                                disabled={!isY(node.enabled)}
                                onChange={(e) => toggleCrud(node.id, "m_delete", e.target.checked, false)}
                                id={`d_${node.id}`}
                            />
                        </div>
                    </div>

                </div>

                {node.children?.map((ch) => renderRows(ch as any, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <>
            <div className="container-fluid app-shell">
                <div className="row g-0">
                    {/* Top Header Panel */}
                    <div className="panel mb-3">
                        <div className="panel-head p-3 d-flex align-items-start justify-content-between flex-wrap gap-2">
                            <div>
                                <div className="h5 mb-1">User Permissions</div>
                                <div className="text-secondary small">
                                    Role wise access for <b>Forms</b> & <b>Reports</b> • ORG_CODE: <b>{ORG_CODE}</b>
                                </div>
                            </div>

                            <div className="d-flex gap-2 flex-wrap">
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => bulkSetAll("readonly")}
                                    disabled={loadingPerms || saving}
                                >
                                    Read-only
                                </button>

                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => bulkSetAll("full")}
                                    disabled={loadingPerms || saving}
                                >
                                    Full
                                </button>

                                <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => bulkSetAll("none")}
                                    disabled={loadingPerms || saving}
                                >
                                    Disable
                                </button>

                                <button
                                    className="btn btn-brand btn-sm"
                                    onClick={onSave}
                                    disabled={saving || loadingPerms || selectedRoleId == null}
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Toast */}
                    {toast && (
                        <div className={`alert alert-${toast.type} py-2`} role="alert">
                            {toast.msg}
                        </div>
                    )}

                    {/* Content Panel */}
                    <div className="panel">
                        <div className="p-3">
                            <div className="row g-3">
                                {/* Roles */}
                                <div className="col-12 col-lg-4 col-xl-3">
                                    <div className="panel h-100">
                                        <div className="panel-head p-3">
                                            <div className="fw-bold">Roles</div>

                                            <div className="mt-2">
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text">
                                                        <i className="bi bi-search" />
                                                    </span>
                                                    <input
                                                        className="form-control"
                                                        value={roleSearch}
                                                        onChange={(e) => setRoleSearch(e.target.value)}
                                                        placeholder="Search role..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="list-group list-group-flush">
                                            {filteredRoles.map((r) => {
                                                const active = r.roleId === selectedRoleId;
                                                return (
                                                    <button
                                                        key={r.roleId}
                                                        className={`list-group-item list-group-item-action ${active ? "active" : ""
                                                            }`}
                                                        onClick={() => setSelectedRoleId(r.roleId)}
                                                    >
                                                        <div className="fw-bold">{r.roleName}</div>
                                                        <div className="small text-secondary">
                                                            ID: {r.roleId} {r.description ? `• ${r.description}` : ""}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div className="col-12 col-lg-8 col-xl-9">
                                    <div className="panel h-100">
                                        <div className="panel-head p-3 d-flex justify-content-between align-items-center">
                                            <div className="fw-bold">
                                                Permissions {selectedRole ? `• ${selectedRole.roleName}` : ""}
                                            </div>

                                            <div style={{ width: 320 }}>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text">
                                                        <i className="bi bi-filter" />
                                                    </span>
                                                    <input
                                                        className="form-control"
                                                        value={permSearch}
                                                        onChange={(e) => setPermSearch(e.target.value)}
                                                        placeholder="Search permissions..."
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 up-scroll">
                                            {loadingPerms ? (
                                                <div className="text-secondary">Loading permissions…</div>
                                            ) : (
                                                moduleRoots.map((module) => (
                                                    <div className="up-group" key={module.id}>
                                                        <div
                                                            className="up-group-head"
                                                            onClick={() => toggleGroup(module.id)}
                                                        >
                                                            <div className="up-group-title">
                                                                <i className={module.icon ?? "bi bi-folder"} />
                                                                {module.name}
                                                            </div>
                                                            <i
                                                                className={`bi ${openGroups[module.id]
                                                                    ? "bi-chevron-up"
                                                                    : "bi-chevron-down"
                                                                    }`}
                                                            />
                                                        </div>

                                                        {openGroups[module.id] && (
                                                            <>
                                                                {/* column header */}
                                                                <div className="up-row up-row-head">
                                                                    <div className="up-pagecell">
                                                                        <div className="up-row-title">Page / Menu</div>
                                                                    </div>

                                                                    <div className="up-enable up-center">
                                                                        <div className="up-row-title">Enabled</div>
                                                                    </div>

                                                                    {/* <div className="up-crud up-crud-head">
                                                                        <div className="up-row-title">Create</div>
                                                                        <div className="up-row-title">View</div>
                                                                        <div className="up-row-title">Edit</div>
                                                                        <div className="up-row-title">Delete</div>
                                                                    </div> */}
                                                                </div>

                                                                {/* rows */}
                                                                {module.children?.map((ch) => renderRows(ch as any, 0))}
                                                            </>
                                                        )}

                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );


};

export default UserRolePermissionPage;
