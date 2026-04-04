import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, CreditCard, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';

export default function RazorpayModal({ isOpen, onClose, onConfirm, amount }) {
  const [step, setStep] = useState('select'); // 'select', 'processing', 'success'
  
  useEffect(() => {
    if (isOpen) {
      setStep('select');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePay = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onConfirm();
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Razorpay Brand Header */}
        <div className="bg-[#3395FF] p-4 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <div className="bg-white p-1 rounded">
                    <ShieldCheck className="w-4 h-4 text-[#3395FF]" />
                </div>
                <span className="font-black tracking-tight text-lg">Razorpay</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Amount & Merchant Info */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Q-Shield Insurance</h3>
                <p className="text-[10px] text-slate-500 font-medium">Order: SHIELD_{Math.floor(1000 + Math.random() * 9000)}</p>
            </div>
            <div className="text-right tracking-tight">
                <div className="text-2xl font-black text-slate-800">₹{amount}</div>
                <div className="text-[10px] text-[#3395FF] font-bold">View Details</div>
            </div>
        </div>

        {/* Step-based Content */}
        <div className="min-h-[300px] flex flex-col">
            {step === 'select' && (
                <div className="p-6 flex-1 animate-in fade-in slide-in-from-bottom-4">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">Cards, UPI & More</h4>
                    <div className="space-y-3">
                        <div onClick={handlePay} className="group flex items-center p-4 border border-slate-200 rounded-xl hover:border-[#3395FF] hover:bg-blue-50/30 cursor-pointer transition-all">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-400 group-hover:bg-[#3395FF] group-hover:text-white transition-colors">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="ml-4 flex-1">
                                <div className="text-sm font-bold text-slate-800">Card</div>
                                <p className="text-[10px] text-slate-500">Visa, Mastercard, RuPay & More</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#3395FF]" />
                        </div>

                        <div onClick={handlePay} className="group flex items-center p-4 border border-slate-200 rounded-xl hover:border-[#3395FF] hover:bg-blue-50/30 cursor-pointer transition-all opacity-80">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-400">
                                <div className="font-black text-xs">UPI</div>
                            </div>
                            <div className="ml-4 flex-1">
                                <div className="text-sm font-bold text-slate-800">UPI/QR</div>
                                <p className="text-[10px] text-slate-500">Pay via Google Pay, PhonePe, etc.</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        <Lock className="w-3 h-3" />
                        <span>Secure payments by Razorpay</span>
                    </div>
                </div>
            )}

            {step === 'processing' && (
                <div className="p-12 flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                    <div className="relative mb-6">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-[#3395FF] animate-spin"></div>
                        <ShieldCheck className="absolute inset-0 m-auto w-6 h-6 text-[#3395FF]" />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 mb-2 font-outfit">Verifying Payment</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Please do not refresh this page or close the window. Contacting secure bank server...</p>
                </div>
            )}

            {step === 'success' && (
                <div className="p-12 flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-105 duration-500">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6 scale-110 shadow-lg shadow-emerald-500/10">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h4 className="text-xl font-black text-slate-800 mb-2 font-outfit uppercase tracking-tight">Payment Success!</h4>
                    <p className="text-xs text-slate-500 font-bold">Transaction Confirmed by Razorpay</p>
                    <div className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-100">
                        Redirecting to Insurance Core...
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 text-[9px] text-slate-400 font-bold text-center border-t border-slate-100 uppercase tracking-widest">
            PCI-DSS COMPLIANT • 100% SECURE
        </div>
      </div>
    </div>
  );
}
