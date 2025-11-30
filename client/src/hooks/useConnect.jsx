import { useEffect, useState, useRef } from "react";
import { Room, RoomEvent, Track } from 'livekit-client';
import { getToken } from "../service/httpService";


const useConnect = () => {
    const socketRef = useRef();
    const [isConnected, setIsConnected] = useState(false);
    const roomRef = useRef(new Room());

    const connect = async (roomName) => {
        try {
            const data = await getToken(roomName);
            console.log(data, "datatoken");
            roomRef.current.connect(data.serverUrl, data.participantToken);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    }

    return {
        isConnected,
        roomRef,
        connect,
    }
}

export default useConnect;