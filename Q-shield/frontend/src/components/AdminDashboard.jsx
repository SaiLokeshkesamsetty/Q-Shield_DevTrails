import React, { useState, useEffect } from 'react';
import { fetchAdminAnalytics, getRisk, simulateRainTrigger } from '../api';
import { 
    Activity, MapPin, Zap, TrendingUp, ShieldAlert, BrainCircuit, 
    CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, BarChart3, 
    Clock, Loader2, ShieldCheck, Users, LayoutDashboard, 
    History, BadgeInfo, Sparkles, User, Target, ArrowRight
} from 'lucide-react';
const RadarPortal = React.lazy(() => import('./radar/RadarPortal'));
import WorkerDetailsModal from './admin/WorkerDetailsModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [globalRisk, setGlobalRisk] = useState('LOW');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'events'
  const [telemetry, setTelemetry] = useState({ aqi: 42, rainfall: 0, temperature: 32 });
  const [simulating, setSimulating] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);

  const loadAdmin = async () => {
     try {
         const data = await fetchAdminAnalytics();
         setStats(data);
         const riskData = await getRisk();
         setGlobalRisk(riskData.risk || 'LOW');
         if (riskData.raw) {
             setTelemetry({
                 aqi: riskData.raw.aqi,
                 rainfall: riskData.raw.rain || 0,
                 temperature: riskData.raw.temp,
                 zone: riskData.raw.zone
             });
         }
     } catch(e) { console.error(e); }
  };

  useEffect(() => {
     loadAdmin();
     const interval = setInterval(loadAdmin, 5000);
     return () => clearInterval(interval);
  }, []);

  const handleSimulate = async (type = 'RAIN', label = 'Anomalous Event') => {
      setSimulating(true);
      const tId = toast.loading(`Simulating ${label}...`);
      try {
          const targetZone = stats.workers?.length > 0 ? stats.workers[0].home_zone : 'Hyderabad';
          await simulateRainTrigger(type, targetZone); 
          toast.success(`⚡ ${label} signal pushed to ${targetZone}`, { id: tId, style: { background: '#1e1b4b', color: '#fff' } });
          loadAdmin();
      } catch(error) {
          toast.error('Simulation failed', { id: tId });
      } finally {
          setSimulating(false);
      }
  };

  if(!stats) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-indigo-600">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
            <Zap className="w-16 h-16 relative z-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-black font-outfit uppercase tracking-widest">Synchronizing AI Core</h2>
        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-80">Fetching Neural Analytics & Risk Telemetry...</p>
    </div>
  );

  const chartData = {
    labels: ['10AM', '11AM', '12PM', '1PM', '2PM', '3PM', 'NOW'],
    datasets: [
      {
        label: 'Claim Payouts (₹)',
        data: stats.payoutVelocity || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: ['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', '#ec4899'],
        pointBorderColor: ['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', '#fff'],
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 12,
      }
    },
    scales: {
      y: { display: false, min: 0 },
      x: { 
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { weight: 'bold', size: 10 } }
      }
    }
  };

  const renderMetric = (label, value, icon, color, subValue) => (
    <div key={label} className={`bg-white/90 p-6 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(${color},0.15)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden backdrop-blur-md`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${color.includes('99') ? 'indigo' : color.includes('168') ? 'purple' : 'emerald'}-50 rounded-full blur-2xl group-hover:bg-${color.includes('99') ? 'indigo' : color.includes('168') ? 'purple' : 'emerald'}-100 transition-colors`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`bg-slate-50 p-3 rounded-2xl text-slate-600 group-hover:scale-110 transition-transform`}>{icon}</div>
        {subValue && <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center">{subValue}</span>}
      </div>
      <div className="relative z-10">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-3xl font-black font-outfit text-slate-800">{value}</h4>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 animate-in fade-in duration-700">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
              <div className="space-y-1">
                  <div className="flex items-center space-x-3 mb-1">
                      <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
                          <BrainCircuit className="text-white w-6 h-6" />
                      </div>
                      <h1 className="text-4xl font-black font-outfit text-slate-900 tracking-tight tracking-tighter uppercase">Admin Console</h1>
                  </div>
                  <p className="text-slate-500 font-bold ml-11 text-[10px] uppercase tracking-[0.2em] italic opacity-80">Actuarial Oversight & Global Risk Telemetry</p>
              </div>
              <div className="flex space-x-3 items-center">
                   <button onClick={loadAdmin} className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-2xl shadow-sm flex items-center font-bold text-sm transition-all hover:bg-slate-50 mr-2">
                       <RefreshCw className="w-4 h-4" />
                   </button>
                   <button onClick={handleSimulate} disabled={simulating} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-lg shadow-slate-900/20 flex items-center font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 group">
                       <Zap className={`w-4 h-4 mr-2 text-yellow-400 group-hover:animate-pulse ${simulating ? 'animate-spin' : ''}`} />
                       {simulating ? 'Processing...' : 'Run Simulation'}
                   </button>
               </div>
           </div>

           {/* 📑 TAB NAVIGATION */}
           <div className="flex space-x-2 mb-10 bg-white p-2 rounded-[1.8rem] w-fit shadow-lg shadow-slate-200/50 border border-slate-100">
                <button 
                    onClick={() => setActiveTab('overview')} 
                    className={`flex items-center space-x-3 px-8 py-3.5 rounded-[1.3rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard Overview</span>
                </button>
                <button 
                    onClick={() => setActiveTab('users')} 
                    className={`flex items-center space-x-3 px-8 py-3.5 rounded-[1.3rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                    <Users className="w-4 h-4" />
                    <span>Users Management</span>
                </button>
                <button 
                    onClick={() => setActiveTab('events')} 
                    className={`flex items-center space-x-3 px-8 py-3.5 rounded-[1.3rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${activeTab === 'events' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                    <History className="w-4 h-4" />
                    <span>Live Event Horizon</span>
                </button>
           </div>

           {/* 🖼️ TAB CONTENT */}
           <div className="min-h-[600px]">
               {activeTab === 'overview' && (
                   <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {renderMetric('Total Policies', stats.activePolicies || 0, <ShieldCheck className="w-5 h-5"/>, '99,102,241')}
                            {renderMetric('Workers', stats.totalWorkers || 0, <Users className="w-5 h-5"/>, '56,189,248')}
                            {renderMetric('Premiums (₹)', `₹${stats.totalPremiums?.toLocaleString() || 0}`, <TrendingUp className="w-5 h-5"/>, '168,85,247')}
                            {renderMetric('Payouts (₹)', `₹${stats.totalPayouts?.toLocaleString() || 0}`, <TrendingUp className="w-5 h-5"/>, '239,68,68')}
                            {renderMetric('BCR', (stats.bcr || 0).toFixed(2), <Activity className="w-5 h-5"/>, stats.bcr > 0.8 ? '239,68,68' : stats.bcr > 0.5 ? '251,146,60' : '16,185,129', 'Claim Freq')}
                            {renderMetric('Loss Ratio', `${((stats.lossRatio || 0) * 100).toFixed(1)}%`, <BarChart3 className="w-5 h-5"/>, stats.lossRatio > 0.8 ? '239,68,68' : stats.lossRatio > 0.6 ? '251,146,60' : '16,185,129', 'Payout/Prem')}
                        </div>

                        {/* Rejection Analysis */}
                        <div>
                            <div className="flex items-center space-x-3 mb-6">
                                <ShieldAlert className="text-rose-600 w-5 h-5" />
                                <h2 className="text-xl font-black font-outfit text-slate-800 uppercase tracking-tighter">Engine Integrity & Rejection Analysis</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-3xl border-2 border-slate-50 border-l-rose-500 shadow-sm relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-2 opacity-5"><ShieldAlert className="w-12 h-12" /></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Rejections</p>
                                    <h4 className="text-3xl font-black text-rose-600">{stats.rejectionStats?.total || 0}</h4>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Threshold Failures</p>
                                    <h4 className="text-2xl font-black text-slate-800">{stats.rejectionStats?.threshold || 0}</h4>
                                    <div className="w-full bg-slate-50 h-1 rounded-full mt-3 overflow-hidden">
                                        <div className="bg-rose-400 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (stats.rejectionStats?.threshold / (stats.rejectionStats?.total || 1)) * 100)}%` }}></div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Eligibility Mismatch</p>
                                    <h4 className="text-2xl font-black text-slate-800">{stats.rejectionStats?.eligibility || 0}</h4>
                                    <div className="w-full bg-slate-50 h-1 rounded-full mt-3 overflow-hidden">
                                        <div className="bg-amber-400 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (stats.rejectionStats?.eligibility / (stats.rejectionStats?.total || 1)) * 100)}%` }}></div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fraud Proximity Audit</p>
                                    <h4 className="text-2xl font-black text-slate-800">{stats.rejectionStats?.fraud || 0}</h4>
                                    <div className="w-full bg-slate-50 h-1 rounded-full mt-3 overflow-hidden">
                                        <div className="bg-indigo-400 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (stats.rejectionStats?.fraud / (stats.rejectionStats?.total || 1)) * 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Velocity & Situation Room */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-xl font-black font-outfit text-slate-800 tracking-tighter uppercase">Payout Velocity Matrix</h2>
                                    </div>
                                    <div className="w-full h-[320px]">
                                        <Line data={chartData} options={chartOptions} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-indigo-900 text-white p-7 rounded-[2rem] relative overflow-hidden group shadow-xl shadow-indigo-200">
                                        <Zap className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 group-hover:scale-125 transition-transform duration-1000" />
                                        <h3 className="text-lg font-black font-outfit mb-2 uppercase tracking-tighter">Automated Underwriting</h3>
                                        <p className="text-indigo-200 text-[11px] font-bold leading-relaxed opacity-80 italic">Active days {'>'} 7, Location Radius 5km verified via dynamic acts on Supabase GPS telemetry stream.</p>
                                    </div>
                                    <div className="bg-white border-2 border-slate-50 p-7 rounded-[2rem] shadow-sm relative overflow-hidden">
                                        <div className="absolute right-0 top-0 p-4 opacity-5"><BrainCircuit className="w-16 h-16"/></div>
                                        <h3 className="text-lg font-black font-outfit text-slate-800 mb-4 flex items-center tracking-tighter uppercase">
                                            <BrainCircuit className="w-4 h-4 mr-2 text-indigo-500" /> ML Analytics Core
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <span>Model Confidence (GPS+Time)</span>
                                                    <span className="text-emerald-500">98.4%</span>
                                                </div>
                                                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-emerald-500 h-full w-[98%] transition-all"></div>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ensemble Baseline</span>
                                                <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border border-indigo-100">Live Active</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-full flex flex-col items-stretch space-y-8">
                                {/* 🎮 Simulation Command Deck */}
                                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                                     <div className="absolute right-0 top-0 bg-indigo-500/5 p-12 rounded-full -translate-y-8 translate-x-8"></div>
                                     <div className="flex items-center space-x-3 mb-8">
                                         <Zap className="w-5 h-5 text-indigo-600" />
                                         <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Scenario Command Deck</h3>
                                     </div>
                                     <div className="space-y-4">
                                         <button 
                                            onClick={() => handleSimulate('RAIN', 'Monsoon Crisis')}
                                            className="w-full group/s p-5 rounded-2xl border border-slate-50 hover:border-sky-200 hover:bg-sky-50 transition-all flex flex-col items-start text-left bg-slate-50/50"
                                         >
                                             <div className="flex justify-between w-full mb-1">
                                                 <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Scenario Alpha</span>
                                                 <CloudRain className="w-4 h-4 text-sky-400 group-hover/s:animate-bounce" />
                                             </div>
                                             <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">Monsoon Crisis</span>
                                             <p className="text-[9px] font-bold text-slate-400 mt-1 italic uppercase">Heavy Rain + Flood Alert</p>
                                         </button>

                                         <button 
                                            onClick={() => handleSimulate('AQI', 'Pollution Surge')}
                                            className="w-full group/s p-5 rounded-2xl border border-slate-50 hover:border-rose-200 hover:bg-rose-50 transition-all flex flex-col items-start text-left bg-slate-50/50"
                                         >
                                             <div className="flex justify-between w-full mb-1">
                                                 <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Scenario Beta</span>
                                                 <Wind className="w-4 h-4 text-rose-400 group-hover/s:animate-pulse" />
                                             </div>
                                             <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">Toxic Smog Surge</span>
                                             <p className="text-[9px] font-bold text-slate-400 mt-1 italic uppercase">Critical AQI (450+) + Low Visibility</p>
                                         </button>

                                         <button 
                                            onClick={() => handleSimulate('TRAFFIC', 'Black Swan')}
                                            className="w-full group/s p-5 rounded-2xl border border-slate-50 hover:border-amber-200 hover:bg-amber-50 transition-all flex flex-col items-start text-left bg-slate-50/50"
                                         >
                                             <div className="flex justify-between w-full mb-1">
                                                 <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Scenario Delta</span>
                                                 <AlertTriangle className="w-4 h-4 text-amber-500 group-hover/s:animate-ping" />
                                             </div>
                                             <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">Black Swan Event</span>
                                             <p className="text-[9px] font-bold text-slate-400 mt-1 italic uppercase">Extreme Traffic + Multi-Zone Gridlock</p>
                                         </button>
                                     </div>
                                </div>

                                <div className="h-full flex-shrink-0 animate-in fade-in zoom-in duration-1000">
                                    <React.Suspense fallback={<div className="h-full w-full glass-dark animate-pulse rounded-[3rem]"></div>}>
                                        <RadarPortal 
                                            title="Situation Room" 
                                            intelligence={{
                                                level: globalRisk,
                                                alerts: stats.triggers?.filter(t => (Date.now() - new Date(t.recorded_timestamp)) < 3600000).map(t => `DISRUPTION: ${t.event_type} in ${t.zone}`) || [],
                                                diagnostics: { syncStatus: 'Live', aqiStatus: 'Nominal', rainStatus: 'Monitoring' }
                                            }}
                                            data={{
                                                aqi: telemetry.aqi,
                                                rainfall: telemetry.rainfall || 0,
                                                temperature: telemetry.temperature,
                                                zone: telemetry.zone || 'Global'
                                            }}
                                        />
                                    </React.Suspense>
                                </div>
                            </div>
                        </div>
                   </div>
               )}

               {activeTab === 'users' && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col min-h-[600px]">
                            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black font-outfit text-slate-800 flex items-center tracking-tighter uppercase">
                                            <Users className="w-8 h-8 mr-4 text-indigo-500" /> Users Management Core
                                        </h2>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Identity Matrix & Actuarial Governance Panel</p>
                                    </div>
                                    <div className="text-[11px] bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 border border-indigo-400/20 flex items-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full mr-3 animate-pulse"></div>
                                        {stats.totalWorkers || 0} Entities Registered
                                    </div>
                                </div>
                                <div className="mt-8 flex items-start space-x-4 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm italic">
                                    <BadgeInfo className="w-5 h-5 text-indigo-500 mt-0.5" />
                                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                                        Select an identity to access deep-climate telemetry and commit actuarial premium overrides.
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse sticky-header">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                                            <th className="px-10 py-6">Entity / Identity</th>
                                            <th className="px-10 py-6">Home Risk Zone</th>
                                            <th className="px-10 py-6 text-center">Engine Mode</th>
                                            <th className="px-10 py-6 text-center">Risk Tier</th>
                                            <th className="px-10 py-6 text-center">Trust Index</th>
                                            <th className="px-10 py-6 text-center">Activation Log</th>
                                            <th className="px-10 py-6 text-center">Policy Manager</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {stats.workers && stats.workers.map(w => (
                                            <tr key={w.worker_id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-10 py-7">
                                                    <div className="flex items-center space-x-5">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
                                                            {w.name ? w.name[0] : '?'}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tighter">{w.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold lowercase opacity-80">{w.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-7 text-xs font-black text-slate-600 italic tracking-tight">
                                                    {w.home_zone}
                                                </td>
                                                <td className="px-10 py-7 text-center">
                                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100`}>LIVE</span>
                                                </td>
                                                <td className="px-10 py-7 text-center">
                                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border ${w.tier === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' : w.tier === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{w.tier || 'LOW'}</span>
                                                </td>
                                                <td className="px-10 py-7 text-center text-xs font-black text-slate-800">{w.trust_score || 100}</td>
                                                <td className="px-10 py-7 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-black text-sky-600 mb-1.5 tracking-tighter">{w.active_days_last_30 || 0} Active Days</span>
                                                        <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                                            <div className="bg-sky-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (w.active_days_last_30 || 1) * 3.33)}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-7 text-center">
                                                    <button 
                                                        onClick={() => setSelectedWorker(w)}
                                                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 hover:border-indigo-600 transition-all active:scale-95 flex items-center mx-auto"
                                                    >
                                                        Click Here <ArrowRight className="w-3 h-3 ml-2" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                   </div>
               )}

               {activeTab === 'events' && (
                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] min-h-[600px] overflow-hidden flex flex-col">
                            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black font-outfit text-slate-800 flex items-center tracking-tighter uppercase">
                                        <Activity className="w-8 h-8 mr-4 text-pink-500" /> Live Event Horizon
                                    </h2>
                                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Real-time Telemetry Trigger Archive</p>
                                </div>
                                <div className="flex items-center space-x-4 bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse appearance-none"></div>
                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Protocol Online</span>
                                </div>
                            </div>
                            <div className="flex-1 p-10 space-y-6 overflow-y-auto custom-scrollbar">
                                {stats.triggers?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {stats.triggers.map((t, i) => (
                                            <div key={i} className="group p-8 rounded-[2.5rem] border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50/50 transition-all duration-500 relative overflow-hidden">
                                                <div className="absolute -right-6 -bottom-6 opacity-0 group-hover:opacity-10 transition-opacity duration-700">
                                                    <Zap className="w-24 h-24 text-indigo-500" />
                                                </div>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className={`p-4 rounded-3xl transition-all duration-300 ${t.event_type.includes('FAIL') || t.event_type.includes('REJECTED') ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                                        {t.event_type.includes('FAIL') || t.event_type.includes('REJECTED') ? <ShieldAlert className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                                                    </div>
                                                    <span className={`text-[10px] border px-4 py-1.5 rounded-full font-black uppercase tracking-widest italic shadow-sm ${t.event_type.includes('FAIL') || t.event_type.includes('REJECTED') ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                                        {t.event_type.includes('FAIL') || t.event_type.includes('REJECTED') ? 'Rejected · Audit Fail' : 'Paid · Settlement Matrix'}
                                                    </span>
                                                </div>
                                                <div className="mb-8">
                                                    <h4 className="font-black text-lg text-slate-800 mb-2 uppercase tracking-tighter line-clamp-1">{t.event_type}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center italic">
                                                        <MapPin className="w-3.5 h-3.5 mr-2 text-rose-500" /> {t.zone}
                                                    </p>
                                                </div>
                                                <div className="pt-6 border-t border-slate-50 flex justify-between items-center text-[11px]">
                                                    <span className="font-black text-slate-400 uppercase tracking-tighter flex items-center">
                                                        <Clock className="w-4 h-4 mr-2" /> {new Date(t.recorded_timestamp).toLocaleTimeString()}
                                                    </span>
                                                    <span className="font-black text-slate-800 opacity-60 bg-slate-50 px-2 py-1 rounded-lg">{new Date(t.recorded_timestamp).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-96 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                        <History className="w-20 h-20 mb-6 opacity-20 animate-pulse" />
                                        <p className="font-black text-[10px] uppercase tracking-[0.3em] opacity-50">No events detected in current risk horizon</p>
                                    </div>
                                )}
                            </div>
                        </div>
                   </div>
               )}
           </div>
      </div>
      
      {/* 🚀 Interactive Weather & Underwriting Overrides */}
      {selectedWorker && <WorkerDetailsModal worker={selectedWorker} onClose={() => setSelectedWorker(null)} />}
      
    </div>
  );
}
