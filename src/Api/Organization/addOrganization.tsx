export type AddUpdateOrgPayload = {
  OrgCode: string;
  OwnerName: string;
  MobileNo: string;
  OrgName: string;
  FullName: string;
  AdminUsername: string;
  AdminPassword: string;
  PinCode: string;
  State: string;
  City: string;
  Area: string;
  Address: string;
  Status: string;
  LogoImg?: File | null;
};

export type CommonApiResult = {
  responseCode: number;
  responseStatus: boolean;
  responseErrorType: string;
  responseMessage: string;
  noOfRecord?: number;
  data?: any;
};

export const addUpdateOrganization = async (
  payload: AddUpdateOrgPayload
): Promise<CommonApiResult> => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiKey = import.meta.env.VITE_API_KEY;

  if (!baseUrl) throw new Error("Missing VITE_API_BASE_URL");
  if (!apiKey) throw new Error("Missing VITE_API_KEY");

  const fd = new FormData();
  fd.append("OrgCode", payload.OrgCode);
  fd.append("OwnerName", payload.OwnerName);
  fd.append("MobileNo", payload.MobileNo);
  fd.append("OrgName", payload.OrgName);
  fd.append("FullName", payload.FullName);
  fd.append("AdminUsername", payload.AdminUsername);
  if (payload.AdminPassword?.trim()) {
    fd.append("AdminPassword", payload.AdminPassword);
  }
  fd.append("PinCode", payload.PinCode);
  fd.append("State", payload.State);
  fd.append("City", payload.City);
  fd.append("Area", payload.Area);
  fd.append("Address", payload.Address);
  fd.append("Status", payload.Status);

  if (payload.LogoImg) fd.append("LogoImg", payload.LogoImg);

  const res = await fetch(`${baseUrl}/api/Organization/addUpdateOrganization`, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "X-ADMIN-CODE": "2",
      // ✅ DO NOT set Content-Type for FormData
    },
    body: fd,
  });

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);

  const result: CommonApiResult = await res.json();

  if (result.responseCode !== 101) {
    throw new Error(result.responseMessage || "Failed to save organization");
  }

  return result;
};
