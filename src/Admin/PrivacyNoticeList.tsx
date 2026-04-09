import React, { useState, useEffect } from "react";
import { getNoticesList } from "../Api/noticeApi";

type NoticeStatus = "Draft" | "Published" | "Archived";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusBadge = (status: NoticeStatus | string) => {
    const s = status === "Draft" 
        ? { bg: "rgba(255,193,7,0.15)", color: "#ffc107", icon: "bi-pencil-square" }
        : status === "Archived"
        ? { bg: "rgba(108,117,125,0.2)", color: "#adb5bd", icon: "bi-archive" }
        : { bg: "rgba(25,135,84,0.15)", color: "#3dd68c", icon: "bi-broadcast" }; // Default to Published

    return (
        <span style={{ background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className={`bi ${s.icon}`} style={{ fontSize: 10 }} />
            {status || "Published"}
        </span>
    );
};

const completionBar = (done: number, total: number) => {
    const pct = total > 0 ? Math.round((done / total) * 100) : 100;
    const color = pct === 100 ? "#198754" : pct >= 60 ? "#ffc107" : "#dc3545";
    return (
        <div>
            <div className="d-flex justify-content-between mb-1">
                <span style={{ fontSize: 11, color: "#adb5bd" }}>{done || 10}/{total || 10} sections</span>
                <span style={{ fontSize: 11, color }}>{pct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
    onCreateNew?: () => void;
    onEdit?: (id: string) => void;
}

const PrivacyNoticeList: React.FC<Props> = ({ onCreateNew, onEdit }) => {
    const [notices, setNotices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | NoticeStatus>("All");
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // 👉 NEW: Fetch real notices from backend
    useEffect(() => {
        loadNotices();
    }, []);

    const loadNotices = async () => {
        try {
            setLoading(true);
            const res = await getNoticesList();
            console.log("Raw Notice List Data:", res);
            
            let data = [];
            if (res?.data) {
                data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            } else if (Array.isArray(res)) {
                data = res;
            }
            setNotices(data);
        } catch (err) {
            console.error("Error loading notices", err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = notices.filter((n) => {
        const name = n.noticeName || n.NoticeName || `Notice #${n.id}`;
        const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
        const nStatus = n.status || "Published";
        const matchStatus = statusFilter === "All" || nStatus === statusFilter;
        return matchSearch && matchStatus;
    });

    const handleDelete = (id: string) => {
        // TODO: Call delete API here if you have one
        setNotices((prev) => prev.filter((n) => n.id !== id));
        setDeleteConfirm(null);
    };

    const stats = {
        total: notices.length,
        published: notices.filter((n) => (n.status || "Published") === "Published").length,
        draft: notices.filter((n) => n.status === "Draft").length,
        archived: notices.filter((n) => n.status === "Archived").length,
        emailsSent: notices.reduce((sum, n) => sum + (n.emailsSent || 0), 0),
    };

    return (
        <>
            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="modal d-block" style={{ background: "rgba(0,0,0,0.65)", zIndex: 1055 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
                        <div className="modal-content" style={{ background: "var(--bs-body-bg, #0f1117)", border: "1px solid rgba(220,53,69,0.3)", borderRadius: 14 }}>
                            <div className="modal-body p-4 text-center">
                                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(220,53,69,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                    <i className="bi bi-trash3 text-danger fs-4" />
                                </div>
                                <h6 className="fw-bold mb-2">Delete Privacy Notice?</h6>
                                <p className="text-secondary small mb-4">This action cannot be undone.</p>
                                <div className="d-flex gap-2 justify-content-center">
                                    <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--bs-body-color)", minWidth: 80 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                                    <button className="btn btn-sm btn-danger" style={{ minWidth: 80 }} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container-fluid">
                <div className="panel mb-3">
                    <div className="panel-head p-3 d-flex flex-wrap gap-3 align-items-center justify-content-between">
                        <div>
                            <div className="h5 mb-1 d-flex align-items-center gap-2">
                                <i className="bi bi-files text-primary" /> Privacy Notices
                            </div>
                            <div className="text-secondary small">Manage DPDP Act, 2023 compliant privacy notices</div>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary" onClick={loadNotices}>
                                <i className="bi bi-arrow-clockwise" /> Refresh
                            </button>
                            <button className="btn btn-sm btn-primary d-flex align-items-center gap-2" onClick={onCreateNew}>
                                <i className="bi bi-plus-lg" /> Create New Notice
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="row g-3 mb-3">
                    {[
                        { label: "Total Notices", value: stats.total, icon: "bi-files", color: "#4f6ef7" },
                        { label: "Published", value: stats.published, icon: "bi-broadcast", color: "#3dd68c" },
                        { label: "Drafts", value: stats.draft, icon: "bi-pencil-square", color: "#ffc107" },
                        { label: "Emails Sent", value: stats.emailsSent, icon: "bi-envelope-check", color: "#5ac8fa" },
                    ].map((s) => (
                        <div key={s.label} className="col-6 col-md-3">
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

                {/* Table */}
                <div className="panel">
                    {loading ? (
                        <div className="text-center py-5 text-secondary"><div className="spinner-border spinner-border-sm me-2"/> Loading notices...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-5 text-secondary" style={{ fontSize: 14 }}>
                            <i className="bi bi-file-earmark-x mb-2 d-block" style={{ fontSize: 36, opacity: 0.3 }} />
                            No privacy notices found
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th style={{ minWidth: 240 }}>Notice</th>
                                        <th style={{ minWidth: 100 }}>Status</th>
                                        <th style={{ minWidth: 130 }}>Completion</th>
                                        <th style={{ minWidth: 120, textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((n, i) => (
                                        <tr key={n.id || i}>
                                            <td>
                                                <div className="d-flex align-items-start gap-2">
                                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(79,110,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        <i className="bi bi-file-earmark-lock2 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold" style={{ fontSize: 13 }}>
                                                            {n.noticeName || n.NoticeName || `Notice #${n.id || i}`}
                                                        </div>
                                                        <div className="text-secondary" style={{ fontSize: 11 }}>
                                                            ID: {n.id || "N/A"} · v{n.version || "1.0"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{statusBadge(n.status || "Published")}</td>
                                            <td>{completionBar(n.sectionsCompleted, n.totalSections)}</td>
                                            <td>
                                                <div className="d-flex gap-1 justify-content-end">
                                                    <button className="btn btn-sm" style={{ background: "rgba(220,53,69,0.1)", border: "none", color: "#f86e7a", padding: "4px 8px", fontSize: 12 }} title="Delete" onClick={() => setDeleteConfirm(n.id)}>
                                                        <i className="bi bi-trash3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PrivacyNoticeList;