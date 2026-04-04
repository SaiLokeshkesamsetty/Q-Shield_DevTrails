import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { MapPin, Zap, LayoutGrid, CloudRain, Clock, BrainCircuit, ShieldCheck, CreditCard, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// Custom Hooks for Decoupled Logic
import { useWorkerTelemetry } from '../../hooks/useWorkerTelemetry';
import { useRiskIntelligence } from '../../hooks/useRiskIntelligence';

// Modular Components
import TabNavigation from './TabNavigation';
import OverviewTab from './OverviewTab';
import HistoryTab from './HistoryTab';

// Lazy Loaded Radar Portal (Enterprise Performance)
const RadarPortal = React.lazy(() => import('../radar/RadarPortal'));

// Error Boundary Fallback View
const RadarErrorView = () => (
    <div className="w-full h-[600px] rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-300 mb-4" />
        <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Radar Module Offline</h4>
        <p className="text-slate-400 text-sm font-bold max-w-xs mx-auto mt-2 italic">Unable to sync mapping telemetry. Using cached static zone metadata.</p>
    </div>
);

export default function WorkerDashboard({ user }) {
    // 1. Navigation State with Persistence
    const [activeTab, setActiveTab] = useState(() => 
        localStorage.getItem('qshield_worker_tab') || 'overview'
    );

    // 2. Data & Intelligence Layer
    const { data, loading, refresh } = useWorkerTelemetry(user?.worker_id);
    const intelligence = useRiskIntelligence(data);
    const [triggering, setTriggering] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [workerProfile, setWorkerProfile] = useState(user); // Local state for fresh DB data

    // 🔄 REFRESH PROFILE Sync (Ensure we have fresh DB data combined with auth context)
    useEffect(() => {
        if (data?.worker) {
            console.log(`📡 [Dashboard] Telemetry Sync: Internal state updated with fresh worker telemetry.`);
            setWorkerProfile(prev => ({ ...prev, ...data.worker }));
        }
    }, [data?.worker]);


    useEffect(() => {
        // Soft prefetch the Radar module during idle time
        const prefetch = () => import('../radar/RadarPortal');
        const timer = setTimeout(prefetch, 2000);
        return () => clearTimeout(timer);
    }, []);

    // 4. Intelligence Monitor: Alerts handled via UI cards instead of intrusive popups
    // (Removed auto-toast useEffect as per UI refinement request)

    const handleCheckIn = async () => {
        const toastId = toast.loading('Syncing GPS & Active Status...');
        try {
            const { updateWorkerStatus } = await import('../../api');
            // 📍 Live Sync Priority: Registration Coords (workerProfile) -> Live GPS -> fallback
            const lat = workerProfile.latitude || workerProfile.last_location?.lat || 17.3850;
            const lng = workerProfile.longitude || workerProfile.last_location?.lng || 78.4867;
            
            console.log(`📡 [Sync] Nexus handshaking at: ${lat}, ${lng}`);
            const res = await updateWorkerStatus(workerProfile.worker_id, lat, lng);
            if (res.success && res.worker) {
                toast.success('System Online. You are now eligible for payouts.', { id: toastId });
                setWorkerProfile(res.worker); // 🚀 Immediate UI Update
                refresh();
            } else {
                throw new Error('Update failed');
            }
        } catch (e) {
            toast.error('Sync failed. Please try again.', { id: toastId });
        }
    };

    const handleSimulateDisruption = async () => {
        if (workerProfile.mode === 'LIVE') {
            const confirm = window.confirm("⚠️ Live Mode Active: This simulation will perform strict weather and fraud audits. If real-world thresholds are not met, your claim will be REJECTED. \n\nTip: Click 'GO ONLINE' to prime a successful Demo Payout.");
            if (!confirm) return;
        }

        setTriggering(true);
        const toastId = toast.loading(workerProfile.mode === 'DEMO' ? 'Executing Demo Payout Flow...' : 'Initiating Strict Parametric Audit...');
        try {
            const api = await import('../../api');
            const lat = workerProfile.latitude || workerProfile.last_location?.lat;
            const lng = workerProfile.longitude || workerProfile.last_location?.lng;
            
            await api.simulateRainTrigger('RAIN', workerProfile.home_zone || 'Hyderabad', lat, lng, workerProfile.worker_id);
            toast.success(`⚡ Disruption signal logged. Processing ${workerProfile.mode} pipeline.`, { id: toastId });
            setIsSimulating(true);
            
            setTimeout(() => {
                refresh();
            }, 2000);
        } catch(e) {
            toast.error('Simulation sync failed', { id: toastId });
        } finally {
            setTriggering(false);
        }
    };

    if (!user) return <div className="p-20 text-center font-black">LOGIN REQUIRED</div>;
    if (loading || !data) return <div className="p-20 text-center font-black animate-pulse text-indigo-500 uppercase tracking-[20px]">SYNCING_AI_CORE</div>;

    return (
        <div className="min-h-screen bg-transparent command-grid py-12 animate-in fade-in duration-1000">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-8">
                
                {/* 🚀 Premium Orchestrator Header */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center justify-between gap-10 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-slate-900/0 to-purple-500/10 opacity-60"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="flex items-center space-x-8 relative z-10">
                        <div 
                            className="h-24 w-24 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-4xl font-black shadow-[0_20px_40px_rgba(79,70,229,0.4)] relative transition-all group-hover:scale-105 group-hover:rotate-3 duration-500"
                        >
                            {user.name?.charAt(0)}
                            <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-emerald-500 border-4 border-slate-900 rounded-full shadow-[0_0_15px_#10b981]"></div>
                        </div>
                        <div>
                            <h1 className="text-5xl font-black text-white tracking-tighter font-outfit italic mb-3 drop-shadow-sm">
                                Hi, {user.name}
                            </h1>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
                                    <MapPin className="w-3.5 h-3.5 mr-2 text-indigo-400"/> 
                                    <span className="text-slate-300 font-bold uppercase tracking-[0.2em] text-[10px]">{user.home_zone} Nexus</span>
                                </div>
                                 <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
                                    <div className={`h-1.5 w-1.5 rounded-full ${workerProfile.mode === 'DEMO' ? 'bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]' : 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]'}`}></div>
                                    <span className={`${workerProfile.mode === 'DEMO' ? 'text-purple-400' : 'text-emerald-400'} font-black text-[10px] uppercase tracking-widest italic`}>
                                        {workerProfile.mode === 'DEMO' ? '🧪 Demo Mode Ready' : '🟢 Live Mode'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-5 relative z-10">
                        <div className="flex space-x-4">
                            <button 
                                onClick={handleCheckIn}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-5 rounded-2xl flex items-center font-black text-xs transition-all shadow-xl shadow-emerald-900/20 active:scale-95 uppercase tracking-widest group/btn"
                            >
                                <ShieldCheck className="w-4 h-4 mr-3 group-hover/btn:rotate-12 transition-transform" />
                                GO ONLINE
                            </button>
                            <button 
                                onClick={handleSimulateDisruption} 
                                disabled={triggering} 
                                className="relative overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-5 rounded-2xl flex items-center font-black text-xs transition-all disabled:opacity-50 tracking-widest active:scale-95 border border-white/10"
                            >
                                <div className={`mr-3 ${triggering ? 'animate-spin' : ''}`}>
                                    <Zap className="w-4 h-4 text-yellow-400" />
                                </div>
                                {triggering ? 'SYNCING...' : 'SIMULATE DISRUPTION'}
                            </button>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 italic opacity-60 tracking-[0.2em]">{loading ? 'DATA_SYNC_WAITING...' : 'LIVE_CLAIM_PROCESS_V5'}</span>
                    </div>
                </div>

                {/* 📍 Tab Navigation Area */}
                <div className="flex justify-center mb-4">
                     <TabNavigation active={activeTab} onChange={setActiveTab} />
                </div>

                {/* 📺 Contextual Tab View Container */}
                <div className="min-h-[600px] relative">
                    {activeTab === 'overview' && (
                        <div key="overview" className="tab-view">
                            <OverviewTab 
                                user={user} 
                                data={data} 
                                intelligence={intelligence} 
                                isSimulating={isSimulating}
                                setIsSimulating={setIsSimulating}
                                refresh={refresh}
                            />
                        </div>
                    )}
                    
                    {activeTab === 'radar' && (
                        <div key="radar" className="tab-view animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <Suspense fallback={<div className="h-[600px] glass-dark animate-pulse rounded-[3rem]"></div>}>
                                <RadarPortal user={user} data={data} intelligence={intelligence} />
                            </Suspense>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div key="history" className="tab-view">
                            <HistoryTab data={data} refresh={refresh} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
