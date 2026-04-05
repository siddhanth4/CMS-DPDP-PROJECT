import React, { useEffect, useMemo, useState } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    arrayMove,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useProject } from "../Context/projectContext";
import { addFormData } from "../Api/addFormData";
import { PopupAlert } from "../Components/alert"; // ✅ correct path


/* ===================== TYPES ===================== */
type SortableFieldCardProps = {
    f: BuilderField;
    selectedId: string;
    canDelete: boolean;
    onSelect: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
};
type FormSchema = {
    id: string;
    meta: Meta;
    fields: BuilderField[];
    createdAt: string;
    updatedAt: string;
};

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

type ToolboxItem = {
    type: FieldType;
    title: string;
    subtitle: string;
    icon: string; // bootstrap icon class name
    group: "Basic" | "Choices" | "Other";
};

type FieldValidation = {
    minLength?: number;
    maxLength?: number;
    errorMessage?: string;
    pattern?: string;
};

type FieldOption = { id: string; label: string; value?: string };

type UploadConfig = {
    accept?: string;       // ".png,.jpg,application/pdf"
    multiple?: boolean;
    maxSizeMB?: number;
};

type NumberConfig = {
    min?: number;
    max?: number;
};

type TermsConfig = {
    text?: string;
};

type BuilderField = {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    validation?: FieldValidation;
    description?: string;
    descriptionAuto?: boolean;
    // ✅ type specific
    options?: FieldOption[];     // dropdown/radio/checkbox
    numberConfig?: NumberConfig; // number
    uploadConfig?: UploadConfig; // upload
    termsConfig?: TermsConfig;   // terms

    locked?: boolean;
};

type Meta = {
    category: string;
    title: string;
    subtitle: string;
};

/* ===================== HELPERS ===================== */
const uid = () => Math.random().toString(36).slice(2, 10);
const defaultOptions = (): FieldOption[] => [
    { id: uid(), label: "Option 1" },
    { id: uid(), label: "Option 2" },
];


const defaultFieldByType = (type: FieldType): BuilderField => {
    const base: BuilderField = {
        id: uid(),
        type,
        label: "New Field",
        placeholder: "",
        required: false,
        validation: { minLength: undefined, maxLength: undefined, errorMessage: "" },
        description: "",
        descriptionAuto: false
    };

    switch (type) {
        case "text":
            return { ...base, label: "Full Name", placeholder: "e.g., Narendra Modi", required: true };
        case "email":
            return {
                ...base,
                label: "Email",
                placeholder: "name@company.com",
                required: true,
                validation: {
                    minLength: undefined,
                    maxLength: undefined,
                    errorMessage: "Please enter a valid email address",
                    pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
                },
            }; case "phone":
            return { ...base, label: "Phone", placeholder: "Enter phone number" };
        case "dropdown":
            return { ...base, label: "Dropdown", placeholder: "Select an option", options: defaultOptions() };

        case "radio":
            return { ...base, label: "Radio", options: defaultOptions() };

        case "checkbox":
            return { ...base, label: "Checkbox", options: defaultOptions() };

        case "number":
            return { ...base, label: "Number", placeholder: "Enter number", numberConfig: { min: 0, max: 100 } };

        case "upload":
            return { ...base, label: "Upload", uploadConfig: { accept: ".png,.jpg,.pdf", multiple: false, maxSizeMB: 5 } };

        case "terms":
            return { ...base, label: "Terms", termsConfig: { text: "I agree to the terms and conditions" } };

        default:
            return base;
    }
};

const fieldTypeLabel = (t: FieldType) => {
    switch (t) {
        case "text": return "Text";
        case "email": return "Email";
        case "phone": return "Phone";
        case "number": return "Number";
        case "dropdown": return "Dropdown";
        case "radio": return "Radio";
        case "checkbox": return "Checkbox";
        case "date": return "Date";
        case "upload": return "Upload";
        case "terms": return "Terms";
    }
};



const normLabel = (s: string) =>
    (s ?? "")
        .toLowerCase()
        .replace(/[_\-]/g, " ")
        .replace(/[.]/g, "")          // remove dots: "no." => "no"
        .replace(/[^a-z0-9\s]/g, "")  // remove special chars
        .replace(/\s+/g, " ")
        .trim();

