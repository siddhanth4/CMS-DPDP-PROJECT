import React, { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";


const calculateMonths = (from: string, to: string) => {
    if (!from || !to) return "";

    const start = dayjs(from);
    const end = dayjs(to);

    const months = end.diff(start, "month");

    return months >= 0 ? `${months} month(s)` : "";
};

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionKey =
    | "dataController"
    | "purposeOfProcessing"
    | "dataCategories"
    | "legalBasis"
    | "retentionPeriod"
    | "dataSharing"
    | "dataSubjectRights"
    | "contactDPO"
    | "grievanceOfficer"
    | "policyUpdates";

interface NoticeSection {
    key: SectionKey;
    title: string;
    icon: string;
    placeholder: string;
    required: boolean;
    content: string;
    enabled: boolean;
}

interface PrivacyNoticeForm {
    noticeName: string;
    organizationName: string;
    effectiveDate: string;
    version: string;
    linkedFormId: string;
    language: string;
    sections: NoticeSection[];
}

const PURPOSE_OPTIONS = [
    "Service Provision & Account Management (Provide services, create/manage accounts, process requests)",
    "Communication & Customer Support (Send updates, notifications, and handle user queries)",
    "Analytics & Service Improvement (Analyze usage, improve features, optimize performance)",
    "Personalization (Customize content, recommendations, and user experience)",
    "AI/ML Training & Research (Train models, develop new features, innovation)",
    "Marketing & Promotional Activities (Send offers, advertisements, product updates)",
    "Security, Fraud Prevention & Legal Compliance (Protect platform, detect fraud, comply with laws, enforce policies)",
];

const DATA_CATEGORIES_OPTIONS = [
    "Identity Information (Name, username, gender, date of birth)",
    "Contact Information (Email, mobile number, address)",
    "Government Identification Details (Aadhaar, PAN, passport, driving license)",
    "Financial & Payment Information (Bank details, UPI ID, transactions, billing info)",
    "Technical & Device Information (IP address, device type, browser, system logs)",
    "Usage & Behavioral Data (Activity, preferences, interaction patterns)",
    "User-Provided Content & Documents (Form inputs, uploaded files, feedback, messages)",
    "Professional / Educational Information (Job details, company, education, resume)",
    "Communication Data (Emails, chats, support tickets, call records)",
    "Third-Party / Integrated Data (Social media data, partner-provided data)",
    "Sensitive Personal Data (Biometric, health, financial credentials, other sensitive info)",
];

const LEGAL_BASIS_OPTIONS = [
    "Consent of the Data Principal",
    "Compliance with legal obligations",
    "Performance of a contract",
    "Legitimate uses (as per DPDP Act)",
    "Prevention of fraud / security purposes",
];

const DATA_SUBJECT_RIGHTS_OPTIONS = [
    "Right to Access Information",
    "Right to Correction & Update",
    "Right to Erasure (Deletion)",
    "Right to Withdraw Consent",
    "Right to Grievance Redressal",
    "Right to Nominate",
];

const DEFAULT_SECTIONS: NoticeSection[] = [
    {
        key: "dataController",
        title: "Data Controller / Fiduciary Information",
        icon: "bi-building",
        placeholder:
            "Enter details about the organization acting as Data Fiduciary under the DPDP Act, 2023. Include registered name, address, and contact information.",
        required: true,
        content: "",
        enabled: true,
    },
    {
        key: "purposeOfProcessing",
        title: "Purpose of Processing Personal Data",
        icon: "bi-bullseye",
        placeholder:
            "Clearly describe the specific, explicit, and legitimate purposes for which personal data is collected and processed. Each purpose must be lawful under the DPDP Act.",
        required: true,
        content: "",
        enabled: true,
    },
    {
        key: "dataCategories",
        title: "Categories of Personal Data Collected",
        icon: "bi-collection",
        placeholder:
            "List the types of personal data that will be collected (e.g., name, email, Aadhaar number, health data, financial data). Indicate if any sensitive personal data is included.",
        required: true,
        content: "",
        enabled: true,
    },
    {
        key: "legalBasis",
        title: "Legal Basis for Processing",
        icon: "bi-shield-check",
        placeholder:
            "Specify the legal basis under Section 4 of the DPDP Act, 2023. E.g., Consent of the Data Principal, performance of a contract, compliance with legal obligation, etc.",
        required: true,
        content: "",
        enabled: true,
    },
    {
        key: "retentionPeriod",
        title: "Data Retention Period",
        icon: "bi-clock-history",
        placeholder:
            "Specify how long personal data will be retained and the criteria used to determine retention periods. Include data erasure obligations under Section 8(7) of the DPDP Act.",
        required: true,
        content: "",
        enabled: true,
    },
    {
        key: "dataSharing",
        title: "Data Sharing & Third-Party Transfers",
        icon: "bi-share",
        placeholder:
            "Disclose if personal data is shared with Data Processors or third parties. Mention cross-border transfers if applicable and safeguards in place.",
        required: false,
        content: "",
        enabled: true,
    },
    {
        key: "dataSubjectRights",
        title: "Rights of the Data Principal",
        icon: "bi-person-check",
        placeholder:
            "Describe the rights available under Chapter III of the DPDP Act: Right to Access, Right to Correction, Right to Erasure, Right to Grievance Redressal, Right to Nominate, and Right to Withdraw Consent.",
        required: true,
        content: "",
        enabled: true,
    },
    {
        key: "contactDPO",
        title: "Contact – Data Protection Officer",
        icon: "bi-person-badge",
        placeholder:
            "Provide name, email, and contact details of the Data Protection Officer (if appointed) or the designated contact person for data protection queries.",
        required: false,
        content: "",
        enabled: false,
    },
    {
        key: "grievanceOfficer",
        title: "Grievance Redressal Officer",
        icon: "bi-headset",
        placeholder:
            "Provide contact details of the Grievance Officer and the process to raise a complaint. Include escalation to the Data Protection Board of India if unresolved.",
        required: true,
        content: "",
        enabled: true,
    },
    {
        key: "policyUpdates",
        title: "Changes to This Privacy Notice",
        icon: "bi-arrow-repeat",
        placeholder:
            "Explain how and when Data Principals will be notified of material changes to this privacy notice. Include the effective date mechanism.",
        required: false,
        content: "",
        enabled: true,
    },
];

const LANGUAGE_OPTIONS = [
    { value: "en", label: "English" },
    { value: "hi", label: "Hindi (हिन्दी)" },
    { value: "mr", label: "Marathi (मराठी)" },
    { value: "ta", label: "Tamil (தமிழ்)" },
    { value: "te", label: "Telugu (తెలుగు)" },
    { value: "bn", label: "Bengali (বাংলা)" },
    { value: "gu", label: "Gujarati (ગુજરાતી)" },
    { value: "kn", label: "Kannada (ಕನ್ನಡ)" },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ step: number; current: number; label: string }> = ({
    step,
    current,
    label,
}) => {
    const done = current > step;
    const active = current === step;
    return (
        <div className="d-flex align-items-center gap-2">
            <div
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    background: done
                        ? "var(--bs-success, #198754)"
                        : active
                        ? "var(--accent, #4f6ef7)"
                        : "rgba(255,255,255,0.07)",
                    color: done || active ? "#fff" : "var(--bs-secondary-color, #adb5bd)",
                    border: active ? "2px solid var(--accent, #4f6ef7)" : "2px solid transparent",
                    transition: "all 0.2s",
                    flexShrink: 0,
                }}
            >
                {done ? <i className="bi bi-check" /> : step}
            </div>
            <span
                style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active
                        ? "var(--bs-body-color, #dee2e6)"
                        : done
                        ? "var(--bs-success, #198754)"
                        : "var(--bs-secondary-color, #adb5bd)",
                }}
            >
                {label}
            </span>
        </div>
    );
};

