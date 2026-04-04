import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Zap, DollarSign, CloudRain, MapPin, CheckCircle2, Clock, Hourglass, CreditCard, ShieldAlert, BrainCircuit } from 'lucide-react';
import { fetchDashboard, simulateRainTrigger } from '../api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import LiveRadar from './LiveRadar';

const PIPELINE_STEPS = [
  { id: 'Triggered', label: 'Trigger', icon: <Zap className="w-4 h-4"/> },
  { id: 'Eligibility_Checking', label: 'Eligibility', icon: <ShieldCheck className="w-4 h-4"/> },
  { id: 'Fraud_Verifying', label: 'Fraud Check', icon: <ShieldAlert className="w-4 h-4"/> },
  { id: 'Transferring', label: 'Payout', icon: <CreditCard className="w-4 h-4"/> },
  { id: 'Completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4"/> }
];

export default function WorkerDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const loadData = async () => {
    if (!user) return;
    try {
       const dashboardData = await fetchDashboard(user.worker_id);
       setData(dashboardData);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Faster polling for demo "Realtime" feel
    return () => clearInterval(interval);
  }, [user]);

  const handleSimulateDisruption = async () => {
      setTriggering(true);
      const toastId = toast.loading('Simulating anomalous disruption...');
      try {
          await simulateRainTrigger('RAIN', user.home_zone || 'Hyderabad');
          toast.success('⚡ Anomalous spike detected! Processing Zero-Touch claim...', { id: toastId });
          loadData();
      } catch(e) {
          toast.error('Simulation failed', { id: toastId });
      } finally {
          setTriggering(false);
      }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-20 text-center">
      <div>
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Session Expired</h2>
        <p className="text-slate-500 font-medium mb-6">Please log in to access your dashboard.</p>
        <a href="/auth?mode=login" className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold inline-block hover:bg-indigo-700 transition-colors">Go to Login</a>
      </div>
    </div>
  );
  if (loading || !data) return <div className="p-12 text-center text-indigo-500 font-black animate-pulse uppercase tracking-widest">Waking Up AI Sensors...</div>;

  const latestClaim = data.claimsHistory && data.claimsHistory[0];
  const currentStepIndex = latestClaim ? PIPELINE_STEPS.findIndex(s => s.id === latestClaim.processing_step) : -1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* 🚀 Header Profile & Simulated Trigger */}
      <div className="bg-white/40 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-xl shadow-indigo-100/20 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:bg-white/60">
          <div className="flex items-center space-x-5">
            <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-200">
               {user?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight font-outfit">Hello, {user?.name?.split(' ')[0] || 'Worker'}!</h1>
              <p className="text-slate-500 font-medium flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-indigo-500"/> {user?.home_zone || 'Your Zone'} Pool • <span className="ml-2 text-indigo-600 font-bold uppercase tracking-tighter text-xs">Active Coverage</span>
              </p>
            </div>
          </div>
          <button onClick={handleSimulateDisruption} disabled={triggering} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-lg shadow-slate-900/20 flex items-center font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 group">
              <Zap className={`w-4 h-4 mr-2 text-yellow-400 group-hover:animate-pulse ${triggering ? 'animate-spin' : ''}`} />
              {triggering ? 'Processing...' : `Run Simulation (${user?.home_zone?.split(',')[0] || 'Zone'})`}
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📊 Live Statistics Column */}
        <div className="space-y-6">
           {/* Risk Meter */}
           <div className={`bg-white p-7 rounded-3xl border shadow-sm transition-all relative overflow-hidden group ${data.liveRiskLevel === 'HIGH' ? 'border-red-100 bg-red-50/30' : 'border-slate-50'}`}>
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Zone Telemetry</h3>
                  <CloudRain className={`w-5 h-5 ${data.liveRiskLevel === 'HIGH' ? 'text-red-500 animate-bounce' : 'text-slate-300'}`} />
              </div>
              <div className="space-y-4">
                  <div className="flex justify-between items-end">
                     <div>
                        <div className={`text-4xl font-black font-outfit ${data.liveRiskLevel === 'HIGH' ? 'text-rose-600' : 'text-slate-800'}`}>
                           {data.liveRiskLevel}
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">{data.riskReason || 'Optimal Conditions'}</p>
                     </div>
                     <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${data.liveRiskLevel === 'HIGH' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                        {data.liveRiskLevel === 'HIGH' ? 'Disruption Active' : 'Stable'}
                     </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                     <div className={`h-full transition-all duration-1000 ${data.liveRiskLevel === 'HIGH' ? 'w-full bg-red-500' : 'w-1/4 bg-slate-300'}`}></div>
                  </div>
              </div>
           </div>

           {/* Policy Details */}
           <div className="bg-indigo-600 p-7 rounded-3xl text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
              <ShieldCheck className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10">
                 <h3 className="text-xs font-black text-indigo-100 uppercase tracking-widest mb-6">Parametric Cover</h3>
                 <div className="text-3xl font-black font-outfit mb-1">PROTECTED</div>
                 <p className="text-indigo-200 text-xs font-bold mb-6 italic opacity-80">Zero-touch payouts enabled for {user.home_zone}</p>
                 <div className="bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                       <span className="opacity-70">Payout Headings</span>
                       <span>₹500 / Day</span>
                    </div>
                    <div className="h-[1px] bg-white/10 w-full"></div>
                    <div className="flex justify-between text-xs font-bold">
                       <span className="opacity-70">Weekly Premium</span>
                       <span>₹{data.currentPremiumQuote || 50}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Regional Weather Radar */}
           <div className="h-[280px] mt-6">
              <LiveRadar 
                title="Regional Radar" 
                center={user.latitude && user.longitude ? [user.latitude, user.longitude] : [17.3850, 78.4867]} 
                zoom={12} 
                showLegend={false}
              />
           </div>
        </div>

        {/* 🤖 Pipeline Visualization Column */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center">
                 <BrainCircuit className="w-5 h-5 mr-3 text-indigo-600" /> 
                 Live Claim Pipeline
              </h3>

              {latestClaim && latestClaim.processing_step !== 'Completed' && latestClaim.status !== 'Rejected' ? (
                 <div className="space-y-10 py-4 relative">
                    {/* Background Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-50"></div>
                    <div className={`absolute left-[19px] top-4 w-0.5 bg-indigo-500 transition-all duration-1000`} style={{ height: `${(currentStepIndex / (PIPELINE_STEPS.length - 1)) * 100}%` }}></div>

                    {PIPELINE_STEPS.map((step, idx) => {
                       const isCurrent = currentStepIndex === idx;
                       const isCompleted = idx < currentStepIndex;
                       
                       return (
                          <div key={step.id} className={`flex items-center space-x-6 relative z-10 transition-all duration-500 ${isCurrent ? 'scale-105' : ''} ${!isCurrent && !isCompleted ? 'opacity-40 filter grayscale' : ''}`}>
                             <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isCompleted ? 'bg-indigo-500 border-indigo-500 text-white' : isCurrent ? 'bg-white border-indigo-500 text-indigo-500 animate-pulse ring-4 ring-indigo-50' : 'bg-white border-slate-200 text-slate-400'}`}>
                                {isCompleted ? <CheckCircle2 className="w-5 h-5"/> : step.icon}
                             </div>
                             <div className="flex-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-50 flex justify-between items-center group-hover:bg-slate-50 transition-colors">
                                <div>
                                   {latestClaim ? (
                                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                                         (latestClaim.claim_status || latestClaim.status) === 'Paid' || (latestClaim.claim_status || latestClaim.status) === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                         (latestClaim.claim_status || latestClaim.status) === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                                         'bg-indigo-50 text-indigo-700 border-indigo-100'
                                     }`}>
                                         {latestClaim.claim_status || latestClaim.status}
                                     </span>
                                   ) : (
                                     <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-slate-300 uppercase tracking-tighter">Monitoring</span>
                                   )}
                                   <div className="text-[10px] font-bold text-slate-500 mt-0.5">
                                      {idx === 0 && 'Anomalous disruption signal detected by CPCB'}
                                      {idx === 1 && 'Validation of active policy and 7-day activity'}
                                      {idx === 2 && 'GPS telemetry cross-check with affected zone'}
                                      {idx === 3 && 'Instant UPI transfer initiation via Razorpay'}
                                      {idx === 4 && 'Settlement record pushed to distributed ledger'}
                                   </div>
                                </div>
                                {isCurrent && (
                                   <div className="flex space-x-1">
                                      <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce delay-0"></div>
                                      <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                                      <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
                                   </div>
                                )}
                             </div>
                          </div>
                       );
                    })}
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                       <ShieldCheck className="w-10 h-10 text-slate-200" />
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-slate-800 font-outfit uppercase">Pipeline Idle</h4>
                       <p className="text-slate-400 text-sm font-bold max-w-xs mx-auto">Sensors are live and monitoring. Automated zero-touch claims will trigger upon zone disruption.</p>
                    </div>
                    <div className="flex items-center space-x-2 text-indigo-500 font-black text-[10px] tracking-widest uppercase bg-indigo-50 px-4 py-2 rounded-full">
                       <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                       <span>All Systems Nominal</span>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* 💼 Claims History Section */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
               <Clock className="w-5 h-5 mr-3 text-slate-400" /> Claim History
            </h3>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase italic">Showing last 24H</span>
         </div>

         {data.latestPayouts && data.latestPayouts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {data.latestPayouts.map((p, i) => (
                  <div key={i} className="group bg-slate-50 p-6 rounded-3xl border border-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all duration-500">
                     <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><DollarSign className="w-4 h-4"/></div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Settled</span>
                     </div>
                     <div className="text-sm font-bold text-slate-400 uppercase tracking-tighter mb-1">Auto-Payout</div>
                     <div className="text-3xl font-black font-outfit text-slate-900 tracking-tight">₹{p.amount || '0'}</div>
                     <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                        <span>Razorpay ID: RZ-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                        <span>{new Date(p.paid_at || p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="py-12 text-center text-slate-400 font-bold italic text-sm">No recorded disruptions in your zone recently.</div>
         )}
      </div>

    </div>
  );
}
