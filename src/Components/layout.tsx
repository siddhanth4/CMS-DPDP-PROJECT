import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Sidebar from "./sidebar";
import FormHeader from "./header";

import FormBuilder from "../formbuilder/formbuilder";
import FormsPage from "../formbuilder/formReport";
import SubmissionsReport from "../formbuilder/submissionReport";
// import AllFormReport from "../Admin/AllFormReport";
// import UserRolePermissionPage from "../Admin/UserPermission";
import Dashboard from "../Admin/Dashboard";
import AdminLogin from "../Admin/AdminLogin";
import PublicFormView from "../formbuilder/publicForm";
import OrganizationLogin from "../Organization/organizationLogin";
import AddOrganization from "../Organization/addOrganization";
import ProtectedRoute from "../protectedRoute";
import OrganizationDashboard from "../Organization/OrganizationDashboard";
import AddAdmin from "../Admin/AddAdmin";
import MyFormDetails from "../formbuilder/myFormDetail";
import ConsentWithdrawRequest from "../formbuilder/consentWithdrawReport";

const Layout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const standalonePaths = [
        "/admin/AdminLogin",
        "/organization/organizationLogin",
        "/PublicFormView",
        "/myFormDetails",
    ];

    const isStandalonePage = standalonePaths.includes(location.pathname);

    // ✅ Standalone pages (no sidebar/header)
    if (isStandalonePage) {
        return (
            <Routes>
                <Route path="/admin/AdminLogin" element={<AdminLogin />} />
                <Route path="/organization/organizationLogin" element={<OrganizationLogin />} />
                <Route path="/PublicFormView" element={<PublicFormView />} />
                <Route path="/myFormDetails" element={<MyFormDetails />} />

                {/* ✅ page not found without sidebar */}
                <Route
                    path="*"
                    element={
                        <div className="container py-5">
                            <div className="alert alert-warning mb-0">Page not found</div>
                        </div>
                    }
                />
            </Routes>
        );
    }

    // ✅ Normal layout
    return (
        <div className="app-shell">
            {sidebarOpen && (
                <div
                    className="sidebar-backdrop d-lg-none"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="app-layout">
                <div className={`sidebar-wrapper ${sidebarOpen ? "open" : ""}`}>
                    <Sidebar
                        onClose={() => setSidebarOpen(false)}
                        onNav={() => setSidebarOpen(false)}
                    />
                </div>

                <main className="app-main">

                    <div className="builder-host">
                        <Routes>
                            {/* organization Route */}
                            <Route
                                path="/organization/addOrganization"
                                element={
                                    <ProtectedRoute type="organization">
                                        <AddOrganization />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/organization/OrganizationDashboard"
                                element={
                                    <ProtectedRoute type="organization">
                                        <OrganizationDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Admin Route */}
                            <Route
                                path="/admin/dashboard"
                                element={
                                    <ProtectedRoute type="admin">
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admin/addAdmin"
                                element={
                                    <ProtectedRoute type="admin">
                                        <AddAdmin />
                                    </ProtectedRoute>
                                }
                            />

                            {/* <Route
                                path="/admin/userPermissions"
                                element={
                                    <ProtectedRoute type="admin">
                                        <UserRolePermissionPage />
                                    </ProtectedRoute>
                                }
                            /> */}

                            {/* <Route
                                path="/admin/allforms"
                                element={
                                    <ProtectedRoute type="admin">
                                        <AllFormReport />
                                    </ProtectedRoute>
                                }
                            /> */}

                            {/* sub-admin/user Route */}
                            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="/builder" element={<FormBuilder />} />
                            <Route path="/forms" element={<FormsPage />} />
                            <Route path="/submissions" element={<SubmissionsReport />} />
                            <Route path="/withdrawRequest" element={<ConsentWithdrawRequest />} />

                            {/* ✅ page not found with sidebar for normal pages */}
                            {/* <Route
                                path="*"
                                element={<div className="p-4 text-secondary">Page not found</div>}
                            /> */}
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;