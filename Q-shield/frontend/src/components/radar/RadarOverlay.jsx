import React, { useState, useEffect } from 'react';
import { AlertCircle, Zap, ShieldCheck, Thermometer, Droplets, Wind, ChevronDown, ChevronUp, Maximize2, Crosshair, Loader2, CheckCircle2, Car } from 'lucide-react';

/* 🟢 V4 Animated SVG Progress Circle (High-Contrast Midnight) */
export const RiskIndicator = ({ intelligence }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (intelligence.score / 100) * circumference;
    
    const color = intelligence.level === 'CRITICAL' ? '#f43f5e' : intelligence.level === 'MEDIUM' ? '#f59e0b' : '#10b981';

    return (
        <div 
            className="flex flex-col items-center bg-slate-900/90 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-white/10 shadow-[0_32px_128px_rgba(0,0,0,0.8)] transition-all duration-700"
        >
            <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-[-10px] rounded-full opacity-25 blur-2xl" style={{ backgroundColor: color }}></div>
                <svg className="w-20 h-20 transform -rotate-90 relative">
                    <circle
                        cx="40" cy="40" r={radius}
                        stroke="currentColor" strokeWidth="2" fill="transparent"
                        className="text-white/5"
                    />
                    <circle
                        cx="40" cy="40" r={radius}
                        stroke={color} strokeWidth="5" fill="transparent"
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-[13px] font-black text-white italic tracking-tighter leading-none">{intelligence.score}%</span>
                    <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter border-t border-white/10 pt-1 mt-1">RISK</span>
                </div>
            </div>
            
            <div className="mt-5 text-center space-y-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${intelligence.level === 'CRITICAL' ? 'text-rose-400' : 'text-slate-200'}`}>
                    {intelligence.level === 'CRITICAL' ? '⚠️ CRITICAL' : intelligence.level === 'MEDIUM' ? '⚡ ELEVATED' : '✓ NOMINAL'}
                </p>
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-80">
                    Confidence: <span className={intelligence.confidence === 'HIGH' ? 'text-emerald-500' : 'text-amber-500'}>{intelligence.confidence}</span>
                </div>
            </div>
        </div>
    );
};

