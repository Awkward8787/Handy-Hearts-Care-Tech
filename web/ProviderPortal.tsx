
import React, { useState, useEffect } from 'react';
import { User, InquirySubmission } from '../types/entities';
import { supabase } from '../lib/supabase';

interface ProviderPortalProps {
  user: User;
  onLogout: () => void;
}

const ProviderPortal: React.FC<ProviderPortalProps> = ({ user, onLogout }) => {
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

  // 1. BLACKLISTED STATE
  if (user.is_banned) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 text-center font-sans">
        <div className="border-[16px] border-red-600 p-16 max-w-2xl bg-black shadow-[40px_40px_0px_0px_rgba(220,38,38,0.2)]">
          <h1 className="text-8xl font-black uppercase tracking-tighter mb-10 italic leading-[0.8]">Access<br/>Revoked</h1>
          <div className="h-4 bg-red-600 w-full mb-10"></div>
          <p className="text-red-600 font-black uppercase tracking-widest text-lg mb-12 leading-tight">Your provider node has been permanently decommissioned by Central Command. Please contact support for appeal procedures.</p>
          <button onClick={onLogout} className="w-full bg-red-600 py-8 text-2xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Disconnect Session</button>
        </div>
      </div>
    );
  }

  // 2. PENDING VETTING STATE
  if (!user.is_approved) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 text-center font-sans">
        <div className="border-[12px] border-yellow-400 p-12 max-w-2xl bg-slate-900 shadow-[20px_20px_0px_0px_rgba(234,179,8,0.2)]">
          <div className="flex justify-center mb-8">
             <div className="w-16 h-16 border-8 border-yellow-400 border-t-transparent animate-spin"></div>
          </div>
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-6 italic leading-none">Vetting Queue</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-12">Your credentials have been logged. An Admin must verify your profile before deployment authorization is granted.</p>
          <button onClick={onLogout} className="w-full bg-yellow-400 text-black py-6 text-xl font-black uppercase tracking-widest hover:bg-white transition-all">Logout Terminal</button>
        </div>
      </div>
    );
  }

  // 3. ACTIVE STATE
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <header className="p-8 md:p-12 border-b-8 border-white flex justify-between items-center sticky top-0 bg-black z-50">
        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">Gateway: {user.name}</h1>
        <button onClick={onLogout} className="px-6 py-2 border-4 border-white font-black uppercase text-xs hover:bg-white hover:text-black transition-all">Disconnect</button>
      </header>

      <main className="p-8 md:p-24 space-y-16">
        <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">Active Missions</h2>
        <div className="grid gap-8">
          {assignedInquiries.length === 0 ? (
            <div className="border-4 border-dashed border-white/20 p-24 text-center text-white/40 uppercase font-black tracking-widest text-2xl">No Active Signals</div>
          ) : (
            assignedInquiries.map(i => (
              <div key={i.id} className="border-8 border-white p-12 hover:bg-white hover:text-black transition-all group">
                <div className="flex justify-between items-center mb-8">
                  <span className="px-4 py-1 bg-white text-black text-[10px] font-black uppercase">{i.status}</span>
                  <span className="text-[10px] font-black opacity-30">REF_{i.id.slice(0, 8)}</span>
                </div>
                <h3 className="text-5xl font-black uppercase tracking-tighter italic mb-4">{i.full_name}</h3>
                <p className="text-xl font-bold uppercase opacity-60 group-hover:opacity-100">{i.service_requested} • {i.phone_e164}</p>
                <div className="border-t-4 border-current pt-8 mt-8 italic text-lg leading-relaxed">"{i.notes}"</div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default ProviderPortal;
