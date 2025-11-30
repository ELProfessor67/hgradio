'use server';


export const getToken = async (roomName) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_PANEL_URL}/api/v1/token?room=${roomName}?isAdmin=false`);
    const data = await response.json();
    return data;
}