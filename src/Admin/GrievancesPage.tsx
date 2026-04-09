import React, { useEffect, useMemo, useState } from "react";
import { getGrievanceList, resolveGrievance } from "../Api/grievance";


/* ══════════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════════ */

type GrievancePriority = "Low" | "Medium" | "High" | "Critical";
type GrievanceStatus   = "Open" | "In Progress" | "Resolved" | "Closed";
type GrievanceType     =
    | "Data Access Request"
    | "Data Correction Request"
    | "Data Deletion / Erasure"
    | "Consent Withdrawal"
    | "Data Breach Concern"
    | "Unauthorised Processing"
    | "Data Portability"
    | "Other";

type RangeFilter = "All" | "Today" | "Last 7 days" | "Last 30 days";

interface Resolution {
    text: string;
    resolvedBy: string;
    resolvedAt: string;
}

interface Grievance {
    Id: number;
    ConsentId: string;
    UserName: string;
    UserEmail: string;
    UserMobile: string;
    IssueType: GrievanceType;
    IssueDescription: string;
    Priority: GrievancePriority;
    Status: GrievanceStatus;
    FiledOn: string;          // ISO string
    FormName: string;
    Resolution?: Resolution | null;
}

/* ══════════════════════════════════════════════════════════════════════
   DEMO DATA  (replace with real API call)
══════════════════════════════════════════════════════════════════════ */

