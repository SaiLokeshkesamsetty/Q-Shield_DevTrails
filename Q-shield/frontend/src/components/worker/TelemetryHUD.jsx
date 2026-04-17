import React from 'react';
import { CloudRain, Wind, Thermometer, MapPin, Signal } from 'lucide-react';

export default function TelemetryHUD({ data, intelligence }) {
    if (!data) return null;

    const metrics = [
        { label: 'Rainfall', value: `${data.rain || 0}mm`, icon: <CloudRain className="w-4 h-4" />, color: 'text-sky-400' },
        { label: 'AQI Index', value: data.aqi || 42, icon: <Wind className="w-4 h-4" />, color: 'text-emerald-400' },
        { label: 'Ambient', value: `${data.temp || 32}°C`, icon: <Thermometer className="w-4 h-4" />, color: 'text-orange-400' },
    ];

    return (
        <div className="fixed bottom-10 right-10 z-[2000] pointer-events-none animate-in slide-in-from-right-12 duration-1000">
            <div className="bg-slate-950/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] flex flex-col space-y-6 min-w-[220px]">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">Telemetry HUD</span>
                    </div>
                    <Signal className="w-3.5 h-3.5 text-white/20" />
                </div>

                <div className="space-y-5">
                    {metrics.map((m, i) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-xl bg-white/5 ${m.color} border border-white/5`}>
                                    {m.icon}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</span>
                            </div>
                            <span className="text-sm font-black text-white font-outfit">{m.value}</span>
                        </div>
                    ))}
                </div>

                <div className="pt-4 mt-auto border-t border-white/5">
                    <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest italic truncate max-w-[140px]">
                            {data.zone || 'Nexus Prime'}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* HUD Scanning Line Effect */}
            <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none border border-white/10 border-indigo-500/20">
                <div className="w-full h-[2px] bg-indigo-500/30 absolute top-0 left-0 animate-hud-scan shadow-[0_0_15px_#6366f1]"></div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes hud-scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-hud-scan {
                    animation: hud-scan 4s linear infinite;
                }
            `}} />
        </div>
    );
}
