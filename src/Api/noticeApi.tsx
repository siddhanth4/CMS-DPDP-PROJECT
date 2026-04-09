const baseUrl = import.meta.env.VITE_API_BASE_URL;
const apiKey = import.meta.env.VITE_API_KEY;

// Base headers without Content-Type (Fetch sets Content-Type automatically for FormData)
const getHeaders = () => ({
    "X-API-KEY": apiKey || "",
    "X-ADMIN-CODE": localStorage.getItem("ADCODE") || "",
});

export const addNotice = async (payload: { FormID: string, Notice: string }) => {
    // 👉 CHANGED: Using FormData instead of JSON string
    const formData = new FormData();
    formData.append("FormID", payload.FormID);
    formData.append("Notice", payload.Notice);

    const response = await fetch(`${baseUrl}/api/Notice/addNotice`, {
        method: "POST",
        headers: getHeaders(), // ❌ No Content-Type here
        body: formData,        // ✅ Send as FormData
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    return response.json();
};

export const getNoticesList = async () => {
    const response = await fetch(`${baseUrl}/api/Notice/Notices`, { 
        method: "GET", 
        headers: {
            ...getHeaders(),
            "Content-Type": "application/json" // OK to keep for GET requests
        }
    });
    if (!response.ok) throw new Error("Failed to fetch Notices");
    return response.json(); 
};

export const getNoticeById = async (noticeId: string) => {
    const response = await fetch(`${baseUrl}/api/Notice/getNotice?id=${noticeId}`, { 
        method: "GET", 
        headers: {
            ...getHeaders(),
            "Content-Type": "application/json" // OK to keep for GET requests
        }
    });
    if (!response.ok) throw new Error("Failed to fetch Notice Details");
    return response.json(); 
};