// ✅ Taken from your PPT form slide text
const PPT_FIELD_DESCRIPTIONS: Record<string, string> = {
    first_name:
        "Necessary to link consent to identifiable Data Principal. According to Section 6, DPDP Act 2023.",
    last_name:
        "Necessary to link consent to identifiable Data Principal. According to Section 6, DPDP Act 2023.",
    address:
        "Necessary for Performance of service and Legal communication. According to Section 6 & Section 7(a), DPDP Act 2023.",
    phone:
        "Necessary for authentication and communication. According to Section 6 (Consent) + Section 7(a) (Performance of requested service), DPDP Act 2023.",
    gender:
        "Purpose Specific Consent (service delivery, legal compliance, billing, for contractual performance). Section 6, 7(a), DPDP Act 2023.",
    email:
        "Necessary for Service Communication. According to Section 6, 7(a), DPDP Act 2023.",
    data_retention_period:
        "Section 8(7) (Data must not be retained longer than necessary for the specified purpose) + transparency obligation under Section 6 (informed consent requires disclosure of retention period or criteria).",
};

const LABEL_SYNONYMS: Record<string, string[]> = {
    first_name: ["first name", "fname", "given name", "forename", "first"],
    last_name: ["last name", "lname", "surname", "family name", "last"],
    address: ["address", "addr", "residential address", "permanent address", "location"],
    phone: [
        "phone",
        "phone no",
        "phone no.",
        "phone number",
        "mobile",
        "mobile no",
        "mobile no.",
        "mobile number",
        "mob",
        "mob no",
        "mob no.",
        "mob number",
        "contact",
        "contact no",
        "contact no.",
        "contact number",
        "whatsapp",
        "whatsapp no",
        "whatsapp number",
        "cell",
        "cell no",
        "cell number",
        "tel",
        "tel no",
        "telephone",
        "telephone no",
        "telephone number",
    ],
    email: ["email", "email id", "emailid", "e-mail", "mail", "mail id", "gmail"],
    gender: ["gender", "sex"],
    data_retention_period: [
        "data retention period",
        "retention period",
        "retention",
        "data retention",
        "how long we keep data",
        "storage period",
    ],
};

const resolveCanonicalKey = (label: string): string | null => {
    const normalized = normLabel(label);

    // exact match against synonyms
    for (const [canonical, variants] of Object.entries(LABEL_SYNONYMS)) {
        for (const v of variants) {
            if (normalized === normLabel(v)) return canonical;
        }
    }

    // contains match (handles: "mobile number (whatsapp)")
    for (const [canonical, variants] of Object.entries(LABEL_SYNONYMS)) {
        for (const v of variants) {
            const vv = normLabel(v);
            if (vv.length >= 3 && normalized.includes(vv)) return canonical;
        }
    }

    return null;
};

