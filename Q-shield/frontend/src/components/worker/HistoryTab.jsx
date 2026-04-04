import React from 'react';
import { DollarSign, Clock, CheckCircle2, ShieldCheck, RefreshCw, ShieldAlert } from 'lucide-react';

export default function HistoryTab({ data, refresh }) {
    const allEvents = (data.claimsHistory || []).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <div 
            className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[600px] flex flex-col animate-in fade-in duration-500"
        >
            <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center">
                      <Clock className="w-6 h-6 mr-3 text-slate-400" /> Virtual Settlement Ledger
                   </h3>
                   <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest italic opacity-70">Unified Claims Telemetry (Last 24 Events)</p>
                </div>
                <div className="flex space-x-3">
                   <button 
                      onClick={refresh}
                      className="bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-200 transition-all active:scale-90"
                   >
                      <RefreshCw className="w-5 h-5 text-slate-500" />
                   </button>
                   <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">ledger synced</span>
                   </div>
                </div>
            </div>

            {allEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {allEvents.slice(0, 12).map((p, i) => {
                        const isSettled = p.claim_status === 'Paid' || p.claim_status === 'Approved';
                        const isRejected = p.claim_status === 'Rejected';
                        return (
                            <div key={i} className="group bg-slate-50/50 p-7 rounded-[2rem] border border-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-2xl transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3 rounded-2xl text-white shadow-lg ${isSettled ? 'bg-indigo-600 shadow-indigo-200' : isRejected ? 'bg-rose-500 shadow-rose-200' : 'bg-amber-500 shadow-amber-200'}`}>
                                    {isSettled ? <DollarSign className="w-5 h-5"/> : <ShieldCheck className="w-5 h-5"/>}
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                                    isSettled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                    isRejected ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                                }`}>
                                    {isSettled ? 'Settled (Accepted)' : isRejected ? `Rejected (${p.failed_stage || 'Validation'})` : p.claim_status || 'Pending'}
                                </span>
                            </div>
                            {isRejected && (
                                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl relative overflow-hidden group-hover:bg-white transition-colors duration-500">
                                    <div className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1 italic">Audit Failure Detail</div>
                                    <p className="text-[10px] font-bold text-slate-600 leading-tight italic">"{p.rejection_reason || 'Disruption thresholds not met'}"</p>
                                </div>
                            )}
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60 flex items-center">
                                {isRejected ? <ShieldAlert className="w-3 h-3 mr-1 text-rose-400" /> : <Clock className="w-3 h-3 mr-1 text-indigo-400" />}
                                {p.calculation_metadata?.reason || p.trigger_type || 'Nexus Core Disruption'}
                            </div>
                            <div className="text-4xl font-black font-outfit text-slate-900 tracking-tight italic">₹{p.amount || '0'}</div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                    <span className="uppercase tracking-widest opacity-60">Session Code</span>
                                    <span className="text-slate-800 font-black">{p.claim_id?.slice(0, 8) || 'RZ-NEXUS'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                    <span className="uppercase tracking-widest opacity-60">Timestamp</span>
                                    <span className="text-slate-800 font-black">{new Date(p.created_at || p.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-40">
                    <ShieldCheck className="w-20 h-20 text-slate-200" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No recorded telemetry for this cycle</p>
                </div>
            )}
        </div>
    );
}
