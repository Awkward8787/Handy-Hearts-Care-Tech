
import React, { useState, useEffect } from 'react';
import { User, Service, Booking, InquirySubmission } from '../types/entities';
import { supabase } from '../lib/supabase';
import { PricingEngine } from '../domain/pricingEngine';

interface FamilyPortalProps {
  user: User;
  onLogout: () => void;
}

const FamilyPortal: React.FC<FamilyPortalProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<'SERVICES' | 'MY_BOOKINGS' | 'INQUIRY' | 'MY_INQUIRIES'>('SERVICES');
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<InquirySubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inquiryForm, setInquiryForm] = useState({
    fullName: user.name,
    email: user.email,
    phone: user.phone_e164 || '',
    service: '',
    date: '',
    notes: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (view === 'MY_BOOKINGS') fetchBookings();
    if (view === 'MY_INQUIRIES') fetchMyInquiries();
  }, [view]);

  const fetchServices = async () => {
    try {
      const { data, error: fetchError } = await supabase.from('services').select('*').eq('is_active', true);
      if (fetchError) throw fetchError;
      setServices(data || []);
    } catch (err: any) {
      console.warn('Backend unavailable, showing demo services');
      setServices([
        { id: '1', name: 'Tech Concierge', description: 'Smart home setup, tablet training, and remote support.', base_rate_cents: 4500, min_hours: 1 },
        { id: '2', name: 'Errand Runner', description: 'Groceries, prescriptions, and light housework.', base_rate_cents: 3500, min_hours: 2 },
        { id: '3', name: 'Companion Care', description: 'Meaningful social engagement and wellness checks.', base_rate_cents: 5000, min_hours: 3 }
      ]);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase.from('bookings').select('*, service:services(name)').order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setBookings(data || []);
    } catch (err: any) {
      setError('Could not retrieve booking history.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyInquiries = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase.from('inquiry_submission').select('*').order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setInquiries(data || []);
    } catch (err: any) {
      setError('Could not retrieve inquiry records.');
    } finally {
      setLoading(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final check for required fields (HTML5 required already handles most)
    if (!inquiryForm.fullName || !inquiryForm.phone || !inquiryForm.service || !inquiryForm.date || !inquiryForm.notes) {
      alert('Error: All dispatch parameters are required for mission planning.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: submitError } = await supabase.from('inquiry_submission').insert({
        user_id: user.id,
        role_snapshot: user.role,
        full_name: inquiryForm.fullName,
        email: inquiryForm.email,
        phone_e164: inquiryForm.phone,
        service_requested: inquiryForm.service,
        preferred_date: inquiryForm.date,
        notes: inquiryForm.notes,
        status: 'new'
      });
      if (submitError) throw submitError;
      alert('Inquiry Dispatched Successfully.');
      setView('MY_INQUIRIES');
    } catch (err: any) {
      alert(`Submission Error: ${err.message}. Ensure your database connection is active.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-yellow-300">
      <nav className="border-b-8 border-black p-8 flex flex-wrap justify-between items-center sticky top-0 bg-white z-40 gap-6">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter">HandyHearts</h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => setView('SERVICES')} className={`px-6 py-3 text-xs font-black uppercase border-4 border-black transition-all ${view === 'SERVICES' ? 'bg-black text-white translate-y-[-4px] shadow-[4px_4px_0px_0px_rgba(250,204,21,1)]' : 'hover:bg-slate-50'}`}>Catalog</button>
          <button onClick={() => setView('INQUIRY')} className={`px-6 py-3 text-xs font-black uppercase border-4 border-black transition-all ${view === 'INQUIRY' ? 'bg-black text-white translate-y-[-4px] shadow-[4px_4px_0px_0px_rgba(250,204,21,1)]' : 'hover:bg-slate-50'}`}>New Inquiry</button>
          <button onClick={() => setView('MY_INQUIRIES')} className={`px-6 py-3 text-xs font-black uppercase border-4 border-black transition-all ${view === 'MY_INQUIRIES' ? 'bg-black text-white translate-y-[-4px] shadow-[4px_4px_0px_0px_rgba(250,204,21,1)]' : 'hover:bg-slate-50'}`}>Requests</button>
          <button onClick={onLogout} className="px-6 py-3 text-xs font-black uppercase border-4 border-transparent text-red-600 hover:border-red-600">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 md:p-12 lg:p-20">
        {error && <div className="bg-red-50 border-8 border-red-600 p-8 mb-12 font-black uppercase text-red-600">{error}</div>}

        {view === 'SERVICES' && (
          <div className="space-y-16">
            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter italic leading-none">Catalog</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {services.map(s => (
                <div key={s.id} className="border-8 border-black p-10 flex flex-col justify-between hover:shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all bg-white group">
                  <div>
                    <h3 className="text-4xl font-black uppercase mb-4 italic leading-tight group-hover:text-yellow-500 transition-colors">{s.name}</h3>
                    <p className="text-lg font-medium text-slate-600 mb-8 leading-snug">{s.description}</p>
                    <p className="font-black text-2xl tracking-tighter">${(s.base_rate_cents/100).toFixed(2)} / HOUR</p>
                  </div>
                  <button onClick={() => { setInquiryForm({...inquiryForm, service: s.name}); setView('INQUIRY'); }} className="mt-12 bg-black text-white py-6 font-black uppercase text-xl hover:bg-yellow-400 hover:text-black transition-all">Select</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'INQUIRY' && (
          <div className="max-w-3xl mx-auto border-8 border-black p-12 shadow-[25px_25px_0px_0px_rgba(0,0,0,1)] bg-white">
            <h2 className="text-5xl font-black uppercase italic mb-10 leading-none">Dispatch Request</h2>
            <form onSubmit={handleInquirySubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block opacity-40">Client Name *</label>
                  <input required value={inquiryForm.fullName} onChange={e => setInquiryForm({...inquiryForm, fullName: e.target.value})} className="w-full border-4 border-black p-5 font-black text-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block opacity-40">Contact Phone *</label>
                  <input required placeholder="+1..." value={inquiryForm.phone} onChange={e => setInquiryForm({...inquiryForm, phone: e.target.value})} className="w-full border-4 border-black p-5 font-black text-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest block opacity-40">Service Module *</label>
                <select required value={inquiryForm.service} onChange={e => setInquiryForm({...inquiryForm, service: e.target.value})} className="w-full border-4 border-black p-5 font-black uppercase text-xl appearance-none">
                  <option value="">Select Target Module</option>
                  {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  <option value="Custom">Custom / Specialized</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest block opacity-40">Mission Date *</label>
                <input required type="datetime-local" value={inquiryForm.date} onChange={e => setInquiryForm({...inquiryForm, date: e.target.value})} className="w-full border-4 border-black p-5 font-black text-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest block opacity-40">Detailed Instructions *</label>
                <textarea required rows={5} value={inquiryForm.notes} onChange={e => setInquiryForm({...inquiryForm, notes: e.target.value})} className="w-full border-4 border-black p-5 font-black text-xl placeholder:opacity-20" placeholder="Provide specific requirements..." />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-8 font-black uppercase text-2xl hover:bg-emerald-500 hover:text-black transition-all disabled:opacity-30">
                {isSubmitting ? 'TRANSMITTING...' : 'DISPATCH MISSION'}
              </button>
            </form>
          </div>
        )}

        {view === 'MY_INQUIRIES' && (
          <div className="space-y-16">
            <h1 className="text-7xl font-black uppercase italic tracking-tighter">Mission Log</h1>
            <div className="grid gap-8">
              {inquiries.length === 0 && !loading && <div className="p-32 border-8 border-dashed border-slate-200 text-center uppercase font-black text-slate-300 text-2xl tracking-[0.5em]">No Log Data</div>}
              {inquiries.map(i => (
                <div key={i.id} className="border-8 border-black p-10 bg-white hover:translate-x-4 transition-transform shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)] flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${i.status === 'new' ? 'bg-yellow-400' : 'bg-black text-white'}`}>{i.status}</span>
                      <span className="text-[10px] font-black opacity-20 uppercase tracking-widest">{new Date(i.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-4xl font-black uppercase italic">{i.service_requested}</h3>
                    <p className="text-slate-500 font-bold mt-2">"{i.notes || 'Standard protocol.'}"</p>
                  </div>
                  <div className="text-right font-black uppercase text-[10px] opacity-20 tracking-tighter">REF_{i.id.slice(0, 8)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FamilyPortal;
