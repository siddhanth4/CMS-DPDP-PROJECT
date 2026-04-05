import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProject } from "../Context/projectContext";
import { PopupAlert } from "../Components/alert";
import { updateFormResponseData } from "../Api/updateFormResponse";
import { addConsentRemoveRequest } from "../Api/addRemoveConsentRequest";
import { sendOtpMail } from "../Api/sendMailOtp";

/* ================= TYPES ================= */
type FieldType =
    | "text"
    | "email"
    | "phone"
    | "number"
    | "dropdown"
    | "radio"
    | "checkbox"
    | "date"
    | "upload"
    | "terms";

type BuilderField = {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    validation?: {
        minLength?: number;
        maxLength?: number;
        errorMessage?: string;
        pattern?: string;
    };
    description?: string;
    descriptionAuto?: boolean;
    options?: { id: string; label: string; value?: string }[];
    numberConfig?: { min?: number; max?: number };
    uploadConfig?: { accept?: string; multiple?: boolean; maxSizeMB?: number };
    termsConfig?: { text?: string };
    locked?: boolean;
    value?: any;
};

type Meta = {
    title?: string;
    subtitle?: string;
    category?: string;
};

type FormResponseSchema = {
    id?: string;
    meta?: Meta;
    fields?: BuilderField[];
    createdAt?: string;
    updatedAt?: string;
    submittedAt?: string;
};

/* ================= VALIDATION HELPERS ================= */
const isPasswordField = (f: BuilderField) => {
    const text = `${f.id} ${f.label} ${f.placeholder ?? ""}`.toLowerCase();
    return text.includes("password") || text.includes("pass word") || text.includes("pwd");
};

const isPhoneField = (f: BuilderField) => {
    const text = `${f.id} ${f.label} ${f.placeholder ?? ""}`.toLowerCase();

    if (
        text.includes("pincode") ||
        text.includes("pin code") ||
        text.includes("postal code") ||
        text.includes("zipcode") ||
        text.includes("zip code")
    ) {
        return false;
    }

    return (
        f.type === "phone" ||
        text.includes("mobile") ||
        text.includes("phone") ||
        text.includes("contact")
    );
};

const isEmailField = (f: BuilderField) => {
    const text = `${f.id} ${f.label} ${f.placeholder ?? ""}`.toLowerCase();
    return f.type === "email" || text.includes("email") || text.includes("e-mail");
};

const isPincodeField = (f: BuilderField) => {
    const text = `${f.id} ${f.label} ${f.placeholder ?? ""}`.toLowerCase();
    return (
        text.includes("pincode") ||
        text.includes("pin code") ||
        text.includes("postal code") ||
        text.includes("zipcode") ||
        text.includes("zip code")
    );
};

const getEmptyErrorMessage = (f: BuilderField) =>
    f.validation?.errorMessage?.trim() || "This field is required.";

