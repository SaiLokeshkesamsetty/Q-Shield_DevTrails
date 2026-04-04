import React from 'react';

export default function RadarSkeleton() {
    return (
        <div className="w-full h-[780px] rounded-[3.5rem] bg-slate-950 backdrop-blur-3xl border border-white/10 shadow-3xl overflow-hidden animate-pulse relative">
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center">
                {/* Visual Tactical Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}></div>

                <div className="flex flex-col items-center gap-10 z-10">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-2xl"></div>
                        <div className="h-10 w-10 border-4 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin"></div>
                    </div>

                    <div className="flex flex-col items-center space-y-3">
                        <span className="text-[14px] font-black text-indigo-400 uppercase tracking-[0.6em] italic">Building Tactical Layer...</span>
                        <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500/40 w-1/2 animate-[payout-shimmer_2s_infinite]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contextual UI Skeletons */}
            <div className="absolute top-12 left-12 w-64 h-16 bg-white/5 rounded-[2rem] border border-white/5"></div>
            <div className="absolute top-12 right-12 w-32 h-16 bg-white/5 rounded-[1.5rem] border border-white/5"></div>
            <div className="absolute bottom-12 right-12 w-80 h-24 bg-white/5 rounded-[2.5rem] border border-white/5"></div>
        </div>
    );
}
