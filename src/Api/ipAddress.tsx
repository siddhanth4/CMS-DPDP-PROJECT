export interface IpifyResponse {
    ip: string;
}

export const getPublicIP = async (): Promise<string> => {
    const response = await fetch("https://api.ipify.org?format=json");

    if (!response.ok) {
        throw new Error("Failed to fetch IP address");
    }

    const data: IpifyResponse = await response.json();

    return data.ip;
};
