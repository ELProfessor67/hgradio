import { useEffect, useState, useRef } from "react";
import { Room, RoomEvent, Track } from 'livekit-client';
import { getToken } from "../service/httpService";


const useConnect = () => {
    const socketRef = useRef();
    const [isConnected, setIsConnected] = useState(false);
    const roomRef = useRef(new Room({
        // Keep each track on its own <audio> element. Mixing through Web Audio
        // adds a second buffer and makes the live stream fall behind.
        webAudioMix: false,
    }));

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