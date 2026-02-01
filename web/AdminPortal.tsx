
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
  const [monitoringNotes, setMonitoringNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedRole, setDetectedRole] = useState<string | null>(null);

  useEffect(() => {
    verifyAdminRole();
  }, [user.id]);

  useEffect(() => {
    if (isVerified === true) {
      fetchAdminData();
    }
  }, [activeTab, isVerified]);

  const verifyAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from('app_user')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        setDetectedRole('NOT_FOUND');
        setErrorMsg(`Profile record missing in DB. Run the Master SQL Fix script.`);
        setIsVerified(false);
        return;
      }

      setDetectedRole(data?.role);

      if (data?.role !== 'ADMIN') {
        setErrorMsg(`Access Denied: Role is '${data?.role}'. Admin status required.`);
        setIsVerified(false);
      } else {
        setIsVerified(true);
      }
    } catch (err: any) {
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
        if (error) throw error;
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
        // Explicitly naming the relationship 'app_user!author_id' to fix cache issues
        const { data, error } = await supabase
          .from('admin_monitoring_notes')
          .select(`
            *,
            app_user ( name )
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Join Query Error:", error);
          // Fallback to simple fetch if relationship is still sync'ing
          const { data: simpleData, error: simpleError } = await supabase
            .from('admin_monitoring_notes')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (simpleError) throw simpleError;
          setMonitoringNotes(simpleData || []);
          setErrorMsg("Note: Database relationship cache is refreshing. Author names may be hidden temporarily.");
        } else {
          setMonitoringNotes(data || []);
        }
      }
    } catch (err: any) {
      setErrorMsg(`DB Error: ${err.message}. Check your Supabase table settings.`);
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 sm:p-10 text-center font-black uppercase">
        <div className="max-w-xl w-full border-[12px] border-red-600 p-8 sm:p-12 shadow-[30px_30px_0px_0px_rgba(220,38,38,0.2)] bg-black">
          <h1 className="text-4xl sm:text-6xl mb-6 italic leading-none text-red-600">Access Denied</h1>
          <div className="bg-red-950/20 p-6 mb-10 text-left border-l-8 border-red-600">
            <p className="text-[10px] tracking-widest text-red-400 font-mono">SECURITY FAULT:</p>
            <p className="font-bold text-sm text-white uppercase font-mono">{errorMsg}</p>
          </div>
          <button onClick={onLogout} className="w-full py-6 bg-red-600 text-white font-black hover:bg-white hover:text-black transition-all uppercase tracking-widest text-xl">
            EXIT TERMINAL
          </button>
        </div>
      </div>
    );
  }

  if (isVerified === null) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center font-mono uppercase tracking-[0.5em] space-y-8">
        <div className="w-20 h-20 border-[12px] border-black border-t-red-600 animate-spin"></div>
        <p className="animate-pulse text-xs font-black">Syncing Node...</p>
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
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'inquiries', label: 'Inquiries' },
            { id: 'users', label: 'Users' },
            { id: 'monitoring', label: 'Safety Log' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`w-full text-left px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-black translate-x-4 shadow-[10px_10px_0px_0px_rgba(239,68,68,1)]' : 'text-slate-500 hover:text-white'}`}
            >
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
            <p className="font-bold text-red-800 text-sm">{errorMsg}</p>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-16">
            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic leading-none">Status</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white border-8 border-black p-12 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-xs font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Signals</p>
                <p className="text-8xl font-black tracking-tighter">{inquiries.length}</p>
              </div>
              <div className="bg-white border-8 border-black p-12">
                <p className="text-xs font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Personnel</p>
                <p className="text-8xl font-black tracking-tighter">{profiles.length}</p>
              </div>
              <div className="bg-black text-white border-8 border-black p-12">
                <p className="text-xs font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Security</p>
                <p className="text-8xl font-black tracking-tighter text-emerald-500 italic">ON</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="space-y-12">
            <h1 className="text-7xl font-black uppercase italic tracking-tighter">Inquiry List</h1>
            <div className="grid gap-8">
              {inquiries.length === 0 && !loading && (
                 <div className="p-32 border-8 border-dashed border-slate-200 text-center uppercase font-black text-slate-300">Queue Empty</div>
              )}
              {inquiries.map(i => (
                <div key={i.id} className="bg-white border-[8px] border-black p-10 flex flex-col lg:flex-row justify-between gap-10 hover:translate-x-4 transition-transform shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex-1">
                    <div className="flex gap-4 items-center mb-4">
                      <span className={`px-4 py-1 text-[10px] font-black uppercase ${i.status === 'new' ? 'bg-yellow-400' : 'bg-black text-white'}`}>{i.status}</span>
                      <span className="text-[10px] font-black opacity-20 uppercase tracking-widest">{new Date(i.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-4xl font-black uppercase italic leading-none">{i.full_name}</h3>
                    <p className="font-bold text-slate-400 uppercase text-sm mt-2">{i.service_requested} • {i.email}</p>
                    <div className="mt-6 p-6 bg-slate-100 border-l-8 border-black italic font-medium">"{i.notes}"</div>
                  </div>
                  <div className="lg:w-64 flex flex-col gap-3">
                    <button onClick={() => updateInquiryStatus(i.id, 'in_review')} className="bg-black text-white py-4 font-black uppercase text-xs hover:bg-emerald-500 hover:text-black transition-all">Review</button>
                    <button onClick={() => updateInquiryStatus(i.id, 'closed')} className="border-4 border-black py-4 font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all">Archive</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-12">
            <h1 className="text-7xl font-black uppercase italic tracking-tighter">Personnel</h1>
            <div className="grid gap-4">
              {profiles.map(p => (
                <div key={p.id} className="bg-white border-8 border-black p-8 flex justify-between items-center hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div>
                    <span className={`px-2 py-1 text-[8px] font-black uppercase ${p.role === 'ADMIN' ? 'bg-red-600 text-white' : 'bg-black text-white'}`}>{p.role}</span>
                    <h3 className="text-3xl font-black uppercase italic mt-1">{p.name || 'Unknown Node'}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.email}</p>
                  </div>
                  <div className="text-[10px] font-black opacity-20 uppercase">UID_{p.id.slice(0, 8)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-12">
            <h1 className="text-7xl font-black uppercase italic tracking-tighter">Safety Log</h1>
            <div className="grid gap-6">
              {monitoringNotes.length === 0 ? (
                <div className="border-8 border-dashed border-slate-200 p-20 text-center text-slate-300 uppercase font-black tracking-widest">No Logs Found</div>
              ) : (
                monitoringNotes.map(n => (
                  <div key={n.id} className={`border-[8px] p-8 ${n.priority === 'CRITICAL' ? 'border-red-600 bg-red-50' : 'border-black bg-white'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-4 py-1 text-[10px] font-black uppercase ${n.priority === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-black text-white'}`}>{n.priority}</span>
                      <span className="text-[10px] font-black opacity-40">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xl font-bold italic mb-4">"{n.content}"</p>
                    <p className="text-[10px] font-black uppercase opacity-60">Author: {n.app_user?.name || 'Authorized Node'}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPortal;