// ─── Preview Modal ────────────────────────────────────────────────────────────

const PreviewModal: React.FC<{
    form: PrivacyNoticeForm;
    onClose: () => void;
}> = ({ form, onClose }) => {
    const enabledSections = form.sections.filter((s) => s.enabled);
    return (
        <div
            className="modal d-block"
            style={{ background: "rgba(0,0,0,0.7)", zIndex: 1055 }}
            onClick={onClose}
        >
            <div
                className="modal-dialog modal-lg modal-dialog-scrollable"
                style={{ maxWidth: 760 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="modal-content"
                    style={{
                        background: "var(--bs-body-bg, #0f1117)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 16,
                    }}
                >
                    {/* Header */}
                    <div
                        className="modal-header"
                        style={{
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(79,110,247,0.08)",
                            borderRadius: "16px 16px 0 0",
                        }}
                    >
                        <div>
                            <h5 className="modal-title mb-0 fw-bold">
                                <i className="bi bi-eye me-2 text-primary" />
                                Privacy Notice Preview
                            </h5>
                            <small className="text-secondary">
                                As it will appear to the Data Principal
                            </small>
                        </div>
                        <button
                            className="btn-close btn-close-white"
                            onClick={onClose}
                        />
                    </div>

                    <div className="modal-body p-4">
                        {/* Notice header */}
                        <div
                            className="text-center mb-4 p-4"
                            style={{
                                background:
                                    "linear-gradient(135deg, rgba(79,110,247,0.15), rgba(79,110,247,0.05))",
                                borderRadius: 12,
                                border: "1px solid rgba(79,110,247,0.2)",
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    background: "rgba(79,110,247,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 12px",
                                }}
                            >
                                <i className="bi bi-shield-lock fs-5 text-primary" />
                            </div>
                            <h4 className="fw-bold mb-1">
                                {form.noticeName || "Privacy Notice"}
                            </h4>
                            <div className="text-secondary small">
                                {form.organizationName} · Version {form.version} · Effective{" "}
                                {form.effectiveDate || "—"}
                            </div>
                            <div className="mt-2">
                                <span
                                    className="badge"
                                    style={{
                                        background: "rgba(79,110,247,0.2)",
                                        color: "#7c9ff7",
                                        fontSize: 11,
                                    }}
                                >
                                    DPDP Act, 2023 Compliant
                                </span>
                            </div>
                        </div>

                        {/* Sections */}
                        {enabledSections.map((sec, idx) => (
                            <div key={sec.key} className="mb-3">
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <span
                                        style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            background: "rgba(79,110,247,0.15)",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 11,
                                            color: "#7c9ff7",
                                            fontWeight: 700,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {idx + 1}
                                    </span>
                                    <h6 className="mb-0 fw-semibold">{sec.title}</h6>
                                    {sec.required && (
                                        <span
                                            className="badge"
                                            style={{
                                                background: "rgba(220,53,69,0.15)",
                                                color: "#f86e7a",
                                                fontSize: 10,
                                            }}
                                        >
                                            Required
                                        </span>
                                    )}
                                </div>
                                <div
                                    className="p-3"
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        borderRadius: 8,
                                        border: "1px solid rgba(255,255,255,0.06)",
                                        fontSize: 14,
                                        color: sec.content
                                            ? "var(--bs-body-color)"
                                            : "var(--bs-secondary-color)",
                                        lineHeight: 1.7,
                                        whiteSpace: "pre-wrap",
                                    }}
                                >
                                    {sec.content ? (
                                        sec.key === "retentionPeriod" ? (
                                            <>
                                                <div><strong>From:</strong> {sec.content.split("|")[0]}</div>
                                                <div><strong>To:</strong> {sec.content.split("|")[1]}</div>
                                                <div><strong>Duration:</strong> {sec.content.split("|")[2]}</div>
                                            </>
                                        ) : sec.key === "contactDPO" || sec.key === "grievanceOfficer" ? (
                                            <>
                                                <div><strong>Name:</strong> {sec.content.split("|")[0] || "—"}</div>
                                                <div><strong>Email:</strong> {sec.content.split("|")[1] || "—"}</div>
                                            </>
                                        ) : (
                                            sec.content
                                        )
                                    ) : (
                                        <span className="fst-italic">
                                            [No content entered for this section]
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Footer */}
                        <div
                            className="mt-4 p-3 text-center"
                            style={{
                                borderTop: "1px solid rgba(255,255,255,0.06)",
                                fontSize: 12,
                                color: "var(--bs-secondary-color)",
                            }}
                        >
                            <i className="bi bi-shield-check me-1 text-success" />
                            This notice is prepared in compliance with the Digital Personal Data
                            Protection Act, 2023 (India)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PrivacyNoticeBuilder: React.FC = () => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [showPreview, setShowPreview] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<SectionKey | null>(null);

    const [form, setForm] = useState<PrivacyNoticeForm>({
        noticeName: "",
        organizationName: "",
        effectiveDate: "",
        version: "1.0",
        linkedFormId: "",
        language: "en",
        sections: DEFAULT_SECTIONS,
    });

    // ── helpers ──────────────────────────────────────────────────────────────

    const updateMeta = (field: keyof Omit<PrivacyNoticeForm, "sections">, value: string) => {
        setForm((f) => ({ ...f, [field]: value }));
    };

    const updateSection = (key: SectionKey, patch: Partial<NoticeSection>) => {
        setForm((f) => ({
            ...f,
            sections: f.sections.map((s) => (s.key === key ? { ...s, ...patch } : s)),
        }));
    };

    const toggleSection = (key: SectionKey) => {
        setForm((f) => ({
            ...f,
            sections: f.sections.map((s) =>
                s.key === key && !s.required ? { ...s, enabled: !s.enabled } : s
            ),
        }));
    };

    const completedSections = form.sections.filter((s) => s.enabled && s.content.trim().length > 0)
        .length;
    const enabledSections = form.sections.filter((s) => s.enabled).length;
    const requiredFilled = form.sections
        .filter((s) => s.required)
        .every((s) => s.content.trim().length > 0);
    const step1Valid =
        form.noticeName.trim() &&
        form.organizationName.trim() &&
        form.effectiveDate &&
        form.version.trim();

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        // TODO: wire to API — POST /api/privacy-notices
        console.log("Save payload:", form);
    };

    // ── Step 1: Basic Info ────────────────────────────────────────────────────

    const renderStep1 = () => (
        <div className="row g-3">
            <div className="col-12">
                <div
                    className="p-3 mb-2"
                    style={{
                        background: "rgba(79,110,247,0.08)",
                        borderRadius: 10,
                        border: "1px solid rgba(79,110,247,0.2)",
                        fontSize: 13,
                    }}
                >
                    <i className="bi bi-info-circle me-2 text-primary" />
                    <strong>DPDP Act, 2023:</strong> Under Section 5, a Data Fiduciary must
                    provide a clear and accessible Privacy Notice to the Data Principal before or
                    at the time of collecting personal data.
                </div>
            </div>

            <div className="col-md-6">
                <label className="form-label small fw-semibold">
                    Notice Name <span className="text-danger">*</span>
                </label>
                <input
                    className="form-control"
                    placeholder="e.g., Customer Onboarding Privacy Notice"
                    value={form.noticeName}
                    onChange={(e) => updateMeta("noticeName", e.target.value)}
                />
            </div>

            <div className="col-md-6">
                <label className="form-label small fw-semibold">
                    Organization / Data Fiduciary Name <span className="text-danger">*</span>
                </label>
                <input
                    className="form-control"
                    placeholder="e.g., NJ Softtech Pvt. Ltd."
                    value={form.organizationName}
                    onChange={(e) => updateMeta("organizationName", e.target.value)}
                />
            </div>

            <div className="col-md-4">
                <label className="form-label small fw-semibold">
                    Effective Date <span className="text-danger">*</span>
                </label>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        value={form.effectiveDate ? dayjs(form.effectiveDate) : null}
                        onChange={(newValue) =>
                            updateMeta(
                                "effectiveDate",
                                newValue ? newValue.format("YYYY-MM-DD") : ""
                            )
                        }
                        slotProps={{
                            textField: {
                                className: "form-control",
                                size: "small",
                            },
                        }}
                    />
                </LocalizationProvider>
            </div>

            <div className="col-md-4">
                <label className="form-label small fw-semibold">
                    Version <span className="text-danger">*</span>
                </label>
                <input
                    className="form-control"
                    placeholder="1.0"
                    value={form.version}
                    onChange={(e) => updateMeta("version", e.target.value)}
                />
            </div>

            <div className="col-md-4">
                <label className="form-label small fw-semibold">Notice Language</label>
                <select
                    className="form-select"
                    value={form.language}
                    onChange={(e) => updateMeta("language", e.target.value)}
                >
                    {LANGUAGE_OPTIONS.map((l) => (
                        <option key={l.value} value={l.value}>
                            {l.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="col-12">
                <label className="form-label small fw-semibold">
                    Link to Form{" "}
                    <span className="text-secondary fw-normal">(Optional)</span>
                </label>
                <input
                    className="form-control"
                    placeholder="Form ID or Form Name to associate this notice with"
                    value={form.linkedFormId}
                    onChange={(e) => updateMeta("linkedFormId", e.target.value)}
                />
                <div className="form-text">
                    The privacy notice will be emailed to Data Principals before they fill the
                    linked form.
                </div>
            </div>
        </div>
    );

    // ── Step 2: Section Editor ────────────────────────────────────────────────

    const renderStep2 = () => {
        const active = form.sections.find((s) => s.key === activeSection);
        return (
            <div className="row g-0" style={{ minHeight: 480 }}>
                {/* Left Panel – Section List */}
                <div
                    className="col-12 col-md-4"
                    style={{
                        borderRight: "1px solid rgba(255, 255, 255, 0)",
                        paddingRight: 0,
                    }}
                >
                    <div
                        className="p-3"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="small fw-semibold">Sections</span>
                            <span className="badge" style={{ background: "rgba(79,110,247,0.2)", color: "#7c9ff7" }}>
                                {completedSections}/{enabledSections} filled
                            </span>
                        </div>
                    </div>
                    <div style={{ overflowY: "auto", maxHeight: 460 }}>
                        {form.sections.map((sec) => {
                            const isActive = activeSection === sec.key;
                            const isFilled = sec.content.trim().length > 0;
                            return (
                                <div
                                    key={sec.key}
                                    onClick={() => sec.enabled && setActiveSection(sec.key)}
                                    style={{
                                        padding: "10px 16px",
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                        cursor: sec.enabled ? "pointer" : "default",
                                        background: isActive
                                            ? "rgba(79,110,247,0.12)"
                                            : "transparent",
                                        borderLeft: isActive
                                            ? "3px solid #4f6ef7"
                                            : "3px solid transparent",
                                        opacity: sec.enabled ? 1 : 0.4,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <div className="d-flex align-items-start gap-2">
                                        <i
                                            className={`bi ${sec.icon} mt-1`}
                                            style={{
                                                fontSize: 14,
                                                color: isActive ? "#7c9ff7" : "#6c757d",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    lineHeight: 1.4,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    color: isActive ? "#dee2e6" : "#adb5bd",
                                                }}
                                                title={sec.title}
                                            >
                                                {sec.title}
                                            </div>
                                            <div className="d-flex gap-1 mt-1">
                                                {sec.required && (
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            color: "#f86e7a",
                                                            background: "rgba(220,53,69,0.1)",
                                                            padding: "0 5px",
                                                            borderRadius: 3,
                                                        }}
                                                    >
                                                        Required
                                                    </span>
                                                )}
                                                {isFilled && sec.enabled && (
                                                    <span
                                                        style={{
                                                            fontSize: 10,
                                                            color: "#198754",
                                                            background: "rgba(25,135,84,0.1)",
                                                            padding: "0 5px",
                                                            borderRadius: 3,
                                                        }}
                                                    >
                                                        ✓ Filled
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {!sec.required && (
                                            <div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSection(sec.key);
                                                    if (isActive) setActiveSection(null);
                                                }}
                                                style={{
                                                    cursor: "pointer",
                                                    color: sec.enabled ? "#4f6ef7" : "#6c757d",
                                                    fontSize: 16,
                                                    flexShrink: 0,
                                                }}
                                                title={sec.enabled ? "Disable section" : "Enable section"}
                                            >
                                                <i
                                                    className={`bi ${sec.enabled ? "bi-toggle-on" : "bi-toggle-off"}`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel – Editor */}
                <div className="col-12 col-md-8 p-4">
                    {!active ? (
                        <div
                            className="d-flex flex-column align-items-center justify-content-center h-100 text-center"
                            style={{ minHeight: 300, color: "var(--bs-secondary-color)" }}
                        >
                            <i
                                className="bi bi-cursor-text mb-3"
                                style={{ fontSize: 40, opacity: 0.3 }}
                            />
                            <div className="fw-semibold">Select a section to edit</div>
                            <div className="small mt-1">
                                Click any section on the left to start writing
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 8,
                                        background: "rgba(79,110,247,0.15)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <i className={`bi ${active.icon} text-primary`} />
                                </div>
                                <div>
                                    <div className="fw-semibold" style={{ fontSize: 15 }}>
                                        {active.title}
                                    </div>
                                    {active.required && (
                                        <div style={{ fontSize: 11, color: "#f86e7a" }}>
                                            * Required under DPDP Act, 2023
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* DPDP Hint */}
                            <div
                                className="mb-3 p-2"
                                style={{
                                    background: "rgba(255,193,7,0.07)",
                                    borderRadius: 8,
                                    border: "1px solid rgba(255,193,7,0.15)",
                                    fontSize: 12,
                                    color: "#e0c060",
                                    lineHeight: 1.6,
                                }}
                            >
                                <i className="bi bi-lightbulb me-1" />
                                <strong>Guidance:</strong> {active.placeholder}
                            </div>

                            {active.key === "purposeOfProcessing" ? (
                                <div>
                                    {PURPOSE_OPTIONS.map((purpose, index) => {
                                        const selected = active.content.split("\n").includes(purpose);

                                        return (
                                            <div key={index} className="form-check mb-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`purpose-${index}`}
                                                    checked={selected}
                                                    onChange={(e) => {
                                                        let updated = active.content
                                                            ? active.content.split("\n")
                                                            : [];

                                                        if (e.target.checked) updated.push(purpose);
                                                        else updated = updated.filter((p) => p !== purpose);

                                                        updateSection(active.key, {
                                                            content: updated.join("\n"),
                                                        });
                                                    }}
                                                />
                                                <label className="form-check-label">{purpose}</label>
                                            </div>
                                        );
                                    })}
                                </div>

                            ) : active.key === "dataCategories" ? (
                                <div>
                                    {DATA_CATEGORIES_OPTIONS.map((category, index) => {
                                        const selected = active.content.split("\n").includes(category);

                                        return (
                                            <div key={index} className="form-check mb-2">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selected}
                                                    onChange={(e) => {
                                                        let updated = active.content
                                                            ? active.content.split("\n")
                                                            : [];

                                                        if (e.target.checked) updated.push(category);
                                                        else updated = updated.filter((c) => c !== category);

                                                        updateSection(active.key, {
                                                            content: updated.join("\n"),
                                                        });
                                                    }}
                                                />
                                                <label className="form-check-label">{category}</label>
                                            </div>
                                        );
                                    })}
                                </div>

                            ) : active.key === "legalBasis" ? (
                                <div>
                                    {LEGAL_BASIS_OPTIONS.map((basis, index) => {
                                        const selected = active.content.split("\n").includes(basis);

                                        return (
                                            <div key={index} className="form-check mb-2">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={selected}
                                                    onChange={(e) => {
                                                        let updated = active.content
                                                            ? active.content.split("\n")
                                                            : [];

                                                        if (e.target.checked) updated.push(basis);
                                                        else updated = updated.filter((b) => b !== basis);

                                                        updateSection(active.key, {
                                                            content: updated.join("\n"),
                                                        });
                                                    }}
                                                />
                                                <label className="form-check-label">{basis}</label>
                                            </div>
                                        );
                                    })}
                                </div>

                            ) : active.key === "dataSubjectRights" ? (
                                <div>
                                    {DATA_SUBJECT_RIGHTS_OPTIONS.map((right, index) => {
                                        const selected = active.content.split("\n").includes(right);

                                        return (
                                            <div key={index} className="form-check mb-2">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id={`rights-${index}`}
                                                    checked={selected}
                                                    onChange={(e) => {
                                                        let updated = active.content
                                                            ? active.content.split("\n")
                                                            : [];

                                                        if (e.target.checked) updated.push(right);
                                                        else updated = updated.filter((r) => r !== right);

                                                        updateSection(active.key, {
                                                            content: updated.join("\n"),
                                                        });
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor={`rights-${index}`}>
                                                    {right}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>

                            ) : active.key === "contactDPO" || active.key === "grievanceOfficer" ? (
                                <div className="row g-3">
                                    {/* Name */}
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter name"
                                            value={active.content?.split("|")[0] || ""}
                                            onChange={(e) => {
                                                const email = active.content?.split("|")[1] || "";
                                                updateSection(active.key, {
                                                    content: `${e.target.value}|${email}`,
                                                });
                                            }}
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Enter email address"
                                            value={active.content?.split("|")[1] || ""}
                                            onChange={(e) => {
                                                const name = active.content?.split("|")[0] || "";
                                                updateSection(active.key, {
                                                    content: `${name}|${e.target.value}`,
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : active.key === "retentionPeriod" ? (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">From Date</label>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                value={
                                                    active.content?.split("|")[0]
                                                        ? dayjs(active.content.split("|")[0])
                                                        : null
                                                }
                                                onChange={(newValue) => {
                                                    const toDate = active.content?.split("|")[1] || "";
                                                    const fromDate = newValue
                                                        ? newValue.format("YYYY-MM-DD")
                                                        : "";

                                                    const duration = calculateMonths(fromDate, toDate);

                                                    updateSection(active.key, {
                                                        content: `${fromDate}|${toDate}|${duration}`,
                                                    });
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">To Date</label>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DatePicker
                                                value={
                                                    active.content?.split("|")[1]
                                                        ? dayjs(active.content.split("|")[1])
                                                        : null
                                                }
                                                onChange={(newValue) => {
                                                    const fromDate = active.content?.split("|")[0] || "";
                                                    const toDate = newValue
                                                        ? newValue.format("YYYY-MM-DD")
                                                        : "";

                                                    const duration = calculateMonths(fromDate, toDate);

                                                    updateSection(active.key, {
                                                        content: `${fromDate}|${toDate}|${duration}`,
                                                    });
                                                }}
                                            />
                                        </LocalizationProvider>
                                    </div>

                                    <div className="col-12">
                                        <div className="p-2" style={{ background: "rgba(79,110,247,0.08)", borderRadius: 8 }}>
                                            <strong>Retention Duration:</strong>{" "}
                                            {active.content?.split("|")[2] || "—"}
                                        </div>
                                    </div>
                                </div>

                            ) : (
                                <textarea
                                    className="form-control"
                                    rows={10}
                                    value={active.content}
                                    onChange={(e) =>
                                        updateSection(active.key, { content: e.target.value })
                                    }
                                />
                            )}
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <span
                                    style={{ fontSize: 12, color: "var(--bs-secondary-color)" }}
                                >
                                    {active.content.length} characters
                                </span>
                                {active.content.trim().length > 0 && (
                                    <span style={{ fontSize: 12, color: "#198754" }}>
                                        <i className="bi bi-check-circle me-1" />
                                        Section complete
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    // ── Step 3: Review & Send ─────────────────────────────────────────────────

    const renderStep3 = () => {
        const missing = form.sections.filter(
            (s) => s.required && s.enabled && s.content.trim().length === 0
        );
        return (
            <div>
                {/* Summary Card */}
                <div
                    className="p-4 mb-4"
                    style={{
                        background:
                            "linear-gradient(135deg, rgba(79,110,247,0.1), rgba(79,110,247,0.04))",
                        borderRadius: 12,
                        border: "1px solid rgba(79,110,247,0.2)",
                    }}
                >
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="small text-secondary mb-1">Notice Name</div>
                            <div className="fw-semibold">{form.noticeName || "—"}</div>
                        </div>
                        <div className="col-md-6">
                            <div className="small text-secondary mb-1">Organization</div>
                            <div className="fw-semibold">{form.organizationName || "—"}</div>
                        </div>
                        <div className="col-md-4">
                            <div className="small text-secondary mb-1">Effective Date</div>
                            <div>{form.effectiveDate || "—"}</div>
                        </div>
                        <div className="col-md-4">
                            <div className="small text-secondary mb-1">Version</div>
                            <div>{form.version}</div>
                        </div>
                        <div className="col-md-4">
                            <div className="small text-secondary mb-1">Language</div>
                            <div>
                                {LANGUAGE_OPTIONS.find((l) => l.value === form.language)?.label}
                            </div>
                        </div>
                        {form.linkedFormId && (
                            <div className="col-12">
                                <div className="small text-secondary mb-1">Linked Form</div>
                                <div>
                                    <i className="bi bi-link-45deg me-1 text-primary" />
                                    {form.linkedFormId}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sections Status */}
                <div className="mb-4">
                    <div className="fw-semibold mb-3">Section Completion Status</div>
                    <div className="row g-2">
                        {form.sections
                            .filter((s) => s.enabled)
                            .map((sec) => {
                                const filled = sec.content.trim().length > 0;
                                return (
                                    <div key={sec.key} className="col-12 col-md-6">
                                        <div
                                            className="d-flex align-items-center gap-2 p-2"
                                            style={{
                                                background: filled
                                                    ? "rgba(25,135,84,0.08)"
                                                    : sec.required
                                                    ? "rgba(220,53,69,0.08)"
                                                    : "rgba(255,255,255,0.03)",
                                                borderRadius: 8,
                                                border: `1px solid ${
                                                    filled
                                                        ? "rgba(25,135,84,0.2)"
                                                        : sec.required
                                                        ? "rgba(220,53,69,0.2)"
                                                        : "rgba(255,255,255,0.06)"
                                                }`,
                                            }}
                                        >
                                            <i
                                                className={`bi ${
                                                    filled
                                                        ? "bi-check-circle-fill text-success"
                                                        : sec.required
                                                        ? "bi-exclamation-circle-fill text-danger"
                                                        : "bi-circle text-secondary"
                                                }`}
                                                style={{ fontSize: 14, flexShrink: 0 }}
                                            />
                                            <span
                                                style={{ fontSize: 12, lineHeight: 1.3 }}
                                                className={
                                                    filled
                                                        ? "text-success"
                                                        : sec.required
                                                        ? "text-danger"
                                                        : "text-secondary"
                                                }
                                            >
                                                {sec.title}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Warnings */}
                {missing.length > 0 && (
                    <div
                        className="p-3 mb-4"
                        style={{
                            background: "rgba(220,53,69,0.08)",
                            borderRadius: 10,
                            border: "1px solid rgba(220,53,69,0.25)",
                        }}
                    >
                        <div className="fw-semibold text-danger mb-2">
                            <i className="bi bi-exclamation-triangle me-2" />
                            {missing.length} required section{missing.length > 1 ? "s" : ""} incomplete
                        </div>
                        {missing.map((s) => (
                            <div key={s.key} className="small text-danger opacity-75">
                                • {s.title}
                            </div>
                        ))}
                    </div>
                )}

                {/* Email delivery note */}
                <div
                    className="p-3"
                    style={{
                        background: "rgba(13,202,240,0.06)",
                        borderRadius: 10,
                        border: "1px solid rgba(13,202,240,0.15)",
                        fontSize: 13,
                    }}
                >
                    <div className="fw-semibold mb-1" style={{ color: "#5ac8fa" }}>
                        <i className="bi bi-envelope-check me-2" />
                        Email Delivery
                    </div>
                    <div className="text-secondary">
                        When saved and published, this Privacy Notice will be automatically
                        emailed to Data Principals{" "}
                        {form.linkedFormId ? (
                            <>
                                before they access the form{" "}
                                <strong className="text-light">{form.linkedFormId}</strong>
                            </>
                        ) : (
                            "before they fill any linked form"
                        )}
                        . Consent to the notice will be captured and stored for compliance
                        purposes under the DPDP Act, 2023.
                    </div>
                </div>
            </div>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {showPreview && (
                <PreviewModal form={form} onClose={() => setShowPreview(false)} />
            )}

            <div className="container-fluid">
                {/* Top panel */}
                <div className="panel mb-3">
                    <div className="panel-head p-3 d-flex flex-wrap gap-3 align-items-center justify-content-between">
                        <div>
                            <div className="h5 mb-1 d-flex align-items-center gap-2">
                                <i className="bi bi-file-earmark-lock2 text-primary" />
                                Privacy Notice Builder
                            </div>
                            <div className="text-secondary small">
                                Create DPDP Act, 2023 compliant privacy notices · Linked to consent
                                forms · Emailed to Data Principals
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-sm"
                                style={{
                                    background: "rgba(255,255,255,0.07)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "var(--bs-body-color)",
                                }}
                                onClick={() => setShowPreview(true)}
                            >
                                <i className="bi bi-eye me-1" />
                                Preview
                            </button>
                            {saved ? (
                                <button className="btn btn-sm btn-success" disabled>
                                    <i className="bi bi-check-circle me-1" />
                                    Saved!
                                </button>
                            ) : (
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={handleSave}
                                    disabled={!requiredFilled || !step1Valid}
                                >
                                    <i className="bi bi-floppy me-1" />
                                    Save Notice
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step indicator */}
                <div
                    className="panel mb-3"
                    style={{ padding: "16px 24px" }}
                >
                    <div className="d-flex gap-4 align-items-center flex-wrap">
                        <StepIndicator step={1} current={step} label="Basic Information" />
                        <div
                            style={{
                                flex: 1,
                                height: 1,
                                background: "rgba(255,255,255,0.07)",
                                minWidth: 20,
                            }}
                        />
                        <StepIndicator step={2} current={step} label="Write Sections" />
                        <div
                            style={{
                                flex: 1,
                                height: 1,
                                background: "rgba(255,255,255,0.07)",
                                minWidth: 20,
                            }}
                        />
                        <StepIndicator step={3} current={step} label="Review & Publish" />
                    </div>
                </div>

                {/* Main content */}
                <div className="panel">
                    <div className="p-4">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </div>

                    {/* Navigation */}
                    <div
                        className="p-3 d-flex justify-content-between align-items-center"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                    >
                        <button
                            className="btn btn-sm"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "var(--bs-body-color)",
                            }}
                            disabled={step === 1}
                            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                        >
                            <i className="bi bi-arrow-left me-1" />
                            Back
                        </button>

                        <div className="d-flex align-items-center gap-2">
                            {step === 2 && (
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "var(--bs-secondary-color)",
                                    }}
                                >
                                    {completedSections}/{enabledSections} sections filled
                                </span>
                            )}
                            {step < 3 ? (
                                <button
                                    className="btn btn-sm btn-primary"
                                    disabled={step === 1 && !step1Valid}
                                    onClick={() => {
                                        setStep((s) => (s + 1) as 1 | 2 | 3);
                                        if (step === 1 && form.sections[0]) {
                                            setActiveSection(form.sections[0].key);
                                        }
                                    }}
                                >
                                    Next
                                    <i className="bi bi-arrow-right ms-1" />
                                </button>
                            ) : (
                                <button
                                    className="btn btn-sm"
                                    style={{
                                        background: requiredFilled && step1Valid
                                            ? "linear-gradient(135deg, #198754, #28a745)"
                                            : "rgba(255,255,255,0.05)",
                                        border: "none",
                                        color: "#fff",
                                    }}
                                    disabled={!requiredFilled || !step1Valid}
                                    onClick={handleSave}
                                >
                                    <i className="bi bi-send me-1" />
                                    Publish & Enable Email Delivery
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PrivacyNoticeBuilder;
