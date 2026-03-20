import React, { useEffect } from "react";

type PopupType = "success" | "warning" | "danger";

type PopupAlertProps = {
    open: boolean;
    type: PopupType;
    title?: string;
    message: string;
    onClose: () => void;

    // NEW
    confirmMode?: boolean;              // true → show Yes/No
    onConfirm?: () => void;             // YES callback
    onCancel?: () => void;              // NO callback
    confirmText?: string;               // default: Yes
    cancelText?: string;                // default: No

    autoCloseMs?: number;
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
};

const STYLES: Record<
    PopupType,
    { border: string; bg: string; text: string; iconBg: string; button: string }
> = {
    success: {
        border: "rgba(22,163,74,.35)",
        bg: "rgba(22,163,74,.10)",
        text: "rgb(22,163,74)",
        iconBg: "rgba(22,163,74,.18)",
        button: "rgb(22,163,74)",
    },
    warning: {
        border: "rgba(245,158,11,.35)",
        bg: "rgba(245,158,11,.10)",
        text: "rgb(245,158,11)",
        iconBg: "rgba(245,158,11,.18)",
        button: "rgb(245,158,11)",
    },
    danger: {
        border: "rgba(220,38,38,.35)",
        bg: "rgba(220,38,38,.10)",
        text: "rgb(220,38,38)",
        iconBg: "rgba(220,38,38,.18)",
        button: "rgb(220,38,38)",
    },
};

export const PopupAlert: React.FC<PopupAlertProps> = ({
    open,
    type,
    title,
    message,
    onClose,
    confirmMode = false,
    onConfirm,
    onCancel,
    confirmText = "Yes",
    cancelText = "No",
    autoCloseMs,
}) => {
    const s = STYLES[type];

    // Auto close only if NOT confirm mode
    useEffect(() => {
        if (!open || confirmMode) return;
        if (!autoCloseMs) return;

        const t = window.setTimeout(onClose, autoCloseMs);
        return () => window.clearTimeout(t);
    }, [open, autoCloseMs, confirmMode, onClose]);

    if (!open) return null;

    return (
        <>
            {/* Overlay */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.35)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 9999,
                }}
            >
                <div
                    style={{
                        width: 380,
                        maxWidth: "90%",
                        border: `1px solid ${s.border}`,
                        background: "#fff",
                        borderRadius: 16,
                        padding: 20,
                        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
                        animation: "popupScale 180ms ease",
                    }}
                >
                    {/* Title */}
                    {title && (
                        <h4 style={{ marginBottom: 10, color: s.text }}>
                            {title}
                        </h4>
                    )}

                    {/* Message */}
                    <p style={{ fontSize: 14, marginBottom: 20 }}>
                        {message}
                    </p>

                    {/* Buttons */}
                    {confirmMode ? (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 10,
                            }}
                        >
                            <button
                                onClick={() => {
                                    onCancel?.();
                                    onClose();
                                }}
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: 8,
                                    border: "1px solid #ccc",
                                    background: "#f5f5f5",
                                    cursor: "pointer",
                                }}
                            >
                                {cancelText}
                            </button>

                            <button
                                onClick={() => {
                                    onConfirm?.();
                                    onClose();
                                }}
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: 8,
                                    border: "none",
                                    background: s.button,
                                    color: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: "right" }}>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: "6px 16px",
                                    borderRadius: 8,
                                    border: "none",
                                    background: s.button,
                                    color: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                OK
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>
                {`
                @keyframes popupScale {
                    from { transform: scale(.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}
            </style>
        </>
    );
};
