import React, { useState, useEffect, useRef } from 'react';
import { Zap, ShieldCheck, Search, DollarSign, Send, CheckCircle2, Loader2, Activity, MapPin, Cpu, Database, ShieldAlert } from 'lucide-react';

const INITIAL_TIMELINE = [
    { time: 0, step: 0, log: "Initializing multi-channel sensor sweep...", icon: Activity, type: 'audit' },
    { time: 1.5, step: 0, log: "Scanning Doppler Radar (Precipitation threshold: 50mm)...", icon: Zap, type: 'audit' },
    { time: 3.5, step: 0, log: "Scanning IR Heat Sensors (Threshold: 42°C)...", icon: Activity, type: 'audit' },
    { time: 5.5, step: 0, log: "Analyzing CPCB Air Quality Feed (Threshold: 300 AQI)...", icon: Activity, type: 'audit' },
    { time: 7.5, step: 0, log: "Cross-referencing TomTom Real-Time Traffic Flux...", icon: Activity, type: 'audit' },
    { time: 9.5, step: 1, log: "Worker activity verified via GPS & biometrics.", icon: MapPin, type: 'location' },
    { time: 12.0, step: 1, log: "Validating parametric policy coverage window...", icon: ShieldCheck, type: 'audit' },
    { time: 15.0, step: 2, log: "Executing anti-deepfake & location integrity audit.", icon: Search, type: 'fraud' },
    { time: 18.0, step: 2, log: "Deep audit passed: No synthetic activity detected.", icon: Database, type: 'success' },
    { time: 21.0, step: 3, log: "Calculating payout based on severity magnitude...", icon: DollarSign, type: 'payout' },
    { time: 24.0, step: 3, log: "Actuarial engine finalized payout...", icon: Cpu, type: 'payout' },
    { time: 27.0, step: 4, log: "Initiating instant UPI transfer (Razorpay X).", icon: Send, type: 'payment' },
    { time: 29.5, step: 4, log: "Payment successful. Settlement record logged.", icon: CheckCircle2, type: 'finished' }
];

const STEPS = [
    { id: 0, label: 'Trigger Detected', icon: Zap },
    { id: 1, label: 'Eligibility Verified', icon: MapPin },
    { id: 2, label: 'Fraud Audit', icon: Search },
    { id: 3, label: 'Payout Finalized', icon: DollarSign },
    { id: 4, label: 'Settlement Sent', icon: Send }
];

