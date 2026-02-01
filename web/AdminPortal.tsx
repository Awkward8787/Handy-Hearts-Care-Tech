
import React, { useState, useEffect } from 'react';
import { User, UserRole, InquirySubmission, Service, Booking } from '../types/entities';
import { supabase } from '../lib/supabase';

interface AdminPortalProps {
  user: User;
  onLogout: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('hub');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [inquiries, setInquiries] = useState<InquirySubmission[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [monitoring, setMonitoring] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: i } = await supabase.from('inquiry_submission').select('*').order('created_at', { ascending: false });
      const { data: u } = await supabase.from('app_user').select('*');
      const { data: b } = await supabase.from('bookings').select('*');
      const { data: s } = await supabase.from('services').select('*').order('name');
      
      setInquiries(i || []);
      setUsers(u || []);
      setBookings(b || []);
      setServices(s || []);

      if (activeTab === 'monitoring') {
        const { data: m, error: monError } = await supabase
          .from('admin_monitoring_notes')
          .select('*, app_user!author_id(name)')
          .order('created_at', { ascending: false });
        
        if (monError) {
           setErrorMsg("Warning: Safety log relationship data is syncing. Author names hidden.");
        } else {
           setMonitoring(m || []);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderStatus = async (userId: string, action: 'APPROVE' | 'BLACKLIST' | 'RESET') => {
    let updates = {};
    if (action === 'APPROVE') updates = { is_approved: true, is_banned: false };
    if (action === 'BLACKLIST') updates = { is_approved: false, is_banned: true };
    if (action === 'RESET') updates = { is_approved: false, is_banned: false };

    const { error } = await supabase.from('app_user').update(updates).eq('id', userId);
    if (!error) fetchAdminData();
  };

  const assignSignal = async (inquiryId: string, providerId: string) => {
    if (!providerId) return;
    const { error } = await supabase
      .from('inquiry_submission')
      .update({ 
        assigned_provider_user_id: providerId, 
        status: 'assigned' 
      })
      .eq('id', inquiryId);
    
    if (!error) fetchAdminData();
  };

  const updateServiceRate = async (id: string, newRateCents: number) => {
    const { error } = await supabase.from('services').update({ base_rate_cents: newRateCents }).eq('id', id);
    if (!error) fetchAdminData();
  };

  const calculateRevenue = () => {
    return bookings.reduce((acc, b) => acc + (b.total_amount_cents || 0), 0) / 100;
  };

  const verifiedProviders = users.filter(u => u.role === 'PROVIDER' && u.is_approved && !u.is_banned);

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-black font-sans selection:bg-red-500 selection:text-white">
      <aside className="w-full md:w-80 bg-black text-white p-8 flex flex-col border-r-8 border-black z-50">
        <div className="mb-16">
          <h2 className="text-4xl font-black uppercase italic leading-none tracking-tighter">Command</h2>
          <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em]">Node: {user.name}</span>
        </div>
        
        <nav className="space-y-2 flex-grow">
          {[
            { id: 'hub', label: 'Command Hub', icon: '⚡' },
            { id: 'vetting', label: 'Personnel Desk', icon: '🛡️' },
            { id: 'services', label: 'Service Config', icon: '⚙️' },
            { id: 'monitoring', label: 'Safety Log', icon: '🚨' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`w-full text-left px-6 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-4 ${activeTab === tab.id ? 'bg-white text-black translate-x-4 shadow-[10px_10px_0px_0px_rgba(220,38,38,1)]' : 'text-slate-500 hover:text-white'}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        
        <button onClick={onLogout} className="mt-8 text-xs font-black uppercase tracking-widest text-red-500 border-4 border-red-500 py-4 hover:bg-red-500 hover:text-white transition-all">
          Terminate Session
        </button>
      </aside>

      <main className="flex-1 p-8 lg:p-16 overflow-y-auto bg-slate-50">
        {errorMsg && (
          <div className="bg-red-600 text-white p-6 border-8 border-black mb-10 font-black uppercase italic">
            Fault Detected: {errorMsg}
          </div>
        )}

        {activeTab === 'hub' && (
          <div className="space-y-16">
            <h1 className="text-8xl font-black uppercase italic tracking-tighter leading-none">Command Hub</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-white border-8 border-black p-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Total Revenue</p>
                <p className="text-6xl font-black tracking-tighter">${calculateRevenue().toLocaleString()}</p>
              </div>
              <div className="bg-white border-8 border-black p-10 shadow-[10px_10px_0px_0px_rgba(239,68,68,1)]">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Unvetted Personnel</p>
                <p className="text-6xl font-black tracking-tighter text-red-600">{users.filter(u => u.role === 'PROVIDER' && !u.is_approved && !u.is_banned).length}</p>
              </div>
              <div className="bg-white border-8 border-black p-10">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Unrouted Signals</p>
                <p className="text-6xl font-black tracking-tighter">{inquiries.filter(i => i.status === 'new').length}</p>
              </div>
              <div className="bg-black text-white border-8 border-black p-10">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">System Health</p>
                <p className="text-6xl font-black tracking-tighter italic text-emerald-400">OPTIMAL</p>
              </div>
            </div>

            <section className="space-y-8">
              <h2 className="text-4xl font-black uppercase italic tracking-tight">Signal Routing Matrix</h2>
              <div className="grid gap-6">
                {inquiries.filter(i => i.status === 'new').map(sig => (
                  <div key={sig.id} className="bg-white border-8 border-black p-8 flex flex-col lg:flex-row justify-between lg:items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 text-[8px] font-black bg-yellow-400 text-black uppercase">NEW SIGNAL</span>
                        <span className="text-[10px] font-black opacity-30">REF_{sig.id.slice(0,8)}</span>
                      </div>
                      <h3 className="text-3xl font-black uppercase italic">{sig.service_requested}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">FOR: {sig.full_name} • ${((sig.total_price_cents || 0)/100).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row gap-4 mt-6 lg:mt-0">
                      <select 
                        onChange={(e) => assignSignal(sig.id, e.target.value)}
                        className="bg-slate-100 border-4 border-black p-4 font-black uppercase text-xs outline-none focus:bg-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Select Verified Personnel</option>
                        {verifiedProviders.map(vp => (
                          <option key={vp.id} value={vp.id}>{vp.name} (ID: {vp.id.slice(0,5)})</option>
                        ))}
                      </select>
                      <button className="bg-black text-white px-8 py-4 font-black uppercase text-xs hover:invert transition-all">
                        Route Dispatch
                      </button>
                    </div>
                  </div>
                ))}
                {inquiries.filter(i => i.status === 'new').length === 0 && (
                  <div className="border-4 border-dashed border-slate-200 p-12 text-center text-slate-300 font-black uppercase tracking-widest italic">All Signals Routed</div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'vetting' && (
          <div className="space-y-12">
            <h1 className="text-8xl font-black uppercase italic tracking-tighter leading-none">Personnel Desk</h1>
            <div className="grid gap-6">
              {users.filter(u => u.role === 'PROVIDER').map(p => (
                <div key={p.id} className={`bg-white border-8 border-black p-10 flex flex-col lg:flex-row justify-between lg:items-center transition-all ${p.is_banned ? 'bg-red-50 grayscale opacity-70' : ''}`}>
                  <div className="mb-6 lg:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                       {p.is_banned ? (
                         <span className="px-3 py-1 text-[8px] font-black uppercase bg-black text-red-500">BLACKLISTED</span>
                       ) : p.is_approved ? (
                         <span className="px-3 py-1 text-[8px] font-black uppercase bg-emerald-500 text-white">VERIFIED NODE</span>
                       ) : (
                         <span className="px-3 py-1 text-[8px] font-black uppercase bg-yellow-400 text-black">AWAITING REVIEW</span>
                       )}
                       <span className="text-[10px] font-black opacity-30">UID_{p.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-4xl font-black uppercase italic leading-none">{p.name || 'ANON_NODE'}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{p.email} • {p.phone_e164 || 'NO_PHONE'}</p>
                  </div>
                  
                  <div className="flex gap-4">
                    {!p.is_approved && !p.is_banned && (
                      <>
                        <button onClick={() => handleProviderStatus(p.id, 'APPROVE')} className="bg-emerald-500 text-white px-8 py-5 font-black uppercase text-xs hover:bg-black transition-all">
                          Activate Node
                        </button>
                        <button onClick={() => handleProviderStatus(p.id, 'BLACKLIST')} className="bg-red-600 text-white px-8 py-5 font-black uppercase text-xs hover:bg-black transition-all">
                          Blacklist Node
                        </button>
                      </>
                    )}
                    {(p.is_approved || p.is_banned) && (
                      <button onClick={() => handleProviderStatus(p.id, 'RESET')} className="border-4 border-black px-8 py-5 font-black uppercase text-xs hover:bg-black hover:text-white transition-all">
                        Reset Status
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-12">
            <h1 className="text-8xl font-black uppercase italic tracking-tighter leading-none">Price Control</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map(s => (
                <div key={s.id} className="bg-white border-8 border-black p-10">
                  <h3 className="text-4xl font-black uppercase italic mb-4">{s.name}</h3>
                  <p className="text-slate-500 font-bold mb-8 italic">"{s.description}"</p>
                  <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Base Rate (Cents)</label>
                      <input type="number" defaultValue={s.base_rate_cents} onBlur={(e) => updateServiceRate(s.id, parseInt(e.target.value))} className="w-full border-4 border-black p-4 font-black text-2xl" />
                    </div>
                    <div className="p-4 bg-black text-white font-black text-xl">
                      ${(s.base_rate_cents/100).toFixed(2)}/HR
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-12">
            <h1 className="text-8xl font-black uppercase italic tracking-tighter leading-none">Safety Log</h1>
            <div className="grid gap-4">
              {monitoring.map(n => (
                <div key={n.id} className={`border-8 p-8 flex justify-between items-center ${n.priority === 'CRITICAL' ? 'bg-red-600 text-white border-black' : 'bg-white border-black'}`}>
                  <div className="flex-1">
                    <div className="flex gap-4 items-center mb-2">
                      <span className={`px-3 py-1 text-[8px] font-black uppercase ${n.priority === 'CRITICAL' ? 'bg-white text-red-600' : 'bg-black text-white'}`}>{n.priority}</span>
                      <span className="text-[10px] font-black opacity-40 uppercase">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-2xl font-black italic">"{n.content}"</p>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">Source: {n.app_user?.name || 'AUTHORIZED_NODE'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPortal;
