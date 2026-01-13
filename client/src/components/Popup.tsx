'use client'
import React, { useEffect, useState } from 'react'
import { useData } from '@/context/Context';
const Popup = () => {
    const [hide,setHide] = useState(false);
    const {currentDJ} = useData();

    function utcToLocalAmPm(utcTime:any) {
        if (!utcTime) return "";
      
        // Split hours and minutes
        const [hours, minutes] = utcTime.split(":").map(Number);
      
        // Create a UTC date with that time
        const utcDate = new Date(Date.UTC(2025, 0, 1, hours, minutes));
      
        // Convert to local time string
        const localTime = utcDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      
        return localTime;
      }
      


    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setHide(false);
    //         setTimeout(() => {
    //             setHide(true);
    //         }, 10000);
    //     }, 4000);
    //     return () => clearTimeout(timer);
    // }, []);
    return (
        <div className={`fixed bottom-4 left-4 bg-white shadow-lg rounded-lg p-4 max-w-[20rem] transition-all duration-500 transform -translate-y-4 ${hide ? "hidden": ""}`} style={{zIndex: 9999}}>
            <div className="flex items-center gap-3">
                <div className="min-w-[4rem] min-h-[4rem] max-w-[4rem] max-h-[4rem] relative ">
                    <img alt="Dj Image" loading="lazy" src='/SongFallback.jpg'/>

                    </div>
                <div className="text-gray-800 text-sm leading-relaxed">
                    <span className="font-semibold text-black text-2xl">{currentDJ?.dj?.name}</span> Invites You!
                    <br/><span className="font-semibold text-black">{utcToLocalAmPm(currentDJ?.dj?.djStartTime)}</span> Los Angeles.<br />
                    <span className="text-gray-800 text-sm leading-relaxed">A blessed, powerfull broadcast that will <span className="font-semibold text-black">uplift</span> and <span className="font-semibold text-black">inspire</span>.</span>
                
                
                </div>
            </div>
        </div>
    )
}

export default Popup