const validateField = (f: BuilderField, value: any): string => {
    const isEmpty =
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "boolean" && value === false && f.type === "terms");

    if (f.required && isEmpty) {
        return getEmptyErrorMessage(f);
    }

    if (isEmpty) return "";

    const strValue = typeof value === "string" ? value.trim() : value;

    if (isEmailField(f) && typeof strValue === "string" && strValue !== "") {
        const regex = f.validation?.pattern
            ? new RegExp(f.validation.pattern)
            : /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regex.test(strValue)) {
            return f.validation?.errorMessage?.trim() || "Please enter a valid email address.";
        }
    }

    if (isPincodeField(f) && typeof strValue === "string" && strValue !== "") {
        const onlyDigits = strValue.replace(/\D/g, "");
        if (!/^\d{6}$/.test(onlyDigits)) {
            return f.validation?.errorMessage?.trim() || "Please enter a valid 6-digit pincode.";
        }
        return "";
    }

    if (isPhoneField(f) && typeof strValue === "string" && strValue !== "") {
        const onlyDigits = strValue.replace(/\D/g, "");
        if (!/^\d{10}$/.test(onlyDigits)) {
            return (
                f.validation?.errorMessage?.trim() ||
                "Please enter a valid 10-digit mobile number."
            );
        }
        return "";
    }

    if (isPasswordField(f) && typeof strValue === "string" && strValue !== "") {
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+={}[\]:;"'<>,./\\|`~]).{8,}$/;

        if (!passwordRegex.test(strValue)) {
            return (
                f.validation?.errorMessage?.trim() ||
                "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
            );
        }
        return "";
    }

    if (f.type === "number" && strValue !== "") {
        const n = Number(strValue);

        if (Number.isNaN(n)) {
            return f.validation?.errorMessage?.trim() || "Please enter a valid number.";
        }

        if (typeof f.numberConfig?.min === "number" && n < f.numberConfig.min) {
            return (
                f.validation?.errorMessage?.trim() ||
                `Value must be at least ${f.numberConfig.min}.`
            );
        }

        if (typeof f.numberConfig?.max === "number" && n > f.numberConfig.max) {
            return (
                f.validation?.errorMessage?.trim() ||
                `Value must be at most ${f.numberConfig.max}.`
            );
        }

        return "";
    }

    if (typeof strValue === "string") {
        const plainLength = strValue.length;

        if (
            typeof f.validation?.minLength === "number" &&
            plainLength < f.validation.minLength
        ) {
            return (
                f.validation?.errorMessage?.trim() ||
                `Minimum ${f.validation.minLength} characters required.`
            );
        }

        if (
            typeof f.validation?.maxLength === "number" &&
            plainLength > f.validation.maxLength
        ) {
            return (
                f.validation?.errorMessage?.trim() ||
                `Maximum ${f.validation.maxLength} characters allowed.`
            );
        }
    }

    return "";
};

