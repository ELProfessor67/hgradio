'use client';
import { createContext, useContext, useEffect, useState } from "react";
import useConnect from "@/hooks/useConnect";
import { params } from "./RadioContext";
import { RoomEvent, Track } from "livekit-client";
const LiveContext = createContext();


export const LiveProvider = ({ children }) => {
    const { isConnected, roomRef, connect } = useConnect();
    const [isLive, setIsLive] = useState(false);
    const [roomActive, setRoomActive] = useState(false);
    const [isPlay, setIsPlay] = useState(false);


    useEffect(() => {
        roomRef.current.on(RoomEvent.ParticipantConnected, (participant) => {
            console.log('Participant connected:', participant.identity);
        });

        roomRef.current.on(RoomEvent.ParticipantDisconnected, (participant) => {
            console.log('Participant disconnected:', participant.identity);
        });

        roomRef.current.on(RoomEvent.ParticipantDisconnected, (participant) => {
            console.log('Participant disconnected:', participant.identity);
            setParticipantCount(roomRef.current.numParticipants - 1);
        });

        roomRef.current.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
            console.log('Track subscribed:', track.kind, participant.identity);

            if(participant.identity === 'admin' && track.source == Track.Source.Microphone){
                setIsLive(true);
                setRoomActive(true);
                const audioRef = document.getElementById('auto-dj');
                audioRef.pause();
                audioRef.volume = 0;
            }
            handleTrackSubscribed(track);
        });

        roomRef.current.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
            console.log('Track unsubscribed:', track.kind, participant.identity);

            if(participant.identity === 'admin' && track.source == Track.Source.Microphone){
                setIsLive(false);
                setRoomActive(false);
                const audioRef = document.getElementById('auto-dj');
                audioRef.play();
                audioRef.volume = 1;
            }

            track.detach();
        });
    }, [roomRef.current]);


    function handleTrackSubscribed(track) {
        const audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        track.attach(audioElement);
        document.body.appendChild(audioElement);
    }

    useEffect(() => {
        if (params?.streamId) {
            connect(params?.streamId);
        }
    }, []);

    return (
        <LiveContext.Provider value={{ isConnected, roomRef, isLive, setIsLive, roomActive, setRoomActive, isPlay, setIsPlay }}>
            {children}
        </LiveContext.Provider>
    )
}

export const useLive = () => {
    return useContext(LiveContext);
}