const DEMO_GRIEVANCES: Grievance[] = [
    {
        Id: 1001,
        ConsentId: "CMP-1718000001-A3F9B",
        UserName: "Ravi Kumar",
        UserEmail: "ravi.kumar@example.com",
        UserMobile: "9876543210",
        IssueType: "Data Deletion / Erasure",
        IssueDescription:
            "I have previously submitted my data via the registration form on 12 May 2024. I now wish to exercise my right to erasure under Section 12 of the DPDP Act, 2023. Please delete all personal data associated with my Consent ID at the earliest.",
        Priority: "High",
        Status: "Open",
        FiledOn: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        FormName: "Customer Registration Form",
        Resolution: null,
    },
    {
        Id: 1002,
        ConsentId: "CMP-1718000002-B7C1D",
        UserName: "Priya Sharma",
        UserEmail: "priya.sharma@example.com",
        UserMobile: "9123456780",
        IssueType: "Data Correction Request",
        IssueDescription:
            "My date of birth was entered incorrectly in the form. The correct date is 14 March 1992 but it currently shows 14 March 1982. I request an immediate correction as this discrepancy is causing issues in verification.",
        Priority: "Medium",
        Status: "In Progress",
        FiledOn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        FormName: "Employee Onboarding Form",
        Resolution: null,
    },
    {
        Id: 1003,
        ConsentId: "CMP-1718000003-C2E5F",
        UserName: "Amitabh Nair",
        UserEmail: "amitabh.nair@example.com",
        UserMobile: "9988776655",
        IssueType: "Consent Withdrawal",
        IssueDescription:
            "I wish to withdraw my consent for the processing of my personal data effective immediately. I had provided consent on 1 April 2024 for the purpose of the vendor KYC form but no longer wish to participate.",
        Priority: "High",
        Status: "Resolved",
        FiledOn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        FormName: "Vendor KYC Form",
        Resolution: {
            text: "Consent has been successfully withdrawn from our system. All personal data processing activities related to this Data Principal have been halted. A confirmation email has been dispatched to the registered email address.",
            resolvedBy: "DPO — Meena Joshi",
            resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
    },
    {
        Id: 1004,
        ConsentId: "CMP-1718000004-D9A2E",
        UserName: "Sunita Patel",
        UserEmail: "sunita.patel@example.com",
        UserMobile: "9765432109",
        IssueType: "Data Breach Concern",
        IssueDescription:
            "I received an unsolicited marketing email from a third party that contained my personal information. I suspect a data breach and request an immediate investigation.",
        Priority: "Critical",
        Status: "Open",
        FiledOn: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        FormName: "Health Data Collection Form",
        Resolution: null,
    },
    {
        Id: 1005,
        ConsentId: "CMP-1718000005-E4F8C",
        UserName: "Mohammed Ansari",
        UserEmail: "m.ansari@example.com",
        UserMobile: "9654321098",
        IssueType: "Data Access Request",
        IssueDescription:
            "Under Section 11 of the DPDP Act, 2023, I wish to access all personal data you hold about me in a structured, commonly used, and machine-readable format. Please provide within the statutory timeline.",
        Priority: "Low",
        Status: "Closed",
        FiledOn: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        FormName: "Customer Registration Form",
        Resolution: {
            text: "A complete data export has been emailed to the registered email address in JSON and PDF formats. The request has been fulfilled within the statutory 30-day timeline under DPDP Act, 2023.",
            resolvedBy: "Admin — Rajesh Mehta",
            resolvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
    },
    {
        Id: 1006,
        ConsentId: "CMP-1718000006-F1B3A",
        UserName: "Kavita Desai",
        UserEmail: "kavita.desai@example.com",
        UserMobile: "9543210987",
        IssueType: "Unauthorised Processing",
        IssueDescription:
            "I was not informed that my data would be shared with a marketing partner. This was not mentioned in the privacy notice I agreed to. I consider this unauthorised processing under the DPDP Act.",
        Priority: "Critical",
        Status: "In Progress",
        FiledOn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        FormName: "Job Application Form",
        Resolution: null,
    },
];

/* ══════════════════════════════════════════════════════════════════════
   HELPERS / SMALL COMPONENTS
══════════════════════════════════════════════════════════════════════ */

const priorityConfig: Record<GrievancePriority, { bg: string; color: string; dot: string }> = {
    Low:      { bg: "rgba(25,135,84,0.12)",  color: "#3dd68c", dot: "#3dd68c" },
    Medium:   { bg: "rgba(255,193,7,0.12)",  color: "#ffc107", dot: "#ffc107" },
    High:     { bg: "rgba(253,126,20,0.15)", color: "#fd8c3a", dot: "#fd8c3a" },
    Critical: { bg: "rgba(220,53,69,0.15)",  color: "#f86e7a", dot: "#dc3545" },
};

const statusConfig: Record<GrievanceStatus, { bg: string; color: string; icon: string }> = {
    "Open":        { bg: "rgba(13,202,240,0.12)",  color: "#5ac8fa", icon: "bi-circle"              },
    "In Progress": { bg: "rgba(255,193,7,0.12)",   color: "#ffc107", icon: "bi-arrow-repeat"         },
    "Resolved":    { bg: "rgba(25,135,84,0.12)",   color: "#3dd68c", icon: "bi-check-circle"         },
    "Closed":      { bg: "rgba(108,117,125,0.15)", color: "#adb5bd", icon: "bi-x-circle"             },
};

const PriorityBadge: React.FC<{ p: GrievancePriority }> = ({ p }) => {
    const c = priorityConfig[p];
    return (
        <span style={{
            background: c.bg, color: c.color,
            padding: "3px 10px", borderRadius: 20,
            fontSize: 11, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 5,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
            {p}
        </span>
    );
};

const StatusBadge: React.FC<{ s: GrievanceStatus }> = ({ s }) => {
    const c = statusConfig[s];
    return (
        <span style={{
            background: c.bg, color: c.color,
            padding: "3px 10px", borderRadius: 20,
            fontSize: 11, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 5,
        }}>
            <i className={`bi ${c.icon}`} style={{ fontSize: 10 }} />
            {s}
        </span>
    );
};

const withinRange = (iso: string, range: RangeFilter) => {
    if (range === "All") return true;
    const d    = new Date(iso);
    const now  = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (range === "Today") return d >= startOfToday;
    const days = range === "Last 7 days" ? 7 : 30;
    const from = new Date(now);
    from.setDate(now.getDate() - days);
    return d >= from;
};

const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)   return "Just now";
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
};

/* ══════════════════════════════════════════════════════════════════════
   RESOLVE PANEL  (inline below the row when expanded)
══════════════════════════════════════════════════════════════════════ */

const ResolvePanel: React.FC<{
    grievance: Grievance;
    onResolve: (id: number, text: string, resolvedBy: string) => void;
    onClose: () => void;
}> = ({ grievance, onResolve, onClose }) => {
    const [resText, setResText]           = useState(grievance.Resolution?.text ?? "");
    const [resolvedBy, setResolvedBy]     = useState(grievance.Resolution?.resolvedBy ?? "");
    const [resTextErr, setResTextErr]     = useState("");
    const [resolvedByErr, setResolvedByErr] = useState("");
    const [saving, setSaving]             = useState(false);

    const alreadyResolved = grievance.Status === "Resolved" || grievance.Status === "Closed";

    const handleSubmit = async () => {
        let valid = true;
        if (!resText.trim()) { setResTextErr("Resolution note is required."); valid = false; }
        else setResTextErr("");
        if (!resolvedBy.trim()) { setResolvedByErr("Resolved by is required."); valid = false; }
        else setResolvedByErr("");
        if (!valid) return;

        setSaving(true);
        // simulate network delay — replace with real API call
        await new Promise((r) => setTimeout(r, 600));
        onResolve(grievance.Id, resText.trim(), resolvedBy.trim());
        setSaving(false);
    };

    return (
        <div
            style={{
                borderTop: "1px solid rgba(255,255,255,0.07)",
                padding: "20px 24px",
                background: "rgba(79,110,247,0.04)",
                animation: "fadeIn .15s ease",
            }}
        >
            {/* Section heading */}
            <div className="d-flex align-items-center gap-2 mb-3">
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: alreadyResolved ? "rgba(25,135,84,0.15)" : "rgba(79,110,247,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <i className={`bi ${alreadyResolved ? "bi-check-circle text-success" : "bi-pencil-square text-primary"}`} />
                </div>
                <div>
                    <div className="fw-semibold" style={{ fontSize: 14 }}>
                        {alreadyResolved ? "Resolution Details" : "Resolve Grievance"}
                    </div>
                    <div className="text-secondary" style={{ fontSize: 11 }}>
                        Grievance ID: <span style={{ fontFamily: "monospace" }}>GRV-{grievance.Id}</span>
                        {" · "}Consent: <span style={{ fontFamily: "monospace" }}>{grievance.ConsentId}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#adb5bd", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
                    title="Close"
                >
                    <i className="bi bi-x" />
                </button>
            </div>

            {/* Original issue summary */}
            <div className="mb-3 p-3" style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.07)",
                fontSize: 13,
            }}>
                <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    <span className="fw-semibold text-secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Issue Filed By</span>
                    <span className="fw-semibold">{grievance.UserName}</span>
                    <span className="text-secondary">·</span>
                    <span className="text-secondary" style={{ fontFamily: "monospace", fontSize: 11 }}>{grievance.UserEmail}</span>
                    <span className="text-secondary">·</span>
                    <span style={{ fontSize: 11, color: "#adb5bd" }}>{fmt(grievance.FiledOn)}</span>
                </div>
                <div style={{ color: "#ced4da", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {grievance.IssueDescription}
                </div>
            </div>

            {/* Resolution form */}
            <div className="row g-3">
                <div className="col-12">
                    <label className="form-label small fw-semibold">
                        Resolution Note <span className="text-danger">*</span>
                    </label>
                    <textarea
                        className={`form-control ${resTextErr ? "is-invalid" : ""}`}
                        rows={5}
                        placeholder="Describe the resolution steps taken. Be specific — this will be shared with the Data Principal and stored as an audit record under DPDP Act, 2023..."
                        value={resText}
                        readOnly={alreadyResolved}
                        style={{
                            fontSize: 13,
                            lineHeight: 1.7,
                            resize: "vertical",
                            background: alreadyResolved ? "rgba(255,255,255,0.03)" : undefined,
                        }}
                        onChange={(e) => {
                            setResText(e.target.value);
                            if (e.target.value.trim()) setResTextErr("");
                        }}
                    />
                    {resTextErr && <div className="invalid-feedback d-block">{resTextErr}</div>}
                </div>

                <div className="col-md-6">
                    <label className="form-label small fw-semibold">
                        Resolved By (Name / Designation) <span className="text-danger">*</span>
                    </label>
                    <input
                        className={`form-control ${resolvedByErr ? "is-invalid" : ""}`}
                        placeholder="e.g., DPO — Meena Joshi"
                        value={resolvedBy}
                        readOnly={alreadyResolved}
                        style={{ fontSize: 13, background: alreadyResolved ? "rgba(255,255,255,0.03)" : undefined }}
                        onChange={(e) => {
                            setResolvedBy(e.target.value);
                            if (e.target.value.trim()) setResolvedByErr("");
                        }}
                    />
                    {resolvedByErr && <div className="invalid-feedback d-block">{resolvedByErr}</div>}
                </div>

                {alreadyResolved && grievance.Resolution?.resolvedAt && (
                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">Resolved At</label>
                        <input
                            className="form-control"
                            readOnly
                            value={fmt(grievance.Resolution.resolvedAt)}
                            style={{ fontSize: 13, background: "rgba(255,255,255,0.03)" }}
                        />
                    </div>
                )}
            </div>

            {/* Footer */}
            {!alreadyResolved && (
                <div className="d-flex gap-2 mt-3">
                    <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "var(--bs-body-color)",
                        }}
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                            background: saving ? "rgba(25,135,84,0.3)" : "linear-gradient(135deg,#198754,#28a745)",
                            border: "none",
                            color: "#fff",
                            minWidth: 120,
                        }}
                        disabled={saving}
                        onClick={handleSubmit}
                    >
                        {saving ? (
                            <><span className="spinner-border spinner-border-sm me-2" />Resolving...</>
                        ) : (
                            <><i className="bi bi-check2-circle me-2" />Mark as Resolved</>
                        )}
                    </button>
                </div>
            )}

            {alreadyResolved && (
                <div className="mt-3 d-flex align-items-center gap-2" style={{ fontSize: 12, color: "#3dd68c" }}>
                    <i className="bi bi-shield-check" />
                    This grievance has been resolved and the audit record is stored.
                </div>
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════
   GRIEVANCE ROW
══════════════════════════════════════════════════════════════════════ */

const GrievanceRow: React.FC<{
    g: Grievance;
    isExpanded: boolean;
    onToggle: (id: number) => void;
    onResolve: (id: number, text: string, resolvedBy: string) => void;
}> = ({ g, isExpanded, onToggle, onResolve }) => {
    const isResolved = g.Status === "Resolved" || g.Status === "Closed";

    return (
        <div
            style={{
                border: `1px solid ${isExpanded ? "rgba(79,110,247,0.35)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12,
                overflow: "hidden",
                background: isExpanded ? "rgba(79,110,247,0.04)" : "rgba(255,255,255,0.015)",
                transition: "border-color 0.2s, background 0.2s",
                marginBottom: 12,
            }}
        >
            {/* ── Row header ─────────────────────────────────────────── */}
            <div
                style={{ padding: "14px 18px", cursor: "pointer" }}
                onClick={() => onToggle(g.Id)}
            >
                <div className="d-flex flex-wrap align-items-start gap-3">

                    {/* Left: ID + type */}
                    <div style={{ minWidth: 0, flex: "1 1 240px" }}>
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <span style={{
                                fontFamily: "monospace", fontSize: 11,
                                color: "#7c9ff7", background: "rgba(79,110,247,0.12)",
                                padding: "1px 8px", borderRadius: 4,
                            }}>
                                GRV-{g.Id}
                            </span>
                            <span style={{
                                fontSize: 11, fontWeight: 600,
                                color: "#adb5bd", background: "rgba(255,255,255,0.06)",
                                padding: "1px 8px", borderRadius: 4,
                            }}>
                                {g.IssueType}
                            </span>
                        </div>
                        <div className="fw-semibold" style={{ fontSize: 14, lineHeight: 1.4 }}>
                            {g.IssueDescription.length > 90
                                ? g.IssueDescription.slice(0, 90) + "…"
                                : g.IssueDescription}
                        </div>
                        <div className="d-flex align-items-center gap-1 mt-1" style={{ fontSize: 12, color: "#adb5bd" }}>
                            <i className="bi bi-link-45deg text-primary" />
                            {g.FormName}
                        </div>
                    </div>

                    {/* Right: meta chips */}
                    <div className="d-flex flex-wrap gap-2 align-items-center" style={{ flexShrink: 0 }}>
                        <PriorityBadge p={g.Priority} />
                        <StatusBadge s={g.Status} />

                        <div style={{ fontSize: 12, color: "#adb5bd", textAlign: "right" }}>
                            <div><i className="bi bi-person me-1" />{g.UserName}</div>
                            <div style={{ fontFamily: "monospace", fontSize: 11 }}>{timeAgo(g.FiledOn)}</div>
                        </div>

                        {/* Resolve CTA  */}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggle(g.Id); }}
                            style={{
                                padding: "5px 14px",
                                borderRadius: 20,
                                border: "none",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                background: isResolved
                                    ? "rgba(25,135,84,0.12)"
                                    : "rgba(79,110,247,0.18)",
                                color: isResolved ? "#3dd68c" : "#7c9ff7",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                transition: "background 0.15s",
                            }}
                        >
                            <i className={`bi ${isResolved ? "bi-eye" : "bi-check2-circle"}`} />
                            {isResolved ? "View" : "Resolve"}
                        </button>

                        <i
                            className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"}`}
                            style={{ color: "#6c757d", fontSize: 13 }}
                        />
                    </div>
                </div>

                {/* Consent + user meta strip */}
                <div className="d-flex flex-wrap gap-3 mt-2" style={{ fontSize: 11, color: "#6c757d" }}>
                    <span>
                        <i className="bi bi-fingerprint me-1 text-primary" />
                        <span style={{ fontFamily: "monospace" }}>{g.ConsentId}</span>
                    </span>
                    <span><i className="bi bi-envelope me-1" />{g.UserEmail}</span>
                    <span><i className="bi bi-phone me-1" />{g.UserMobile}</span>
                    <span><i className="bi bi-calendar3 me-1" />{fmt(g.FiledOn)}</span>
                </div>
            </div>

            {/* ── Resolve Panel (expanded) ─────────────────────────── */}
            {isExpanded && (
                <ResolvePanel
                    grievance={g}
                    onResolve={onResolve}
                    onClose={() => onToggle(g.Id)}
                />
            )}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════ */

const GrievancesPage: React.FC = () => {
    const [grievances, setGrievances] = useState<Grievance[]>(DEMO_GRIEVANCES);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState("");

    // Filters
    const [search, setSearch]         = useState("");
    const [rangeFilter, setRangeFilter] = useState<RangeFilter>("All");
    const [statusFilter, setStatusFilter] = useState<GrievanceStatus | "All">("All");
    const [priorityFilter, setPriorityFilter] = useState<GrievancePriority | "All">("All");
    const [typeFilter, setTypeFilter] = useState<GrievanceType | "All">("All");

    // Expanded row
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // ── Fetch (wire to your API) ──────────────────────────────────────
    useEffect(() => {
        const fetchGrievances = async () => {

            const json = await getGrievanceList({ pageNumber: 1, pageSize: 50 });
            if (json.responseCode === 101) setGrievances(json.data);
            else throw new Error(json.responseMessage);


            setLoading(true);
            setError("");
            try {
                // TODO: replace with real API
                // const baseUrl = import.meta.env.VITE_API_BASE_URL;
                // const apiKey  = import.meta.env.VITE_API_KEY;
                // const orgCode = localStorage.getItem("ORGCODE") || "";
                // const res = await fetch(`${baseUrl}/api/Grievance/GetList`, {
                //     headers: { "X-API-KEY": apiKey, "X-ORG-CODE": orgCode },
                // });
                // const json = await res.json();
                // if (json.responseCode === 101) setGrievances(json.data);
                // else throw new Error(json.responseMessage);

                // Using demo data for now
                await new Promise((r) => setTimeout(r, 400));
                setGrievances(DEMO_GRIEVANCES);
            } catch (err: any) {
                setError(err?.message || "Failed to load grievances");
            } finally {
                setLoading(false);
            }
        };

        fetchGrievances();
    }, []);

    // ── Filtered + sorted list ────────────────────────────────────────
    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        return grievances
            .filter((g) => {
                if (s) {
                    const haystack = [
                        g.UserName, g.UserEmail, g.UserMobile,
                        g.ConsentId, g.IssueType, g.IssueDescription,
                        g.FormName, String(g.Id),
                    ].join(" ").toLowerCase();
                    if (!haystack.includes(s)) return false;
                }
                if (statusFilter   !== "All" && g.Status   !== statusFilter)   return false;
                if (priorityFilter !== "All" && g.Priority !== priorityFilter) return false;
                if (typeFilter     !== "All" && g.IssueType !== typeFilter)    return false;
                if (!withinRange(g.FiledOn, rangeFilter))                      return false;
                return true;
            })
            .sort((a, b) => {
                const pOrd: Record<GrievancePriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
                if (pOrd[a.Priority] !== pOrd[b.Priority]) return pOrd[a.Priority] - pOrd[b.Priority];
                return new Date(b.FiledOn).getTime() - new Date(a.FiledOn).getTime();
            });
    }, [grievances, search, statusFilter, priorityFilter, typeFilter, rangeFilter]);

    // ── Stats ─────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total:      grievances.length,
        open:       grievances.filter((g) => g.Status === "Open").length,
        inProgress: grievances.filter((g) => g.Status === "In Progress").length,
        resolved:   grievances.filter((g) => g.Status === "Resolved" || g.Status === "Closed").length,
        critical:   grievances.filter((g) => g.Priority === "Critical").length,
    }), [grievances]);

    // ── Handlers ──────────────────────────────────────────────────────
    const toggleExpand = (id: number) =>
        setExpandedId((prev) => (prev === id ? null : id));

    const handleResolve = (id: number, text: string, resolvedBy: string) => {
        setGrievances((prev) =>
            prev.map((g) =>
                g.Id !== id ? g : {
                    ...g,
                    Status: "Resolved" as GrievanceStatus,
                    Resolution: {
                        text,
                        resolvedBy,
                        resolvedAt: new Date().toISOString(),
                    },
                }
            )
        );
        // TODO: call real API
        // await fetch(`${baseUrl}/api/Grievance/Resolve`, {
        //     method: "PUT",
        //     headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
        //     body: JSON.stringify({ GrievanceId: id, ResolutionNote: text, ResolvedBy: resolvedBy }),
        // });
        setExpandedId(null);
    };

    const ISSUE_TYPES: GrievanceType[] = [
        "Data Access Request", "Data Correction Request", "Data Deletion / Erasure",
        "Consent Withdrawal", "Data Breach Concern", "Unauthorised Processing",
        "Data Portability", "Other",
    ];

    /* ── Render ────────────────────────────────────────────────────── */
    return (
        <div className="app-container">

            {/* ── Page header ────────────────────────────────────────── */}
            <div className="panel mb-3">
                <div className="panel-head p-3 d-flex flex-wrap gap-3 align-items-center justify-content-between">
                    <div>
                        <div className="h5 mb-1 d-flex align-items-center gap-2">
                            <i className="bi bi-exclamation-octagon text-warning" />
                            Grievances
                        </div>
                        <div className="text-secondary small">
                            Manage Data Principal grievances under Chapter IV of the DPDP Act, 2023
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-sm"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--bs-body-color)" }}
                            onClick={() => window.location.reload()}
                        >
                            <i className="bi bi-arrow-clockwise me-1" />Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stats row ─────────────────────────────────────────── */}
            <div className="row g-3 mb-3">
                {[
                    { label: "Total Grievances", value: stats.total,      icon: "bi-collection",          color: "#4f6ef7" },
                    { label: "Open",              value: stats.open,       icon: "bi-circle",              color: "#5ac8fa" },
                    { label: "In Progress",       value: stats.inProgress, icon: "bi-arrow-repeat",        color: "#ffc107" },
                    { label: "Resolved",          value: stats.resolved,   icon: "bi-check-circle",        color: "#3dd68c" },
                    { label: "Critical",          value: stats.critical,   icon: "bi-exclamation-octagon", color: "#f86e7a" },
                ].map((s) => (
                    <div key={s.label} className="col-6 col-md-4 col-xl">
                        <div className="stat-card">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <div className="text-secondary small" style={{ fontWeight: 500 }}>{s.label}</div>
                                    <div className="stat-value">{s.value}</div>
                                </div>
                                <div className="stat-icon" style={{ background: `${s.color}22`, color: s.color }}>
                                    <i className={`bi ${s.icon} fs-5`} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── DPDP compliance note ──────────────────────────────── */}
            <div className="mb-3 p-3" style={{
                background: "rgba(255,193,7,0.06)",
                borderRadius: 10,
                border: "1px solid rgba(255,193,7,0.15)",
                fontSize: 13,
            }}>
                <i className="bi bi-info-circle me-2 text-warning" />
                <strong>DPDP Act, 2023 — Section 13:</strong> Every Data Fiduciary must establish an accessible mechanism for Data Principals to file grievances. Grievances must be redressed within a reasonable timeframe. Unresolved grievances may be escalated to the Data Protection Board of India.
            </div>

            {/* ── Filters panel ─────────────────────────────────────── */}
            <div className="panel mb-3">
                <div className="p-3 d-flex flex-wrap gap-2 align-items-center">

                    {/* Search */}
                    <div className="input-group input-group-sm" style={{ maxWidth: 320, flex: "1 1 200px" }}>
                        <span className="input-group-text search"><i className="bi bi-search" /></span>
                        <input
                            className="form-control search"
                            placeholder="Search name, email, consent ID, issue..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => setSearch("")}>
                                <i className="bi bi-x" />
                            </button>
                        )}
                    </div>

                    {/* Status */}
                    <select
                        className="form-select form-select-sm search"
                        style={{ maxWidth: 150 }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="All">All Status</option>
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                        <option>Closed</option>
                    </select>

                    {/* Priority */}
                    <select
                        className="form-select form-select-sm search"
                        style={{ maxWidth: 150 }}
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value as any)}
                    >
                        <option value="All">All Priority</option>
                        <option>Critical</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>

                    {/* Type */}
                    <select
                        className="form-select form-select-sm search"
                        style={{ maxWidth: 210 }}
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                    >
                        <option value="All">All Issue Types</option>
                        {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>

                    {/* Date range */}
                    <select
                        className="form-select form-select-sm search"
                        style={{ maxWidth: 150 }}
                        value={rangeFilter}
                        onChange={(e) => setRangeFilter(e.target.value as RangeFilter)}
                    >
                        <option>All</option>
                        <option>Today</option>
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                    </select>

                    <span className="ms-auto text-secondary small">
                        {filtered.length} grievance{filtered.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* ── List ──────────────────────────────────────────────── */}
            <div>
                {loading && (
                    <div className="text-center py-5 text-secondary">
                        <div className="spinner-border spinner-border-sm me-2" />
                        Loading grievances...
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="panel text-center py-5 text-secondary">
                        <i className="bi bi-check2-all d-block mb-2" style={{ fontSize: 36, opacity: 0.3 }} />
                        <div className="fw-semibold">No grievances found</div>
                        <div className="small mt-1">Try adjusting your filters</div>
                    </div>
                )}

                {!loading && filtered.map((g) => (
                    <GrievanceRow
                        key={g.Id}
                        g={g}
                        isExpanded={expandedId === g.Id}
                        onToggle={toggleExpand}
                        onResolve={handleResolve}
                    />
                ))}
            </div>

            {/* ── Pagination placeholder ────────────────────────────── */}
            {!loading && filtered.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3 text-secondary small">
                    <span>Showing {filtered.length} of {grievances.length} grievances</span>
                    <div className="d-flex gap-1">
                        {/* Wire real pagination from your API pageNumber / pageSize here */}
                        <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--bs-body-color)" }} disabled>
                            <i className="bi bi-chevron-left" />
                        </button>
                        <button className="btn btn-sm" style={{ background: "rgba(79,110,247,0.2)", border: "1px solid rgba(79,110,247,0.3)", color: "#7c9ff7" }}>1</button>
                        <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--bs-body-color)" }} disabled>
                            <i className="bi bi-chevron-right" />
                        </button>
                    </div>
                </div>
            )}

            {/* Inline animation keyframe */}
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
};

export default GrievancesPage;