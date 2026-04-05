import { useEffect, useMemo, useState } from "react";
import { useProject } from "../Context/projectContext";
import { Skeleton } from "../Components/loader";
import { PopupAlert } from "../Components/alert";
import { addConsentRemoveRequestAction } from "../Api/addRemoveConsentRequestAction";

const TableSkeletonRows: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={`sk_${i}`}>
                    <td>
                        <Skeleton height={16} width="70%" />
                        <div className="mt-2">
                            <Skeleton height={12} width="50%" />
                        </div>
                    </td>

                    <td>
                        <Skeleton height={14} width={120} />
                    </td>

                    <td>
                        <Skeleton height={14} width={120} />
                    </td>

                    <td>
                        <Skeleton height={18} width={90} radius={50} />
                    </td>

                    <td>
                        <Skeleton height={18} width={90} radius={50} />
                    </td>

                    <td>
                        <Skeleton height={14} width={120} />
                    </td>

                    <td className="text-end">
                        <Skeleton height={32} width={100} radius={8} />
                    </td>
                </tr>
            ))}
        </>
    );
};

type RequestStatusUI = "All" | "Pending" | "Resolved";
type SortUI = "Newest" | "Oldest";

const formatDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const safeString = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
};

const badgeClass = (type: "success" | "warning" | "secondary" | "danger") => {
    if (type === "success") return "badge text-bg-success rounded-pill";
    if (type === "warning") return "badge text-bg-warning rounded-pill";
    if (type === "danger") return "badge text-bg-danger rounded-pill";
    return "badge text-bg-secondary rounded-pill";
};

const getConsentBadge = (value?: string) => {
    return value === "Y"
        ? { text: "Withdraw Requested", className: badgeClass("warning") }
        : { text: "No Request", className: badgeClass("secondary") };
};

const getResolvedBadge = (value?: string) => {
    return value === "Y"
        ? { text: "Resolved", className: badgeClass("success") }
        : { text: "Pending", className: badgeClass("danger") };
};

