import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Modal } from "bootstrap";

/* ================= TYPES ================= */
type SubmissionStatus = "Valid" | "Needs Review" | "Rejected";

type SubmissionRow = {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    submitted: string;
    submittedDateISO: string;
    status: SubmissionStatus;
    notes?: string;
};

type RangeFilter = "All" | "Today" | "Last 7 days" | "Last 30 days";
type SortFilter = "Newest first" | "Oldest first";

/* ================= DEMO DATA ================= */
const demoSubmissions: SubmissionRow[] = [
    {
        id: "SUB-10291",
        fullName: "Sachin A",
        email: "sachin@example.com",
        phone: "+91 99999 99999",
        submitted: "Feb 09, 2026 • 10:42 AM",
        submittedDateISO: "2026-02-09T10:42:00",
        status: "Valid",
        notes: "Looking forward to the event.",
    },
    {
        id: "SUB-10290",
        fullName: "Riya P",
        email: "riya@example.com",
        phone: "+91 88888 88888",
        submitted: "Feb 09, 2026 • 10:10 AM",
        submittedDateISO: "2026-02-09T10:10:00",
        status: "Needs Review",
        notes: "Please verify details.",
    },
];

const statusBadgeClass = (s: SubmissionStatus): string => {
    if (s === "Valid") return "badge text-bg-success rounded-pill";
    if (s === "Needs Review") return "badge text-bg-warning rounded-pill";
    return "badge text-bg-danger rounded-pill";
};

const avatarText = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
    return (a + b).toUpperCase();
};

const withinRange = (iso: string, range: RangeFilter) => {
    if (range === "All") return true;

    const d = new Date(iso);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (range === "Today") return d >= startOfToday;

    const days = range === "Last 7 days" ? 7 : 30;
    const from = new Date(now);
    from.setDate(now.getDate() - days);
    return d >= from;
};

