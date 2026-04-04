import React, { useState, useEffect } from 'react';
import { fetchAdminAnalytics, getRisk, simulateRainTrigger } from '../api';
import { Activity, MapPin, Zap, TrendingUp, ShieldAlert, BrainCircuit, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, BarChart3, Clock, Loader2, ShieldCheck, Users, Globe } from 'lucide-react';
const RadarPortal = React.lazy(() => import('./radar/RadarPortal'));
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
  const [telemetry, setTelemetry] = useState({ aqi: 42, rainfall: 0, temperature: 32 });
  const [simulating, setSimulating] = useState(false);

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

  const handleSimulate = async () => {
      setSimulating(true);
      const tId = toast.loading('Simulating anomalous event...');
      try {
          // Dynamic target: pick the first worker's zone to ensure the simulation is "Sync" visible
          const targetZone = stats.workers?.length > 0 ? stats.workers[0].home_zone : 'Hyderabad';
          await simulateRainTrigger('RAIN', targetZone); 
          toast.success(`⚡ Disruption signal pushed to ${targetZone}`, { id: tId, style: { background: '#1e1b4b', color: '#fff' } });
          loadAdmin();
      } catch(error) {
          toast.error('Simulation failed', { id: tId });
      } finally {
          setSimulating(false);
      }
  };

  if(!stats) return <div className="min-h-screen flex items-center justify-center text-indigo-500 font-bold animate-pulse"><Zap className="mr-2 animate-bounce"/> Initializing AI Core...</div>;

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
    <div key={label} className={`bg-white/80 p-6 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(${color},0.15)] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden backdrop-blur-xl`}>
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
          
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
              <div className="space-y-1">
                  <div className="flex items-center space-x-3 mb-1">
                      <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/20">
                          <BrainCircuit className="text-white w-6 h-6" />
                      </div>
                      <h1 className="text-4xl font-black font-outfit text-slate-900 tracking-tight">Admin Console</h1>
                  </div>
                  <p className="text-slate-500 font-medium ml-11">Parametric risk telemetry and actuarial engine oversight.</p>
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

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {renderMetric('Total Policies', stats.activePolicies || 0, <ShieldCheck className="w-5 h-5"/>, '99,102,241')}
              {renderMetric('Workers', stats.totalWorkers || 0, <Users className="w-5 h-5"/>, '56,189,248')}
              {renderMetric('Premiums (₹)', `₹${stats.totalPremiums?.toLocaleString() || 0}`, <TrendingUp className="w-5 h-5"/>, '168,85,247')}
              {renderMetric('Payouts (₹)', `₹${stats.totalPayouts?.toLocaleString() || 0}`, <TrendingUp className="w-5 h-5"/>, '239,68,68')}
              {renderMetric('BCR', (stats.bcr || 0).toFixed(2), <Activity className="w-5 h-5"/>, stats.bcr > 0.8 ? '239,68,68' : stats.bcr > 0.5 ? '251,146,60' : '16,185,129', 'Claim Freq')}
              {renderMetric('Loss Ratio', `${((stats.lossRatio || 0) * 100).toFixed(1)}%`, <BarChart3 className="w-5 h-5"/>, stats.lossRatio > 0.8 ? '239,68,68' : stats.lossRatio > 0.6 ? '251,146,60' : '16,185,129', 'Payout/Prem')}
          </div>

          <div className="mb-10">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                      <div className="flex justify-between items-center mb-8">
                          <h2 className="text-xl font-black font-outfit text-slate-800">Payout Velocity</h2>
                      </div>
                      <div className="w-full h-[320px]">
                          <Line data={chartData} options={chartOptions} />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-indigo-900 text-white p-6 rounded-3xl relative overflow-hidden group shadow-xl shadow-indigo-200">
                        <Zap className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 group-hover:scale-125 transition-transform duration-1000" />
                        <h3 className="text-lg font-black font-outfit mb-2">Automated Underwriting</h3>
                        <p className="text-indigo-200 text-[11px] font-bold leading-relaxed">Active days {'>'} 7, Location Radius 5km verified via Supabase GPS telemetry.</p>
                    </div>
                    <div className="bg-white border-2 border-slate-50 p-6 rounded-3xl shadow-sm">
                        <h3 className="text-lg font-black font-outfit text-slate-800 mb-2">Fraud Intelligence</h3>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-slate-500">GPS Confidence</span>
                              <span className="text-emerald-600">98.4%</span>
                           </div>
                           <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full w-[98%]"></div>
                           </div>
                        </div>
                    </div>
                  </div>
              </div>

              <div className="h-full flex flex-col items-stretch">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-[500px] flex flex-col">
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <h2 className="text-lg font-black font-outfit text-slate-800 flex items-center">
                              <Users className="w-5 h-5 mr-2 text-indigo-500" /> Registered Workers Sync
                          </h2>
                          <div className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                              {stats.totalWorkers || 0} Registered
                          </div>
                      </div>
                      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                          <table className="w-full text-left border-collapse sticky-header">
                              <thead>
                                  <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                      <th className="px-6 py-4">Worker Profile</th>
                                      <th className="px-6 py-4">Home Zone</th>
                                      <th className="px-6 py-4 text-center">Mode</th>
                                      <th className="px-6 py-4 text-center">Risk Tier</th>
                                      <th className="px-6 py-4 text-center">Trust Score</th>
                                      <th className="px-6 py-4 text-center">Active Days</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {stats.workers && stats.workers.map(w => (
                                      <tr key={w.worker_id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="px-6 py-4">
                                              <div className="font-bold text-slate-800 text-sm">{w.name}</div>
                                              <div className="text-[10px] text-slate-400 font-bold">{w.email}</div>
                                          </td>
                                          <td className="px-6 py-4 text-xs font-bold text-slate-600 italic">
                                              {w.home_zone}
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${w.mode === 'DEMO' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{w.mode || 'LIVE'}</span>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${w.tier === 'HIGH' ? 'bg-rose-100 text-rose-700' : w.tier === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{w.tier || 'LOW'}</span>
                                          </td>
                                          <td className="px-6 py-4 text-center text-xs font-black text-slate-700">{w.trust_score || 100}</td>
                                          <td className="px-6 py-4 text-center text-xs font-bold text-sky-600">{w.active_days_last_30 || 0}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[500px] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <h2 className="text-lg font-black font-outfit text-slate-800 flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-pink-500" /> Live Events
                      </h2>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  </div>
                  <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
                      {stats.triggers?.map((t, i) => (
                          <div key={i} className="group p-4 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-all">
                              <div className="flex justify-between items-start mb-2">
                                  <div className="font-black text-[10px] text-slate-800 uppercase tracking-tight italic">{t.event_type} — {t.zone}</div>
                                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(t.recorded_timestamp).toLocaleTimeString()}</span>
                                <span className="text-[9px] bg-white border border-slate-100 px-2 py-0.5 rounded-full font-black text-indigo-500 uppercase tracking-widest italic">Paid</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
