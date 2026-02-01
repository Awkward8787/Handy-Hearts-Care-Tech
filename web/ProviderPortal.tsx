
import React, { useState, useEffect } from 'react';
import { User, InquirySubmission } from '../types/entities';
import { supabase } from '../lib/supabase';
import { Briefcase, DollarSign, UserCheck, AlertCircle } from 'lucide-react';

interface ProviderPortalProps {
  user: User;
  onLogout: () => void;
}

const ProviderPortal: React.FC<ProviderPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'JOBS' | 'EARNINGS' | 'PROFILE'>('JOBS');
  const [assignedInquiries, setAssignedInquiries] = useState<InquirySubmission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user.is_approved && !user.is_banned) {
      fetchData();
    }
  }, [user.is_approved, user.is_banned]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inquiry_submission')
      .select('*')
      .eq('assigned_provider_user_id', user.id);
    setAssignedInquiries(data || []);
    setLoading(false);
  };

  const handleStripeOnboarding = () => {
    // In production, this would call /provider/stripe-link backend
    alert("Redirecting to Stripe Express Onboarding Tunnel...");
  };

  if (user.is_banned) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 text-center">
        <div className="border-[16px] border-red-600 p-16 max-w-2xl bg-black">
          <h1 className="text-8xl font-black uppercase tracking-tighter mb-10 italic leading-[0.8]">Access<br/>Revoked</h1>
          <p className="text-red-600 font-black uppercase tracking-widest text-lg mb-12">Permanent decommissioning enacted by Admin Command.</p>
          <button onClick={onLogout} className="w-full bg-red-600 py-8 text-2xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Close Terminal</button>
        </div>
      </div>
    );
  }

  if (!user.is_approved) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-12 text-center">
        <div className="neo-card border-yellow-400 p-16 max-w-2xl bg-slate-900 shadow-[20px_20px_0px_0px_rgba(234,179,8,0.2)]">
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-6 italic leading-none">Vetting<br/>Sequence</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-12">Your profile is awaiting administrative verification. Estimated wait: 24-48 hours.</p>
          <button onClick={onLogout} className="w-full bg-yellow-400 text-black py-6 text-xl font-black uppercase tracking-widest">Logout Terminal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-black text-white p-8 flex flex-col gap-8 z-20">
        <h1 className="text-3xl font-black uppercase tracking-tighter italic border-b-4 border-white pb-4">Gateway</h1>
        <nav className="flex-grow space-y-4">
          <button onClick={() => setActiveTab('JOBS')} className={`w-full flex items-center gap-4 p-4 font-black uppercase text-xs border-4 transition-all ${activeTab === 'JOBS' ? 'bg-white text-black translate-x-1 translate-y-1' : 'border-white hover:bg-white/10'}`}>
            <Briefcase size={18}/> Mission Board
          </button>
          <button onClick={() => setActiveTab('EARNINGS')} className={`w-full flex items-center gap-4 p-4 font-black uppercase text-xs border-4 transition-all ${activeTab === 'EARNINGS' ? 'bg-white text-black translate-x-1 translate-y-1' : 'border-white hover:bg-white/10'}`}>
            <DollarSign size={18}/> Earnings
          </button>
          <button onClick={() => setActiveTab('PROFILE')} className={`w-full flex items-center gap-4 p-4 font-black uppercase text-xs border-4 transition-all ${activeTab === 'PROFILE' ? 'bg-white text-black translate-x-1 translate-y-1' : 'border-white hover:bg-white/10'}`}>
            <UserCheck size={18}/> Node Profile
          </button>
        </nav>
        <button onClick={onLogout} className="p-4 font-black uppercase text-xs text-red-500">Terminate</button>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 md:p-16 space-y-12">
          {/* Global Warnings */}
          {!user.provider_data?.onboardingComplete && (
            <div className="bg-amber-100 border-4 border-amber-500 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="text-amber-600 w-12 h-12" />
                <div>
                  <h4 className="font-black uppercase text-amber-600">Financial Link Missing</h4>
                  <p className="text-sm font-bold text-amber-600/70">You must connect your Stripe account to receive mission payouts.</p>
                </div>
              </div>
              <button onClick={handleStripeOnboarding} className="bg-amber-600 text-white px-8 py-4 font-black uppercase text-xs">Connect Stripe</button>
            </div>
          )}

          {activeTab === 'JOBS' && (
            <div className="space-y-12">
               <h2 className="text-7xl font-black uppercase tracking-tighter italic leading-none">Active Missions</h2>
               <div className="grid gap-8">
                {assignedInquiries.length === 0 ? (
                  <div className="border-4 border-dashed border-slate-300 p-24 text-center text-slate-300 uppercase font-black text-2xl italic">Waiting for Dispatch Signals...</div>
                ) : (
                  assignedInquiries.map(i => (
                    <div key={i.id} className="neo-card p-10 hover:bg-blue-600 hover:text-white group">
                      <div className="flex justify-between items-center mb-8">
                        <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase group-hover:bg-white group-hover:text-blue-600">{i.status}</span>
                        <span className="text-[10px] font-black opacity-20 tracking-[0.4em]">REF_{i.id.slice(0,8)}</span>
                      </div>
                      <h3 className="text-5xl font-black uppercase tracking-tighter italic mb-4">{i.service_category.replace('_', ' ')}</h3>
                      <p className="text-xl font-bold uppercase opacity-60 group-hover:opacity-100">CLIENT: {i.full_name}</p>
                      <div className="mt-8 pt-8 border-t-2 border-black group-hover:border-white italic leading-relaxed">
                        "{i.notes}"
                      </div>
                    </div>
                  ))
                )}
               </div>
            </div>
          )}

          {activeTab === 'EARNINGS' && (
            <div className="space-y-12">
               <h2 className="text-7xl font-black uppercase tracking-tighter italic leading-none">Yield Log</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="neo-card p-10">
                    <p className="text-[10px] font-black uppercase opacity-40 mb-2">Pending Payout</p>
                    <p className="text-5xl font-black">$0.00</p>
                  </div>
                  <div className="neo-card p-10 bg-emerald-500 text-white">
                    <p className="text-[10px] font-black uppercase opacity-80 mb-2">Total Earnings</p>
                    <p className="text-5xl font-black">$0.00</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProviderPortal;
