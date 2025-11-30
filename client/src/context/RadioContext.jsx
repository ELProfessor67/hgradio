"use client"
import { createContext, useContext } from "react";
import { useSocketUser } from '@/hooks'
import { REACT_PUBLIC_SOCKET_URL } from '@/constants';
import { useState, useEffect, useRef } from 'react';
import { useLive } from './LiveContext';

import axios from 'axios';
import { usePathname } from "next/navigation";
import { IoPauseOutline, IoPlayOutline } from "react-icons/io5";

export const RadioContext = createContext();
const sleep = ms => new Promise(r => window.setTimeout(r, ms));
function groupDJsByDays(djsData) {
    const daysDict = {
        0: [],
        1: [],
        2: [],
        3: [],
        4: [],
        5: [],
        6: []
    };

    djsData.forEach(dj => {
        dj.djDays.forEach(day => {
            daysDict[day].push(dj);
        });
    });

    return daysDict;
}


function getNextDJ(djs) {
    const now = new Date();
    const currentUTCDay = now.getUTCDay();
    const currentUTCHours = now.getUTCHours();
    const currentUTCMinutes = now.getUTCMinutes();
    const currentUTCTimeInMinutes = currentUTCHours * 60 + currentUTCMinutes; // Convert current UTC time to minutes since midnight

    let nextDJ = null;
    let minTimeDiff = Infinity;

    djs.forEach(dj => {
        // Check if DJ is active on the current UTC day
        if (dj.djDays.includes(String(currentUTCDay))) {
            const [startHours, startMinutes] = dj.djStartTime?.split(':').map(Number);
            const startTimeInMinutes = startHours * 60 + startMinutes;
            let timeDiff = startTimeInMinutes - currentUTCTimeInMinutes;

            if (timeDiff < 0) {
                timeDiff += 24 * 60; // Adjust for next day if the DJ's start time has already passed today
            }

            // Check if this DJ has the smallest time difference and update nextDJ accordingly
            if (timeDiff < minTimeDiff) {
                minTimeDiff = timeDiff;
                nextDJ = dj;
            }
        }
    });

    return nextDJ;
}


export const params = {
    streamId: "655347b59c00a7409d9181c3"
}

