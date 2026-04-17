import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Smartphone, ShieldCheck, Mail, Phone, CreditCard, Activity, UploadCloud, Bell, Shield, Edit2, Lock, History, AlertTriangle, Fingerprint, Camera, Building, CheckCircle2, Zap } from 'lucide-react';
import { fetchDashboard, updateWorkerProfile, verifyGigPlatform } from '../api';
import toast from 'react-hot-toast';

export default function ProfilePage({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingStep, setVerifyingStep] = useState('IDLE'); // IDLE, UPLOADING, SCANNING, SUCCESS
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef(null);
  const verifyInputRef = useRef(null);

  useEffect(() => {
     if(user) loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
     try {
         const data = await fetchDashboard(user.worker_id);
         setDashboardData(data);
         setEditForm({
            phone_number: data.worker.phone_number || '',
            bank_mask: data.worker.bank_details?.mask || 'XXXX1234',
            kyc_status: data.worker.kyc_status || 'Verified',
            claim_alerts: data.worker.notification_preferences?.claim_alerts ?? true
         });
     } catch(e) {
         console.error('Failed to load profile', e);
     } finally {
         setLoading(false);
     }
  };

  if(!user || loading || !dashboardData) return <div className="p-20 text-center font-black animate-pulse text-indigo-500 uppercase tracking-[20px]">DECRYPTING_IDENTITY...</div>;

  const w = dashboardData.worker;
  const isKycVerified = w.kyc_status === 'Verified';
  const claims = dashboardData.claimsHistory || [];
  const paidClaims = claims.filter(c => c.claim_status === 'Paid');
  const totalEarnings = paidClaims.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);
  const avgPayout = paidClaims.length ? Math.round(totalEarnings / paidClaims.length) : 0;
  const activePolicy = dashboardData.activeCoverage;
  const isCovered = activePolicy && activePolicy.status === 'Active';

  const handleSaveProfile = async () => {
      setSaving(true);
      const tid = toast.loading('Securing identity vault...');
      try {
          const res = await updateWorkerProfile(user.worker_id, {
              phone_number: editForm.phone_number,
              bank_details: { mask: editForm.bank_mask, bank: 'HDFC Bank', verified: true },
              notification_preferences: { claim_alerts: editForm.claim_alerts, payout_notifications: true, risk_alerts: true }
          });
          if(res.success) {
             toast.success('Identity Vault Updated', { id: tid });
             setEditing(false);
             await loadProfileData();
          } else {
             toast.error('Update Failed', { id: tid });
          }
      } catch(e) { toast.error('Connection Drop', { id: tid }); }
      setSaving(false);
  };

  const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = async () => {
          const tid = toast.loading('Uploading profile vault image...');
          try {
              const res = await updateWorkerProfile(user.worker_id, { profile_image_url: reader.result });
              if (res.success) {
                  toast.success('Image securely vaulted', { id: tid });
                  await loadProfileData();
              } else {
                  toast.error('Upload failed', { id: tid });
              }
          } catch(err) { toast.error('Network Error', { id: tid }); }
      };
      reader.readAsDataURL(file);
  };

  const handleVerifyPlatform = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setVerifyingStep('UPLOADING');
      setIsVerifying(true);
      setTimeout(() => {
          setVerifyingStep('SCANNING');
          let progress = 0;
          const interval = setInterval(() => {
              progress += 5;
              setScanProgress(progress);
              if (progress >= 100) {
                  clearInterval(interval);
                  finalizeVerification();
              }
          }, 100);
      }, 1000);
  };

  const finalizeVerification = async () => {
      try {
          const res = await verifyGigPlatform(user.worker_id, w.platform, 'mock_b64');
          if (res.success) {
              setVerifyingStep('SUCCESS');
              toast.success('Gig Identity Verified', { icon: '🛡️' });
              setTimeout(() => {
                  setIsVerifying(false);
                  loadProfileData();
              }, 3000);
          }
      } catch (err) {
          toast.error('AI Scan Failure');
          setIsVerifying(false);
      }
  };

  const handleSimulateUpload = (docType) => {
      const tid = toast.loading(`Encrypting & uploading ${docType}...`);
      setTimeout(() => toast.success(`${docType} Verified using advanced OCR`, { id: tid }), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 font-sans">
      
      {/* 🚀 Top Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-8 border-b border-gray-200/50">
          <div className="flex items-center space-x-5">
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-1 shadow-2xl relative group cursor-pointer"
              >
                  <div className="w-full h-full bg-white rounded-[1.8rem] overflow-hidden relative">
                      {w.profile_image_url ? (
                          <img src={w.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                              <User className="w-10 h-10 text-slate-300" />
                          </div>
                      )}
                      <div className="absolute inset-0 bg-indigo-900/40 hidden group-hover:flex items-center justify-center backdrop-blur-sm transition-all text-white"><Camera className="w-6 h-6"/></div>
                  </div>
                  {isKycVerified && <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-full border-[3px] border-white shadow-md"><ShieldCheck className="w-4 h-4 text-white"/></div>}
              </div>
              <div>
                  <h1 className="text-4xl font-black font-outfit text-gray-900 flex items-center tracking-tight">
                      {w.name} 
                  </h1>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center mt-1">
                      <Smartphone className="w-3 h-3 mr-1"/> {w.platform} Operations Elite
                  </p>
              </div>
          </div>
          <div className="mt-6 md:mt-0">
             {editing ? (
                 <div className="flex space-x-3">
                     <button onClick={() => setEditing(false)} className="px-5 py-2.5 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
                     <button onClick={handleSaveProfile} disabled={saving} className="px-6 py-2.5 rounded-2xl font-bold bg-indigo-600 text-white shadow-lg hover:shadow-indigo-500/30">{saving ? 'Saving...' : 'Save Vault'}</button>
                 </div>
             ) : (
                <button onClick={() => setEditing(true)} className="flex items-center px-6 py-2.5 rounded-2xl font-bold bg-white border border-gray-200 shadow-sm text-slate-700 hover:bg-slate-50 transition-all hover:shadow-md">
                    <Edit2 className="w-4 h-4 mr-2 text-indigo-500" /> Edit Profile
                </button>
             )}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 🌟 LEFT COLUMN (Identity + Finance) */}
          <div className="space-y-8">
              
              {/* 1. Identity Module */}
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Fingerprint className="w-32 h-32"/></div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Identity Records</h2>
                  
                  <div className="space-y-6 relative z-10">
                      <div>
                          <label className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-1 block">Full Registration Name</label>
                          <div className="text-lg font-bold text-slate-800 flex items-center">{w.name}</div>
                      </div>
                      <div>
                          <label className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-1 block">Verified Email</label>
                          <div className="text-lg font-bold text-slate-800 flex items-center bg-emerald-50 px-3 py-1.5 rounded-xl w-fit border border-emerald-100">
                             <Mail className="w-4 h-4 text-emerald-500 mr-2"/> {w.email}
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-1 block">Primary Phone</label>
                          {editing ? (
                              <input type="text" value={editForm.phone_number} onChange={e=>setEditForm({...editForm, phone_number: e.target.value})} className="w-full bg-slate-50 border border-indigo-200 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91 XXXXXXXX" />
                          ) : (
                              <div className="text-lg font-bold text-slate-800 flex items-center">
                                  <Phone className="w-4 h-4 text-slate-400 mr-2"/> {w.phone_number || 'Update Required'}
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* 2. Financial Vault */}
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 glow-layer"></div>
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform"><Building className="w-32 h-32 text-white"/></div>
                  
                  <div className="flex justify-between items-center mb-6 relative z-10">
                      <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Financial Vault</h2>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase flex items-center">
                          <Lock className="w-3 h-3 mr-1"/> Encrypted
                      </span>
                  </div>

                  <div className="space-y-6 relative z-10 bg-black/40 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                      <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Automated Payout Bank</p>
                          {editing ? (
                             <input type="text" value={editForm.bank_mask} onChange={e=>setEditForm({...editForm, bank_mask: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2 font-mono" />
                          ) : (
                             <div className="flex items-center text-white font-mono font-bold tracking-widest">
                                 <CreditCard className="w-5 h-5 mr-3 text-slate-400"/> {w.bank_details?.mask || 'XXXX-XXXX-1234'}
                             </div>
                          )}
                      </div>
                      <div className="pt-4 border-t border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Linked UPI ID</p>
                          <div className="flex items-center text-indigo-300 font-mono font-bold tracking-widest">
                              <Zap className="w-4 h-4 mr-3 text-indigo-500"/> {w.upi_id || 'NOT_LINKED'}
                          </div>
                      </div>
                  </div>
              </div>

          </div>

          {/* 🌟 MIDDLE COLUMN (Work & Insurance Intel) */}
          <div className="space-y-8">
              
              {/* 3. Coverage Snapshot */}
              <div className={`p-8 rounded-[2rem] border shadow-xl relative overflow-hidden transition-all duration-500 ${isCovered ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-400/50' : 'bg-white border-gray-100 text-slate-800'}`}>
                   <h2 className={`text-xs font-black uppercase tracking-widest mb-6 ${isCovered ? 'text-emerald-100' : 'text-slate-400'}`}>Active Policy Status</h2>
                   
                   <div className="flex items-end mb-2">
                       <Shield className={`w-12 h-12 mr-3 ${isCovered ? 'text-white' : 'text-slate-300'}`}/>
                       <div>
                           <p className={`text-3xl font-black font-outfit leading-none ${isCovered ? '' : 'text-slate-800'}`}>{isCovered ? 'Protected' : 'No Coverage'}</p>
                       </div>
                   </div>
                   
                   <p className={`mt-4 text-sm font-medium ${isCovered ? 'text-emerald-50' : 'text-slate-500'}`}>
                       {isCovered ? `Your zero-touch parametric engine is armed and monitoring ${w.home_zone}.` : 'Secure your income against major disruptions in the Policy Hub.'}
                   </p>
                   
                   {isCovered && (
                       <div className="mt-8 bg-black/20 backdrop-blur-sm rounded-2xl p-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                           <span className="text-emerald-100">Live Telemetry</span>
                           <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></div> SYNCED</span>
                       </div>
                   )}
              </div>

              {/* 4. Earnings Yield Box */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] group">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex justify-between">
                     Lifetime Yield <Activity className="w-4 h-4 text-indigo-400"/>
                  </h2>
                  <div className="text-5xl font-black font-outfit text-indigo-600 mb-2">₹{totalEarnings}</div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Total Insurance Payouts Received</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Avg Payout</p>
                          <p className="text-lg font-black text-slate-700">₹{avgPayout}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Claims Settled</p>
                          <p className="text-lg font-black text-slate-700">{paidClaims.length}</p>
                      </div>
                  </div>
              </div>

              {/* 5. Documents & Security */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex justify-between">
                     Compliance & Security <Lock className="w-4 h-4 text-slate-400"/>
                  </h2>
                  
                  <div className="space-y-4">
                      <div className={`p-5 rounded-2xl border-2 transition-all duration-500 ${w.is_gig_verified ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h3 className={`text-sm font-black uppercase tracking-widest ${w.is_gig_verified ? 'text-emerald-700' : 'text-slate-500'}`}>
                                    {w.is_gig_verified ? 'Verified Platform Partner' : 'Gig Status: Unverified'}
                                  </h3>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Proof of Platform (PoP)</p>
                              </div>
                              {w.is_gig_verified ? (
                                  <div className="bg-emerald-500 p-1.5 rounded-full"><CheckCircle2 className="w-4 h-4 text-white" /></div>
                              ) : (
                                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                              )}
                          </div>
                               
                          {!w.is_gig_verified && (
                              <button 
                                  onClick={() => verifyInputRef.current?.click()}
                                  className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm flex items-center justify-center group"
                              >
                                  <Camera className="w-4 h-4 mr-2 group-hover:animate-bounce" /> Start AI Identity Scan
                              </button>
                          )}
                               
                          <input type="file" ref={verifyInputRef} onChange={handleVerifyPlatform} className="hidden" accept="image/*" />
                               
                          <p className="text-[10px] text-slate-400 mt-4 font-medium leading-relaxed italic">
                              *Upload a screenshot of your {w.platform} profile. Our engine uses OCR to verify active status.
                          </p>
                      </div>

                      <button onClick={()=>handleSimulateUpload('Identity Proof')} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors group">
                           <div className="flex items-center text-sm font-bold text-slate-600">
                               <UploadCloud className="w-5 h-5 mr-3 text-slate-300"/> Submit PAN/Aadhar
                           </div>
                           {isKycVerified && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </button>
                  </div>
                      
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 mt-4">
                       <div className="flex items-center">
                           <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-3"><Bell className="w-5 h-5 text-indigo-600"/></div>
                           <div>
                               <div className="text-sm font-bold text-slate-800">Claim Alerts</div>
                               <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Push Notifications</div>
                           </div>
                       </div>
                       <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                           <input type="checkbox" checked={editForm.claim_alerts} onChange={() => editing && setEditForm({...editForm, claim_alerts: !editForm.claim_alerts})} disabled={!editing} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 left-0 checked:right-0 checked:border-indigo-600 checked:bg-indigo-600 transition-all"/>
                           <label className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                       </div>
                  </div>
              </div>
          </div>

          {/* 🌟 RIGHT COLUMN (Work Intel & Timeline) */}
          <div className="space-y-8">
              
              {/* 6. Work Intelligence Zone */}
              <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 shadow-xl relative overflow-hidden group">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full"></div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-6">Work Intelligence</h2>
                  
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 mb-6">
                      <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Base Location</span>
                          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded uppercase tracking-widest font-black border border-indigo-400/30">GPS Verified</span>
                      </div>
                      <div className="flex items-center text-white font-bold text-xl">
                          <MapPin className="w-6 h-6 mr-3 text-emerald-400"/> {w.home_zone}
                      </div>
                  </div>

                  <div>
                      <div className="flex justify-between items-end mb-2">
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Active Days (Last 30)</span>
                          <span className="text-xl font-black text-white">{w.active_days_last_30}/30</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{width: `${(w.active_days_last_30/30)*100}%`}}></div>
                      </div>
                  </div>
              </div>

              {/* 7. Advanced Activity Timeline */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] h-[400px] flex flex-col">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between">
                      System Timeline <History className="w-4 h-4 text-slate-400"/>
                  </h2>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="relative border-l-2 border-indigo-100 ml-3 space-y-8 pb-4">
                          {claims.length > 0 ? claims.slice(0, 4).map((c, i) => (
                              <div key={i} className="relative pl-6">
                                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${c.claim_status === 'Paid' ? 'bg-emerald-500' : c.claim_status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                                  <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{new Date(c.created_at).toLocaleDateString()}</div>
                                  <p className="text-sm font-bold text-slate-800">
                                      {c.claim_status === 'Paid' ? `Settled Payout: ₹${c.amount}` : `Simulation ${c.claim_status}`}
                                  </p>
                                  <p className="text-xs text-slate-500 font-medium mt-1">{c.trigger_type || 'System Engine'} generated log entry.</p>
                              </div>
                          )) : (
                              <div className="relative pl-6">
                                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white bg-indigo-500 animate-pulse"></div>
                                  <p className="text-sm font-bold text-slate-800">Account Verified</p>
                                  <p className="text-xs text-slate-500 font-medium mt-1">Identity vault successfully minted to database.</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 🧬 AI VERIFICATION MODAL OVERLAY */}
      {isVerifying && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4">
              <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.3)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse"></div>
                  <div className="relative z-10 text-center">
                    {verifyingStep === 'UPLOADING' && (
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <UploadCloud className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Vaulting Asset...</h2>
                            <p className="text-slate-400 text-sm font-medium">Encrypting payload for AI analysis.</p>
                        </div>
                    )}

                    {verifyingStep === 'SCANNING' && (
                        <div className="space-y-8">
                             <div className="relative w-32 h-32 mx-auto">
                                 <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                                 <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                 <div className="absolute inset-0 flex items-center justify-center flex-col">
                                     <Fingerprint className="w-12 h-12 text-indigo-400 animate-pulse" />
                                     <span className="text-white font-mono font-black text-xl mt-2">{scanProgress}%</span>
                                 </div>
                             </div>
                             <div className="space-y-3">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter animate-pulse">Scanning Platform ID</h2>
                                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded inline-block">DETECTING: {w.platform}</div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                                    <div className="h-full bg-indigo-500 transition-all duration-100" style={{width: `${scanProgress}%`}}></div>
                                </div>
                             </div>
                        </div>
                    )}

                    {verifyingStep === 'SUCCESS' && (
                        <div className="space-y-6 py-6 font-outfit">
                            <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-scale-in">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tight">VERIFIED</h2>
                            <p className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-xs">Partner Authentication Confirmed</p>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mt-8">
                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Assigned Trust ID</div>
                                <div className="text-indigo-300 font-mono text-sm tracking-widest">Q-SHIELD-TR-9941X</div>
                            </div>
                        </div>
                    )}
                  </div>
              </div>
          </div>
      )}

      <style dangerouslySetInnerHTML={{__html:`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          input[type=checkbox]:checked + label { background-color: #4f46e5; }
          @keyframes scale-in { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
          .animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}}/>
    </div>
  );
}
