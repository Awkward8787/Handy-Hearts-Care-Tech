
import React, { useState, useEffect } from 'react';
import { User, UserRole, InquirySubmission, InquiryStatus, MonitoringNote } from '../types/entities';
import { supabase } from '../lib/supabase';

interface AdminPortalProps {
  user: User;
  onLogout: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inquiries, setInquiries] = useState<InquirySubmission[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [monitoringNotes, setMonitoringNotes] = useState<MonitoringNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    verifyAdminRole();
  }, []);

  useEffect(() => {
    if (isVerified === true) {
      fetchAdminData();
    }
  }, [activeTab, isVerified]);

  const verifyAdminRole = async () => {
    try {
      // Re-verify from DB directly to ensure role integrity
      const { data, error } = await supabase
        .from('app_user')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || data?.role !== UserRole.ADMIN) {
        console.error('HandyHearts Security: Admin verification failed.', error);
        setErrorMsg('Security Verification Failed. Access Restricted.');
        setIsVerified(false);
        // Delay logout to show error message
        setTimeout(onLogout, 5000);
      } else {
        setIsVerified(true);
      }
    } catch (err: any) {
      console.error('HandyHearts Critical: System fault during verification.', err);
      setErrorMsg(`System Error: ${err.message}`);
      setIsVerified(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'inquiries' || activeTab === 'dashboard') {
        const { data, error } = await supabase
          .from('inquiry_submission')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
           if (error.code === '42P01') {
             console.warn('Table inquiry_submission missing. Run your SQL migration.');
           } else {
             throw error;
           }
        }
        setInquiries(data || []);
      }

      if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('app_user')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setProfiles(data || []);
      }

      if (activeTab === 'monitoring') {
        const { data, error } = await supabase
          .from('admin_monitoring_notes')
          .select('*, author:app_user(name)')
          .order('created_at', { ascending: false });
        
        if (error) {
          if (error.code === '42P01') {
            setErrorMsg('Table "admin_monitoring_notes" not found. Please verify DB schema.');
          } else {
            throw error;
          }
        }
        setMonitoringNotes(data || []);
      }
    } catch (err: any) {
      setErrorMsg(`Database fetch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateInquiryStatus = async (id: string, status: InquiryStatus) => {
    try {
      const { error } = await supabase
        .from('inquiry_submission')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      fetchAdminData();
    } catch (err: any) {
      alert(`Operation failed: ${err.message}`);
    }
  };

  if (isVerified === false) {
    return (
      <div className="min-h-screen bg-red-600 text-white flex flex-col items-center justify-center p-10 text-center font-black uppercase">
        <h1 className="text-6xl mb-4 italic leading-none animate-bounce">Security<br/>Isolation</h1>
        <p className="tracking-widest opacity-80 mb-8 max-w-md">The system has detected an unauthorized access attempt to the Command Node.</p>
        <div className="bg-black p-4 border-2 border-white text-xs font-mono">
          ERROR_CODE: ROLE_MISMATCH_OR_DB_DISCONNECT<br/>
          {errorMsg}
        </div>
        <button onClick={onLogout} className="mt-10 px-8 py-4 border-4 border-white font-black hover:bg-white hover:text-red-600 transition-all">TERMINATE SESSION</button>
      </div>
    );
  }

  if (isVerified === null) {
    return (
      <div className="min-h-screen bg-slate-900 text-red-500 flex flex-col items-center justify-center font-mono uppercase tracking-[0.5em] space-y-8">
        <div className="w-16 h-16 border-8 border-red-500 border-t-transparent animate-spin"></div>
        <p className="animate-pulse text-sm">Verifying Command Privileges...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-slate-900 font-sans selection:bg-red-500 selection:text-white">
      <aside className="w-full md:w-80 bg-slate-900 text-white p-8 flex flex-col border-r-8 border-black z-50">
        <div className="mb-16">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">HandyHearts</h2>
          <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em]">Node: RootAdmin</span>
        </div>
        
        <nav className="space-y-4 flex-grow">
          {[
            { id: 'dashboard', label: 'Command Hub' },
            { id: 'inquiries', label: 'Global Inquiries' },
            { id: 'users', label: 'Active Users' },
            { id: 'monitoring', label: 'Safety Log' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black translate-x-4 shadow-[10px_10px_0px_0px_rgba(239,68,68,1)]' : 'text-slate-500 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
        
        <button onClick={onLogout} className="mt-8 text-xs font-black uppercase tracking-widest text-red-500 border-4 border-red-500 py-5 hover:bg-red-500 hover:text-white transition-all">
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8 lg:p-20 overflow-y-auto bg-slate-50">
        {errorMsg && (
          <div className="bg-red-100 border-[8px] border-red-600 p-8 mb-12 flex items-center gap-6">
            <div className="text-4xl">⚠️</div>
            <div>
              <p className="font-black uppercase text-red-600 leading-tight">System Notification</p>
              <p className="font-bold text-red-800 text-sm">{errorMsg}</p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-16">
            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic">Status</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white border-8 border-black p-12 hover:shadow-[15px_15px_0px_0px_rgba(239,68,68,1)] transition-all">
                <p className="text-xs font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">New Entries</p>
                <p className="text-8xl font-black tracking-tighter">{(inquiries || []).filter(i => i.status === 'new').length}</p>
              </div>
              <div className="bg-white border-8 border-black p-12">
                <p className="text-xs font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Total Inquiries</p>
                <p className="text-8xl font-black tracking-tighter">{(inquiries || []).length}</p>
              </div>
              <div className="bg-black text-white border-8 border-black p-12">
                <p className="text-xs font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Platform Health</p>
                <p className="text-8xl font-black tracking-tighter text-emerald-500 animate-pulse">Optimum</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-12">
            <h1 className="text-7xl font-black uppercase italic tracking-tighter">Global Data</h1>
            {inquiries.length === 0 ? (
              <div className="p-20 border-8 border-dashed border-slate-300 text-center font-black uppercase text-slate-300 text-2xl">No Data Packets Found</div>
            ) : (
              <div className="grid gap-8">
                {inquiries.map(i => (
                  <div key={i.id} className="bg-white border-[8px] border-black p-10 flex flex-col lg:flex-row justify-between gap-10 hover:translate-x-4 transition-transform shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex-1">
                      <div className="flex gap-4 items-center mb-4">
                        <span className={`px-4 py-1 text-[10px] font-black uppercase ${i.status === 'new' ? 'bg-yellow-400' : 'bg-black text-white'}`}>{i.status}</span>
                        <span className="text-[10px] font-black uppercase opacity-20 tracking-widest">{new Date(i.created_at).toLocaleString()}</span>
                      </div>
                      <h3 className="text-4xl font-black uppercase italic leading-none">{i.full_name}</h3>
                      <p className="font-bold text-slate-400 uppercase text-sm mt-2">{i.service_requested} • {i.email} • {i.phone_e164}</p>
                      <div className="mt-6 p-6 bg-slate-100 border-l-8 border-black font-medium italic">"{i.notes || 'No notes provided.'}"</div>
                    </div>
                    <div className="lg:w-64 flex flex-col gap-3">
                      <button onClick={() => updateInquiryStatus(i.id, 'in_review')} className="bg-black text-white py-4 font-black uppercase text-xs hover:invert transition-all">Review Packet</button>
                      <button onClick={() => updateInquiryStatus(i.id, 'closed')} className="border-4 border-black py-4 font-black uppercase text-xs hover:bg-red-500 hover:text-white transition-all">Archive</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-12">
            <h1 className="text-7xl font-black uppercase italic tracking-tighter">Personnel</h1>
            <div className="grid gap-4">
              {profiles.length === 0 ? (
                <div className="p-20 text-center font-black uppercase text-slate-400">Node Directory Empty</div>
              ) : (
                profiles.map(p => (
                  <div key={p.id} className="bg-white border-8 border-black p-8 flex justify-between items-center hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div>
                      <span className={`px-2 py-1 text-[8px] font-black uppercase ${p.role === 'ADMIN' ? 'bg-red-600 text-white' : 'bg-black text-white'}`}>{p.role}</span>
                      <h3 className="text-3xl font-black uppercase italic mt-1">{p.name || 'Anonymous Node'}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.email}</p>
                    </div>
                    <div className="text-[10px] font-black opacity-20">UID_{p.id.slice(0, 8)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-12">
            <h1 className="text-7xl font-black uppercase italic tracking-tighter">Safety Log</h1>
            <div className="grid gap-6">
              {monitoringNotes.length === 0 ? (
                <div className="p-32 border-8 border-dashed border-slate-200 text-center font-black uppercase text-slate-300">Log Buffer Empty</div>
              ) : (
                monitoringNotes.map(n => (
                  <div key={n.id} className={`border-[8px] p-8 ${n.priority === 'CRITICAL' ? 'border-red-600 bg-red-50' : 'border-black bg-white'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-4 py-1 text-[10px] font-black uppercase ${n.priority === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-black text-white'}`}>{n.priority}</span>
                      <span className="text-[10px] font-black opacity-40">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xl font-bold leading-tight mb-4 italic">"{n.content}"</p>
                    <p className="text-[10px] font-black uppercase opacity-60">Source: {n.author?.full_name || 'System'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPortal;
