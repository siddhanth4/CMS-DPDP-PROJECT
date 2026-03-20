import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOrganizationAuth } from "./Context/organizationContext";
import { useProject } from "./Context/projectContext";

type Props = {
    children: React.ReactNode;
    type?: "organization" | "admin";
};

const Loader = () => (
    <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh" }}
    >
        <div className="spinner-border" role="status" />
    </div>
);

const ProtectedRoute: React.FC<Props> = ({
    children,
    type = "organization",
}) => {
    const location = useLocation();

    const { isAuthenticated, authLoading } = useOrganizationAuth();
    const { isAdminAuthenticated, adminAuthLoading } = useProject();

    if (type === "admin") {
        if (adminAuthLoading) return <Loader />;

        if (!isAdminAuthenticated) {
            return (
                <Navigate
                    to="/admin/AdminLogin"
                    replace
                    state={{ from: location }}
                />
            );
        }

        return <>{children}</>;
    }

    if (authLoading) return <Loader />;

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/organization/organizationLogin"
                replace
                state={{ from: location }}
            />
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;