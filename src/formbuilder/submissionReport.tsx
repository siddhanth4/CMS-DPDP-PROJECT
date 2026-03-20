import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "bootstrap";
import { useProject } from "../Context/projectContext";
import type { FormResponseParsed } from "../Api/getFormResponseById";

type RangeFilter = "All" | "Today" | "Last 7 days" | "Last 30 days";
type SortFilter = "Newest first" | "Oldest first";

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

export default function SubmissionsReport() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const formId = Number(params.get("form") || 0);
    // const formName = params.get("name") || "Registration Form";

    const {
        formResponses,
        formResponsesLoading,
        formResponsesError,
        fetchFormResponsesByFormId,
    } = useProject();

    const [search, setSearch] = useState("");
    const [range, setRange] = useState<RangeFilter>("All");
    const [sort, setSort] = useState<SortFilter>("Newest first");

    const [selected, setSelected] = useState<FormResponseParsed | null>(null);

    // ✅ Bootstrap modal refs
    const modalElRef = useRef<HTMLDivElement | null>(null);
    const modalInstanceRef = useRef<Modal | null>(null);

    useEffect(() => {
        if (!modalElRef.current) return;
        modalInstanceRef.current = new Modal(modalElRef.current, {
            backdrop: true,
            keyboard: true,
            focus: true,
        });
        return () => {
            modalInstanceRef.current?.dispose();
            modalInstanceRef.current = null;
        };
    }, []);

    useEffect(() => {
        const el = modalElRef.current;
        if (!el) return;
        const onHidden = () => setSelected(null);
        el.addEventListener("hidden.bs.modal", onHidden);
        return () => el.removeEventListener("hidden.bs.modal", onHidden);
    }, []);

    // const openModal = (row: FormResponseParsed) => {
    //     setSelected(row);
    //     requestAnimationFrame(() => modalInstanceRef.current?.show());
    // };

    // ✅ fetch list when formId changes
    useEffect(() => {
        if (!formId) return;
        fetchFormResponsesByFormId(formId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formId]);

    const filteredSorted = useMemo(() => {
        let rows = [...formResponses];

        const s = search.trim().toLowerCase();
        if (s) {
            rows = rows.filter(
                (x) =>
                    (x.EmailId || "").toLowerCase().includes(s) ||
                    (x.MobileNo || "").toLowerCase().includes(s) ||
                    (x.Status || "").toLowerCase().includes(s) ||
                    String(x.Id).includes(s)
            );
        }

        rows = rows.filter((x) => withinRange(x.CreatedOn, range));

        rows.sort((a, b) => {
            const da = new Date(a.CreatedOn).getTime();
            const db = new Date(b.CreatedOn).getTime();
            return sort === "Newest first" ? db - da : da - db;
        });

        return rows;
    }, [formResponses, search, range, sort]);

    return (
        <>
            <div className="container-fluid app-shell">
                <div className="row g-0">
                    {/* Topbar */}
                    <div className="panel mb-3">
                        <div className="panel-head p-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div>
                                <div className="h5 mb-1">Submissions</div>
                                {/* <div className="text-secondary small">
                                    Form: <span className="badge badge-soft rounded-pill">{formName}</span>
                                </div> */}
                            </div>

                            <div className="d-flex gap-2 align-items-center">
                                <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => navigate("/forms")}>
                                    <i className="bi bi-arrow-left" /> Back
                                </button>
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
                                    placeholder="Search (email, mobile, status, id)"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="d-flex gap-2">
                                <select className="form-select search" style={{ maxWidth: 190 }} value={range}
                                    onChange={(e) => setRange(e.target.value as RangeFilter)}>
                                    <option>All</option>
                                    <option>Today</option>
                                    <option>Last 7 days</option>
                                    <option>Last 30 days</option>
                                </select>

                                <select className="form-select search" style={{ maxWidth: 190 }} value={sort}
                                    onChange={(e) => setSort(e.target.value as SortFilter)}>
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
                            {formResponsesLoading && <div className="text-secondary">Loading...</div>}
                            {formResponsesError && <div className="alert alert-danger mb-3">{formResponsesError}</div>}

                            <div className="table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: 110 }}>ID</th>
                                            <th>Email</th>
                                            <th>Mobile</th>
                                            <th>Created</th>
                                            <th>Status</th>
                                            {/* <th className="text-end" style={{ minWidth: 150 }}>Actions</th> */}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredSorted.map((row) => (
                                            <tr key={row.Id}>
                                                <td className="fw-semibold">{row.Id}</td>
                                                <td className="text-secondary">{row.EmailId || "-"}</td>
                                                <td className="text-secondary">{row.MobileNo || "-"}</td>
                                                <td className="text-secondary">
                                                    {new Date(row.CreatedOn).toLocaleString()}
                                                </td>
                                                <td>
                                                    <span className={`badge rounded-pill ${row.Status === "Y" ? "text-bg-success" : "text-bg-secondary"}`}>
                                                        {row.Status}
                                                    </span>
                                                </td>

                                                {/* <td className="text-end">
                                                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => openModal(row)}>
                                                        <i className="bi bi-eye" /> View
                                                    </button>
                                                </td> */}
                                            </tr>
                                        ))}

                                        {!formResponsesLoading && filteredSorted.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="text-center text-secondary py-5">
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

            {/* ✅ Modal */}
            <div ref={modalElRef} className="modal fade" id="viewModal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Submission Details</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                        </div>

                        <div className="modal-body">
                            {!selected ? (
                                <div className="text-secondary">No data</div>
                            ) : (
                                <>
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <div className="text-secondary small fw-semibold">Email</div>
                                            <div className="fw-semibold">{selected.EmailId || "-"}</div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="text-secondary small fw-semibold">Mobile</div>
                                            <div className="fw-semibold">{selected.MobileNo || "-"}</div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="text-secondary small fw-semibold">IP</div>
                                            <div className="fw-semibold">{selected.IPAddress || "-"}</div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="text-secondary small fw-semibold">Created</div>
                                            <div className="fw-semibold">{new Date(selected.CreatedOn).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="text-secondary small fw-semibold mb-2">FormResponse (JSON)</div>
                                    <pre className="bg-light p-3 rounded" style={{ maxHeight: 420, overflow: "auto" }}>
                                        {JSON.stringify(selected.FormResponse, null, 2)}
                                    </pre>
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outline-secondary" data-bs-dismiss="modal">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
