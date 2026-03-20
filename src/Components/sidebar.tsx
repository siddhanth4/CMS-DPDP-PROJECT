import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useOrganizationAuth } from "../Context/organizationContext";
import { useProject } from "../Context/projectContext";

type Props = {
    onClose: () => void;
    onNav?: () => void;
};

const menuIconClass = (icon: string) => {
    switch ((icon || "").toLowerCase()) {
        case "dashboard":
            return "bi-speedometer2";
        case "admin_panel":
            return "bi-person";
        case "form":
            return "bi-ui-checks-grid";
        case "list":
            return "bi-list-check";
        case "organization":
            return "bi-building";
        default:
            return "bi-circle";
    }
};

const Sidebar: React.FC<Props> = ({ onClose, onNav }) => {
    const location = useLocation();

    const {
        logout,
        isAuthenticated: isOrgAuthenticated,
    } = useOrganizationAuth();

    const {
        logoutAdmin,
        isAdminAuthenticated,
        menus,
        menusLoading,
        adminMenus,
        adminMenusLoading,
    } = useProject();

    const pathname = location.pathname.toLowerCase();

    const isAdminRoute = pathname.startsWith("/admin");
    const isOrgRoute = pathname.startsWith("/organization");

    const sidebarMode: "admin" | "organization" | "none" = useMemo(() => {
        // route should always win
        if (isAdminRoute) return "admin";
        if (isOrgRoute) return "organization";

        // fallback only if exactly one auth is active
        if (isAdminAuthenticated && !isOrgAuthenticated) return "admin";
        if (isOrgAuthenticated && !isAdminAuthenticated) return "organization";

        return "none";
    }, [isAdminRoute, isOrgRoute, isAdminAuthenticated, isOrgAuthenticated]);

    const allowedPageIds = useMemo(() => {
        return new Set((adminMenus || []).map((x) => Number(x.PageId)));
    }, [adminMenus]);

    const visibleAdminMenus = useMemo(() => {
        return (menus || [])
            .filter((m) => allowedPageIds.has(Number(m.Id)))
            .filter(
                (m) =>
                    String(m.PageKey || "").toUpperCase() !==
                    "VIEW_CONSENT_WITHDRAW_REQUEST"
            )
            .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder));
    }, [menus, allowedPageIds]);
    const loadingAdminMenu = menusLoading || adminMenusLoading;

    return (
        <aside className="sidebar p-3">
            <button
                className="btn btn-outline-secondary btn-sm d-lg-none mb-3"
                onClick={onClose}
                type="button"
            >
                <i className="bi bi-x-lg" />
            </button>

            <div className="d-flex align-items-center gap-3 p-2 panel">
                <div className="brand-badge">FF</div>
                <div>
                    <div className="fw-bold">NJ Softtech</div>
                    <div className="text-secondary small">
                        {sidebarMode === "admin"
                            ? "Admin Panel"
                            : sidebarMode === "organization"
                                ? "Organization"
                                : ""}
                    </div>
                </div>
            </div>

            <div className="mt-3 nav nav-pills flex-column gap-2">
                {sidebarMode === "organization" && (
                    <>
                        <NavLink
                            to="/organization/OrganizationDashboard"
                            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                            onClick={onNav}
                        >
                            <i className="bi bi-speedometer2 me-2" />
                            Dashboard
                        </NavLink>

                        <NavLink
                            to="/organization/addOrganization"
                            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                            onClick={onNav}
                        >
                            <i className="bi bi-building me-2" />
                            Organization
                        </NavLink>

                        <button
                            className="btn btn-danger mt-2"
                            onClick={logout}
                            type="button"
                        >
                            Logout
                        </button>
                    </>
                )}

                {sidebarMode === "admin" && (
                    <>
                        {loadingAdminMenu ? (
                            <div className="text-secondary small px-2 py-1">
                                Loading menu...
                            </div>
                        ) : (
                            visibleAdminMenus.map((m) => (
                                <NavLink
                                    key={m.Id}
                                    to={m.Route}
                                    className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                                    onClick={onNav}
                                    id={m.PageKey}
                                >
                                    <i className={`bi ${menuIconClass(m.Icon)} me-2`} />
                                    {m.PageName}
                                </NavLink>
                            ))
                        )}

                        <button
                            className="btn btn-danger mt-2"
                            onClick={logoutAdmin}
                            type="button"
                        >
                            Logout
                        </button>
                    </>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;