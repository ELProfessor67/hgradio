'use client'
import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'hg_dev_notice_dismissed';

const DevNotice = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
        } catch {
        }
        setOpen(true);
    }, []);

    const close = () => {
        setOpen(false);
        try {
            sessionStorage.setItem(STORAGE_KEY, '1');
        } catch {
            // ignore
        }
    };

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dev-notice-title"
            onClick={close}
        >
            <div
                className="relative w-full max-w-[480px] rounded-xl overflow-hidden border border-[#D8B257]/40 bg-[#070D18] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={close}
                    className="absolute top-2 right-2 text-white/50 hover:text-white z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 transition"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6 md:p-8 flex flex-col items-center text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#D8B257]/15 border border-[#D8B257]/40">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#D8B257]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>

                    <h2 id="dev-notice-title" className="text-white text-xl md:text-2xl font-serif font-bold tracking-tight mb-2 uppercase">
                        Site Under Development
                    </h2>

                    {/* Glowing Line */}
                    <div className="h-[2px] w-[70%] bg-gradient-to-r from-transparent via-[#FFF3B0] to-transparent shadow-[0_0_12px_rgba(216,178,87,0.9)] mb-4"></div>

                    <p className="text-white/80 font-sans text-sm md:text-base leading-relaxed mb-6">
                        This website is still under development, so you may run into
                        issues or features that are not working yet. Thank you for your
                        patience while we finish building it.
                    </p>

                    <button
                        onClick={close}
                        className="px-6 py-2.5 rounded-md bg-[#D8B257] hover:bg-[#E2C37E] text-[#070D18] font-sans font-bold text-sm tracking-widest uppercase transition"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DevNotice
