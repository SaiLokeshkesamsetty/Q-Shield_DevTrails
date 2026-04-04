import { CloudRain, ShieldCheck, Zap, BrainCircuit, CheckCircle2, DollarSign, Clock, Sun, Wind, Car, AlertTriangle, ShieldAlert, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import LiveClaimPipeline from './LiveClaimPipeline';

const PIPELINE_STEPS = [
    { id: 'Triggered', label: 'Trigger', icon: <Zap className="w-4 h-4"/> },
    { id: 'Eligibility_Checking', label: 'Eligibility', icon: <ShieldCheck className="w-4 h-4"/> },
    { id: 'Fraud_Verifying', label: 'Fraud Check', icon: <ShieldCheck className="w-4 h-4"/> },
    { id: 'Transferring', label: 'Payout', icon: <DollarSign className="w-4 h-4"/> },
    { id: 'Completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4"/> }
];

export default function OverviewTab({ user, data, intelligence, isSimulating, setIsSimulating, refresh }) {
    const latestClaim = data?.claimsHistory && data?.claimsHistory[0];
    const currentStepIndex = latestClaim ? PIPELINE_STEPS.findIndex(s => s.id === latestClaim.processing_step) : -1;

    const handlePurchase = async () => {
        const toastId = toast.loading('Initiating Secure Transaction...');
        try {
            const api = await import('../../api');
            await api.purchasePolicy(user.worker_id, data.currentPremiumQuote || 35);
            toast.success('Coverage Active. Your income is now protected.', { id: toastId });
            refresh();
        } catch (e) {
            toast.error('Transaction failed. Please try again.', { id: toastId });
        }
    };
    
    // ... icon logic ...
    const getRiskIcon = () => {
        const reason = (data.riskReason || '').toUpperCase();
        if (reason.includes('RAIN') || reason.includes('STORM') || reason.includes('PRECIPITATION')) return <CloudRain className={`w-5 h-5 ${intelligence.level === 'CRITICAL' ? 'text-red-500 animate-bounce' : 'text-slate-300'}`} />;
        if (reason.includes('AQI') || reason.includes('POLLUTION') || reason.includes('SMOG') || reason.includes('AIR')) return <Wind className={`w-5 h-5 ${intelligence.level === 'CRITICAL' ? 'text-rose-500 animate-pulse' : 'text-slate-300'}`} />;
        if (reason.includes('TRAFFIC') || reason.includes('GRIDLOCK') || reason.includes('ROAD')) return <Car className={`w-5 h-5 ${intelligence.level === 'CRITICAL' ? 'text-orange-500 animate-bounce' : 'text-slate-300'}`} />;
        if (reason.includes('CLEAR') || reason.includes('SUN') || reason.includes('HEAT')) return <Sun className={`w-5 h-5 ${intelligence.level === 'CRITICAL' ? 'text-amber-500 animate-spin-slow' : 'text-slate-300'}`} />;
        return <AlertTriangle className={`w-5 h-5 ${intelligence.level === 'CRITICAL' ? 'text-red-500 animate-pulse' : 'text-slate-300'}`} />;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 📊 Live Statistics Column */}
            <div className="space-y-6">
                {/* Risk Meter */}
                <div className={`bg-white p-7 rounded-3xl border shadow-sm transition-all duration-500 relative overflow-hidden group ${intelligence.level === 'CRITICAL' || isSimulating ? 'border-red-100 bg-red-50/30' : 'border-slate-50'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Zone Telemetry</h3>
                            {isSimulating && <span className="text-[8px] font-black text-indigo-500 uppercase tracking-tight animate-pulse">Running Simulation...</span>}
                        </div>
                        {isSimulating ? <Zap className="w-5 h-5 text-indigo-500 animate-bounce" /> : getRiskIcon()}
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <div className={`text-4xl font-black font-outfit ${(intelligence.level === 'CRITICAL' || isSimulating) ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {isSimulating ? 'HIGH' : (intelligence.level === 'CRITICAL' ? 'HIGH' : intelligence.level)}
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                    {isSimulating ? 'SIMULATED DISRUPTION' : (data?.riskReason || 'Optimal Conditions')}
                                </p>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${(intelligence.level === 'CRITICAL' || isSimulating) ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                {isSimulating ? 'Triggered' : (intelligence.level === 'CRITICAL' ? 'Disruption Active' : 'Stable')}
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full transition-all duration-1000" style={{ width: isSimulating ? '95%' : `${intelligence.score}%`, backgroundColor: (intelligence.level === 'CRITICAL' || isSimulating) ? '#f43f5e' : '#6366f1' }}></div>
                        </div>
                    </div>
                </div>

                {/* Policy Details */}
                {data?.activeCoverage ? (
                    <div className="bg-indigo-600 p-7 rounded-3xl text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group border border-indigo-400/30">
                        <ShieldCheck className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-xs font-black text-indigo-100 uppercase tracking-widest ">Parametric Cover</h3>
                                 <div className="flex items-center bg-white/10 px-2 py-1 rounded-full border border-white/20">
                                    <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse mr-2 shadow-[0_0_8px_#34d399]"></div>
                                    <span className="text-[8px] font-black uppercase text-indigo-50">Active</span>
                                 </div>
                            </div>
                            <div className="text-3xl font-black font-outfit mb-1 tracking-tighter">PROTECTED</div>
                            <p className="text-indigo-200 text-xs font-bold mb-6 italic opacity-80 leading-relaxed">Auto-payout protocol primed for {user.home_zone} disruption sensor hits.</p>
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm space-y-3">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="opacity-70 italic tracking-tighter">Weekly Premium</span>
                                    <span>₹{data.activeCoverage.premium_paid || 35}</span>
                                </div>
                                <div className="h-[1px] bg-white/10 w-full opacity-30"></div>
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <div className="space-y-0.5">
                                        <span className="opacity-70 block italic tracking-tighter">Est. Recovery Payout</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Severity Dependent</span>
                                    </div>
                                    <span className="text-sm font-black">₹180 – ₹500</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-rose-500 p-7 rounded-3xl text-white shadow-2xl shadow-rose-200 relative overflow-hidden group border border-rose-400/30">
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-400/20 via-transparent to-transparent"></div>
                         <ShieldAlert className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-1000" />
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-xs font-black text-rose-100 uppercase tracking-widest">Insurance Status</h3>
                                 <div className="flex items-center bg-white/10 px-2 py-1 rounded-full border border-white/20">
                                    <div className="h-1.5 w-1.5 bg-rose-200 rounded-full mr-2"></div>
                                    <span className="text-[8px] font-black uppercase text-rose-50">Suspended</span>
                                 </div>
                            </div>
                            <div className="text-3xl font-black font-outfit mb-1 tracking-tighter">UNPROTECTED</div>
                            <p className="text-rose-100 text-[10px] font-bold mb-6 italic opacity-90 leading-normal">Wait! Disruption signals are {intelligence.level === 'CRITICAL' ? 'CRITICAL' : 'active'} in your zone. Your income is at risk.</p>
                            
                            <button 
                                onClick={handlePurchase}
                                className="w-full bg-white text-rose-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-900/10 hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center group/purchase"
                            >
                                <CreditCard className="w-4 h-4 mr-3 group-hover/purchase:rotate-12 transition-transform" />
                                BUY COVERAGE · ₹{data.currentPremiumQuote || 35}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 🤖 Pipeline Visualization Column */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full min-h-[500px]">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center">
                        <BrainCircuit className="w-5 h-5 mr-3 text-indigo-600" /> 
                        Live Claim Pipeline
                    </h3>

                    {isSimulating ? (
                        <LiveClaimPipeline user={user} onComplete={() => setIsSimulating(false)} />
                    ) : latestClaim ? (
                        <div className="space-y-10 py-4 relative">
                            {/* Background Line */}
                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-50"></div>
                            <div className="absolute left-[19px] top-4 w-0.5 bg-indigo-500 transition-all duration-1000" style={{ height: `${(currentStepIndex / (Math.max(PIPELINE_STEPS.length - 1, 1))) * 100}%` }}></div>

                            {PIPELINE_STEPS.map((step, idx) => {
                                const realStatus = latestClaim.claim_status || latestClaim.status;
                                const isFullySettled = realStatus === 'Paid' || realStatus === 'Approved';
                                const isCurrent = currentStepIndex === idx;
                                const isCompleted = idx < currentStepIndex || (idx === PIPELINE_STEPS.length - 1 && isFullySettled);
                                                    return (
                                    <div key={step.id} className={`flex items-center space-x-6 relative z-10 transition-all duration-500 ${isCurrent ? 'scale-105' : ''} ${!isCurrent && !isCompleted ? 'opacity-40 filter grayscale' : ''}`}>
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                            isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
                                            isCurrent && realStatus === 'Rejected' ? 'bg-rose-500 border-rose-500 text-white animate-critical-shake' :
                                            isCurrent ? 'bg-white border-indigo-500 text-indigo-500 animate-pulse ring-4 ring-indigo-50' : 
                                            'bg-white border-slate-200 text-slate-400'
                                        }`}>
                                            {isCompleted ? <CheckCircle2 className="w-5 h-5"/> : isCurrent && realStatus === 'Rejected' ? <ShieldAlert className="w-5 h-5"/> : step.icon}
                                        </div>
                                        <div className={`flex-1 ${realStatus === 'Rejected' && isCurrent ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50 border-slate-50'} p-4 rounded-2xl border flex justify-between items-center hover:bg-white hover:shadow-md transition-all duration-300`}>
                                            <div>
                                                {latestClaim ? (
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                                                        isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                        isCurrent && realStatus === 'Rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' : 
                                                        isCurrent ? 'bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse' :
                                                        'bg-slate-100 text-slate-400 border-slate-200'
                                                    }`}>
                                                        {isCompleted ? 'ACCEPTED' : 
                                                         (isCurrent && realStatus === 'Rejected') ? `REJECTED — ${latestClaim.failed_stage || 'AUDIT'}` :
                                                         (isCurrent) ? 'PROCESSING' : 'PENDING'}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-slate-300 uppercase tracking-tighter">Monitoring</span>
                                                )}
                                                <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                                                    {isCurrent && realStatus === 'Rejected' ? (
                                                        <span className="text-rose-600 italic">"{latestClaim.rejection_reason}"</span>
                                                    ) : (
                                                        <>
                                                            {idx === 0 && 'Anomalous disruption signal detected by AI sensors'}
                                                            {idx === 1 && 'Validation of active policy and worker activity'}
                                                            {idx === 2 && 'GPS telemetry cross-check with affected zone'}
                                                            {idx === 3 && 'Instant UPI transfer initiation via Razorpay'}
                                                            {idx === 4 && 'Settlement record pushed to distributed ledger'}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {isCurrent && (
                                                <div className="flex space-x-1">
                                                    <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                                    <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                    <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6 group">
                            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200 group-hover:scale-110 transition-transform duration-700">
                                <ShieldCheck className="w-10 h-10 text-slate-200" />
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-800 font-outfit uppercase tracking-tighter">Pipeline Strategy: Active</h4>
                                <p className="text-slate-400 text-sm font-bold max-w-xs mx-auto">Sensors are live and monitoring. Automated zero-touch claims will trigger upon zone disruption.</p>
                            </div>
                            <div className="flex items-center space-x-2 text-indigo-500 font-black text-[10px] tracking-widest uppercase bg-indigo-50 px-4 py-2 rounded-full shadow-sm">
                                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                <span>All Systems Nominal</span>
                            </div>
                        </div>
                    )
                    }
                </div>
            </div>
        </div>
    );
}
