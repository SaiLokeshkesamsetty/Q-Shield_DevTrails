import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Cpu, FileText, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LandingPage({ user }) {
  const navigate = useNavigate();

  // Auth redirection logic is now handled only within the AuthPage itself
  // preventing forced redirection away from the landing page.

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-700 space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Hero */}
          <div className="space-y-8 relative">
             <div className="absolute -left-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>

             <div className="inline-flex items-center px-4 py-2 rounded-full bg-pink-100 text-pink-700 font-bold text-sm shadow-sm border border-pink-200">
                <Zap className="w-4 h-4 mr-2" /> Live Risk Monitoring Enabled
             </div>
             
             <h1 className="text-5xl lg:text-7xl font-outfit font-black tracking-tight text-gray-900 leading-[1.1]">
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-gradient-x">AI-Powered</span><br/>
                 Parametric Insurance
             </h1>
             
             <p className="text-xl text-gray-500 font-medium max-w-lg leading-relaxed">
                 Empowering gig delivery partners against unforeseen disruptions. Instant payouts. Zero claim forms.
             </p>


          </div>

          {/* Right Visual (Wow factor mockup) */}
          <div className="relative transform hover:scale-[1.02] transition-transform duration-700 delay-100 hidden lg:block w-full max-w-lg mx-auto pl-8">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-400 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div className="glass-card p-8 rounded-3xl relative overflow-hidden border border-white/80 shadow-[0_20px_60px_-15px_rgba(99,102,241,0.3)] bg-white/70">
                  
                  {/* Floating elements */}
                  <div className="flex items-center space-x-4 mb-8 z-10 relative">
                     <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
                         <Zap className="text-red-500 w-8 h-8 animate-pulse"/>
                     </div>
                     <div>
                         <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-tight mb-1">Live Trigger System</p>
                         <p className="font-black text-2xl text-red-900 leading-none">High Risk Detected</p>
                     </div>
                  </div>

                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-gray-100 relative z-10 transform -rotate-1 hover:rotate-0 transition-all cursor-pointer shadow-xl shadow-indigo-500/10">
                      <div className="flex justify-between items-center mb-5">
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black tracking-wide">+ ₹500 APPROVED</span>
                          <span className="text-gray-400 text-sm font-bold">Just now</span>
                      </div>
                      <h3 className="text-2xl font-black text-gray-800 mb-2 font-outfit">Heavy Rain Coverage</h3>
                      <p className="text-gray-500 font-medium leading-relaxed text-sm">System successfully detected severe anomaly in ZONE ALPHA and automatically triggered payout directly to your UPI.</p>
                  </div>

                  {/* Abstract Background Shapes */}
                  <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full blur-2xl opacity-40"></div>
                  <div className="absolute -left-10 -top-10 w-48 h-48 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full blur-2xl opacity-40"></div>
              </div>
          </div>
      </div>

      {/* Mini Section: How It Works */}
      <div className="py-8 border-y border-gray-200/50">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 text-center text-sm font-bold text-gray-500">
             <div className="flex items-center"><span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2">1</span> Activate Weekly Coverage</div>
             <ArrowRight className="w-4 h-4 hidden md:block text-gray-300"/>
             <div className="flex items-center"><span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2">2</span> AI Monitors Disruptions</div>
             <ArrowRight className="w-4 h-4 hidden md:block text-gray-300"/>
             <div className="flex items-center text-gray-800"><span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2">3</span> Auto Claim + Instant Payout</div>
          </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-lg transition-all group">
             <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <Zap className="w-6 h-6 text-indigo-600" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2 font-outfit">Instant Payouts</h3>
             <p className="text-gray-500 font-medium leading-relaxed">Claims processed automatically in seconds directly to your verified UPI account without human wait times.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-lg transition-all group">
             <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <Cpu className="w-6 h-6 text-purple-600" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2 font-outfit">AI Risk Engine</h3>
             <p className="text-gray-500 font-medium leading-relaxed">Dynamic, hyper-local pricing based on real-time weather, AQI, and strict traffic gridlock conditions.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:-translate-y-1 hover:shadow-lg transition-all group">
             <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                 <FileText className="w-6 h-6 text-pink-600" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2 font-outfit">Zero Paperwork</h3>
             <p className="text-gray-500 font-medium leading-relaxed">Fully automated smart-contract system continuously evaluating rules. No manual claim forms, absolutely ever.</p>
          </div>
      </div>
    </div>
  );
}