/* 💎 V4 Payout Card State Machine (High-Contrast Midnight) */
export const IntelligenceCard = ({ intelligence, data }) => {
    const [state, setState] = useState('DETECTING'); // DETECTING -> CALCULATING -> PROCESSING -> COMPLETED

    useEffect(() => {
        if (!intelligence.isEligible) {
            setState('DETECTING');
            return;
        }

        const timer1 = setTimeout(() => setState('CALCULATING'), 1500);
        const timer2 = setTimeout(() => setState('PROCESSING'), 4000);
        const timer3 = setTimeout(() => setState('COMPLETED'), 7000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [intelligence.isEligible]);

    if (!intelligence.isEligible && intelligence.level !== 'CRITICAL') return null;

    const stateConfigs = {
        DETECTING: { label: 'Scanning Telemetry', stroke: 'stroke-amber-400', color: 'from-amber-400/30' },
        CALCULATING: { label: 'Valuation Core', stroke: 'stroke-indigo-400', color: 'from-indigo-400/30' },
        PROCESSING: { label: 'Gateway Handshake', stroke: 'stroke-emerald-400', color: 'from-emerald-400/30' },
        COMPLETED: { label: 'Funds Dispatched', stroke: 'stroke-emerald-500', color: 'from-emerald-600/40' }
    };

    const current = stateConfigs[state];

    return (
        <div className="absolute top-20 left-8 z-[1001] w-[320px] transition-all duration-700 animate-in slide-in-from-left-12">
            <div className={`p-[1.5px] rounded-[2.5rem] bg-gradient-to-br ${current.color} via-transparent to-transparent shadow-[0_64px_128px_rgba(0,0,0,0.8)]`}>
                <div className="bg-slate-900/90 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className={`h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-all duration-500 shadow-inner ${state === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-500/30' : ''}`}>
                                {state === 'COMPLETED' ? <CheckCircle2 className="text-emerald-500"/> : <Loader2 className={`animate-spin ${current.stroke.replace('stroke-', 'text-')}`}/>}
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">{current.label}</h4>
                                <p className="text-white font-black text-2xl tracking-tighter font-outfit italic">
                                    ₹500 <span className="text-xs opacity-40 uppercase tracking-tighter">/ Day Payout</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4 relative z-10">
                        <p className="text-white font-bold text-[11px] leading-loose italic opacity-90">
                           "Environmental threshold breach detected. Automatic payout initiated via Q-Shield parametric API."
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-white/10">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">State Trace</span>
                            <div className="flex space-x-1.5">
                                 {[1,2,3,4].map(i => (
                                    <div key={i} className={`h-5 w-8 rounded-full border border-white/10 transition-all duration-500 flex items-center justify-center text-[10px] font-black ${i <= Object.keys(stateConfigs).indexOf(state) + 1 ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-950 opacity-30'}`}>
                                        {i === 4 && state === 'COMPLETED' ? '✓' : i}
                                    </div>
                                 ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ⚠️ V4 Intelligence Banner (High-Contrast Midnight) */
export const IntelligenceBanner = ({ alert }) => {
    if (!alert) return null;
    
    const isCritical = alert.type === 'CRITICAL';

    return (
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-[1001] w-[90%] max-w-lg p-5 rounded-[2.5rem] bg-slate-900/90 backdrop-blur-3xl border border-white/10 shadow-[0_64px_128px_rgba(0,0,0,0.8)] flex items-center space-x-5 transition-all duration-500 ${isCritical ? 'animate-critical-shake' : ''}`}>
             <div className={`p-3.5 rounded-2xl flex items-center justify-center text-white ${isCritical ? 'bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.5)]' : 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)]'}`}>
                <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1 leading-none italic">
                    {isCritical ? 'High-Priority Alert' : 'Systems Intel'}
                </h4>
                <p className="text-[13px] font-bold tracking-tight text-white leading-snug">{alert.msg}</p>
            </div>
             {isCritical && <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-rose-500 animate-ping"></div>}
        </div>
    );
};

/* 📊 V4 Explainability Panel (High-Contrast Midnight Diagnostic) */
/* 📊 V4 Explainability Panel (Refined High-Contrast diagnostic) */
export const TransparencyPanel = ({ data, intelligence }) => {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (intelligence.level === 'CRITICAL') setExpanded(true);
    }, [intelligence.level]);

    return (
        <div className="transition-all duration-700 animate-in slide-in-from-left-8">
            <button 
                onClick={() => setExpanded(!expanded)}
                className="glass-premium px-7 py-4 rounded-[2rem] text-white flex items-center space-x-5 hover:bg-slate-800/40 hover:scale-105 active:scale-95 transition-all shadow-3xl group mb-5"
            >
                <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all duration-1000 ${intelligence.diagnostics?.syncStatus === 'Live' ? 'bg-emerald-500 shadow-[0_0_20px_#10b981]' : 'bg-slate-500 animate-pulse'}`}></div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em] group-hover:tracking-[0.5em] transition-all italic">{expanded ? 'Close Core Intel' : 'Analyze Intelligence'}</span>
            </button>
            
            <div className={`w-[340px] glass-premium rounded-[3rem] p-8 space-y-7 transition-all duration-700 transform origin-top-left overflow-hidden ${expanded ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}>
                <div className="space-y-6">
                    <TelemetryItem icon={<Wind size={16}/>} label="Air Quality Index" value={data.aqi ?? '--'} desc={intelligence.diagnostics.aqiStatus} color="text-amber-400" progress={data.aqi ? Math.min(data.aqi / 4, 100) : 0} />
                    <TelemetryItem icon={<Droplets size={16}/>} label="Precipitation" value={data.rainfall ?? '0'} unit="mm" desc={intelligence.diagnostics.rainStatus} color="text-indigo-400" progress={data.rainfall ? Math.min(data.rainfall * 2, 100) : 0} />
                    <TelemetryItem icon={<Car size={16}/>} label="Traffic Flow" value={data.trafficFlow ?? 'CLEAR'} unit="API" desc="TomTom Live Feed" color="text-emerald-400" progress={30} />
                    <TelemetryItem icon={<Thermometer size={16}/>} label="External Temp" value={data.temperature ?? '--'} unit="°C" desc="Warning Threshold" color="text-rose-400" progress={data.temperature ? Math.min(data.temperature * 1.5, 100) : 0} />
                </div>
                
                <div className="pt-6 border-t border-white/5 flex flex-col items-center space-y-3">
                    <div className="flex items-center text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic animate-pulse">
                        <Loader2 className="w-3 h-3 mr-2 animate-spin"/> Q-Shield Nexus Sync
                    </div>
                </div>
            </div>
        </div>
    );
};

const TelemetryItem = ({ icon, label, value, unit, desc, color, progress }) => (
    <div className="group">
        <div className="flex justify-between items-start mb-3.5 px-0.5">
            <div className="flex items-center space-x-3">
                <div className={`${color} p-2.5 bg-white/5 rounded-[1rem] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>{icon}</div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase opacity-60 tracking-tighter italic">{desc}</span>
                </div>
            </div>
            <p className={`text-sm font-black ${color} italic font-outfit`}>{value}<span className="text-[10px] opacity-40 ml-0.5">{unit}</span></p>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner p-[1px]">
            <div className={`h-full opacity-80 rounded-full transition-all duration-1000 ${color.replace('text-', 'bg-')}`} style={{ width: `${progress}%` }}></div>
        </div>
    </div>
);

/* 🔴 V4 LIVE Status HUD (Metadata Dashboard) — High-Contrast Midnight */
export const LiveStatusHUD = () => {
    const [latency, setLatency] = useState(24);
    useEffect(() => {
        const interval = setInterval(() => setLatency(Math.floor(Math.random() * 8) + 21), 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute bottom-8 right-8 z-[1001] flex flex-col items-end space-y-4 pointer-events-none">
            <div className="flex flex-col items-end space-y-1">
                <div className="flex items-center bg-slate-900/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-3xl">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse mr-3.5"></div>
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic leading-tight">SYSTEM_OPERATIONAL_HUB</span>
                </div>
                <div className="flex space-x-4 pr-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{latency}MS STREAM LATENCY</span>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic opacity-80">STABLE_CONNECT</span>
                </div>
            </div>
        </div>
    );
};
