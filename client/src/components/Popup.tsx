'use client'
import React, { useEffect, useState } from 'react'

const Popup = () => {
    const [hide,setHide] = useState(true);
    


    useEffect(() => {
        const timer = setTimeout(() => {
            setHide(false);
            setTimeout(() => {
                setHide(true);
            }, 10000);
        }, 4000);
        return () => clearTimeout(timer);
    }, []);
    return (
        <div className={`fixed bottom-4 left-4 bg-white shadow-lg rounded-lg p-4 max-w-[20rem] transition-all duration-500 transform -translate-y-4 ${hide ? "hidden": ""}`} style={{zIndex: 9999}}>
            <div className="flex items-center gap-3">
                <div className="min-w-[4rem] min-h-[4rem] max-w-[4rem] max-h-[4rem] relative ">
                    <img alt="Dj Image" loading="lazy" src='/SongFallback.jpg'/>

                    </div>
                <div className="text-gray-800 text-sm leading-relaxed"><span className="font-semibold">Bro Walter Palmer</span> is inviting you to listen to the radio <span className="font-semibold">station</span> starting at <span className="font-semibold">9:12 PM</span> Los Angeles.</div>
            </div>
        </div>
    )
}

export default Popup