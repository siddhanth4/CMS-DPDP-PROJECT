import { useEffect, useMemo, useState } from "react";
import { useProject } from "../Context/projectContext";  // ✅ change path if needed
import { Skeleton } from "../Components/loader";
import { PopupAlert } from "../Components/alert";


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
                        <Skeleton height={18} width={90} radius={50} />
                    </td>

                    <td>
                        <Skeleton height={14} width={120} />
                    </td>

                    <td>
                        <Skeleton height={14} width={60} />
                    </td>

                    <td className="text-end">
                        <div className="d-inline-flex gap-2">
                            <Skeleton height={32} width={90} radius={8} />
                            <Skeleton height={32} width={120} radius={8} />
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
};

/* ================= TYPES ================= */
type FormStatusUI = "All" | "Published" | "Archived";

type SortUI = "Newest" | "Oldest";

const statusBadgeClass = (status: "Published" | "Archived"): string => {
    if (status === "Published") return "badge text-bg-success rounded-pill";
    return "badge text-bg-secondary rounded-pill";
};

// helper: nice date
const formatDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

type FieldType =
    | "text" | "email" | "phone" | "number" | "dropdown" | "radio" | "checkbox"
    | "date" | "upload" | "terms";

type BuilderField = {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    validation?: { minLength?: number; maxLength?: number; errorMessage?: string };
    description?: string;          // ✅ ADD THIS
    descriptionAuto?: boolean;
    options?: { id: string; label: string; value?: string }[];
    numberConfig?: { min?: number; max?: number };
    uploadConfig?: { accept?: string; multiple?: boolean; maxSizeMB?: number };
    termsConfig?: { text?: string };
};

// const previewColClass = (f: BuilderField) => {
//     const maxLen = f.validation?.maxLength ?? 0;
//     return maxLen > 200 ? "col-12" : "col-12 col-md-6";
// };
const getFieldDescription = (f: BuilderField) => {
    return (f.description ?? "").trim();
};
const renderPreviewField = (f: BuilderField) => {
    switch (f.type) {
        case "dropdown":
            return (
                <select className="form-select" required={f.required} defaultValue="">
                    <option value="">{f.placeholder || "Select..."}</option>
                    {(f.options ?? []).map((o) => (
                        <option key={o.id} value={o.value ?? o.label}>{o.label}</option>
                    ))}
                </select>
            );

        case "radio":
            return (
                <div className="mt-2">
                    {(f.options ?? []).map((o) => (
                        <div key={o.id} className="form-check mb-2">
                            <input className="form-check-input" type="radio" name={f.id} required={f.required} />
                            <label className="form-check-label">{o.label}</label>
                        </div>
                    ))}
                </div>
            );

        case "checkbox":
            return (
                <div className="mt-2">
                    {(f.options ?? []).map((o) => (
                        <div key={o.id} className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" />
                            <label className="form-check-label">{o.label}</label>
                        </div>
                    ))}
                </div>
            );

        case "number":
            return (
                <input
                    className="form-control"
                    type="number"
                    placeholder={f.placeholder || ""}
                    min={f.numberConfig?.min}
                    max={f.numberConfig?.max}
                    required={f.required}
                />
            );

        case "email":
            return (
                <input
                    className="form-control"
                    type="email"
                    placeholder={f.placeholder || ""}
                    required={f.required}
                    minLength={f.validation?.minLength}
                    maxLength={f.validation?.maxLength}
                />
            );

        case "phone":
            return (
                <input
                    className="form-control"
                    type="tel"
                    placeholder={f.placeholder || ""}
                    required={f.required}
                    minLength={f.validation?.minLength}
                    maxLength={f.validation?.maxLength}
                />
            );

        case "date":
            return <input className="form-control" type="date" required={f.required} />;

        case "upload":
            return (
                <input
                    className="form-control"
                    type="file"
                    accept={f.uploadConfig?.accept}
                    multiple={!!f.uploadConfig?.multiple}
                    required={f.required}
                />
            );

        case "terms":
            return (
                <label className="d-flex align-items-start gap-2">
                    <input type="checkbox" required={f.required} />
                    <span>{f.termsConfig?.text ?? "I agree to the terms"}</span>
                </label>
            );

        default:
            return (
                <input
                    className="form-control"
                    type="text"
                    placeholder={f.placeholder || ""}
                    required={f.required}
                    minLength={f.validation?.minLength}
                    maxLength={f.validation?.maxLength}
                />
            );
    }
};