/* ================= FIELD RENDER ================= */
const renderField = (
    f: BuilderField,
    value: any,
    setValue: (v: any) => void,
    onBlur?: () => void,
    error?: string
) => {
    const controlClass = `form-control ${error ? "is-invalid" : ""}`;
    const selectClass = `form-select ${error ? "is-invalid" : ""}`;

    switch (f.type) {
        case "dropdown":
            return (
                <select
                    className={selectClass}
                    required={f.required}
                    value={value ?? ""}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={onBlur}
                >
                    <option value="">{f.placeholder || "Select..."}</option>
                    {(f.options ?? []).map((o) => (
                        <option key={o.id} value={o.value ?? o.label}>
                            {o.label}
                        </option>
                    ))}
                </select>
            );

        case "radio":
            return (
                <div className="mt-2">
                    {(f.options ?? []).map((o) => {
                        const v = o.value ?? o.label;
                        return (
                            <div key={o.id} className="form-check mb-2">
                                <input
                                    className={`form-check-input ${error ? "is-invalid" : ""}`}
                                    type="radio"
                                    name={f.id}
                                    value={v}
                                    checked={value === v}
                                    required={f.required}
                                    onChange={(e) => setValue(e.target.value)}
                                    onBlur={onBlur}
                                />
                                <label className="form-check-label">{o.label}</label>
                            </div>
                        );
                    })}
                </div>
            );

        case "checkbox":
            return (
                <div className="mt-2">
                    {(f.options ?? []).map((o) => {
                        const v = o.value ?? o.label;
                        const arr: string[] = Array.isArray(value) ? value : [];
                        const checked = arr.includes(v);

                        return (
                            <div key={o.id} className="form-check mb-2">
                                <input
                                    className={`form-check-input ${error ? "is-invalid" : ""}`}
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                        if (e.target.checked) setValue([...arr, v]);
                                        else setValue(arr.filter((x) => x !== v));
                                    }}
                                    onBlur={onBlur}
                                />
                                <label className="form-check-label">{o.label}</label>
                            </div>
                        );
                    })}
                </div>
            );

        case "number":
            return (
                <input
                    className={controlClass}
                    type="number"
                    placeholder={f.placeholder || ""}
                    min={f.numberConfig?.min}
                    max={f.numberConfig?.max}
                    required={f.required}
                    value={value ?? ""}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={onBlur}
                />
            );

        case "email":
            return (
                <input
                    className={controlClass}
                    type="email"
                    placeholder={f.placeholder || ""}
                    required={f.required}
                    minLength={f.validation?.minLength}
                    maxLength={f.validation?.maxLength}
                    value={value ?? ""}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={onBlur}
                />
            );

        case "phone":
            return (
                <input
                    className={controlClass}
                    type="text"
                    inputMode="numeric"
                    placeholder={f.placeholder || ""}
                    required={f.required}
                    minLength={f.validation?.minLength}
                    maxLength={f.validation?.maxLength}
                    value={value ?? ""}
                    onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, "");
                        const maxLen =
                            typeof f.validation?.maxLength === "number"
                                ? f.validation.maxLength
                                : undefined;
                        setValue(maxLen ? onlyDigits.slice(0, maxLen) : onlyDigits);
                    }}
                    onBlur={onBlur}
                />
            );

        case "date":
            return (
                <input
                    className={controlClass}
                    type="date"
                    required={f.required}
                    value={value ?? ""}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={onBlur}
                />
            );

        case "upload":
            return (
                <input
                    className={controlClass}
                    type="file"
                    accept={f.uploadConfig?.accept}
                    multiple={!!f.uploadConfig?.multiple}
                    required={f.required}
                    onChange={(e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (!files) return setValue(null);
                        if (f.uploadConfig?.multiple) setValue(Array.from(files));
                        else setValue(files[0] ?? null);
                    }}
                    onBlur={onBlur}
                />
            );

        case "terms":
            return (
                <label className="d-flex align-items-start gap-2">
                    <input
                        type="checkbox"
                        required={f.required}
                        checked={!!value}
                        onChange={(e) => setValue(e.target.checked)}
                        onBlur={onBlur}
                    />
                    <span>{f.termsConfig?.text ?? "I agree to the terms"}</span>
                </label>
            );

        default:
            return (
                <input
                    className={controlClass}
                    type={isPasswordField(f) ? "password" : "text"}
                    placeholder={f.placeholder || ""}
                    required={f.required}
                    minLength={f.validation?.minLength}
                    maxLength={f.validation?.maxLength}
                    value={value ?? ""}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={onBlur}
                />
            );
    }
};

