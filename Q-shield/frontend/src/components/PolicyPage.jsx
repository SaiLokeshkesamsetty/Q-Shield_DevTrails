import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, CloudRain, Wind, Car, Zap, Clock, Calendar, ArrowRight, DollarSign, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import { purchasePolicy, fetchDashboard } from '../api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import RazorpayModal from './RazorpayModal';
import LiveRadar from './radar/LiveRadar';

export default function PolicyPage({ user }) {
    const [activating, setActivating] = useState(false);
    const [showRazorpay, setShowRazorpay] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        try {
            const data = await fetchDashboard(user.worker_id);
            setDashboardData(data);
        } catch (e) {
            console.error('Failed to load dashboard', e);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchaseFinalize = async () => {
        setShowRazorpay(false);
        setActivating(true);
        const tid = toast.loading('Syncing with Insurance Core...');
        try {
            await purchasePolicy(user.worker_id, 50);
            await loadData(); // Reload stats and policy
            toast.success('Policy successfully activated!', { id: tid });
        } catch (e) {
            toast.error('Failed to activate policy.', { id: tid });
        } finally {
            setActivating(false);
        }
    };

    if (loading || !dashboardData) {
        return <div className="p-20 text-center font-black animate-pulse text-indigo-500 uppercase tracking-[20px]">SYNCING_HUB...</div>;
    }

    const { activeCoverage, claimsHistory, currentPremiumQuote, liveRiskLevel } = dashboardData;
    const isPurchased = !!activeCoverage;
    const isExpired = isPurchased && activeCoverage.status === 'Expired';
    const isActive = isPurchased && activeCoverage.status === 'Active';

    // Dates
    let startDate = null;
    let endDate = null;
    let daysTotal = 7;
    let daysElapsed = 0;
    let daysRemaining = 0;
    let progressPercent = 0;
    let isExpiringSoon = false;

    if (isPurchased) {
        // Fallback for legacy DB entries from previous sessions
        startDate = activeCoverage.start_date ? new Date(activeCoverage.start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        endDate = activeCoverage.end_date ? new Date(activeCoverage.end_date) : new Date();
        const now = new Date();
        
        daysTotal = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        daysElapsed = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
        
        progressPercent = Math.min(100, Math.max(0, (daysElapsed / daysTotal) * 100));
        isExpiringSoon = isActive && daysRemaining <= 3;
    }

    // Earnings
    const paidClaims = claimsHistory ? claimsHistory.filter(c => c.claim_status === 'Paid') : [];
    const totalPayout = paidClaims.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const avgPayout = paidClaims.length > 0 ? Math.round(totalPayout / paidClaims.length) : 0;
    const successRate = claimsHistory && claimsHistory.length > 0 ? Math.round((paidClaims.length / claimsHistory.length) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto px-4 py-12 animate-in slide-in-from-bottom-8 duration-700 font-sans">
            <RazorpayModal 
                isOpen={showRazorpay} 
                onClose={() => setShowRazorpay(false)} 
                onConfirm={handlePurchaseFinalize}
                amount={50}
            />

            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
                <div>
                    <h1 className="text-5xl font-black font-outfit text-gray-900 tracking-tighter mb-2 italic">Policy Hub</h1>
                    <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Intelligent Parametric Management Console</p>
                </div>
                {isPurchased && (
                    <div className="mt-4 md:mt-0 flex items-center bg-white border border-gray-100 rounded-full px-4 py-2 shadow-sm">
                        <Activity className="w-4 h-4 text-indigo-500 mr-2" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-600">ID: {activeCoverage.policy_id.substr(0, 8)}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Policy Summary & Lifecycle Module */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary Card */}
                    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                        <ShieldCheck className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                            <div>
                                <h2 className="text-sm font-black text-indigo-200 uppercase tracking-[0.3em] mb-4">Coverage Status</h2>
                                <div className="flex items-center space-x-4">
                                    {isActive ? (
                                        <div className={`px-4 py-2 rounded-xl text-sm font-black tracking-widest uppercase flex items-center shadow-lg ${isExpiringSoon ? 'bg-amber-500 text-amber-950 shadow-amber-500/20' : 'bg-emerald-500 text-emerald-950 shadow-emerald-500/20'}`}>
                                            {isExpiringSoon ? <Clock className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                            {isExpiringSoon ? `Expiring Soon (${daysRemaining} Days)` : 'Active Cover'}
                                        </div>
                                    ) : isExpired ? (
                                        <div className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm font-black tracking-widest uppercase flex items-center">
                                            <ShieldAlert className="w-4 h-4 mr-2" /> Expired
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 rounded-xl bg-slate-500/20 border border-slate-500/30 text-slate-300 text-sm font-black tracking-widest uppercase flex items-center">
                                            <AlertTriangle className="w-4 h-4 mr-2" /> No Cover
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="text-right bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/10 w-full md:w-auto">
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-200 block mb-1">Weekly Premium</span>
                                <div className="text-4xl font-black font-outfit drop-shadow-md">₹50</div>
                                <div className="text-[9px] text-indigo-300 uppercase tracking-widest mt-2">{`₹30 BASE + ₹20 RISK`}</div>
                            </div>
                        </div>

                        {/* Lifecycle Tracker */}
                        {isPurchased && (
                            <div className="bg-black/20 rounded-3xl p-6 backdrop-blur-sm border border-white/5 relative z-10 w-full">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-4">
                                    <span className="text-indigo-200 flex items-center"><Calendar className="w-4 h-4 mr-2"/> Start: {startDate.toLocaleDateString()}</span>
                                    <span className={isExpired ? 'text-rose-400' : 'text-indigo-200'}>End: {endDate.toLocaleDateString()}</span>
                                </div>
                                
                                <div className="w-full h-3 bg-indigo-950 rounded-full overflow-hidden mb-4 shadow-inner relative flex">
                                    <div 
                                        className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out ${isExpired ? 'bg-rose-500' : isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-indigo-300">
                                    <span>{daysElapsed} Days Protected</span>
                                    <span>{daysRemaining} Days Remaining</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Earnings & Benefits Tracker */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform"><DollarSign className="w-24 h-24" /></div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Total Earnings</h3>
                            <div className="text-5xl font-black font-outfit text-slate-800 mb-2">₹{totalPayout}</div>
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Across {paidClaims.length} Claims</p>
                            
                            <div className="mt-8 bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Average Payout</span>
                                <span className="text-sm font-black text-slate-700">₹{avgPayout} <span className="text-slate-400 text-[10px]">/ EVENT</span></span>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform"><Activity className="w-24 h-24" /></div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Policy Usage</h3>
                            <div className="text-5xl font-black font-outfit text-slate-800 mb-2">{claimsHistory?.length || 0}</div>
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Total Triggers Logged</p>
                            
                            <div className="mt-8 bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pipeline Success Rate</span>
                                <span className="text-sm font-black text-indigo-600">{successRate}% <span className="text-slate-400 text-[10px]">VERIFIED</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Coverage Intelligence & Renewals */}
                <div className="space-y-6">
                    {/* Action Card */}
                    <div className={`p-8 rounded-[2rem] border shadow-lg transition-all ${(!isActive || isExpiringSoon) ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20' : 'bg-white text-slate-800 border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                        {(!isPurchased || isExpired) ? (
                            <>
                                <h3 className="text-xl font-black mb-2">{isExpired ? 'Protection Lapsed' : 'Protect Your Income'}</h3>
                                <p className="text-sm font-medium mb-8 opacity-80">{isExpired ? '⚠️ Policy Expired — Renew to stay protected from zone disruptions.' : 'AI-driven coverage against delays, weather, and traffic.'}</p>
                                <button 
                                    onClick={() => setShowRazorpay(true)}
                                    disabled={activating}
                                    className="w-full bg-slate-900 text-white hover:bg-slate-800 font-black py-4 px-6 rounded-2xl transition-all shadow-xl active:scale-95 text-xs tracking-widest uppercase flex justify-center items-center"
                                >
                                    {activating ? 'Processing...' : '💳 Renew Policy Now'}
                                </button>
                            </>
                        ) : isExpiringSoon ? (
                            <>
                                <h3 className="text-xl font-black mb-2 text-white">⚡ Expiring Soon</h3>
                                <p className="text-sm font-medium mb-8 text-indigo-100">Your coverage ends in {daysRemaining} days. Renew now to avoid losing protection.</p>
                                <button 
                                    onClick={() => setShowRazorpay(true)}
                                    disabled={activating}
                                    className="w-full bg-amber-400 text-amber-950 hover:bg-amber-300 font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-amber-400/20 active:scale-95 text-xs tracking-widest uppercase flex justify-center items-center"
                                >
                                    {activating ? 'Processing...' : '⚡ Advance Renewal'}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-black mb-2">Coverage is Secure</h3>
                                <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">Your policy is active and autonomously monitoring for disruption parameters.</p>
                            </>
                        )}
                    </div>

                    {/* Coverage Intelligence */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Coverage Intelligence</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all group">
                                <div className="flex items-center">
                                    <CloudRain className="w-5 h-5 text-indigo-500 mr-4" />
                                    <div>
                                        <div className="font-black text-sm text-slate-700">Extreme Rain</div>
                                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Severity: &gt;50mm/hr</div>
                                    </div>
                                </div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full group-hover:scale-105 transition-all">HIGH RISK</div>
                            </li>
                            <li className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all group">
                                <div className="flex items-center">
                                    <Wind className="w-5 h-5 text-orange-500 mr-4" />
                                    <div>
                                        <div className="font-black text-sm text-slate-700">AQI Hazard</div>
                                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Severity: &gt;300 Index</div>
                                    </div>
                                </div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-3 py-1 rounded-full group-hover:scale-105 transition-all">MED RISK</div>
                            </li>
                            <li className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-5"><Car className="w-16 h-16" /></div>
                                <div className="flex items-center relative z-10">
                                    <div className="relative">
                                        <Car className="w-5 h-5 text-emerald-500 mr-4" />
                                        <div className="absolute top-0 right-3 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white animate-ping"></div>
                                        <div className="absolute top-0 right-3 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white"></div>
                                    </div>
                                    <div>
                                        <div className="font-black text-sm text-slate-700">Live Traffic Gridlock <span className="text-[9px] uppercase text-emerald-500 ml-1">Powered by TomTom</span></div>
                                        <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mt-1">Status: Active Monitoring</div>
                                    </div>
                                </div>
                                <div className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-500/20 group-hover:scale-105 transition-all relative z-10 flex items-center">
                                    <div className="w-1 h-1 bg-emerald-500 rounded-full mr-1.5 shadow-[0_0_5px_#10b981]"></div>
                                    LIVE API
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Live Radar Integration in Policy Hub */}
                    <div className="h-64 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative max-w-full">
                        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/20 to-transparent z-[1000] pointer-events-none"></div>
                        <LiveRadar center={[17.3850, 78.4867]} zoom={11} title="Policy Zone Coverage" riskLevel={liveRiskLevel} />
                    </div>
                </div>
            </div>
        </div>
    );
}
