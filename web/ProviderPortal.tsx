
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
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    setLoading(true);
    const { data: profile, error } = await supabase
      .from('app_user')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      setIsApproved(false);
    } else {
      // In a real app, you might have a separate 'approved' boolean, 
      // here we assume existence in app_user as Provider means access.
      setIsApproved(true);
      const { data } = await supabase
        .from('inquiry_submission')
        .select('*')
        .eq('assigned_provider_user_id', user.id);
      setAssignedInquiries(data || []);
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono uppercase animate-pulse tracking-[1em]">Establishing Link...</div>;

  if (isApproved === false) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-12 text-center font-mono">
        <h1 className="text-6xl font-black uppercase tracking-tighter mb-6 italic">Personnel Restricted</h1>
        <p className="text-slate-500 uppercase text-[10px] tracking-widest opacity-60">Credentials verification pending.</p>
        <button onClick={onLogout} className="mt-16 text-xs border-b-4 border-white pb-2 uppercase font-black">Logout</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-white selection:text-black">
      <header className="p-8 md:p-12 border-b-8 border-white flex justify-between items-center sticky top-0 bg-black z-50">
        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">PRO_GATEWAY</h1>
        <button onClick={onLogout} className="text-xs border-b-4 border-white pb-2 uppercase font-black">Disconnect</button>
      </header>

      <main className="p-8 md:p-24 space-y-16">
        <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter border-b-4 border-white pb-8">Active Deployments</h2>
        <div className="grid gap-8">
          {assignedInquiries.length === 0 ? (
            <div className="border-4 border-dashed border-white/20 p-24 text-center text-white/40 uppercase font-black tracking-widest">No Signals Assigned</div>
          ) : (
            assignedInquiries.map(i => (
              <div key={i.id} className="border-8 border-white p-12 hover:bg-white hover:text-black transition-all group">
                <div className="flex justify-between mb-8">
                  <span className="px-4 py-1 bg-white text-black text-[10px] font-black uppercase">{i.status}</span>
                  <span className="text-[10px] font-black opacity-30">ID: {i.id.slice(0, 8)}</span>
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