const MyFormDetails: React.FC = () => {
    const [searchParams] = useSearchParams();
    const responseId = Number(searchParams.get("responseId") || searchParams.get("id"));

    const {
        selectedFormResponseById,
        selectedFormResponseByIdLoading,
        selectedFormResponseByIdError,
        fetchFormResponseByResponseId,
        publicIP,
        refreshIP,
    } = useProject();

    const [values, setValues] = useState<Record<string, any>>({});
    const [initialValues, setInitialValues] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [removeConsentConfirmOpen, setRemoveConsentConfirmOpen] = useState(false);

    const [successOpen, setSuccessOpen] = useState(false);
    const [dangerOpen, setDangerOpen] = useState(false);
    const [dangerMsg, setDangerMsg] = useState("Something went wrong!");
    const [successTitle, setSuccessTitle] = useState("Updated!");
    const [successMsg, setSuccessMsg] = useState("Your response was updated successfully.");

    const [consentTruth, setConsentTruth] = useState(false);
    const [consentDpdp, setConsentDpdp] = useState(false);

    const [otpServer, setOtpServer] = useState<string>("");
    const [otpInput, setOtpInput] = useState<string>("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [removeConsentLoading, setRemoveConsentLoading] = useState(false);

    // ✅ NEW
    const [removeConsentRemark, setRemoveConsentRemark] = useState("");
    const [removeConsentRemarkError, setRemoveConsentRemarkError] = useState("");

    const year = useMemo(() => new Date().getFullYear(), []);

    useEffect(() => {
        if (!responseId || Number.isNaN(responseId)) return;
        fetchFormResponseByResponseId(responseId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [responseId]);

    useEffect(() => {
        if (!publicIP) refreshIP();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicIP]);

    const responseSchema: FormResponseSchema | null =
        (selectedFormResponseById?.FormResponse as FormResponseSchema) ?? null;

    const fields: BuilderField[] = responseSchema?.fields ?? [];
    const meta: Meta = responseSchema?.meta ?? {};
    const formId = selectedFormResponseById?.FormId ?? 0;

    useEffect(() => {
        if (!fields.length) return;

        const init: Record<string, any> = {};

        for (const f of fields) {
            if (f.value !== undefined && f.value !== null) {
                init[f.id] = f.value;
            } else if (f.type === "checkbox") {
                init[f.id] = [];
            } else if (f.type === "terms") {
                init[f.id] = false;
            } else {
                init[f.id] = "";
            }
        }

        setValues(init);
        setInitialValues(init);
        setSubmitted(false);
        setFieldErrors({});
        setTouched({});
        setConsentTruth(false);
        setConsentDpdp(false);
        setOtpServer("");
        setOtpInput("");
        setOtpSent(false);

        // ✅ NEW
        setRemoveConsentRemark("");
        setRemoveConsentRemarkError("");
    }, [selectedFormResponseById, fields.length]);

    const validateAllFields = () => {
        const errs: Record<string, string> = {};
        for (const f of fields) {
            const msg = validateField(f, values[f.id]);
            if (msg) errs[f.id] = msg;
        }
        return errs;
    };

    const handleFieldChange = (f: BuilderField, v: any) => {
        setValues((prev) => ({ ...prev, [f.id]: v }));

        const msg = validateField(f, v);
        setFieldErrors((prev) => ({
            ...prev,
            [f.id]: msg,
        }));

        setTouched((prev) => ({
            ...prev,
            [f.id]: true,
        }));
    };

    const handleFieldBlur = (f: BuilderField) => {
        const msg = validateField(f, values[f.id]);
        setFieldErrors((prev) => ({
            ...prev,
            [f.id]: msg,
        }));
        setTouched((prev) => ({
            ...prev,
            [f.id]: true,
        }));
    };

    const clearForm = () => {
        setValues(initialValues);
        setSubmitted(false);
        setFieldErrors({});
        setTouched({});
        setConsentTruth(false);
        setConsentDpdp(false);
        setOtpServer("");
        setOtpInput("");
        setOtpSent(false);

        // ✅ NEW
        setRemoveConsentRemark("");
        setRemoveConsentRemarkError("");
    };

    const extractEmailMobile = () => {
        let email = "";
        let mobile = "";

        for (const f of fields) {
            const v = values[f.id];

            if (!email && (f.type === "email" || /email/i.test(f.id) || /email/i.test(f.label))) {
                if (typeof v === "string") email = v.trim();
            }

            if (
                !mobile &&
                (f.type === "phone" ||
                    /mobile/i.test(f.id) ||
                    /phone/i.test(f.id) ||
                    /mobile/i.test(f.label) ||
                    /phone/i.test(f.label))
            ) {
                if (typeof v === "string") mobile = v.trim();
            }
        }

        return { email, mobile };
    };

    const generateOtp6 = async () => {
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        setOtpServer(otp);
        setOtpSent(true);
        setOtpInput("");

        console.log("LATEST_OTP:", otp);

        try {
            const { email } = extractEmailMobile();

            if (!email) {
                setDangerMsg("Email not found. OTP generated, but email is empty.");
                setDangerOpen(true);
                return;
            }

            setOtpSending(true);

            await sendOtpMail({
                ToEmail: email,
                OTP: otp,
                ExpiryMinutes: 5,
            });
        } catch (err: any) {
            setDangerMsg(err?.message || "OTP generated, but email sending failed");
            setDangerOpen(true);
        } finally {
            setOtpSending(false);
        }
    };

    const otpOk =
        otpServer.length === 6 &&
        otpInput.trim().length === 6 &&
        otpInput.trim() === otpServer;

    const canSubmit = consentTruth && consentDpdp && otpOk;
    const canRemoveConsent = otpOk;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        const errs = validateAllFields();
        setFieldErrors(errs);

        const allTouched: Record<string, boolean> = {};
        for (const f of fields) allTouched[f.id] = true;
        setTouched(allTouched);

        if (Object.keys(errs).length > 0) return;

        setConfirmOpen(true);
    };

    const normalizeFieldValue = (f: BuilderField, value: any) => {
        if (f.type === "upload") {
            if (Array.isArray(value)) {
                return value.map((file: File | any) => {
                    if (file instanceof File) {
                        return {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                        };
                    }
                    return file;
                });
            }

            if (value instanceof File) {
                return {
                    name: value.name,
                    size: value.size,
                    type: value.type,
                };
            }

            return value ?? null;
        }

        return value;
    };

    const buildFormResponsePayload = () => ({
        id: responseSchema?.id || `form_${formId}`,
        meta,
        fields: fields.map((f) => ({
            ...f,
            value: normalizeFieldValue(
                f,
                values[f.id] ?? (f.type === "checkbox" ? [] : f.type === "terms" ? false : "")
            ),
        })),
        createdAt: responseSchema?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
    });

    const onConfirmSubmit = async () => {
        try {
            const { email, mobile } = extractEmailMobile();

            const responsePayload = buildFormResponsePayload();

            const res = await updateFormResponseData({
                ResponseId: responseId,
                FormId: formId,
                IPAddress: publicIP || "0.0.0.0",
                Status: "Y",
                FormResponse: responsePayload,
                MobileNo: mobile,
                EmailId: email,
            });

            if (res?.responseCode !== 101) {
                throw new Error(res?.responseMessage || "Failed to update form response");
            }

            setConfirmOpen(false);
            setSuccessTitle("Updated!");
            setSuccessMsg("Your response was updated successfully.");
            setSuccessOpen(true);

            await fetchFormResponseByResponseId(responseId);
        } catch (err: any) {
            setConfirmOpen(false);
            setDangerMsg(err?.message || "Failed to update form response");
            setDangerOpen(true);
        }
    };

    // ✅ NEW
    const openRemoveConsentPopup = () => {
        setRemoveConsentRemark("");
        setRemoveConsentRemarkError("");
        setRemoveConsentConfirmOpen(true);
    };

    const onRemoveConsent = async () => {
        const remark = removeConsentRemark.trim();

        if (!remark) {
            setRemoveConsentRemarkError("Please enter remark.");
            return;
        }

        try {
            setRemoveConsentLoading(true);

            const res = await addConsentRemoveRequest({
                ResponseId: responseId,
                ConsentRemovalRemark: remark,
            });

            if (res?.responseCode !== 101) {
                throw new Error(res?.responseMessage || "Consent remove failed");
            }

            setRemoveConsentConfirmOpen(false);
            setRemoveConsentRemark("");
            setRemoveConsentRemarkError("");
            setSuccessTitle("Consent Removed!");
            setSuccessMsg(res.responseMessage || "Consent remove request submitted successfully.");
            setSuccessOpen(true);
        } catch (err: any) {
            setRemoveConsentConfirmOpen(false);
            setDangerMsg(err?.message || "Consent remove failed");
            setDangerOpen(true);
        } finally {
            setRemoveConsentLoading(false);
        }
    };

    if (!responseId || Number.isNaN(responseId)) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger mb-0">Invalid response link.</div>
            </div>
        );
    }

    if (selectedFormResponseByIdLoading) {
        return (
            <div className="container py-5">
                <div className="text-secondary">Loading form response...</div>
            </div>
        );
    }

    if (selectedFormResponseByIdError) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger mb-0">{selectedFormResponseByIdError}</div>
            </div>
        );
    }

    if (!selectedFormResponseById?.FormResponse || !fields.length) {
        return (
            <div className="container py-5">
                <div className="text-secondary">Form response not found / no fields.</div>
            </div>
        );
    }

    const getFieldDescription = (f: BuilderField) => {
        return (f.description ?? "").trim();
    };

    return (
        <>
            <div className="shell">
                <div className="topbar mb-2 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                        <div className="brand-badge">FF</div>
                        <div className="lh-sm">
                            <div className="fw-bold" style={{ fontSize: ".98rem" }}>
                                NJ Softtech
                            </div>
                            <div className="text-secondary" style={{ fontSize: ".78rem" }}>
                                Secure Form
                            </div>
                        </div>
                    </div>

                    <span className="help-chip d-none d-md-inline">
                        <i className="bi bi-shield-lock" /> Encrypted
                    </span>
                </div>

                <div className="hero mb-2">
                    <div className="row g-2 align-items-center">
                        <div className="col-12 col-md-8">
                            <div className="text-secondary small fw-semibold text-uppercase">
                                {meta.category ?? "Registration"}
                            </div>
                            <div className="h4 fw-bold mb-1">{meta.title ?? "My Form Details"}</div>
                            {!!meta.subtitle && (
                                <div className="text-secondary small mb-1">{meta.subtitle}</div>
                            )}
                            <div className="text-secondary small">
                                Fields marked with <span className="req">*</span> are required.
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                                <span className="help-chip">
                                    <i className="bi bi-clock" /> ~2 min
                                </span>
                                <span className="help-chip">
                                    <i className="bi bi-envelope" /> Confirm
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-card card">
                    <div className="card-header">
                        <div className="d-flex align-items-start justify-content-between gap-2">
                            <div>
                                <div className="fw-bold">{meta.title ?? "My Form Details"}</div>
                                <div className="text-secondary" style={{ fontSize: ".8rem" }}>
                                    Powered by NJ Softtech
                                </div>
                            </div>
                            <span className="badge rounded-pill text-bg-secondary">Details</span>
                        </div>
                    </div>

                    <div className="card-body">
                        <form noValidate onSubmit={onSubmit}>
                            <div className="row g-3">
                                {fields.map((f) => {
                                    const err = fieldErrors[f.id] || "";
                                    const showErr = !!err && (submitted || touched[f.id]);
                                    const desc = getFieldDescription(f);

                                    return (
                                        <div key={f.id} className="col-12">
                                            <div className="row g-2 align-items-start">
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label fw-semibold">
                                                        {f.label} {f.required && <span className="req">*</span>}
                                                    </label>

                                                    {renderField(
                                                        f,
                                                        values[f.id],
                                                        (v) => handleFieldChange(f, v),
                                                        () => handleFieldBlur(f),
                                                        showErr ? err : ""
                                                    )}

                                                    {showErr && (
                                                        <div className="form-text text-danger">
                                                            {err}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="col-12 col-md-6">
                                                    {!!desc && (
                                                        <div
                                                            className="small"
                                                            style={{
                                                                color: "red",
                                                                lineHeight: 1.4,
                                                                paddingTop: 30,
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

                                <div className="col-12">
                                    <div className="d-flex flex-column gap-2">
                                        <label className="form-check d-flex align-items-start gap-2 mb-0">
                                            <input
                                                className="form-check-input mt-1"
                                                type="checkbox"
                                                checked={consentTruth}
                                                onChange={(e) => setConsentTruth(e.target.checked)}
                                            />
                                            <span className="small">
                                                I am aware that it is my duty to submit truthful information.
                                            </span>
                                        </label>

                                        <label className="form-check d-flex align-items-start gap-2 mb-0">
                                            <input
                                                className="form-check-input mt-1"
                                                type="checkbox"
                                                checked={consentDpdp}
                                                onChange={(e) => setConsentDpdp(e.target.checked)}
                                            />
                                            <span className="small">
                                                I hereby provide my free, specific, informed, and unambiguous consent to the
                                                Data Fiduciary for the processing, retention, and use of my personal data in
                                                accordance with the applicable provisions section 6 of the Digital Personal
                                                Data Protection Act, 2023.
                                            </span>
                                        </label>

                                        <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                                            <div className="small fw-semibold">Email / sms / Whatsapp OTP</div>

                                            <div className="position-relative" style={{ maxWidth: 220, width: "100%" }}>
                                                <input
                                                    className={`form-control pe-5 ${otpInput.trim().length === 6
                                                            ? otpOk
                                                                ? "is-valid"
                                                                : "is-invalid"
                                                            : ""
                                                        }`}
                                                    placeholder="Enter OTP"
                                                    value={otpInput}
                                                    maxLength={6}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    onChange={(e) => {
                                                        const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                        setOtpInput(onlyDigits);
                                                    }}
                                                />

                                                {otpInput.trim().length === 6 && (
                                                    <span
                                                        className="position-absolute top-50 translate-middle-y"
                                                        style={{ right: 10 }}
                                                    >
                                                        {otpOk ? (
                                                            <i className="bi bi-check-circle-fill right-icon" />
                                                        ) : (
                                                            <i className="bi bi-x-circle-fill wrong-icon" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="small">for my consent.</div>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={generateOtp6}
                                                disabled={otpSending}
                                            >
                                                {otpSending ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-12 d-flex flex-wrap gap-2 align-items-center justify-content-between pt-1">
                                    <div className="footer-note d-none d-md-block">
                                        <i className="bi bi-info-circle" /> Review before submit
                                    </div>

                                    <div className="d-flex gap-2 ms-auto">
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            style={{ borderRadius: 12 }}
                                            disabled={!canRemoveConsent || removeConsentLoading}
                                            title={!canRemoveConsent ? "Please verify OTP to remove consent" : ""}
                                            onClick={openRemoveConsentPopup}
                                        >
                                            {removeConsentLoading ? "Processing..." : "Remove Consent"}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            style={{ borderRadius: 12 }}
                                            onClick={clearForm}
                                        >
                                            Reset
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-brand btn-sm px-3"
                                            disabled={!canSubmit}
                                            title={!canSubmit ? "Please accept consent and verify OTP to submit" : ""}
                                        >
                                            <i className="bi bi-send me-1" />
                                            Update
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="footer-note text-center mt-3">
                    © {year} NJ Softtech • Form Builder
                </div>
            </div>

            <PopupAlert
                open={confirmOpen}
                type="warning"
                title="Confirm Update"
                message="Are you sure you want to update this form response?"
                confirmMode
                confirmText="Yes, Update"
                cancelText="No"
                onClose={() => setConfirmOpen(false)}
                onConfirm={onConfirmSubmit}
                onCancel={() => setConfirmOpen(false)}
            />

            {/* ✅ REMOVE CONSENT MODAL WITH REMARK FIELD */}
            {removeConsentConfirmOpen && (
                <>
                    <div className="modal-backdrop fade show" />
                    <div
                        className="modal fade show d-block"
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Remove Consent</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => {
                                            if (removeConsentLoading) return;
                                            setRemoveConsentConfirmOpen(false);
                                        }}
                                    />
                                </div>

                                <div className="modal-body">
                                    <p className="mb-3">
                                        Please enter remark before sending remove consent request.
                                    </p>

                                    <label className="form-label fw-semibold">
                                        Remark <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        className={`form-control ${removeConsentRemarkError ? "is-invalid" : ""}`}
                                        rows={4}
                                        placeholder="Enter remark..."
                                        value={removeConsentRemark}
                                        onChange={(e) => {
                                            setRemoveConsentRemark(e.target.value);
                                            if (e.target.value.trim()) {
                                                setRemoveConsentRemarkError("");
                                            }
                                        }}
                                    />
                                    {removeConsentRemarkError && (
                                        <div className="invalid-feedback d-block">
                                            {removeConsentRemarkError}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => {
                                            if (removeConsentLoading) return;
                                            setRemoveConsentConfirmOpen(false);
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={onRemoveConsent}
                                        disabled={removeConsentLoading}
                                    >
                                        {removeConsentLoading ? "Sending..." : "Send Request"}
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
                title={successTitle}
                message={successMsg}
                onClose={() => setSuccessOpen(false)}
                autoCloseMs={2000}
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
};

export default MyFormDetails;