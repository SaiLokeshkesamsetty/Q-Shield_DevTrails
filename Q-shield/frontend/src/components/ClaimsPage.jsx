import React, { useState, useEffect } from 'react';
import { fetchAllClaims } from '../api';
import { ShieldCheck, Calendar, Zap } from 'lucide-react';

export default function ClaimsPage({ user }) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllClaims().then(data => {
        setClaims(data);
        setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
          <div>
              <h1 className="text-3xl font-black font-outfit text-gray-900 tracking-tight">Claim History</h1>
              <p className="text-gray-500 font-medium">Fully automated, zero-touch dispute resolution.</p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold flex items-center shadow-sm">
              <ShieldCheck className="w-5 h-5 mr-2" />
              {claims.length} Total Claims
          </div>
      </div>

      {loading ? (
          <div className="text-center p-12 text-gray-400 font-bold animate-pulse">Loading Claim Records...</div>
      ) : claims.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl flex flex-col items-center justify-center min-h-[40vh]">
              <ShieldCheck className="w-12 h-12 text-gray-300 mb-4"/>
              <p className="text-lg text-gray-500 font-medium">No claims have been filed or triggered yet.</p>
          </div>
      ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-sm tracking-wider uppercase">
                          <th className="p-4 font-bold">Claim ID</th>
                          <th className="p-4 font-bold">Trigger Reason</th>
                          <th className="p-4 font-bold">Status</th>
                          <th className="p-4 font-bold">Date & Time</th>
                          <th className="p-4 font-bold text-right">Amount</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {claims.map((claim, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                              <td className="p-4 font-mono text-gray-600 font-medium">#{claim.claim_id.slice(0, 8)}...</td>
                              <td className="p-4 font-bold text-gray-800 flex items-center">
                                  {claim.trigger_type === 'RAIN' ? <Zap className="w-4 h-4 mr-2 text-blue-500" /> : <ShieldCheck className="w-4 h-4 mr-2 text-gray-400"/>}
                                  {claim.trigger_type || 'Disruption'}
                              </td>
                              <td className="p-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-tighter ${
                                      (claim.claim_status || claim.status) === 'Paid' || (claim.claim_status || claim.status) === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                      (claim.claim_status || claim.status) === 'Rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                      'bg-blue-100 text-blue-700 border border-blue-200'
                                  }`}>
                                      {claim.claim_status || claim.status}
                                  </span>
                              </td>
                              <td className="p-4 text-gray-500 text-sm font-medium flex items-center">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                  {/* For the demo, we show the relative time if it's very recent, or formatted locale string */}
                                  {new Date(claim.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(claim.created_at).toLocaleDateString()}
                              </td>
                              <td className="p-4 text-right font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                                  ₹{claim.payout_amount || claim.amount || '0'}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
}