export default function AllFormReport() {
    // const navigate = useNavigate();
    const [params] = useSearchParams();

    const formName = params.get("name") || "Registration Form";

    const [search, setSearch] = useState("");
    const [range, setRange] = useState<RangeFilter>("All");
    const [sort, setSort] = useState<SortFilter>("Newest first");

    const [selected, setSelected] = useState<SubmissionRow | null>(null);

    // ✅ Bootstrap modal refs
    const modalElRef = useRef<HTMLDivElement | null>(null);
    const modalInstanceRef = useRef<Modal | null>(null);

    // ✅ init modal once
    useEffect(() => {
        if (!modalElRef.current) return;

        modalInstanceRef.current = new Modal(modalElRef.current, {
            backdrop: true,
            keyboard: true,
            focus: true,
        });

        // cleanup
        return () => {
            modalInstanceRef.current?.dispose();
            modalInstanceRef.current = null;
        };
    }, []);

    // ✅ close modal when user clicks X/backdrop/esc
    useEffect(() => {
        const el = modalElRef.current;
        if (!el) return;

        const onHidden = () => setSelected(null);
        el.addEventListener("hidden.bs.modal", onHidden);

        return () => el.removeEventListener("hidden.bs.modal", onHidden);
    }, []);

    const openModal = (row: SubmissionRow) => {
        setSelected(row);
        // show after state update paints
        requestAnimationFrame(() => {
            modalInstanceRef.current?.show();
        });
    };

    const closeModal = () => {
        modalInstanceRef.current?.hide(); // triggers hidden event -> selected null
    };

    const filteredSorted = useMemo(() => {
        let rows = [...demoSubmissions];

        const s = search.trim().toLowerCase();
        if (s) {
            rows = rows.filter(
                (x) =>
                    x.fullName.toLowerCase().includes(s) ||
                    x.email.toLowerCase().includes(s) ||
                    x.status.toLowerCase().includes(s) ||
                    x.id.toLowerCase().includes(s)
            );
        }

        rows = rows.filter((x) => withinRange(x.submittedDateISO, range));

        rows.sort((a, b) => {
            const da = new Date(a.submittedDateISO).getTime();
            const db = new Date(b.submittedDateISO).getTime();
            return sort === "Newest first" ? db - da : da - db;
        });

        return rows;
    }, [search, range, sort]);

    return (
        <>
            <div className="container-fluid app-shell">
                <div className="row g-0">
                    {/* Topbar */}
                    <div className="panel mb-3">
                        <div className="panel-head p-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div>
                                <div className="h5 mb-1">Submissions</div>
                                <div className="text-secondary small">
                                    Form: <span className="badge badge-soft rounded-pill">{formName}</span>
                                </div>
                            </div>


                        </div>

                        {/* Filters */}
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
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="panel">
                        <div className="panel-head p-3 d-flex align-items-center justify-content-between">
                            <div className="fw-bold">Filled Data</div>
                            <span className="badge badge-soft rounded-pill">Total: {filteredSorted.length}</span>
                        </div>

                        <div className="p-3">
                            <div className="table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: 240 }}>User</th>
                                            <th>Email</th>
                                            <th>Submitted</th>
                                            <th>Status</th>
                                            <th className="text-end" style={{ minWidth: 240 }}>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredSorted.map((row) => (
                                            <tr key={row.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="avatar">{avatarText(row.fullName)}</div>
                                                        <div>
                                                            <div className="fw-semibold">{row.fullName}</div>
                                                            <div className="text-secondary small">ID: {row.id}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="text-secondary">{row.email}</td>
                                                <td className="text-secondary">{row.submitted}</td>

                                                <td>
                                                    <span className={statusBadgeClass(row.status)}>{row.status}</span>
                                                </td>

                                                <td className="text-end">
                                                    <button
                                                        className="btn btn-outline-secondary btn-sm me-2"
                                                        type="button"
                                                        onClick={() => openModal(row)}
                                                    >
                                                        <i className="bi bi-eye" /> View
                                                    </button>

                                                    <button
                                                        className="btn btn-outline-secondary btn-sm me-2"
                                                        type="button"
                                                        onClick={() => console.log("Print", row.id)}
                                                    >
                                                        <i className="bi bi-printer" /> Print
                                                    </button>

                                                    <button
                                                        className="btn btn-outline-danger btn-sm"
                                                        type="button"
                                                        onClick={() => console.log("Delete", row.id)}
                                                    >
                                                        <i className="bi bi-trash" /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredSorted.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center text-secondary py-5">
                                                    No submissions found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* ✅ Bootstrap JS Modal */}
            <div
                ref={modalElRef}
                className="modal fade"
                id="viewModal"
                tabIndex={-1}
                aria-hidden="true"
            >
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div
                        className="modal-content"
                        style={{
                            border: "1px solid var(--stroke)",
                            background: "color-mix(in oklab, var(--bs-body-bg) 92%, transparent 8%)",
                        }}
                    >
                        <div className="modal-header" style={{ borderBottom: "1px solid var(--stroke)" }}>
                            <h5 className="modal-title">Submission Details</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                        </div>

                        <div className="modal-body">
                            {!selected ? (
                                <div className="text-secondary">No data</div>
                            ) : (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="text-secondary small fw-semibold">Full Name</div>
                                        <div className="fw-semibold">{selected.fullName}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="text-secondary small fw-semibold">Email</div>
                                        <div className="fw-semibold">{selected.email}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="text-secondary small fw-semibold">Phone</div>
                                        <div className="fw-semibold">{selected.phone || "-"}</div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="text-secondary small fw-semibold">Submitted</div>
                                        <div className="fw-semibold">{selected.submitted}</div>
                                    </div>
                                    <div className="col-12">
                                        <div className="text-secondary small fw-semibold">Notes</div>
                                        <div className="fw-semibold">{selected.notes || "-"}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer" style={{ borderTop: "1px solid var(--stroke)" }}>
                            <button className="btn btn-outline-secondary" data-bs-dismiss="modal">
                                Close
                            </button>

                            <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={() => selected && console.log("Print", selected.id)}
                            >
                                <i className="bi bi-printer" /> Print
                            </button>

                            <button
                                className="btn btn-outline-danger"
                                type="button"
                                onClick={() => {
                                    selected && console.log("Delete", selected.id);
                                    closeModal();
                                }}
                            >
                                <i className="bi bi-trash" /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
