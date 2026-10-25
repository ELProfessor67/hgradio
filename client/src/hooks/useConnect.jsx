import { useEffect, useState, useRef } from "react";
import { Room, RoomEvent, DisconnectReason, ConnectionState } from 'livekit-client';
import { getToken } from "../service/httpService";

// The listener's LiveKit connection. livekit-client reconnects by itself for a
// while; when it gives up (long background on a phone, token expiry, server
// restart) this hook rejoins with a FRESH token, and again whenever the tab
// becomes visible. Before this the room connected once at page load and a
// listener who lost it could not hear a live DJ until a full reload.
const useConnect = () => {
    const [isConnected, setIsConnected] = useState(false);
    const roomRef = useRef(new Room({
        // Keep each track on its own <audio> element. Mixing through Web Audio
        // adds a second buffer and makes the live stream fall behind.
        webAudioMix: false,
    }));
    const roomNameRef = useRef(null);
    const retryRef = useRef({ timer: null, attempt: 0, connecting: false });

    const connect = async (roomName) => {
        if (roomName) roomNameRef.current = roomName;
        const room = roomRef.current;
        const r = retryRef.current;
        if (r.connecting || room.state === ConnectionState.Connected || room.state === ConnectionState.Connecting) return;
        r.connecting = true;
        try {
            const data = await getToken(roomNameRef.current);
            await room.connect(data.serverUrl, data.participantToken);
            r.attempt = 0;
            setIsConnected(true);
        } catch (error) {
            console.error('LiveKit connect failed:', error);
            setIsConnected(false);
            scheduleRetry();
        } finally {
            r.connecting = false;
        }
    }

    const scheduleRetry = () => {
        const r = retryRef.current;
        if (r.timer) return;
        const delay = Math.min(30000, 1000 * Math.pow(2, r.attempt++));
        r.timer = setTimeout(() => { r.timer = null; connect(); }, delay);
    };

    useEffect(() => {
        const room = roomRef.current;
        const onConnected = () => setIsConnected(true);
        const onDisconnected = (reason) => {
            setIsConnected(false);
            const name = DisconnectReason[reason] || String(reason);
            console.warn('LiveKit disconnected:', name);
            // Our own disconnect (page unload) is not an error.
            if (name !== 'CLIENT_INITIATED' && roomNameRef.current) scheduleRetry();
        };
        const onVisible = () => {
            if (document.visibilityState === 'visible' && roomNameRef.current && room.state === ConnectionState.Disconnected) {
                connect();
            }
        };
        room.on(RoomEvent.Connected, onConnected);
        room.on(RoomEvent.Reconnected, onConnected);
        room.on(RoomEvent.Disconnected, onDisconnected);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            room.off(RoomEvent.Connected, onConnected);
            room.off(RoomEvent.Reconnected, onConnected);
            room.off(RoomEvent.Disconnected, onDisconnected);
            document.removeEventListener('visibilitychange', onVisible);
            if (retryRef.current.timer) clearTimeout(retryRef.current.timer);
        };
    }, []);

    return {
        isConnected,
        roomRef,
        connect,
    }
}

export default useConnect;
