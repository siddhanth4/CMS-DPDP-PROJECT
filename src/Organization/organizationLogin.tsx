import React, { useMemo, useState } from "react";
import { organizationLogin } from "../Api/Organization/organizationLogin";
import { useNavigate } from "react-router-dom";
import { PopupAlert } from "../Components/alert";

import "../Login.css"
import { useOrganizationAuth } from "../Context/organizationContext";
type Props = {
    onLogin?: (payload: {
        username: string;
        password: string;
        remember: boolean;
    }) => void;

    onForgotPassword?: () => void;


};

export default function OrganizationLogin({ onForgotPassword }: Props) {
    const { login } = useOrganizationAuth();
    const [tried, setTried] = useState(false);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);

    const [showPass, setShowPass] = useState(false);

    const year = useMemo(() => new Date().getFullYear(), []);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    // Optional: if you use bootstrap validation styles
    const usernameErr = tried && username.trim().length < 3;
    const passErr = tried && password.trim().length < 6;

    const navigate = useNavigate();

    const [popupOpen, setPopupOpen] = useState(false);
    const [popupType, setPopupType] = useState<"success" | "danger">("success");
    const [popupMessage, setPopupMessage] = useState("");


    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTried(true);
        setError("");

        if (username.trim().length < 3) return;
        if (password.trim().length < 6) return;

        try {
            setLoading(true);

            const data = await organizationLogin({
                UserName: username.trim(),
                Password: password,
            });

            login(data);

            // ✅ Show success popup
            setPopupType("success");
            setPopupMessage("Login successful! Redirecting...");
            setPopupOpen(true);

            // Redirect after 1.5 sec
            setTimeout(() => {
                navigate("/organization/OrganizationDashboard");
            }, 1500);

        } catch (err: any) {
            setPopupType("danger");
            setPopupMessage(err?.message || "Login failed");
            setPopupOpen(true);
        } finally {
            setLoading(false);
        }

    };




    const onReset = () => {
        setTried(false);
        setUsername("");
        setPassword("");
        setRemember(false);
        setShowPass(false);
    };

    return (
        <>
            <div className="wrap">
                {/* Top right theme toggle */}


                <div className="glass">
                    <div className="row g-0">
                        {/* Left info panel */}
                        <aside className="col-12 col-lg-5 side p-4 p-md-5">
                            <div className="d-flex align-items-center gap-3 mb-4 position-relative" style={{ zIndex: 1 }}>
                                <div className="brand">NJ</div>
                                <div className="lh-sm">
                                    <div className="fw-bold">NJ Softtech</div>
                                    <div className="text-secondary small">Admin Portal</div>
                                </div>
                            </div>

                            <div className="position-relative" style={{ zIndex: 1 }}>
                                <div className="text-uppercase fw-semibold small text-secondary">Secure Access</div>
                                <h1 className="display-6 fw-bold mb-2">Organization Login</h1>
                                <p className="text-secondary mb-4">
                                    Sign in to manage registrations, view submissions, and export data.
                                </p>

                                <div className="d-flex flex-wrap gap-2 mb-4">
                                    <span className="pill">
                                        <i className="bi bi-shield-check" /> Protected
                                    </span>
                                    <span className="pill">
                                        <i className="bi bi-person-lock" /> Admin only
                                    </span>
                                    <span className="pill">
                                        <i className="bi bi-clock-history" /> Activity logs
                                    </span>
                                </div>

                                <div className="divider" />

                                <div className="mini-note">If you don’t have access, contact the system administrator.</div>
                            </div>
                        </aside>

                        {/* Right login panel */}
                        <section className="col-12 col-lg-7 p-4 p-md-5">
                            <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                                <div>
                                    <div className="fw-bold fs-4">Welcome back</div>
                                    <div className="text-secondary">Enter your admin credentials to continue.</div>
                                </div>
                                <span className="badge rounded-pill text-bg-secondary align-self-start">Admin</span>
                            </div>

                            <form
                                id="OrganizationLoginForm"
                                className={`needs-validation ${tried ? "was-validated" : ""}`}
                                noValidate
                                onSubmit={onSubmit}
                                onReset={onReset}
                            >
                                <div className="row g-3">
                                    {/* Username */}
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            Username <span className="req">*</span>
                                        </label>

                                        <div className="input-group has-validation">
                                            <span
                                                className="input-group-text"
                                                style={{
                                                    borderRadius: "14px 0 0 14px",
                                                    borderColor: "var(--stroke)",
                                                }}
                                            >
                                                <i className="bi bi-person" />
                                            </span>

                                            <input
                                                id="adminUser"
                                                className={`form-control ${usernameErr ? "is-invalid" : ""}`}
                                                required
                                                minLength={3}
                                                placeholder="admin@njsofttech.com"
                                                style={{ borderRadius: "0 14px 14px 0" }}
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                            />

                                            <div className="invalid-feedback">Please enter your username/email.</div>
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">
                                            Password <span className="req">*</span>
                                        </label>

                                        <div className="input-group has-validation">
                                            <span
                                                className="input-group-text"
                                                style={{
                                                    borderRadius: "14px 0 0 14px",
                                                    borderColor: "var(--stroke)",
                                                }}
                                            >
                                                <i className="bi bi-key" />
                                            </span>

                                            <input
                                                id="adminPass"
                                                type={showPass ? "text" : "password"}
                                                className={`form-control ${passErr ? "is-invalid" : ""}`}
                                                required
                                                minLength={6}
                                                placeholder="Enter password"
                                                style={{ borderRadius: 0 }}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />

                                            <button
                                                id="togglePass"
                                                className="btn btn-outline-secondary icon-btn"
                                                type="button"
                                                aria-label={showPass ? "Hide password" : "Show password"}
                                                onClick={() => setShowPass((v) => !v)}
                                            >
                                                <i className={showPass ? "bi bi-eye-slash" : "bi bi-eye"} />
                                            </button>

                                            <div className="invalid-feedback">Please enter your password.</div>
                                        </div>

                                        <div className="mini-note mt-1">Minimum 6 characters.</div>
                                    </div>

                                    {error && (
                                        <div className="alert alert-danger py-2">
                                            {error}
                                        </div>
                                    )}


                                    {/* Remember / Forgot */}
                                    <div className="col-12">
                                        <div
                                            className="border rounded-4 p-3"
                                            style={{
                                                borderColor: "var(--stroke)",
                                                background: "color-mix(in oklab, var(--bs-body-bg) 92%, transparent 8%)",
                                            }}
                                        >
                                            <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center">
                                                <div className="form-check m-0">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="remember"
                                                        checked={remember}
                                                        onChange={(e) => setRemember(e.target.checked)}
                                                    />
                                                    <label className="form-check-label fw-semibold" htmlFor="remember">
                                                        Remember me
                                                    </label>
                                                    <div className="mini-note mt-1">Don’t use on public devices.</div>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="btn btn-link link-secondary text-decoration-none small p-0"
                                                    onClick={onForgotPassword}
                                                >
                                                    <i className="bi bi-question-circle" /> Forgot password?
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-12 d-flex flex-wrap gap-2 justify-content-between align-items-center pt-2">
                                        <div className="mini-note">
                                            <i className="bi bi-lock" /> Encrypted session.
                                        </div>

                                        <div className="d-flex gap-2">
                                            <button type="reset" className="btn btn-outline-secondary" style={{ borderRadius: 14 }}>
                                                Reset
                                            </button>

                                            <button
                                                type="submit"
                                                className="btn btn-brand px-4"
                                                disabled={loading}
                                            >
                                                {loading ? "Logging in..." : <>Login <i className="bi bi-arrow-right ms-2" /></>}
                                            </button>

                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="mini-note mt-4">© {year} NJ Softtech • Admin Portal</div>
                        </section>
                    </div>
                </div>
            </div>
            <PopupAlert
                open={popupOpen}
                type={popupType}
                title={popupType === "success" ? "Success" : "Login Failed"}
                message={popupMessage}
                autoCloseMs={2000}
                onClose={() => setPopupOpen(false)}
            />

        </>
    );
}