export default function LiveClaimPipeline({ user, onComplete }) {
    const [elapsed, setElapsed] = useState(0);
    const [currentStep, setCurrentStep] = useState(-1);
    const [logs, setLogs] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [claimData, setClaimData] = useState(null);
    const logEndRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    // 🔄 Sync with Backend Claims (Dynamic Metadata Fetch)
    useEffect(() => {
        const poll = async () => {
            if (isFinished || !user) return;
            try {
                const { fetchDashboard } = await import('../../api');
                const data = await fetchDashboard(user.worker_id);
                // Find a very recent claim (last 30s)
                const latest = data.claimsHistory?.find(c => {
                    const age = (Date.now() - new Date(c.created_at).getTime()) / 1000;
                    return age < 60; // 60s buffer
                });
                if (latest && !claimData) {
                    // Try to parse metadata if it exists
                    try {
                        const meta = typeof latest.calculation_metadata === 'string' 
                            ? JSON.parse(latest.calculation_metadata) 
                            : latest.calculation_metadata;
                        setClaimData({ ...latest, meta });
                    } catch(e) {
                        setClaimData(latest);
                    }
                }
            } catch (e) { console.error('Sync failed', e); }
        };

        const interval = setInterval(poll, 2000);
        return () => clearInterval(interval);
    }, [user, isFinished, claimData]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = (now - startTimeRef.current) / 1000;
            
            if (diff >= 30) {
                setElapsed(30);
                setIsFinished(true);
                clearInterval(interval);
                if (onComplete) onComplete();
                return;
            }

            setElapsed(diff);

            // Construct Dynamic Timeline
            const dynamicTimeline = INITIAL_TIMELINE.map(t => {
                if (t.time === 20 && claimData?.meta) {
                    return { ...t, log: `Calculating payout for ${claimData.meta.reason}...` };
                }
                if (t.time === 23.5 && claimData) {
                    return { ...t, log: `Actuarial engine finalized payout: ₹${claimData.payout_amount || 250}.` };
                }
                return t;
            });

            // Update logs based on timeline
            const newLogs = dynamicTimeline.filter(t => t.time <= diff);
            if (newLogs.length !== logs.length) {
                setLogs(newLogs);
                // Update step index
                const latestStep = newLogs.length > 0 ? newLogs[newLogs.length - 1].step : -1;
                setCurrentStep(latestStep);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [logs.length, onComplete, claimData]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const progress = (elapsed / 30) * 100;
    const timeLeft = Math.max(0, 30 - Math.floor(elapsed));

    if (isFinished) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-700 bg-emerald-50/20 rounded-[2rem] border border-emerald-100 p-8 min-h-[500px]">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl shadow-emerald-200">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black text-slate-800 font-outfit uppercase tracking-tighter italic">Settlement Successful</h3>
                    <p className="text-emerald-600 font-black text-xl italic drop-shadow-sm">₹{claimData?.payout_amount || 250} Credited via UPI</p>
                    {claimData?.meta && (
                        <p className="text-slate-500 font-bold text-[10px] uppercase bg-white/40 px-4 py-1 rounded-full border border-emerald-100 shadow-sm">{claimData.meta.reason}</p>
                    )}
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-4 italic">Processing Latency: 28.4 Seconds</p>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center group active:scale-95"
                >
                    <Activity className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                    RUN SIMULATION AGAIN
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-6 min-h-[500px] py-4">
            {/* Header & Risk Info */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-[2px] flex items-center italic">
                        <Loader2 className={`w-5 h-5 mr-3 text-indigo-600 ${!isFinished ? 'animate-spin' : ''}`} /> 
                        Live Claim Process
                    </h3>
                    <p className="text-[9px] font-black text-indigo-500 mt-1 uppercase tracking-[3px] italic">
                        🟢 Real-World Parametric Audit Active
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center space-x-2 shadow-sm">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">Confidence: High</span>
                    </div>
                    {claimData?.claim_status === 'Rejected' && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-xl animate-in slide-in-from-right-4 duration-500 max-w-xs relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-2 opacity-10">
                                <ShieldAlert className="w-8 h-8 text-rose-500" />
                             </div>
                             <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1 italic">❌ Rejected at {claimData.failed_stage || 'AUDIT'} STAGE</h4>
                             <p className="text-[10px] font-bold text-slate-600 leading-tight italic">"{claimData.rejection_reason || 'Criteria mismatch'}"</p>
                             <div className="mt-3 flex items-center space-x-2 bg-white/60 p-2 rounded-xl border border-rose-50">
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">💡 TIP: Click 'GO ONLINE' to simulate a successful payout</span>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-grow">
                {/* Visual Stepper */}
                <div className="space-y-4">
                    {STEPS.map((step, idx) => {
                        const isRejected = claimData?.claim_status === 'Rejected';
                        const failedIdx = isRejected ? 
                            (claimData.failed_stage === 'THRESHOLD' ? 0 : 
                             claimData.failed_stage === 'ELIGIBILITY' ? 1 : 
                             claimData.failed_stage === 'FRAUD' ? 2 : -1) : -1;
                        
                        const isFailedStep = isRejected && idx === failedIdx;
                        const isAfterFailure = isRejected && idx > failedIdx;
                        const isCompleted = !isAfterFailure && !isFailedStep && (currentStep > idx);
                        const isProcessing = !isRejected && (currentStep === idx);
                        const isPending = !isProcessing && !isCompleted && !isFailedStep;

                        let displayLabel = step.label;
                        if (idx === 0) {
                             if (isFailedStep) {
                                 displayLabel = 'Trigger Audit Failed';
                             } else if (isProcessing || isPending) {
                                 // Dynamic labels based on elapsed time within the audit phase
                                 if (elapsed < 1.5) displayLabel = 'Initializing Sensors...';
                                 else if (elapsed < 3.5) displayLabel = 'Scanning Rainfall...';
                                 else if (elapsed < 5.5) displayLabel = 'Scanning Heat...';
                                 else if (elapsed < 7.5) displayLabel = 'Analyzing Air...';
                                 else displayLabel = 'Checking Traffic...';
                             } else {
                                 displayLabel = 'Disruption Detected';
                             }
                        }

                        return (
                            <div key={step.id} className={`flex items-center space-x-5 transition-all duration-700 ${isPending || isAfterFailure ? 'opacity-30 filter grayscale' : 'opacity-100'}`}>
                                <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center border-2 transition-all duration-700 ${
                                    isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
                                    isFailedStep ? 'bg-rose-500 border-rose-500 text-white animate-critical-shake' :
                                    isProcessing ? 'bg-white border-indigo-500 text-indigo-500 animate-pulse ring-4 ring-indigo-50' : 
                                    'bg-white border-slate-200 text-slate-400'
                                } shadow-md`}>
                                    {isFailedStep ? <ShieldAlert className="w-6 h-6" /> : isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <step.icon className={`w-6 h-6 ${isProcessing ? 'animate-bounce' : ''}`} />}
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className={`text-[11px] font-black uppercase tracking-widest ${isFailedStep ? 'text-rose-600 italic' : isProcessing ? 'text-indigo-600 italic' : isCompleted ? 'text-emerald-600 italic' : 'text-slate-400'}`}>
                                        {displayLabel}
                                    </h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] italic opacity-70">
                                        {isFailedStep ? 'Audit Failed' : isCompleted ? 'Validated' : isProcessing ? 'Verifying...' : 'Pending'}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Progress & Logs */}
                <div className="space-y-8 flex flex-col h-full">
                    {/* Progress Ring */}
                    <div className="relative h-32 w-32 mx-auto group">
                        <div className="absolute inset-0 bg-indigo-500 opacity-5 blur-2xl group-hover:opacity-10 transition-opacity"></div>
                        <svg className="h-full w-full transform -rotate-90 relative z-10">
                            <circle
                                cx="64" cy="64" r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-slate-50"
                            />
                            <circle
                                cx="64" cy="64" r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 - (364.4 * progress) / 100}
                                strokeLinecap="round"
                                className="text-indigo-600 transition-all duration-100 ease-linear"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
                            <span className="text-2xl font-black font-outfit text-slate-800 italic">{timeLeft}s</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Auto-Claim</span>
                        </div>
                    </div>

                    {/* Intelligent Logs */}
                    <div className="bg-slate-900 rounded-[2rem] p-5 flex-grow overflow-hidden relative border border-slate-800 shadow-2xl">
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                        <div className="space-y-4 h-[200px] overflow-y-auto no-scrollbar scroll-smooth pr-2">
                            {logs.map((log, i) => (
                                <div key={i} className="flex space-x-4 items-start animate-in slide-in-from-left-4 duration-500">
                                    <div className={`mt-0.5 p-1.5 rounded-lg ${
                                        log.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                        log.type === 'trigger' ? 'bg-rose-500/20 text-rose-400' :
                                        'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                    }`}>
                                        <log.icon className="w-3.5 h-3.5" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-300 tracking-tight leading-relaxed italic opacity-90">
                                        {log.log}
                                    </p>
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Zero-Touch Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[1.5rem] p-5 text-white flex items-center justify-between shadow-2xl shadow-indigo-200 border border-white/20 group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-1000 rotate-12">
                    <Activity className="w-16 h-16" />
                </div>
                <div className="flex items-center space-x-5 relative z-10">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                        <Zap className="w-6 h-6 animate-pulse text-yellow-300" />
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-[3px] italic">Zero-Touch Strategy</h4>
                        <p className="text-[10px] font-black text-indigo-100 opacity-90 italic mt-0.5 tracking-tight">No action required. Claim processing is fully autonomous.</p>
                    </div>
                </div>
                <div className="flex space-x-1.5 relative z-10 px-4">
                    <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:0s] shadow-[0_0_8px_white]"></div>
                    <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:0.2s] shadow-[0_0_8px_white]"></div>
                    <div className="h-2 w-2 bg-white rounded-full animate-bounce [animation-delay:0.4s] shadow-[0_0_8px_white]"></div>
                </div>
            </div>
        </div>
    );
}
