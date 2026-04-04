import React, { Suspense, useMemo, useState, useEffect } from 'react';
import RadarSkeleton from './RadarSkeleton';
import {
    RiskIndicator,
    IntelligenceCard,
    TransparencyPanel,
    LiveStatusHUD,
    IntelligenceBanner
} from './RadarOverlay';
import { AlertCircle, RefreshCw } from 'lucide-react';

// 📡 V4 Situational Components (Neutral Slate Header)
const CommandHeader = ({ title, riskLevel }) => (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1001] transition-all duration-1000 group">
        <div className={`px-10 py-4 bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.8)] flex items-center space-x-6 pointer-events-none ${riskLevel === 'CRITICAL' ? 'border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.1)]' : ''}`}>
            <div className={`h-2.5 w-2.5 rounded-full transition-all duration-1000 ${riskLevel === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_15px_#10b981]'}`}></div>
            <div className="flex flex-col">
                <span className="text-xs font-black text-white/90 uppercase tracking-[0.5em] italic leading-tight group-hover:tracking-[0.6em] transition-all">{title}</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mt-1 opacity-60">System Intelligence Hub v4.2.0</span>
            </div>
        </div>
    </div>
);

// 🛡️ Error Boundary Fallback for Elite Map
class RadarErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-12 text-center rounded-[3rem] border border-white/5 shadow-inner">
                    <div className="h-24 w-24 bg-rose-500/10 rounded-[3rem] flex items-center justify-center mb-8 border border-rose-500/20">
                        <AlertCircle className="text-rose-500 w-12 h-12 animate-pulse" />
                    </div>
                    <h3 className="text-3xl font-black font-outfit text-white mb-3 italic tracking-tighter">Situational Feed Disconnected</h3>
                    <p className="text-slate-400 text-sm font-bold max-w-sm mb-10 leading-relaxed opacity-60 italic">Critical telemetry failure. Command room is currently operating on fallback environmental datasets.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center"
                    >
                        <RefreshCw className="w-4 h-4 mr-4 animate-spin-slow" /> Force Recon Handshake
                    </button>
                    <style dangerouslySetInnerHTML={{ __html: `.animate-spin-slow { animation: spin 4s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
                </div>
            );
        }
        return this.props.children;
    }
}

// 🚀 Lazy Loaded Elite Map
const LiveRadar = React.lazy(() => import('./LiveRadar'));

export default function RadarPortal({ user = {}, data, intelligence }) {
    const center = useMemo(() =>
        user?.latitude && user?.longitude ? [parseFloat(user.latitude), parseFloat(user.longitude)] : [17.3850, 78.4867],
        [user]);

    return (
        <div className="relative w-full h-[600px] rounded-[3rem] overflow-hidden border border-white/10 outline outline-offset-[-1px] outline-white/5 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.6)] bg-slate-950 group">

            {/* 📍 LAYER 1: Base Situational Radar (The Foundation) */}
            <RadarErrorBoundary>
                <Suspense fallback={<RadarSkeleton />}>
                    <LiveRadar
                        title="Situation Room Nexus"
                        center={center}
                        zoom={13}
                        riskLevel={intelligence.level}
                    />
                </Suspense>
            </RadarErrorBoundary>

            {/* 📍 LAYER 2: Command Insights Priority */}
            <div className={`transition-all duration-1000 transform ${intelligence.alerts.length > 0 ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-24 opacity-0 scale-95 pointer-events-none'}`}>
                <IntelligenceBanner alert={intelligence.alerts[0]} />
            </div>

            {/* 📍 LAYER 3: Tactile Control Interfaces — Fixed Top-Left Position */}
            <div className="absolute top-8 left-8 z-[1001] scale-90 origin-top-left transition-transform duration-700">
                <TransparencyPanel data={data} intelligence={intelligence} />
            </div>

            <div className="scale-90 origin-top-right transition-transform duration-1000 absolute top-24 right-8 z-[1001]">
                <RiskIndicator intelligence={intelligence} />
            </div>

            <div className="scale-90 origin-bottom-left transition-transform duration-1000">
                <IntelligenceCard intelligence={intelligence} data={data} />
            </div>

            <LiveStatusHUD />

            <style dangerouslySetInnerHTML={{
                __html: `
                .tab-view { overflow: visible !important; }
                .shadow-3xl { box-shadow: 0 45px 80px -20px rgba(0, 0, 0, 0.4); }
                [class*='backdrop-blur'] { border-color: rgba(255,255,255,0.08) !important; }
            `}} />
        </div>
    );
}
