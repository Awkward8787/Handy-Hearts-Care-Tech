
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
  
  // Data States
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
      if (activeTab === 'hub') {
        const { data: i } = await supabase.from('inquiry_submission').select('*');
        const { data: u } = await supabase.from('app_user').select('*');
        const { data: b } = await supabase.from('bookings').select('*');
        setInquiries(i || []);
        setUsers(u || []);
        setBookings(b || []);
      } else if (activeTab === 'vetting') {
        const { data } = await supabase.from('app_user').select('*').eq('role', 'PROVIDER');
        setUsers(data || []);
      } else if (activeTab === 'services') {
        const { data } = await supabase.from('services').select('*').order('name');
        setServices(data || []);
      } else if (activeTab === 'monitoring') {
        const { data } = await supabase.from('admin_monitoring_notes').select('*, app_user(name)').order('created_at', { ascending: false });
        setMonitoring(data || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('app_user').update({ is_approved: !currentStatus }).eq('id', userId);
    if (!error) fetchAdminData();
  };

  const updateServiceRate = async (id: string, newRateCents: number) => {
    const { error } = await supabase.from('services').update({ base_rate_cents: newRateCents }).eq('id', id);
    if (!error) fetchAdminData();
  };

  const calculateRevenue = () => {
    return bookings.reduce((acc, b) => acc + (b.total_amount_cents || 0), 0) / 100;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-black font-sans selection:bg-red-500 selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-80 bg-black text-white p-8 flex flex-col border-r-8 border-black z-50">
        <div className="mb-16">
          <h2 className="text-4xl font-black uppercase italic leading-none tracking-tighter">Command</h2>
          <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em]">Node: {user.name}</span>
        </div>
        
        <nav className="space-y-2 flex-grow">
          {[
            { id: 'hub', label: 'Command Hub', icon: '⚡' },
            { id: 'vetting', label: 'Vetting Queue', icon: '🛡️' },
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

      {/* Main Content Area */}
      <main className="flex-1 p-8 lg:p-16 overflow-y-auto bg-slate-50">
        {errorMsg && (
          <div className="bg-red-600 text-white p-6 border-8 border-black mb-10 font-black uppercase italic">
            Fault Detected: {errorMsg}
          </div>
        )}

        {activeTab === 'hub' && (
          <div className="space-y-12">
            <h1 className="text-8xl font-black uppercase italic tracking-tighter leading-none">Command Hub</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-white border-8 border-black p-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Total Revenue</p>
                <p className="text-6xl font-black tracking-tighter">${calculateRevenue().toLocaleString()}</p>
              </div>
              <div className="bg-white border-8 border-black p-10 shadow-[10px_10px_0px_0px_rgba(239,68,68,1)]">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Unvetted Providers</p>
                <p className="text-6xl font-black tracking-tighter text-red-600">{users.filter(u => u.role === 'PROVIDER' && !u.is_approved).length}</p>
              </div>
              <div className="bg-white border-8 border-black p-10">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">Active Signals</p>
                <p className="text-6xl font-black tracking-tighter">{inquiries.filter(i => i.status === 'new').length}</p>
              </div>
              <div className="bg-black text-white border-8 border-black p-10">
                <p className="text-[10px] font-black uppercase opacity-40 mb-2">System Health</p>
                <p className="text-6xl font-black tracking-tighter italic text-emerald-400">99.8%</p>
              </div>
            </div>

            <div className="bg-white border-8 border-black p-12">
              <h2 className="text-3xl font-black uppercase italic mb-8 border-b-4 border-black pb-4">Recent Bookings</h2>
              {bookings.length === 0 ? (
                <p className="text-slate-300 font-black uppercase italic py-10 text-center">No Transactions Logged</p>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
                      <span className="font-black text-xs uppercase tracking-widest">{new Date(b.created_at).toLocaleDateString()}</span>
                      <span className="font-bold">Amt: ${(b.total_amount_cents/100).toFixed(2)}</span>
                      <span className={`px-3 py-1 text-[8px] font-black uppercase ${b.status === 'PAID' ? 'bg-emerald-500 text-white' : 'bg-black text-white'}`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vetting' && (
          <div className="space-y-12">
            <h1 className="text-8xl font-black uppercase italic tracking-tighter leading-none">Personnel Vetting</h1>
            <div className="grid gap-6">
              {users.map(p => (
                <div key={p.id} className={`bg-white border-8 border-black p-10 flex justify-between items-center transition-all ${!p.is_approved ? 'border-red-600 bg-red-50 shadow-[12px_12px_0px_0px_rgba(220,38,38,0.1)]' : ''}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className={`px-3 py-1 text-[8px] font-black uppercase ${p.is_approved ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'}`}>
                        {p.is_approved ? 'VERIFIED' : 'PENDING'}
                       </span>
                       <span className="text-[10px] font-black opacity-30">UID_{p.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-4xl font-black uppercase italic leading-none">{p.name || 'ANON_NODE'}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{p.email} • {p.phone_e164 || 'NO_PHONE'}</p>
                  </div>
                  <button 
                    onClick={() => toggleApproval(p.id, p.is_approved)}
                    className={`px-8 py-5 font-black uppercase text-xs transition-all ${p.is_approved ? 'bg-black text-white hover:bg-red-600' : 'bg-red-600 text-white hover:bg-black'}`}
                  >
                    {p.is_approved ? 'Revoke Access' : 'Approve Node'}
                  </button>
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
                      <input 
                        type="number" 
                        defaultValue={s.base_rate_cents}
                        onBlur={(e) => updateServiceRate(s.id, parseInt(e.target.value))}
                        className="w-full border-4 border-black p-4 font-black text-2xl"
                      />
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
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">Source: {n.app_user?.name || 'ROOT_SYSTEM'}</p>
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
