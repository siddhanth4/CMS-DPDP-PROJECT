import React, { useMemo } from "react";


type StatCard = {
    label: string;
    value: number | string;
    note: React.ReactNode;
    iconClass: string;
};

type ActivityBadge = "New" | "Edit" | "User";
type ActivityRow = {
    badge: ActivityBadge;
    text: string;
    user: string;
    form: string; // "—" allowed
    time: string;
};

type Props = {
    totalUsers?: number;
    totalForms?: number;
    totalResponses?: number;
    totalPublished?: number;
    onRefresh?: () => void;

    // Recent Activity (optional)
    activities?: ActivityRow[];

    // Status Breakdown (optional)
    publishedCount?: number;
    draftCount?: number;
    archivedCount?: number;
};

const badgeClass = (b: ActivityBadge) => {
    if (b === "New") return "badge text-bg-success rounded-pill me-2";
    if (b === "Edit") return "badge text-bg-warning rounded-pill me-2";
    return "badge text-bg-secondary rounded-pill me-2";
};

export default function Dashboard({
    totalUsers = 0,
    totalForms = 0,
    totalResponses = 0,
    totalPublished = 0,


    activities,
    publishedCount = 40,
    draftCount = 15,
    archivedCount = 30,
}: Props) {
    const stats: StatCard[] = [
        {
            label: "Total Users",
            value: totalUsers,
            note: (
                <>
                    <i className="bi bi-arrow-up-right" /> +12 this month
                </>
            ),
            iconClass: "bi bi-people fs-5",
        },
        {
            label: "Total Forms",
            value: totalForms,
            note: (
                <>
                    <i className="bi bi-plus-circle" /> +2 created
                </>
            ),
            iconClass: "bi bi-ui-checks-grid fs-5",
        },
        {
            label: "Total Form Responses",
            value: totalResponses,
            note: (
                <>
                    <i className="bi bi-inbox" /> +46 today
                </>
            ),
            iconClass: "bi bi-chat-square-text fs-5",
        },
        {
            label: "Total Published Forms",
            value: totalPublished,
            note: (
                <>
                    <i className="bi bi-broadcast" /> Active
                </>
            ),
            iconClass: "bi bi-rocket-takeoff fs-5",
        },
    ];

    const demoActivities: ActivityRow[] = [
        { badge: "New", text: "Submission received", user: "rita.k@domain.com", form: "Registration Form", time: "2 min ago" },
        { badge: "Edit", text: "Form updated", user: "admin@njsofttech.com", form: "Job Application", time: "1 hr ago" },
        { badge: "User", text: "New user created", user: "rahul@domain.com", form: "—", time: "Today" },
        { badge: "New", text: "Submission received", user: "neha@domain.com", form: "Customer Feedback", time: "Yesterday" },
    ];

    const rows = activities?.length ? activities : demoActivities;

    const totalStatus = publishedCount + draftCount + archivedCount;

    const pct = (n: number) => {
        if (totalStatus <= 0) return 0;
        return Math.round((n / totalStatus) * 100);
    };

    const publishedPct = useMemo(() => pct(publishedCount), [publishedCount, totalStatus]);
    const draftPct = useMemo(() => pct(draftCount), [draftCount, totalStatus]);
    const archivedPct = useMemo(() => pct(archivedCount), [archivedCount, totalStatus]);

    return (
        <>
            <div className="container-fluid app-shell">
                <div className="row g-0">
                    {/* Topbar */}
                    <div className="panel mb-3">
                        <div className="panel-head p-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div>
                                <div className="h5 mb-1">Organization Dashboard</div>
                                <div className="text-secondary small">Overview of your platform metrics</div>
                            </div>


                        </div>
                    </div>

                    {/* Stats */}
                    <div className="row g-3 mb-3">
                        {stats.map((s) => (
                            <div key={s.label} className="col-12 col-md-6 col-xl-3">
                                <div className="stat-card">
                                    <div className="d-flex align-items-start justify-content-between">
                                        <div>
                                            <div className="text-secondary small font700">{s.label}</div>
                                            <div className="stat-value">{s.value}</div>
                                            <div className="mini-note mt-1">{s.note}</div>
                                        </div>
                                        <div className="stat-icon">
                                            <i className={s.iconClass} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Two panels row */}
                    <div className="row g-3">
                        {/* Recent Activity */}
                        <div className="col-12 col-xl-7">
                            <div className="panel">
                                <div className="panel-head p-3 d-flex align-items-center justify-content-between">
                                    <div className="fw-bold">Recent Activity</div>
                                    <span className="badge badge-soft rounded-pill">Live</span>
                                </div>

                                <div className="p-3">
                                    <div className="table-responsive">
                                        <table className="table align-middle mb-0">
                                            <thead>
                                                <tr>
                                                    <th style={{ minWidth: 220 }}>Event</th>
                                                    <th>User</th>
                                                    <th>Form</th>
                                                    <th className="text-end">Time</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {rows.map((r, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <span className={badgeClass(r.badge)}>{r.badge}</span>
                                                            {r.text}
                                                        </td>
                                                        <td className="text-secondary">{r.user}</td>
                                                        <td className={r.form === "—" ? "text-secondary" : "fw-semibold"}>{r.form}</td>
                                                        <td className="text-end text-secondary">{r.time}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Breakdown */}
                        <div className="col-12 col-xl-5">
                            <div className="panel">
                                <div className="panel-head p-3 d-flex align-items-center justify-content-between">
                                    <div className="fw-bold">Status Breakdown</div>
                                    <span className="badge badge-soft rounded-pill">Forms</span>
                                </div>

                                <div className="p-3">
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="text-secondary">Published</div>
                                        <div className="fw-semibold">
                                            <span>{publishedCount}</span>
                                        </div>
                                    </div>
                                    <div className="progress mb-3" role="progressbar" aria-label="Published percent">
                                        <div className="progress-bar" style={{ width: `${publishedPct}%` }} />
                                    </div>

                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="text-secondary">Draft</div>
                                        <div className="fw-semibold">
                                            <span>{draftCount}</span>
                                        </div>
                                    </div>
                                    <div className="progress mb-3" role="progressbar" aria-label="Draft percent">
                                        <div className="progress-bar" style={{ width: `${draftPct}%` }} />
                                    </div>

                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <div className="text-secondary">Archived</div>
                                        <div className="fw-semibold">
                                            <span>{archivedCount}</span>
                                        </div>
                                    </div>
                                    <div className="progress" role="progressbar" aria-label="Archived percent">
                                        <div className="progress-bar" style={{ width: `${archivedPct}%` }} />
                                    </div>

                                    <div className="mini-note mt-3">
                                        Connect these numbers to your API response (forms summary).
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