export default function FormsPage() {
    const {
        forms, loading, error, params, refreshForms, totalCount, initialized,
        selectedForm, selectedFormLoading, selectedFormError, fetchFormById
    } = useProject();

    const [previewOpen, setPreviewOpen] = useState(false);

    // UI states (server-side)
    const [search, setSearch] = useState<string>(params.searchString ?? "");
    const [status, setStatus] = useState<FormStatusUI>(params.status === "Y" ? "Published" : "All");
    const [sort, setSort] = useState<SortUI>((params.sortOrder ?? "DESC") === "ASC" ? "Oldest" : "Newest");
    const [alertOpen, setAlertOpen] = useState(false);
    // const [alertMsg, setAlertMsg] = useState("");

    const page = params.pageNumber ?? 1;
    const pageSize = params.pageSize ?? 10;

    const totalPages = useMemo(() => Math.max(1, Math.ceil((totalCount || 0) / pageSize)), [totalCount, pageSize]);


    // ✅ Map API -> Table Rows
    const tableRows = useMemo(() => {
        return forms.map((r) => {
            const title = r.FormData?.meta?.title ?? `Form #${r.Id}`;
            const subtitle = r.FormData?.meta?.subtitle ?? "";

            // backend Status "Y" => Published
            const uiStatus: "Published" | "Archived" = r.Status === "Y" ? "Published" : "Archived";

            return {
                key: r.Id,
                id: r.Id,
                title,
                subtitle,
                status: uiStatus,
                created: formatDate(r.CreatedOn),
                submissions: r.TotalSubmission, // not provided by API; keep 0 for now
            };
        });
    }, [forms]);

    // ✅ Debounced search (so API not called on every key press)
    useEffect(() => {
        const t = setTimeout(() => {
            refreshForms({
                pageNumber: 1,
                searchColumn: "title", // 👈 change to your backend column if different
                searchString: search.trim(),
            });
        }, 400);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const onChangeStatus = (v: FormStatusUI) => {
        setStatus(v);

        // map UI status to API status param
        // if your API expects only Y/N, adjust here
        const apiStatus =
            v === "All" ? "Y" : v === "Published" ? "Y" : "N";

        refreshForms({
            pageNumber: 1,
            status: apiStatus,
        });
    };

    const onChangeSort = (v: SortUI) => {
        setSort(v);
        refreshForms({
            pageNumber: 1,
            sortColumn: "CreatedOn",
            sortOrder: v === "Oldest" ? "ASC" : "DESC",
        });
    };

    const goToPage = (p: number) => {
        const next = Math.max(1, Math.min(totalPages, p));
        refreshForms({ pageNumber: next });
    };
    const copyPublicLink = async (formId: number) => {
        // ✅ Create URL
        const url = `${window.location.origin}/CMP/PublicFormView?form=${formId}`;

        try {
            await navigator.clipboard.writeText(url);

            // setAlertMsg(`Link copied:\n${url}`);
            setAlertOpen(true);
        } catch {
            // fallback for some browsers / http
            const ta = document.createElement("textarea");
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);

            // setAlertMsg(`Link copied:\n${url}`);
            setAlertOpen(true);
        }
    };

    return (
        <>
            <div className="container-fluid app-shell">
                <div className="row g-0">
                    {/* Topbar */}
                    <div className="panel mb-3">
                        <div className="panel-head p-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                            <div>
                                <div className="h5 mb-1">Forms</div>
                                <div className="text-secondary small">Manage your published &amp; draft forms</div>
                            </div>

                            <div className="d-flex gap-2 align-items-center">
                                {/* <button
                                    className="btn btn-outline-secondary btn-sm"
                                    type="button"
                                    onClick={() => console.log("Export")}
                                >
                                    <i className="bi bi-download" /> Export
                                </button> */}

                                <a className="btn btn-brand btn-sm" href="/CMP/builder">
                                    <i className="bi bi-plus-lg" /> New Form
                                </a>
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
                                    placeholder="Search forms..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="d-flex gap-2">
                                <select
                                    className="form-select search"
                                    style={{ maxWidth: 190 }}
                                    value={status}
                                    onChange={(e) => onChangeStatus(e.target.value as FormStatusUI)}
                                >
                                    <option value="All">All</option>
                                    <option value="Published">Published</option>
                                    <option value="Archived">Archived</option>
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

                                {/* Page Size */}
                                <select
                                    className="form-select search"
                                    style={{ maxWidth: 140 }}
                                    value={pageSize}
                                    onChange={(e) => refreshForms({ pageNumber: 1, pageSize: Number(e.target.value) })}
                                >
                                    <option value={5}>5 / page</option>
                                    <option value={10}>10 / page</option>
                                    <option value={20}>20 / page</option>
                                    <option value={50}>50 / page</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="panel">
                        <div className="panel-head p-3 d-flex align-items-center justify-content-between">
                            <div className="fw-bold">All Forms</div>
                            <span className="badge badge-soft rounded-pill">Total: {totalCount}</span>
                        </div>

                        <div className="p-3">
                            <div className="table-responsive">
                                <table className="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th style={{ minWidth: 260 }}>Form</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Submissions</th>
                                            <th style={{ minWidth: 260 }} className="text-end">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(!initialized || loading) && <TableSkeletonRows rows={pageSize} />}

                                        {/* 
                                        {initialized && !loading && error && (
                                            <tr>
                                                <td colSpan={5} className="text-center text-danger py-5">
                                                    {error}
                                                </td>
                                            </tr>
                                        )} */}

                                        {initialized && !loading && !error && tableRows.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center text-secondary py-5">
                                                    No forms found.
                                                </td>
                                            </tr>
                                        )}


                                        {initialized && !loading && !error && tableRows.map((f) => (
                                            <tr key={f.key}>
                                                <td>
                                                    <div className="fw-semibold">{f.title}</div>
                                                    <div className="text-secondary small">{f.subtitle}</div>
                                                </td>

                                                <td>
                                                    <span className={statusBadgeClass(f.status)}>{f.status}</span>
                                                </td>

                                                <td className="text-secondary">{f.created}</td>

                                                <td>
                                                    <span className="fw-semibold">{f.submissions}</span>
                                                </td>

                                                <td className="text-end">
                                                    {f.status === "Published" ? (
                                                        <>
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm me-2"
                                                                type="button"
                                                                onClick={async () => {
                                                                    await fetchFormById(f.id);   // ✅ call api by id
                                                                    setPreviewOpen(true);        // ✅ open modal
                                                                }}
                                                            >
                                                                <i className="bi bi-eye" />
                                                            </button>

                                                            <button
                                                                className="btn btn-outline-secondary btn-sm me-2"
                                                                type="button"
                                                                onClick={() => copyPublicLink(f.id)}

                                                            >
                                                                <i className="bi bi-link-45deg" />
                                                            </button>


                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm me-2"
                                                                type="button"
                                                                onClick={() => console.log("Restore", f.id)}
                                                            >
                                                                <i className="bi bi-arrow-counterclockwise" /> Restore
                                                            </button>

                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                type="button"
                                                                onClick={() => console.log("Delete", f.id)}
                                                            >
                                                                <i className="bi bi-trash" /> Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="d-flex justify-content-end mt-3">
                                <nav aria-label="Forms pagination">
                                    <ul className="pagination pagination-soft mb-0">
                                        <li className={`page-item ${page <= 1 || loading ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => goToPage(page - 1)} type="button">
                                                Previous
                                            </button>
                                        </li>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)) // show near pages only
                                            .map((p) => (
                                                <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                                                    <button className="page-link" onClick={() => goToPage(p)} type="button" disabled={loading}>
                                                        {p}
                                                    </button>
                                                </li>
                                            ))}

                                        <li className={`page-item ${page >= totalPages || loading ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => goToPage(page + 1)} type="button">
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>

                            {/* Footer Info */}
                            <div className="text-secondary small mt-2 text-end">
                                Page {page} of {totalPages} • Showing {tableRows.length} records
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===================== PREVIEW MODAL ===================== */}
            {previewOpen && (
                <>
                    <div className="modal-backdrop fade show" />

                    <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <div className="fw-bold">Preview</div>
                                    <button type="button" className="btn-close" onClick={() => setPreviewOpen(false)} />
                                </div>

                                <div className="modal-body" style={{ maxHeight: "78vh", overflowY: "auto" }}>
                                    {/* ✅ Loading / Error */}
                                    {selectedFormLoading ? (
                                        <div className="text-secondary">Loading form...</div>
                                    ) : selectedFormError ? (
                                        <div className="text-danger">{selectedFormError}</div>
                                    ) : !selectedForm?.FormData ? (
                                        <div className="text-secondary">No form data found.</div>
                                    ) : (
                                        (() => {
                                            const meta = selectedForm.FormData?.meta ?? {};
                                            const fields: BuilderField[] = selectedForm.FormData?.fields ?? [];

                                            return (
                                                <div className="shell">
                                                    {/* Topbar */}
                                                    <div className="topbar mb-2 d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="brand-badge">FF</div>
                                                            <div className="lh-sm">
                                                                <div className="fw-bold" style={{ fontSize: ".98rem" }}>NJ Softtech</div>
                                                                <div className="text-secondary" style={{ fontSize: ".78rem" }}>Secure Form</div>
                                                            </div>
                                                        </div>

                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="help-chip d-none d-md-inline">
                                                                <i className="bi bi-shield-lock" /> Encrypted
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Hero */}
                                                    <div className="hero mb-2">
                                                        <div className="row g-2 align-items-center">
                                                            <div className="col-12 col-md-8">
                                                                <div className="text-secondary small fw-semibold text-uppercase">{meta.category}</div>
                                                                <div className="h4 fw-bold mb-1">{meta.title}</div>
                                                                <div className="text-secondary small">
                                                                    Fields marked with <span className="req">*</span> are required.
                                                                </div>
                                                            </div>

                                                            <div className="col-12 col-md-4">
                                                                <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                                                                    <span className="help-chip"><i className="bi bi-clock" /> ~2 min</span>
                                                                    <span className="help-chip"><i className="bi bi-envelope" /> Confirm</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Form Card */}
                                                    <div className="form-card card">
                                                        <div className="card-header">
                                                            <div className="d-flex align-items-start justify-content-between gap-2">
                                                                <div>
                                                                    <div className="fw-bold">{meta.title || "Form Preview"}</div>
                                                                    <div className="text-secondary" style={{ fontSize: ".8rem" }}>
                                                                        Powered by NJ Softtech
                                                                    </div>
                                                                </div>
                                                                <span className="badge rounded-pill text-bg-secondary">Preview</span>
                                                            </div>
                                                        </div>

                                                        <div className="card-body">
                                                            <form
                                                                className="needs-validation"
                                                                noValidate
                                                                onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    alert("Preview Submit (demo)");
                                                                }}
                                                            >
                                                                <div className="row g-3">
                                                                    {fields.map((f) => {
                                                                        const desc = getFieldDescription(f);

                                                                        return (
                                                                            <div key={f.id} className="col-12">
                                                                                <div className="row g-2 align-items-start">
                                                                                    {/* LEFT: Field + input */}
                                                                                    <div className="col-12 col-md-6">
                                                                                        <label className="form-label fw-semibold">
                                                                                            {f.label} {f.required && <span className="req">*</span>}
                                                                                        </label>

                                                                                        {renderPreviewField(f)}

                                                                                        {!!f.validation?.errorMessage && (
                                                                                            <div className="form-text text-danger">
                                                                                                {f.validation.errorMessage}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* RIGHT: Description */}
                                                                                    <div className="col-12 col-md-6">
                                                                                        {!!desc && (
                                                                                            <div
                                                                                                className="small"
                                                                                                style={{
                                                                                                    color: "red",
                                                                                                    lineHeight: 1.35,
                                                                                                    paddingTop: 30, // aligns with input area
                                                                                                    whiteSpace: "pre-wrap",
                                                                                                }}
                                                                                            >
                                                                                                {desc}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}

                                                                    <div className="col-12 d-flex flex-wrap gap-2 align-items-center justify-content-between pt-1">
                                                                        <div className="footer-note d-none d-md-block">
                                                                            <i className="bi bi-info-circle" /> Review before submit
                                                                        </div>

                                                                        <div className="d-flex gap-2 ms-auto">
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-outline-secondary btn-sm"
                                                                                style={{ borderRadius: 12 }}
                                                                                onClick={() => setPreviewOpen(false)}
                                                                            >
                                                                                Close
                                                                            </button>

                                                                            <button type="submit" className="btn btn-brand btn-sm px-3">
                                                                                <i className="bi bi-send me-1" />
                                                                                Submit
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </div>

                                                    <div className="footer-note text-center mt-3">
                                                        © {new Date().getFullYear()} NJ Softtech • Form Builder
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <PopupAlert
                open={alertOpen}
                type="success"
                title="Form Link Copied!"
                message='Successfully copied the public form link to clipboard. You can now share it with your audience.'
                onClose={() => setAlertOpen(false)}
                autoCloseMs={2000}
            />

        </>
    );
}
