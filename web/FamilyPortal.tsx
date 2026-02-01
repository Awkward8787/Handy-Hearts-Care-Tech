
import React, { useState, useEffect } from 'react';
import { User, Service, InquirySubmission } from '../types/entities';
import { supabase } from '../lib/supabase';
import ServiceRequestWizard from './forms/ServiceRequestWizard';
import { LayoutDashboard, PlusCircle, History, LogOut, MessageSquare, Send, X, Bot } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface FamilyPortalProps {
  user: User;
  onLogout: () => void;
}

const FamilyPortal: React.FC<FamilyPortalProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<'DASHBOARD' | 'WIZARD' | 'HISTORY'>('DASHBOARD');
  const [services, setServices] = useState<Service[]>([]);
  const [inquiries, setInquiries] = useState<InquirySubmission[]>([]);
  const [loading, setLoading] = useState(false);
  
  // AI Chat State
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase.from('services').select('*').eq('is_active', true);
      const { data: i } = await supabase.from('inquiry_submission').select('*').order('created_at', { ascending: false });
      setServices(s || []);
      setInquiries(i || []);
    } catch (err) {
      console.error("Data Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const askAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    
    setAiLoading(true);
    setAiResponse(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
        config: {
          systemInstruction: "You are the HandyHearts Care Assistant. You help families understand technology for seniors. Be concise, patient, and helpful. If they ask about services, recommend hiring a HandyHearts Pro. Your tone should be encouraging but professional."
        }
      });
      setAiResponse(response.text || "I'm having trouble processing that request right now.");
      setAiPrompt('');
    } catch (err) {
      console.error("AI Assistant Error:", err);
      setAiResponse("System Fault: The AI logic core is currently unavailable.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleWizardSubmit = async (formData: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('inquiry_submission').insert({
        user_id: user.id,
        full_name: user.name,
        service_category: formData.category,
        urgency: formData.urgency,
        devices: formData.devices,
        senior_info: {
          name: formData.seniorName,
          comfortLevel: formData.comfortLevel,
          accessibilityNeeds: formData.accessibility
        },
        scheduling: {
          serviceType: formData.serviceType,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          address: formData.address
        },
        notes: formData.notes,
        status: 'submitted',
        total_price_cents: 8500 
      });

      if (error) throw error;
      setView('DASHBOARD');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r-4 border-black p-8 flex flex-col gap-8 z-20">
        <h1 className="text-3xl font-black uppercase tracking-tighter italic border-b-4 border-black pb-4">HandyHearts</h1>
        <nav className="flex-grow space-y-4">
          <button onClick={() => setView('DASHBOARD')} className={`w-full flex items-center gap-4 p-4 font-black uppercase text-xs border-4 border-black transition-all ${view === 'DASHBOARD' ? 'bg-blue-600 text-white shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1'}`}>
            <LayoutDashboard size={18}/> Dashboard
          </button>
          <button onClick={() => setView('WIZARD')} className={`w-full flex items-center gap-4 p-4 font-black uppercase text-xs border-4 border-black transition-all ${view === 'WIZARD' ? 'bg-blue-600 text-white shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1'}`}>
            <PlusCircle size={18}/> New Mission
          </button>
          <button onClick={() => setView('HISTORY')} className={`w-full flex items-center gap-4 p-4 font-black uppercase text-xs border-4 border-black transition-all ${view === 'HISTORY' ? 'bg-blue-600 text-white shadow-none translate-x-1 translate-y-1' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1'}`}>
            <History size={18}/> Signal Log
          </button>
        </nav>
        <button onClick={onLogout} className="flex items-center gap-4 p-4 font-black uppercase text-xs text-red-600 border-4 border-transparent hover:border-red-600 transition-all">
          <LogOut size={18}/> Terminate Session
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {view === 'DASHBOARD' && (
          <div className="p-8 md:p-16 space-y-12">
            <header>
              <h2 className="text-7xl font-black uppercase tracking-tighter italic leading-none">Command Center</h2>
              <p className="font-bold text-slate-400 uppercase tracking-widest mt-4">Node Profile: {user.name} • Active Signals: {inquiries.filter(i => i.status !== 'completed').length}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="neo-card p-8 bg-blue-600 text-white">
                <h3 className="text-xl font-black uppercase mb-2">New Request</h3>
                <p className="text-sm font-bold opacity-80 mb-8">Deploy professional care tech for your family members.</p>
                <button onClick={() => setView('WIZARD')} className="w-full bg-white text-black py-4 font-black uppercase text-xs border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">Initiate Sequence</button>
              </div>
              
              <div className="neo-card p-8">
                <h3 className="text-xl font-black uppercase mb-2">Active Signal</h3>
                {inquiries.filter(i => i.status !== 'completed')[0] ? (
                  <div className="space-y-4">
                    <p className="text-3xl font-black italic uppercase leading-none">{inquiries.filter(i => i.status !== 'completed')[0].service_category.replace(/_/g, ' ')}</p>
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 font-black uppercase text-[10px]">Status: {inquiries.filter(i => i.status !== 'completed')[0].status}</span>
                  </div>
                ) : (
                  <p className="text-slate-300 font-black uppercase italic">No active signals detected.</p>
                )}
              </div>
            </div>

            <section className="space-y-6">
              <h3 className="text-3xl font-black uppercase italic tracking-tight">Recent Activity</h3>
              <div className="space-y-4">
                {inquiries.slice(0, 5).map(inq => (
                  <div key={inq.id} className="neo-card p-6 flex justify-between items-center group">
                    <div>
                      <h4 className="text-xl font-black uppercase italic">{inq.service_category.replace(/_/g, ' ')}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(inq.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-4 py-1 border-4 border-black font-black uppercase text-[10px] ${inq.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-yellow-400'}`}>{inq.status}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {view === 'WIZARD' && (
          <ServiceRequestWizard 
            services={services} 
            onCancel={() => setView('DASHBOARD')} 
            onSubmit={handleWizardSubmit} 
          />
        )}

        {view === 'HISTORY' && (
          <div className="p-8 md:p-16 space-y-12">
             <h2 className="text-7xl font-black uppercase tracking-tighter italic leading-none">Signal History</h2>
             <div className="grid gap-6">
               {inquiries.map(inq => (
                 <div key={inq.id} className="neo-card p-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div>
                      <span className="text-[10px] font-black opacity-20 block mb-2 tracking-[0.4em]">REF_{inq.id.slice(0,12)}</span>
                      <h3 className="text-4xl font-black uppercase italic">{inq.service_category.replace(/_/g, ' ')}</h3>
                      <p className="font-bold text-slate-400 mt-2">DEPLOYED FOR: {inq.senior_info?.name || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black italic mb-2">${((inq.total_price_cents || 0)/100).toFixed(2)}</p>
                      <span className="px-4 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest">{inq.status}</span>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </main>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-8 right-8 z-50">
        {!aiOpen ? (
          <button 
            onClick={() => setAiOpen(true)}
            className="w-16 h-16 bg-black text-white rounded-none border-4 border-black shadow-[6px_6px_0px_0px_rgba(37,99,235,1)] flex items-center justify-center hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <MessageSquare size={24} />
          </button>
        ) : (
          <div className="w-80 md:w-96 neo-card bg-white p-6 animate-in slide-in-from-right-8">
            <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-4">
              <h4 className="font-black uppercase italic flex items-center gap-2">
                <Bot className="text-blue-600" /> Care Assistant
              </h4>
              <button onClick={() => setAiOpen(false)}><X size={20}/></button>
            </div>
            
            <div className="h-64 overflow-y-auto mb-4 bg-slate-50 p-4 font-bold text-xs space-y-4">
              {aiResponse ? (
                <div className="p-4 bg-white border-2 border-black italic leading-relaxed">
                  {aiResponse}
                </div>
              ) : (
                <p className="opacity-30">Ask me anything about senior tech support...</p>
              )}
              {aiLoading && <div className="animate-pulse font-black text-blue-600">THINKING...</div>}
            </div>

            <form onSubmit={askAI} className="flex gap-2">
              <input 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 p-3 text-xs outline-none"
              />
              <button type="submit" disabled={aiLoading} className="bg-black text-white p-3 border-2 border-black hover:bg-blue-600 transition-colors disabled:opacity-50">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyPortal;