export const RadioProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [schediles, setSchedules] = useState([]);
    const [songs, setSongs] = useState([]);
    const { isPlay, setIsPlay } = useLive();
    const [message, setMessage] = useState('');
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [gedetailOpen, setGetDetailsOpne] = useState(false);
    const [callOpen, setCallOpen] = useState(false);
    const [permissionReset, setPermissionReset] = useState(false);
    // null,processing,accepted,rejected
    const [callStatus, setCallStatus] = useState(null);
    // const [soundOff,setSoundOff] = useState(false);
    const [volume, setVolume] = useState(1);
    const [record, setRecord] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [djs, setDjs] = useState({});
    const [nextDJ, setNextDJ] = useState([]);
    const audioRef = useRef(null);
    const mediaRecorder = useRef(null);
    const recordedChunks = useRef([]);
    const downloadLink = useRef();
    const pathname = usePathname();

    // console.log('isPlay from components side', isPlay)
    const { owner, schedulePlaying, IsTonePlayingMessage, roomActive, handleRequestSong, isLive, autodj, messageList, handleSendMessage, callAdmin, cutCall, nextSong, currentSong, disabledPlatBtn } = useSocketUser(params.streamId, audioRef, name, isPlay, setIsPlay, message, setMessage, setCallStatus, location);
    // const [more,setMore] = useState(false);
    const [rOpen, setROPen] = useState(false);
    console.log(roomActive)

    const handlePlay = () => {
        console.log(audioRef.current.src)
        if (isPlay) {
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                audio.pause();
            });
            setIsPlay(false);
        } else {
            const audioElements = document.querySelectorAll('audio');
            audioElements.forEach(audio => {
                audio.play();
            });
            setIsPlay(true);
        }
    }


    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);


    useEffect(() => {
        if (!roomActive) {
            setIsPlay(false);
            audioRef.current.pause();
        }
    }, [roomActive])


    useEffect(() => {
        (async function () {
            try {
                const { data } = await axios.get(`${REACT_PUBLIC_SOCKET_URL}/api/v1/channel-detail/${params.streamId}`);
                setUser(data?.user);
                setSongs(data?.songs);
                setSchedules(data?.schedules);
            } catch (err) {
                console.log(err?.response?.data?.message);
            }
        })();
    }, []);


    function startRecording() {
        const audioStream = audioRef.current.captureStream();

        // Create a MediaRecorder instance
        mediaRecorder.current = new MediaRecorder(audioStream);

        // Listen for data available event
        mediaRecorder.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.current.push(event.data);
            }
        };

        // Listen for the recording stop event
        mediaRecorder.current.onstop = () => {
            const blob = new Blob(recordedChunks.current, { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            downloadLink.current.href = url;
            downloadLink.current.download = 'live_session.wav';
            downloadLink.current.click();
        };

        // Start recording
        mediaRecorder.current.start();
    }

    function stopRecording() {
        // Stop recording
        mediaRecorder.current.stop();
    }

    const handleRecord = () => {
        if (record) {
            setRecord(false);
            stopRecording();
        } else {
            setRecord(true);
            startRecording();
        }
    }

    const handleCall = async () => {
        audioRef.current.pause();
        window.open(`https://hgdjlive.com/call/${params.streamId}`, "_blank", "width=600,height=600")
    }



    useEffect(() => {
        const element = document.getElementById('navbar');
        if (element) {
            element.style.background = 'transparent';
        }
    }, [])



    useEffect(() => {
        fetch(`${REACT_PUBLIC_SOCKET_URL}/api/v1/all-djs`,).then(res => res.json()).then(res => {
            if (res.teams) {

                setDjs(groupDJsByDays(res.teams));
                setNextDJ(getNextDJ(res.teams));
            }
        }).catch(err => console.log(err.message))
    }, [])


    const handleEnded = async (isPlay) => {
        console.log('handle handleEnded call');
        if (true) {
            console.log('handle playing... call');
            const url = audioRef.current.src
            audioRef.current.src = url;
            await sleep(3000)
            audioRef.current.play();
        }

    }

    const value = {
        user, setUser,
        schediles, setSchedules,
        songs, setSongs,
        isPlay, setIsPlay,
        message, setMessage,
        name, setName,
        location, setLocation,
        gedetailOpen, setGetDetailsOpne,
        callOpen, setCallOpen,
        permissionReset, setPermissionReset,
        callStatus, setCallStatus,
        volume, setVolume,
        record, setRecord,
        chatOpen, setChatOpen,
        scheduleOpen, setScheduleOpen,
        djs, setDjs,
        nextDJ, setNextDJ,
        audioRef,
        mediaRecorder,
        recordedChunks,
        downloadLink,
        owner,
        schedulePlaying,
        IsTonePlayingMessage,
        roomActive,
        handleRequestSong,
        isLive,
        autodj,
        messageList,
        handleSendMessage,
        callAdmin,
        cutCall,
        nextSong,
        currentSong,
        disabledPlatBtn,
        rOpen, setROPen,
        handlePlay,
        handleRecord,
        handleCall,
        handleEnded
    }

    useEffect(() => {
        console.log(pathname, "pathname")
    }, [pathname])
    return (
        <RadioContext.Provider value={value}>
            <audio ref={audioRef} controls className="w-full bg-none hidden" onEnded={() => handleEnded(isPlay)} onPlay={() => setIsPlay(true)} autoPlay onPause={() => setIsPlay(false)} id="auto-dj"></audio>

            {
                pathname !== "/" &&
                <div className="fixed bottom-[5rem] right-5 z-50 h-[5rem] w-[8rem] bg-[#fc2626] flex items-center justify-center flex-col gap-2 p-3">

                    <button className="disabled:opacity-20 p-2 rounded-full border-none outline-none text-white" disabled={!roomActive || disabledPlatBtn} onClick={handlePlay}>
                        {
                            isPlay ? <IoPauseOutline size={35} /> : <IoPlayOutline size={35} />
                        }
                    </button>
                </div>
            }
            {children}
        </RadioContext.Provider>
    )
}

export const useRadio = () => {
    return useContext(RadioContext);
}