export default function ConsentWithdrawRequest() {
    const {
        consentRemoveRequests,
        consentRemoveRequestsTotal,
        consentRemoveRequestsLoading,
        consentRemoveRequestsError,
        consentRemoveRequestParams,
        refreshConsentRemoveRequests,
    } = useProject();

    const [initialized, setInitialized] = useState(false);
    const [search, setSearch] = useState<string>(consentRemoveRequestParams.searchString ?? "");
    const [status, setStatus] = useState<RequestStatusUI>("All");
    const [sort, setSort] = useState<SortUI>(
        (consentRemoveRequestParams.sortOrder ?? "DESC") === "ASC" ? "Oldest" : "Newest"
    );

    const [actionOpen, setActionOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    const [actionRemark, setActionRemark] = useState("");
    const [actionRemarkError, setActionRemarkError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const [successOpen, setSuccessOpen] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [dangerOpen, setDangerOpen] = useState(false);
    const [dangerMsg, setDangerMsg] = useState("");

    const page = consentRemoveRequestParams.pageNumber ?? 1;
    const pageSize = consentRemoveRequestParams.pageSize ?? 10;

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil((consentRemoveRequestsTotal || 0) / pageSize));
    }, [consentRemoveRequestsTotal, pageSize]);


    const initialSearch = consentRemoveRequestParams.searchString ?? "";


    useEffect(() => {
        setInitialized(true);
    }, []);

    useEffect(() => {
        if (!initialized) return;
        if (search === initialSearch) return;

        const t = setTimeout(() => {
            refreshConsentRemoveRequests({
                pageNumber: 1,
                searchColumn: "Search",
                searchString: search.trim(),
            });
        }, 400);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, initialized]);

    const onChangeStatus = async (v: RequestStatusUI) => {
        setStatus(v);

        if (v === "All") {
            await refreshConsentRemoveRequests({
                pageNumber: 1,
                searchColumn: "",
                searchString: "",
            });
            return;
        }

        if (v === "Pending") {
            await refreshConsentRemoveRequests({
                pageNumber: 1,
                searchColumn: "ConsentResolved",
                searchString: "N",
            });
            return;
        }

        await refreshConsentRemoveRequests({
            pageNumber: 1,
            searchColumn: "ConsentResolved",
            searchString: "Y",
        });
    };

    const onChangeSort = async (v: SortUI) => {
        setSort(v);
        await refreshConsentRemoveRequests({
            pageNumber: 1,
            sortColumn: "CreatedOn",
            sortOrder: v === "Oldest" ? "ASC" : "DESC",
        });
    };

    const goToPage = async (p: number) => {
        const next = Math.max(1, Math.min(totalPages, p));
        await refreshConsentRemoveRequests({ pageNumber: next });
    };

    const openActionPopup = (row: any) => {
        setSelectedRow(row);
        setActionRemark("");
        setActionRemarkError("");
        setActionOpen(true);
    };

    const handleAction = async (statusValue: "Y" | "N") => {
        const remark = actionRemark.trim();

        if (!remark) {
            setActionRemarkError("Please enter remark.");
            return;
        }

        if (!selectedRow?.Id) {
            setDangerMsg("Invalid request selected.");
            setDangerOpen(true);
            return;
        }

        try {
            setActionLoading(true);

            const res = await addConsentRemoveRequestAction({
                ResponseId: selectedRow.Id,
                ConsentActionRemark: remark,
                Status: statusValue,
            });

            setActionOpen(false);
            setSelectedRow(null);
            setActionRemark("");
            setActionRemarkError("");

            setSuccessMsg(
                res?.responseMessage ||
                (statusValue === "Y"
                    ? "Consent request approved successfully."
                    : "Consent request rejected successfully.")
            );
            setSuccessOpen(true);

            await refreshConsentRemoveRequests();
        } catch (err: any) {
            setDangerMsg(err?.message || "Consent action failed");
            setDangerOpen(true);
        } finally {
            setActionLoading(false);
        }
    };

    const tableRows = useMemo(() => {
        return consentRemoveRequests.map((r) => {
            const consentBadge = getConsentBadge(r.Consent);
            const resolvedBadge = getResolvedBadge(r.ConsentResolved);

            let summary = `Response #${r.Id}`;
            if (r.FormResponse && typeof r.FormResponse === "object") {
                const maybeName =
                    r.FormResponse.FullName ||
                    r.FormResponse.Name ||
                    r.FormResponse.fullName ||
                    r.FormResponse.name ||
                    r.FormResponse.CustomerName ||
                    r.FormResponse.customerName;

                if (maybeName) {
                    summary = String(maybeName);
                }
            }

            return {
                key: r.Id,
                id: r.Id,
                formId: r.FormId,
                summary,
                email: r.EmailId,
                mobile: r.MobileNo,
                ipAddress: r.IPAddress,
                created: formatDate(r.CreatedOn),
                consentText: consentBadge.text,
                consentClass: consentBadge.className,
                resolvedText: resolvedBadge.text,
                resolvedClass: resolvedBadge.className,
                raw: r,
            };
        });
    }, [consentRemoveRequests]);

    return (
        <>
            <div className="container-fluid app-shell">
                <div className="row g-0">
                    <div className="panel mb-3">
                        <div className="panel-head p-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div>
                                <div className="h5 mb-1">Consent Withdraw Requests</div>
                                <div className="text-secondary small">
                                    Manage consent withdrawal and removal requests submitted by users
                                </div>
                            </div>
                        </div>

                        <div className="p-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div className="input-group" style={{ maxWidth: 520 }}>
                                <span className="input-group-text search">
                                    <i className="bi bi-search" />
                                </span>
                                <input
                                    className="form-control search"
                                    placeholder="Search by email, mobile, IP, form response..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="d-flex gap-2 flex-wrap">
                                <select
                                    className="form-select search"
                                    style={{ maxWidth: 190 }}
                                    value={status}
                                    onChange={(e) => onChangeStatus(e.target.value as RequestStatusUI)}
                                >
                                    <option value="All">All</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Resolved">Resolved</option>
                                </select>

                                <select
                                    className="form-select search"
                                    style={{ maxWidth: 190 }}
                                    value={sort}
                                    onChange={(e) => onChangeSort(e.target.value as SortUI)}
                                >
                                    <option value="Newest">Newest first</option>
                                    <option value="Oldest">Oldest first</option>
                                </select>

                                <select
                                    className="form-select search"
                                    style={{ maxWidth: 140 }}
                                    value={pageSize}
                                    onChange={(e) =>
                                        refreshConsentRemoveRequests({
                                            pageNumber: 1,
                                            pageSize: Number(e.target.value),
                                        })
                                    }
                                >
                                    <option value={5}>5 / page</option>
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="panel">
                        <div className="panel-head p-3 d-flex align-items-center justify-content-between">
                            <div className="fw-bold">All Requests</div>
                            <span className="badge badge-soft rounded-pill">
                                Total: {consentRemoveRequestsTotal}
                            </span>
                        </div>

                        <div className="p-3">
                            <div className="table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: 230 }}>Request / User</th>
                                            <th>Email</th>
                                            <th>Mobile</th>
                                            <th>Consent</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th className="text-end" style={{ minWidth: 150 }}>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(!initialized || consentRemoveRequestsLoading) && (
                                            <TableSkeletonRows rows={pageSize} />
                                        )}

                                        {initialized &&
                                            !consentRemoveRequestsLoading &&
                                            !!consentRemoveRequestsError && (
                                                <tr>
                                                    <td colSpan={7} className="text-center text-danger py-5">
                                                        {consentRemoveRequestsError}
                                                    </td>
                                                </tr>
                                            )}

                                        {initialized &&
                                            !consentRemoveRequestsLoading &&
                                            !consentRemoveRequestsError &&
                                            tableRows.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="text-center text-secondary py-5">
                                                        No consent withdrawal requests found.
                                                    </td>
                                                </tr>
                                            )}

                                        {initialized &&
                                            !consentRemoveRequestsLoading &&
                                            !consentRemoveRequestsError &&
                                            tableRows.map((row) => (
                                                <tr key={row.key}>
                                                    <td>
                                                        <div className="fw-semibold">{row.summary}</div>
                                                        <div className="text-secondary small">
                                                            Form ID: {row.formId} • IP: {safeString(row.ipAddress)}
                                                        </div>
                                                    </td>

                                                    <td className="text-secondary">{safeString(row.email)}</td>
                                                    <td className="text-secondary">{safeString(row.mobile)}</td>

                                                    <td>
                                                        <span className={row.consentClass}>{row.consentText}</span>
                                                    </td>

                                                    <td>
                                                        <span className={row.resolvedClass}>{row.resolvedText}</span>
                                                    </td>

                                                    <td className="text-secondary">{row.created}</td>

                                                    <td className="text-end">
                                                        <button
                                                            className="btn btn-outline-primary btn-sm"
                                                            type="button"
                                                            onClick={() => openActionPopup(row.raw)}
                                                            disabled={row.raw?.ConsentResolved === "Y"}
                                                        >
                                                            <i className="bi bi-check2-circle" /> Approve
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="d-flex justify-content-end mt-3">
                                <nav aria-label="Consent withdraw pagination">
                                    <ul className="pagination pagination-soft mb-0">
                                        <li
                                            className={`page-item ${page <= 1 || consentRemoveRequestsLoading ? "disabled" : ""
                                                }`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() => goToPage(page - 1)}
                                                type="button"
                                            >
                                                Previous
                                            </button>
                                        </li>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                                            .map((p) => (
                                                <li
                                                    key={p}
                                                    className={`page-item ${p === page ? "active" : ""}`}
                                                >
                                                    <button
                                                        className="page-link"
                                                        onClick={() => goToPage(p)}
                                                        type="button"
                                                        disabled={consentRemoveRequestsLoading}
                                                    >
                                                        {p}
                                                    </button>
                                                </li>
                                            ))}

                                        <li
                                            className={`page-item ${page >= totalPages || consentRemoveRequestsLoading ? "disabled" : ""
                                                }`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() => goToPage(page + 1)}
                                                type="button"
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>

                            <div className="text-secondary small mt-2 text-end">
                                Page {page} of {totalPages} • Showing {tableRows.length} records
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {actionOpen && (
                <>
                    <div className="modal-backdrop fade show" />
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <div className="fw-bold">Consent Request Action</div>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            if (actionLoading) return;
                                            setActionOpen(false);
                                        }}
                                    />
                                </div>

                                <div className="modal-body">
                                    <div className="mb-2 small text-secondary">
                                        Request ID: <span className="fw-semibold text-dark">{selectedRow?.Id}</span>
                                    </div>

                                    <div className="mb-3 small text-secondary">
                                        User: <span className="fw-semibold text-dark">
                                            {selectedRow?.EmailId || selectedRow?.MobileNo || `Response #${selectedRow?.Id}`}
                                        </span>
                                    </div>

                                    <label className="form-label fw-semibold">
                                        Remark <span className="text-danger">*</span>
                                    </label>

                                    <textarea
                                        className={`form-control ${actionRemarkError ? "is-invalid" : ""}`}
                                        rows={4}
                                        placeholder="Enter action remark..."
                                        value={actionRemark}
                                        onChange={(e) => {
                                            setActionRemark(e.target.value);
                                            if (e.target.value.trim()) setActionRemarkError("");
                                        }}
                                    />

                                    {actionRemarkError && (
                                        <div className="invalid-feedback d-block">
                                            {actionRemarkError}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => {
                                            if (actionLoading) return;
                                            setActionOpen(false);
                                        }}
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        disabled={actionLoading}
                                        onClick={() => handleAction("N")}
                                    >
                                        {actionLoading ? "Processing..." : "Reject"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        disabled={actionLoading}
                                        onClick={() => handleAction("Y")}
                                    >
                                        {actionLoading ? "Processing..." : "Accept"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <PopupAlert
                open={successOpen}
                type="success"
                title="Success"
                message={successMsg}
                onClose={() => setSuccessOpen(false)}
                autoCloseMs={2200}
            />

            <PopupAlert
                open={dangerOpen}
                type="danger"
                title="Error"
                message={dangerMsg}
                onClose={() => setDangerOpen(false)}
                autoCloseMs={2500}
            />
        </>
    );
}