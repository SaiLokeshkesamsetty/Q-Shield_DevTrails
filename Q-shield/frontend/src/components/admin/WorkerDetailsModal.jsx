import React, { useState, useEffect } from 'react';
import { 
    X, CloudRain, Thermometer, BrainCircuit, ShieldAlert, 
    CheckCircle2, Loader2, Calendar, TrendingUp, TrendingDown, 
    Minus, AlertTriangle, Info, BadgeInfo, Sparkles, User, 
    Target, ArrowRight
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
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
import toast from 'react-hot-toast';
import { fetchZoneForecast, overrideWorkerPremium } from '../../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function WorkerDetailsModal({ worker, onClose }) {
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aiPremium, setAiPremium] = useState(35);
    const [riskLevel, setRiskLevel] = useState('Low');
    const [confidence, setConfidence] = useState(0);
    const [explanation, setExplanation] = useState('');
    
    // UI Logic states
    const [riskTrend, setRiskTrend] = useState('Stable'); // 'Increasing' | 'Decreasing' | 'Stable'
    const [peakDay, setPeakDay] = useState(null);

    const [overrideVal, setOverrideVal] = useState('');
    const [reason, setReason] = useState('');
    const [expiresDays, setExpiresDays] = useState(7);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!worker) return;
        const loadForecast = async () => {
            setLoading(true);
            try {
                const data = await fetchZoneForecast(worker.home_zone);
                if (data && data.forecast) {
                    setForecastData(data.forecast);
                    setAiPremium(data.suggested_premium || 35);
                    setRiskLevel(data.ai_analysis?.risk_level || 'Low');
                    setConfidence(data.ai_analysis?.confidence || 0);
                    setExplanation(data.ai_analysis?.explanation || 'Stable conditions expected.');
                    setOverrideVal(data.suggested_premium || 35);

                    // 📈 Calculate Trend: Compare first day rain to avg of next 3 days
                    const firstDayRain = data.forecast[0]?.rain_mm || 0;
                    const avgFutureRain = data.forecast.slice(1, 4).reduce((acc, d) => acc + d.rain_mm, 0) / 3;
                    
                    if (avgFutureRain > firstDayRain + 5) setRiskTrend('Increasing');
                    else if (avgFutureRain < firstDayRain - 5) setRiskTrend('Decreasing');
                    else setRiskTrend('Stable');

                    // 🏔️ Find Peak Rainfall Day
                    const peak = [...data.forecast].sort((a, b) => b.rain_mm - a.rain_mm)[0];
                    setPeakDay(peak);
                }
            } catch (e) {
                toast.error("Telemetry link failed. Check connection.");
            } finally {
                setLoading(false);
            }
        };
        loadForecast();
    }, [worker]);

    if (!worker) return null;

    const handleOverride = async () => {
        if (!overrideVal) {
            toast.error("Please provide a premium value.");
            return;
        }
        setSubmitting(true);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiresDays));

        const res = await overrideWorkerPremium(worker.worker_id, overrideVal, aiPremium, "Admin Override", expiresAt.toISOString());
        if (res.success) {
            toast.success("Underwriting override committed.");
            onClose();
        } else {
            toast.error("Failed to commit override.");
        }
        setSubmitting(false);
    };

    const chartData = {
        labels: forecastData?.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })) || [],
        datasets: [
            {
                label: 'Precipitation (mm)',
                data: forecastData?.map(d => d.rain_mm) || [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y',
                pointBackgroundColor: forecastData?.map(d => d.date === peakDay?.date ? '#f43f5e' : '#6366f1'),
                pointRadius: forecastData?.map(d => d.date === peakDay?.date ? 6 : 3),
                pointHoverRadius: 8,
            },
            {
                label: 'Temperature (°C)',
                data: forecastData?.map(d => d.temp) || [],
                borderColor: '#f59e0b',
                backgroundColor: 'transparent',
                tension: 0.4,
                borderDash: [5, 5],
                yAxisID: 'y1',
                pointRadius: 0
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                cornerRadius: 12,
                titleFont: { weight: 'bold' }
            }
        },
        scales: {
            y: { type: 'linear', display: false, min: 0 },
            y1: { type: 'linear', display: false, grid: { drawOnChartArea: false } },
            x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-[#F8FAFC] rounded-[3rem] w-full max-w-5xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[92vh] border border-white/20">
                
                {/* 🛡️ HEADER PANEL */}
                <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white">
                    <div className="flex items-center space-x-6">
                        <div className="bg-indigo-600 p-4 rounded-3xl shadow-lg shadow-indigo-600/20">
                            <BrainCircuit className="text-white w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-3 mb-1">
                                <h1 className="text-3xl font-black font-outfit text-slate-900 tracking-tight tracking-tighter uppercase">Weather Forecasting</h1>
                                <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-emerald-100">Live Telemetry</span>
                            </div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{worker.name} · {worker.home_zone} · {worker.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl transition-all active:scale-95">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center text-indigo-500">
                            <div className="relative mb-8">
                                <Loader2 className="w-16 h-16 animate-spin" />
                                <Target className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
                            </div>
                            <span className="font-black text-xs uppercase tracking-[0.2em] animate-pulse">Synchronizing Actuarial Engine...</span>
                        </div>
                    ) : (
                        <>
                            {/* 📈 COMPONENT 1: THE 7-DAY PREDICTIVE CHART */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-8 left-8 flex items-center space-x-3 z-10">
                                    <div className="bg-sky-50 p-2 rounded-xl"><CloudRain className="w-5 h-5 text-sky-500" /></div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Weather Forecasting Matrix</h3>
                                </div>
                                <div className="absolute top-8 right-8 flex items-center space-x-4 z-10">
                                    <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 italic">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rainfall (mm)</span>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 italic">
                                        <div className="w-2 h-2 rounded-full border-2 border-amber-500 bg-white"></div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temp (°C)</span>
                                    </div>
                                </div>
                                <div className="h-72 w-full mt-12 relative">
                                    {forecastData && <Line data={chartData} options={chartOptions} />}
                                    
                                    {/* Peak rainfall day callout */}
                                    {peakDay && (
                                        <div className="absolute top-0 right-1/4 animate-in slide-in-from-top-4 duration-1000">
                                            <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl shadow-sm flex items-center space-x-3">
                                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                                <div>
                                                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Peak Disruption</p>
                                                    <p className="text-xs font-black text-rose-600">{peakDay.rain_mm}mm on {new Date(peakDay.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 🧠 COMPONENT 2: AI INSIGHTS CENTER */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                                        <BadgeInfo className="w-3 h-3 mr-2" /> Severity Vector
                                    </p>
                                    <div className="flex items-end justify-between">
                                        <h4 className={`text-4xl font-black font-outfit ${riskLevel === 'High' ? 'text-rose-600' : riskLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-600'}`}>
                                            {riskLevel}
                                        </h4>
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-tighter uppercase ${riskLevel === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {riskLevel === 'High' ? 'Critical' : 'Nominal'}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                                        <Sparkles className="w-3 h-3 mr-2 text-indigo-500" /> Model Confidence
                                    </p>
                                    <div className="flex items-center justify-between space-x-4">
                                        <span className="text-4xl font-black font-outfit text-slate-800">{confidence}%</span>
                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                                            <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${confidence}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-2 text-indigo-500" /> Risk Trend
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-black font-outfit text-slate-800">{riskTrend}</span>
                                        <div className={`p-3 rounded-2xl ${riskTrend === 'Increasing' ? 'bg-rose-50 text-rose-600' : riskTrend === 'Decreasing' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                            {riskTrend === 'Increasing' ? <TrendingUp className="w-6 h-6" /> : riskTrend === 'Decreasing' ? <TrendingDown className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 🧠 COMPONENT 2.5: XAI RADAR (EXPLAINABLE AI) */}
                            <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center space-x-3">
                                        <BrainCircuit className="w-5 h-5 text-indigo-600" />
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">AI Feature Influence Breakdown (XAI)</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center">
                                        <Info className="w-3 h-3 mr-2" /> Weights determined by Ensemble Dataset
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Precipitation Impact</span>
                                            <span className="text-indigo-600">65%</span>
                                        </div>
                                        <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                                            <div className="h-full bg-indigo-500 transition-all duration-1000 delay-300" style={{ width: '65%' }}></div>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 italic">High correlation with historical flooding in {worker.home_zone}.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Thermal Severity</span>
                                            <span className="text-amber-600">20%</span>
                                        </div>
                                        <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                                            <div className="h-full bg-amber-500 transition-all duration-1000 delay-500" style={{ width: '20%' }}></div>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 italic">Moderate influence from heatwave activity levels.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Historical Anomaly</span>
                                            <span className="text-rose-600">15%</span>
                                        </div>
                                        <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                                            <div className="h-full bg-rose-500 transition-all duration-1000 delay-700" style={{ width: '15%' }}></div>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 italic">Adjusted for trust index and previous claim frequency.</p>
                                    </div>
                                </div>
                            </div>

                            {/* 💰 COMPONENT 3: PRICING EXECUTION PANEL */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <div className="bg-white border-2 border-indigo-50 rounded-[2.5rem] p-10 relative overflow-hidden">
                                     <div className="absolute right-0 top-0 bg-indigo-500/5 p-12 rounded-full -translate-y-8 translate-x-8"></div>
                                     <div className="flex items-center space-x-4 mb-10">
                                        <div className="bg-emerald-100/50 p-3 rounded-2xl text-emerald-600"><Sparkles className="w-6 h-6" /></div>
                                        <div>
                                            <h3 className="text-xl font-black font-outfit text-slate-900">Actuarial Recommendation</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Scikit-Learn Regression Outcome</p>
                                        </div>
                                     </div>

                                     <div className="space-y-6 relative z-10">
                                        <div className="flex justify-between items-center bg-slate-50/50 rounded-3xl p-6 border border-slate-50">
                                            <span className="text-xs font-black text-slate-500 uppercase">Suggested Premium</span>
                                            <div className="flex items-baseline space-x-1">
                                                <span className="text-sm font-black text-indigo-400">₹</span>
                                                <h4 className="text-5xl font-black font-outfit text-indigo-600 tracking-tighter">{aiPremium}</h4>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 p-3 rounded-2xl border border-emerald-100/50">
                                            <ShieldAlert className="w-3 h-3" />
                                            <span>This calculation factors in 7-day climatic risk & historical zone disruptions.</span>
                                        </div>
                                     </div>
                                </div>

                                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative shadow-2xl overflow-hidden group">
                                     <User className="absolute -right-8 -top-8 w-40 h-40 text-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                     <div className="flex items-center space-x-4 mb-8">
                                        <div className="bg-rose-500 p-3 rounded-2xl"><ShieldAlert className="w-6 h-6 text-white" /></div>
                                        <div>
                                            <h3 className="text-xl font-black font-outfit text-white">Manual Underwriting</h3>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Administrative Policy Lock</p>
                                        </div>
                                     </div>

                                     <div className="space-y-6">
                                        <div className="flex space-x-4">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Policy Lock (₹)</label>
                                                <div className="relative">
                                                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</div>
                                                     <input 
                                                        type="number" 
                                                        value={overrideVal}
                                                        onChange={e => setOverrideVal(e.target.value)}
                                                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl pl-8 pr-4 py-4 text-2xl font-black text-white focus:border-rose-500 transition-all outline-none" 
                                                    />
                                                </div>
                                            </div>
                                            <div className="w-1/3">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Expires</label>
                                                <select 
                                                    value={expiresDays}
                                                    onChange={e => setExpiresDays(e.target.value)}
                                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:border-rose-500 transition-all outline-none appearance-none">
                                                    <option value="1">1D</option>
                                                    <option value="3">3D</option>
                                                    <option value="7">7D</option>
                                                </select>
                                            </div>
                                        </div>

                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-[10px] font-black text-slate-500">AI: ₹{aiPremium}</span>
                                                <ArrowRight className="w-3 h-3 text-slate-700" />
                                                <span className="text-[10px] font-black text-emerald-400">Lock: ₹{overrideVal}</span>
                                            </div>
                                            <button 
                                                onClick={handleOverride}
                                                disabled={submitting}
                                                className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center transition-all active:scale-95 disabled:opacity-50 group/btn">
                                                {submitting ? 'Syncing...' : 'COMMIT OVERRIDE'}
                                                <CheckCircle2 className="ml-3 w-4 h-4 text-emerald-500 group-hover/btn:scale-125 transition-transform" />
                                            </button>
                                        </div>
                                     </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