const getFieldDescription = (f: BuilderField) => {
    const direct = (f.description ?? "").trim();
    if (direct) return direct;

    const canonical = resolveCanonicalKey(f.label);
    if (canonical && PPT_FIELD_DESCRIPTIONS[canonical]) {
        return PPT_FIELD_DESCRIPTIONS[canonical];
    }

    return "";
};
/* ===================== COMPONENT ===================== */
const FormBuilder: React.FC = () => {

    const { publicIP, refreshForms } = useProject();

    const [publishLoading, setPublishLoading] = useState(false);

    const [confirmPopup, setConfirmPopup] = useState(false);

    const [toast, setToast] = useState<{
        open: boolean;
        type: "success" | "warning" | "danger";
        title?: string;
        message: string;
        confirmMode?: boolean;
    }>({
        open: false,
        type: "success",
        title: "",
        message: "",
        confirmMode: false,
    });

    const [meta, setMeta] = useState<Meta>({
        category: "Registration",
        title: "Event Sign-up",
        subtitle: "Collect attendee details with a branded UI.",
    });

    const [previewOpen, setPreviewOpen] = useState(false);

    const FORM_KEY = "FORM_BUILDER_SCHEMA_V1";

    const buildSchema = (): FormSchema => ({
        id: "form_" + uid(),
        meta,
        fields,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });





    const onClickPublish = () => {
        setConfirmPopup(true);
    };


    const doPublish = async () => {

        if (!publicIP) {
            setToast({
                open: true,
                type: "warning",
                title: "IP not ready",
                message: "Please wait a second, fetching your public IP...",
                confirmMode: false,
            });
            return;
        }


        try {
            setPublishLoading(true);

            const schema: FormSchema = {
                id: "form_" + uid(),
                meta,
                fields,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const result = await addFormData({
                IPAddress: publicIP || "0.0.0.0",
                Status: "Y",
                FormData: schema,
            });

            if (result.responseCode === 101) {
                setToast({
                    open: true,
                    type: "success",
                    title: "Published",
                    message: result.responseMessage || "Saved successfully",
                    confirmMode: false,
                });

                const schema = buildSchema();
                localStorage.setItem(FORM_KEY, JSON.stringify(schema, null, 2));
                console.log("SAVED_SCHEMA", schema);
                // ✅ refresh list page
                await refreshForms({ pageNumber: 1 });
            } else {
                setToast({
                    open: true,
                    type: "warning",
                    title: "Not Published",
                    message: result.responseMessage || "Something went wrong",
                    confirmMode: false,
                });
            }
        } catch (err: any) {
            setToast({
                open: true,
                type: "danger",
                title: "Error",
                message: err?.message || "Publish failed",
                confirmMode: false,
            });
        } finally {
            setPublishLoading(false);
        }
    };


    const toolbox: ToolboxItem[] = useMemo(
        () => [
            { group: "Basic", type: "text", title: "Text", subtitle: "Single line", icon: "bi-fonts" },
            { group: "Basic", type: "email", title: "Email", subtitle: "Email format", icon: "bi-envelope" },
            { group: "Basic", type: "phone", title: "Phone", subtitle: "Numbers only", icon: "bi-telephone" },
            { group: "Basic", type: "number", title: "Number", subtitle: "Min/Max", icon: "bi-123" },

            { group: "Choices", type: "dropdown", title: "Dropdown", subtitle: "Single select", icon: "bi-caret-down-square" },
            { group: "Choices", type: "radio", title: "Radio", subtitle: "Single select", icon: "bi-record-circle" },
            { group: "Choices", type: "checkbox", title: "Checkbox", subtitle: "Multi select", icon: "bi-check2-square" },

            { group: "Other", type: "date", title: "Date", subtitle: "Date picker", icon: "bi-calendar-event" },
            { group: "Other", type: "upload", title: "Upload", subtitle: "File types", icon: "bi-paperclip" },
            { group: "Other", type: "terms", title: "Terms", subtitle: "Agreement", icon: "bi-shield-check" },
        ],
        []
    );

    const [fields, setFields] = useState<BuilderField[]>([

        { ...defaultFieldByType("email"), locked: true },
    ]);

    const [selectedId, setSelectedId] = useState<string>("");
    useEffect(() => {
        if (!selectedId && fields.length) setSelectedId(fields[0].id);
    }, [fields, selectedId]);
    const META_ID = "__META__"; // keep it near top (outside component is also ok)



    const isMetaSelected = selectedId === META_ID;

    const selected = useMemo(
        () => (isMetaSelected ? null : fields.find((f) => f.id === selectedId) ?? null),
        [fields, selectedId, isMetaSelected]
    );

    const switchId = selected ? `reqSwitch-${selected.id}` : "reqSwitch";

    const canDelete = fields.some((x) => !x.locked) && fields.length > 1;



    const addField = (type: FieldType) => {
        const f = defaultFieldByType(type);
        setFields((prev) => [...prev, f]);
        setSelectedId(f.id);
    };

    const deleteField = (id: string) => {
        setFields((prev) => {
            const target = prev.find((x) => x.id === id);

            // ✅ don't delete locked fields
            if (target?.locked) return prev;

            // ✅ don't delete last remaining field
            if (prev.length <= 1) return prev;

            const next = prev.filter((x) => x.id !== id);

            if (selectedId === id) setSelectedId(next[0]?.id ?? "");
            return next;
        });
    };



    const duplicateField = (id: string) => {
        setFields((prev) => {
            const idx = prev.findIndex((x) => x.id === id);
            if (idx === -1) return prev;
            const copy = { ...prev[idx], id: uid(), label: prev[idx].label + " (copy)" };
            const next = [...prev];
            next.splice(idx + 1, 0, copy);
            setSelectedId(copy.id);
            return next;
        });
    };

    const updateSelected = (patch: Partial<BuilderField>) => {
        if (!selected) return;
        setFields((prev) => prev.map((f) => (f.id === selected.id ? { ...f, ...patch } : f)));
    };

    const updateSelectedValidation = (patch: Partial<FieldValidation>) => {
        if (!selected) return;
        setFields((prev) =>
            prev.map((f) =>
                f.id === selected.id
                    ? { ...f, validation: { ...(f.validation ?? {}), ...patch } }
                    : f
            )
        );
    };
    const isChoiceField = (t: FieldType) => t === "dropdown" || t === "radio" || t === "checkbox";

    const addOption = () => {
        if (!selected || !isChoiceField(selected.type)) return;
        const nextOpt: FieldOption = { id: uid(), label: "New option" };

        setFields(prev =>
            prev.map(f =>
                f.id === selected.id ? { ...f, options: [...(f.options ?? []), nextOpt] } : f
            )
        );
    };


    const updateOption = (optId: string, patch: Partial<FieldOption>) => {
        if (!selected || !isChoiceField(selected.type)) return;

        setFields(prev =>
            prev.map(f =>
                f.id === selected.id
                    ? { ...f, options: (f.options ?? []).map(o => (o.id === optId ? { ...o, ...patch } : o)) }
                    : f
            )
        );
    };

    const deleteOption = (optId: string) => {
        if (!selected || !isChoiceField(selected.type)) return;

        setFields(prev =>
            prev.map(f =>
                f.id === selected.id ? { ...f, options: (f.options ?? []).filter(o => o.id !== optId) } : f
            )
        );
    };
    const setOptionCount = (count: number) => {
        if (!selected || !isChoiceField(selected.type)) return;

        const safe = Math.max(0, Math.min(50, count)); // limit 0-50
        const existing = selected.options ?? [];

        let next: FieldOption[] = [];

        for (let i = 0; i < safe; i++) {
            if (existing[i]) {
                next.push(existing[i]);
            } else {
                next.push({
                    id: uid(),
                    label: `Option ${i + 1}`,
                    value: `option_${i + 1}`,
                });
            }
        }

        setFields((prev) =>
            prev.map((f) => (f.id === selected.id ? { ...f, options: next } : f))
        );
    };




    // const loadFromJson = () => {
    //     const raw = localStorage.getItem(FORM_KEY);
    //     if (!raw) return alert("No saved form found in localStorage");

    //     try {
    //         const parsed = JSON.parse(raw) as FormSchema;

    //         // ✅ restore state
    //         setMeta(parsed.meta ?? meta);

    //         setFields(parsed.fields ?? []);
    //         setSelectedId(parsed.fields?.[0]?.id ?? "");
    //         // meta is currently const [meta] so if you want editable meta,
    //         // convert it to setMeta (shown below)
    //         alert("Loaded form from localStorage");
    //     } catch {
    //         alert("Invalid JSON in localStorage");
    //     }
    // };

    /* group toolbox */
    const basic = toolbox.filter((t) => t.group === "Basic");
    const choices = toolbox.filter((t) => t.group === "Choices");
    const other = toolbox.filter((t) => t.group === "Other");

    const SortableFieldCard: React.FC<SortableFieldCardProps> = ({
        f,
        selectedId,
        canDelete,
        onSelect,
        onDuplicate,
        onDelete,
    }) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
            useSortable({ id: f.id });

        const style: React.CSSProperties = {
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.6 : 1,
        };

        const isSelected = f.id === selectedId;
        const isLocked = !!f.locked;

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`field-card p-3 ${isSelected ? "selected" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(f.id)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelect(f.id);
                }}
            >
                <div className="d-flex justify-content-between gap-2">
                    <div className="d-flex gap-3">
                        {/* ✅ Drag Handle */}
                        <div
                            className="text-secondary"
                            title="Drag"
                            style={{ cursor: "grab", userSelect: "none" }}
                            onClick={(e) => e.stopPropagation()}
                            {...attributes}
                            {...listeners}
                        >
                            ⋮⋮
                        </div>

                        <div>
                            <div className="fw-bold">
                                {f.label} {f.required && <span className="text-danger">*</span>}
                            </div>
                            <div className="text-secondary small">{fieldTypeLabel(f.type)}</div>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {f.required && <span className="chip">Required</span>}

                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDuplicate(f.id);
                            }}
                            title="Duplicate"
                        >
                            <i className="bi bi-copy" />
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            disabled={isLocked || !canDelete}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isLocked || !canDelete) return;
                                onDelete(f.id);
                            }}
                            title={isLocked ? "Mandatory field" : (!canDelete ? "At least 1 field is required" : "Delete")}
                        >
                            <i className="bi bi-trash" />
                        </button>

                    </div>
                </div>

                <div className="mt-3">
                    {f.type === "dropdown" ? (
                        <select className="form-select" disabled>
                            <option value="">{f.placeholder || "Select..."}</option>
                            {(f.options ?? []).map((o) => (
                                <option key={o.id} value={o.label}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    ) : f.type === "radio" ? (
                        <div className="d-flex flex-column gap-2">
                            {(f.options ?? []).map((o) => (
                                <label key={o.id} className="d-flex align-items-center gap-2">
                                    <input type="radio" disabled />
                                    <span className="text-secondary">{o.label}</span>
                                </label>
                            ))}
                        </div>
                    ) : f.type === "checkbox" ? (
                        <div className="d-flex flex-column gap-2">
                            {(f.options ?? []).map((o) => (
                                <label key={o.id} className="d-flex align-items-center gap-2">
                                    <input type="checkbox" disabled />
                                    <span className="text-secondary">{o.label}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <input className="form-control" placeholder={f.placeholder || ""} disabled />
                    )}
                </div>
            </div>
        );
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        if (active.id === over.id) return;

        setFields((prev) => {
            const oldIndex = prev.findIndex((x) => x.id === active.id);
            const newIndex = prev.findIndex((x) => x.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return prev;
            return arrayMove(prev, oldIndex, newIndex);
        });

        setSelectedId(String(active.id));
    };

    const renderPreviewField = (f: BuilderField) => {
        switch (f.type) {
            case "dropdown":
                return (
                    <select className="form-select" required={f.required}>
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
                        {(f.options ?? []).map((o) => (
                            <div key={o.id} className="form-check mb-2">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name={f.id}
                                    value={o.value ?? o.label}
                                    required={f.required}
                                    id={`${f.id}-${o.id}`}
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor={`${f.id}-${o.id}`}
                                >
                                    {o.label}
                                </label>
                            </div>
                        ))}
                    </div>
                );


            case "checkbox":
                return (
                    <div className="mt-2">
                        {(f.options ?? []).map((o) => (
                            <div key={o.id} className="form-check mb-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    value={o.value ?? o.label}
                                    id={`${f.id}-${o.id}`}
                                />
                                <label
                                    className="form-check-label"
                                    htmlFor={`${f.id}-${o.id}`}
                                >
                                    {o.label}
                                </label>
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
                        pattern={f.validation?.pattern || "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"}
                        title={f.validation?.errorMessage || "Please enter a valid email address"}
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

    // const previewColClass = (f: BuilderField) => {
    //     // always full width for these
    //     // if (f.type === "radio" || f.type === "checkbox" || f.type === "terms" || f.type === "upload") {
    //     //     return "col-12";
    //     // }

    //     const maxLen = f.validation?.maxLength ?? 0;

    //     // ✅ RULE: maxLength > 200 => col-12, else col-6
    //     return maxLen > 200 ? "col-12" : "col-12 col-md-6";
    // };

    useEffect(() => {
        if (!selected) return;

        const canonical = resolveCanonicalKey(selected.label);
        const pptDesc = canonical ? PPT_FIELD_DESCRIPTIONS[canonical] : "";

        if (pptDesc && (!selected.description || selected.descriptionAuto)) {
            updateSelected({
                description: pptDesc,
                descriptionAuto: true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.id, selected?.label]);



    return (
        <>

            <div className="row g-3 builder-area">
                <div className="panel mb-3">
                    <div className="panel-head p-3 d-flex align-items-start justify-content-between">
                        <div>
                            <div className="h5 mb-1">Registration Form</div>
                            <div className="text-secondary small">
                                Draft • Last saved 2 mins ago
                            </div>
                        </div>

                        <div className="d-flex gap-2 align-items-center">


                            <button
                                className="btn btn-outline-secondary btn-sm"
                                type="button"
                                onClick={() => setPreviewOpen(true)}
                            >
                                Preview
                            </button>

                            <button
                                className="btn btn-primary btn-sm"
                                style={{ background: "var(--brand)", borderColor: "var(--brand)" }}
                                onClick={onClickPublish}
                                disabled={publishLoading}
                            >
                                {publishLoading ? "Publishing..." : "Publish"}
                            </button>

                        </div>
                    </div>
                </div>

                {/* ===================== TOOLBOX ===================== */}
                <section className="col-12 col-xl-3">
                    <div className="panel h-100 d-flex flex-column">
                        <div className="panel-head p-3 d-flex justify-content-between align-items-start">
                            <div>
                                <div className="fw-bold">Fields</div>
                                <div className="text-secondary small">Click to add</div>
                            </div>

                        </div>

                        <div className="p-3 overflow-auto flex-grow-1">
                            <div className="text-secondary small text-uppercase fw-semibold mb-2">Basic</div>
                            <div className="d-grid gap-2">
                                {basic.map((t) => (
                                    <button
                                        key={t.type}
                                        type="button"
                                        className="tool-btn"
                                        onClick={() => addField(t.type)}
                                    >
                                        <i className={`bi ${t.icon} me-2`} />
                                        <span className="fw-semibold">{t.title}</span>
                                        <div className="text-secondary small">{t.subtitle}</div>
                                    </button>
                                ))}
                            </div>

                            <hr className="my-3" />

                            <div className="text-secondary small text-uppercase fw-semibold mb-2">Choices</div>
                            <div className="d-grid gap-2">
                                {choices.map((t) => (
                                    <button
                                        key={t.type}
                                        type="button"
                                        className="tool-btn"
                                        onClick={() => addField(t.type)}
                                    >
                                        <i className={`bi ${t.icon} me-2`} />
                                        <span className="fw-semibold">{t.title}</span>
                                        <div className="text-secondary small">{t.subtitle}</div>
                                    </button>
                                ))}
                            </div>

                            <hr className="my-3" />

                            <div className="text-secondary small text-uppercase fw-semibold mb-2">Other</div>
                            <div className="d-grid gap-2">
                                {other.map((t) => (
                                    <button
                                        key={t.type}
                                        type="button"
                                        className="tool-btn"
                                        onClick={() => addField(t.type)}
                                    >
                                        <i className={`bi ${t.icon} me-2`} />
                                        <span className="fw-semibold">{t.title}</span>
                                        <div className="text-secondary small">{t.subtitle}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===================== CANVAS ===================== */}
                <section className="col-12 col-xl-6">
                    <div className="panel h-100 d-flex flex-column">
                        <div className="panel-head p-3 d-flex justify-content-between align-items-start">
                            <div>
                                <div className="fw-bold">Form Area</div>
                                <div className="text-secondary small">Reorder • Click to edit</div>
                            </div>
                        </div>

                        <div className="p-3 overflow-auto d-flex flex-column gap-3 canvas-scroll flex-grow-1">
                            <div className="text-secondary small fw-semibold text-uppercase">Heading</div>

                            <div
                                className={`panel p-3 ${isMetaSelected ? "selected" : ""}`}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedId(META_ID)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") setSelectedId(META_ID);
                                }}
                                style={{
                                    cursor: "pointer",
                                    borderColor: "color-mix(in oklab, var(--brand) 45%, var(--stroke) 55%)",
                                    background: "var(--soft)",
                                }}
                            >
                                <div className="h5 mt-1 mb-1">{meta.title}</div>
                                <div className="text-secondary small">{meta.subtitle}</div>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={onDragEnd}
                            >
                                <SortableContext
                                    items={fields.map((x) => x.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {fields.map((f) => (
                                        <SortableFieldCard
                                            key={f.id}
                                            f={f}
                                            selectedId={selectedId}
                                            canDelete={canDelete}
                                            onSelect={setSelectedId}
                                            onDuplicate={duplicateField}
                                            onDelete={deleteField}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>

                            <button
                                type="button"
                                className="add-field p-3 text-start"
                                onClick={() => addField("text")}
                                title="Quick add (Text)"
                            >
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        className="rounded-4 border px-3 py-2"
                                        style={{
                                            borderColor: "var(--stroke)",
                                            background: "color-mix(in oklab, var(--bs-body-bg) 90%, transparent 10%)",
                                        }}
                                    >
                                        <span className="fw-bold fs-5">+</span>
                                    </div>
                                    <div>
                                        <div className="fw-bold">Add a field</div>
                                        <div className="text-secondary small">Choose from the left panel</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </section>

                {/* ===================== PROPERTIES ===================== */}
                <section className="col-12 col-xl-3 properties-col">
                    <div className="panel h-100 d-flex flex-column">
                        <div className="panel-head p-3 d-flex justify-content-between align-items-start">
                            <div>
                                <div className="fw-bold">Properties</div>
                                <div className="text-secondary small">Selected field</div>
                            </div>

                        </div>

                        <div className="p-3 overflow-auto d-flex flex-column gap-3 flex-grow-1">
                            {/* ✅ META SELECTED */}
                            {isMetaSelected && (
                                <div className="panel p-3">
                                    <div className="fw-bold mb-2">Form Heading</div>


                                    <label className="form-label small text-secondary fw-semibold mt-3">Title</label>
                                    <input
                                        className="form-control"
                                        value={meta.title}
                                        onChange={(e) => setMeta((p) => ({ ...p, title: e.target.value }))}
                                        placeholder="e.g. Event Sign-up"
                                    />

                                    <label className="form-label small text-secondary fw-semibold mt-3">Subtitle</label>
                                    <textarea
                                        className="form-control"
                                        rows={2}
                                        value={meta.subtitle}
                                        onChange={(e) => setMeta((p) => ({ ...p, subtitle: e.target.value }))}
                                        placeholder="Short description..."
                                    />
                                </div>
                            )}

                            {/* ✅ FIELD SELECTED */}
                            {!isMetaSelected && selected && (
                                <>
                                    <div className="panel p-3">
                                        <div className="fw-bold mb-2">Field</div>

                                        <label className="form-label small text-secondary fw-semibold">Label</label>
                                        <input
                                            className="form-control"
                                            value={selected.label}
                                            onChange={(e) => updateSelected({ label: e.target.value })}
                                        />

                                        <label className="form-label small text-secondary fw-semibold mt-3">
                                            Placeholder
                                        </label>
                                        <input
                                            className="form-control"
                                            value={selected.placeholder ?? ""}
                                            onChange={(e) => updateSelected({ placeholder: e.target.value })}
                                        />
                                        <label className="form-label small text-secondary fw-semibold mt-3">
                                            Field Description
                                        </label>
                                        <textarea
                                            className="form-control"
                                            rows={4}
                                            value={selected.description ?? ""}
                                            onChange={(e) =>
                                                updateSelected({
                                                    description: e.target.value,
                                                    descriptionAuto: false, // ✅ user changed it, stop auto overwrite
                                                })
                                            }
                                            placeholder="Description will auto-fill if label matches PPT field name..."
                                        />
                                        <div className="form-check form-switch mt-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                id={switchId}
                                                checked={selected.required}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;

                                                    setFields((prev) =>
                                                        prev.map((f) =>
                                                            f.id === selected.id
                                                                ? {
                                                                    ...f,
                                                                    required: checked,
                                                                    validation: checked
                                                                        ? { ...(f.validation ?? {}) }
                                                                        : {
                                                                            ...(f.validation ?? {}),
                                                                            errorMessage: "",
                                                                        },
                                                                }
                                                                : f
                                                        )
                                                    );
                                                }} />
                                            <label className="form-check-label fw-semibold" htmlFor={switchId}>
                                                Required
                                            </label>
                                        </div>
                                    </div>

                                    {/* ✅ TYPE SPECIFIC PROPERTIES */}
                                    {selected && (selected.type === "dropdown" || selected.type === "radio" || selected.type === "checkbox") && (
                                        <div className="panel p-3">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="fw-bold">Options</div>
                                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addOption}>
                                                    <i className="bi bi-plus-lg me-2" />
                                                    Add option
                                                </button>
                                            </div>

                                            <div className="row g-2 mb-2">
                                                <div className="col-12">
                                                    <label className="form-label small text-secondary fw-semibold">
                                                        No. of options
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        min={0}
                                                        max={50}
                                                        value={(selected.options ?? []).length}
                                                        onChange={(e) => setOptionCount(Number(e.target.value || 0))}
                                                    />
                                                </div>
                                            </div>

                                            {(selected.options ?? []).map((opt) => (
                                                <div key={opt.id} className="d-flex gap-2 mb-2">
                                                    <input
                                                        className="form-control"
                                                        placeholder="Option"
                                                        value={opt.label}
                                                        onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        onClick={() => deleteOption(opt.id)}
                                                        title="Remove option"
                                                    >
                                                        <i className="bi bi-x-lg" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selected?.type === "number" && (
                                        <div className="panel p-3">
                                            <div className="fw-bold mb-2">Number Settings</div>
                                            <div className="row g-2">
                                                <div className="col-6">
                                                    <label className="form-label small text-secondary fw-semibold">Min</label>
                                                    <input
                                                        className="form-control"
                                                        type="number"
                                                        value={selected.numberConfig?.min ?? ""}
                                                        onChange={(e) =>
                                                            updateSelected({
                                                                numberConfig: {
                                                                    ...(selected.numberConfig ?? {}),
                                                                    min: e.target.value === "" ? undefined : Number(e.target.value),
                                                                },
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="col-6">
                                                    <label className="form-label small text-secondary fw-semibold">Max</label>
                                                    <input
                                                        className="form-control"
                                                        type="number"
                                                        value={selected.numberConfig?.max ?? ""}
                                                        onChange={(e) =>
                                                            updateSelected({
                                                                numberConfig: {
                                                                    ...(selected.numberConfig ?? {}),
                                                                    max: e.target.value === "" ? undefined : Number(e.target.value),
                                                                },
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selected?.type === "upload" && (
                                        <div className="panel p-3">
                                            <div className="fw-bold mb-2">Upload Settings</div>

                                            <label className="form-label small text-secondary fw-semibold">Allowed Types (accept)</label>
                                            <input
                                                className="form-control"
                                                value={selected.uploadConfig?.accept ?? ""}
                                                onChange={(e) =>
                                                    updateSelected({
                                                        uploadConfig: { ...(selected.uploadConfig ?? {}), accept: e.target.value },
                                                    })
                                                }
                                                placeholder=".png,.jpg,.pdf"
                                            />

                                            <div className="form-check mt-3">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={!!selected.uploadConfig?.multiple}
                                                    onChange={(e) =>
                                                        updateSelected({
                                                            uploadConfig: { ...(selected.uploadConfig ?? {}), multiple: e.target.checked },
                                                        })
                                                    }
                                                    id={`multi-${selected.id}`}
                                                />
                                                <label className="form-check-label" htmlFor={`multi-${selected.id}`}>
                                                    Allow multiple files
                                                </label>
                                            </div>

                                            <label className="form-label small text-secondary fw-semibold mt-3">Max Size (MB)</label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                value={selected.uploadConfig?.maxSizeMB ?? ""}
                                                onChange={(e) =>
                                                    updateSelected({
                                                        uploadConfig: {
                                                            ...(selected.uploadConfig ?? {}),
                                                            maxSizeMB: e.target.value === "" ? undefined : Number(e.target.value),
                                                        },
                                                    })
                                                }
                                            />
                                        </div>
                                    )}

                                    {selected?.type === "terms" && (
                                        <div className="panel p-3">
                                            <div className="fw-bold mb-2">Terms Text</div>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={selected.termsConfig?.text ?? ""}
                                                onChange={(e) =>
                                                    updateSelected({
                                                        termsConfig: { ...(selected.termsConfig ?? {}), text: e.target.value },
                                                    })
                                                }
                                            />
                                        </div>
                                    )}

                                    <div className="panel p-3">
                                        <div className="fw-bold mb-2">Validation</div>

                                        <div className="row g-2">
                                            <div className="col-6">
                                                <label className="form-label small text-secondary fw-semibold">Min length</label>
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    value={selected.validation?.minLength ?? ""}
                                                    onChange={(e) =>
                                                        updateSelectedValidation({
                                                            minLength: e.target.value === "" ? undefined : Number(e.target.value),
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small text-secondary fw-semibold">Max length</label>
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    value={selected.validation?.maxLength ?? ""}
                                                    onChange={(e) =>
                                                        updateSelectedValidation({
                                                            maxLength: e.target.value === "" ? undefined : Number(e.target.value),
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {selected.required && (
                                            <>
                                                <label className="form-label small text-secondary fw-semibold mt-3">
                                                    Error message
                                                </label>
                                                <input
                                                    className="form-control"
                                                    value={selected.validation?.errorMessage ?? ""}
                                                    onChange={(e) =>
                                                        updateSelectedValidation({
                                                            errorMessage: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Enter required field error message"
                                                />
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ✅ NOTHING SELECTED */}
                            {!isMetaSelected && !selected && (
                                <div className="text-secondary small">Select a field or heading from canvas.</div>
                            )}
                        </div>

                    </div>
                </section>
            </div>




            {previewOpen && (
                <>
                    {/* Backdrop */}
                    <div className="modal-backdrop fade show" />

                    {/* Modal */}
                    <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <div className="fw-bold">Preview</div>
                                    <button type="button" className="btn-close" onClick={() => setPreviewOpen(false)} />
                                </div>

                                <div className="modal-body" style={{ maxHeight: "78vh", overflowY: "auto" }}>
                                    {/* ✅ PREVIEW LIKE YOUR HTML */}
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
                                                        <div className="fw-bold">Registration Form</div>
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
                                                                        {/* LEFT: Field input */}
                                                                        <div className="col-12 col-md-6">
                                                                            <label className="form-label fw-semibold">
                                                                                {f.label} {f.required && <span className="req">*</span>}
                                                                            </label>

                                                                            {renderPreviewField(f)}

                                                                            {!!f.validation?.errorMessage && (
                                                                                <div className="form-text text-danger">{f.validation.errorMessage}</div>
                                                                            )}
                                                                        </div>

                                                                        {/* RIGHT: Field description */}
                                                                        <div className="col-12 col-md-6">
                                                                            <div
                                                                                className="small"
                                                                                style={{
                                                                                    color: "red",
                                                                                    lineHeight: 1.35,
                                                                                    paddingTop: 30, // aligns with input area (adjust if needed)
                                                                                }}
                                                                            >
                                                                                {desc ? desc : ""}
                                                                            </div>
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
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ✅ Confirm Publish Popup (Yes/No) */}
            <PopupAlert
                open={confirmPopup}
                type="warning"
                title="Publish Form?"
                message="Are you sure you want to publish this form?"
                confirmMode={true}
                confirmText="Yes, Publish"
                cancelText="No"
                onClose={() => setConfirmPopup(false)}
                onConfirm={async () => {
                    setConfirmPopup(false);
                    await doPublish();
                }}
                onCancel={() => setConfirmPopup(false)}
            />

            {/* ✅ Result Popup (OK only) */}
            <PopupAlert
                open={toast.open}
                type={toast.type}
                title={toast.title}
                message={toast.message}
                confirmMode={false}
                autoCloseMs={2500}
                onClose={() => setToast((p) => ({ ...p, open: false }))}
            />


        </>
    );
};

export default FormBuilder;
