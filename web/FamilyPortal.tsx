
import React, { useState, useEffect } from 'react';
import { User, Service, InquirySubmission, PriceBreakdown } from '../types/entities';
import { supabase } from '../lib/supabase';
import { PricingEngine } from '../domain/pricingEngine';
import { getStripe } from '../lib/stripe';

interface FamilyPortalProps {
  user: User;
  onLogout: () => void;
}

const FamilyPortal: React.FC<FamilyPortalProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<'SERVICES' | 'INQUIRY' | 'CHECKOUT' | 'MY_INQUIRIES'>('SERVICES');
  const [services, setServices] = useState<Service[]>([]);
  const [inquiries, setInquiries] = useState<InquirySubmission[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quote, setQuote] = useState<PriceBreakdown | null>(null);

  const [inquiryForm, setInquiryForm] = useState({
    fullName: user.name,
    email: user.email,
    phone: user.phone_e164 || '',
    serviceName: '',
    hours: 2,
    notes: ''
  });

  useEffect(() => {
    fetchServices();
    fetchMyInquiries();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').eq('is_active', true);
    setServices(data || []);
  };

  const fetchMyInquiries = async () => {
    const { data } = await supabase.from('inquiry_submission').select('*').order('created_at', { ascending: false });
    setInquiries(data || []);
  };

  const handleServiceSelection = (service: Service) => {
    setSelectedService(service);
    const initialQuote = PricingEngine.calculate(
      { name: service.name, baseRate: service.base_rate_cents, minHours: service.min_hours },
      service.min_hours
    );
    setQuote(initialQuote);
    setInquiryForm({ ...inquiryForm, serviceName: service.name, hours: service.min_hours });
    setView('INQUIRY');
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // In a real app, this would create a 'booking' record in 'pending' state
      const { error } = await supabase.from('inquiry_submission').insert({
        user_id: user.id,
        full_name: inquiryForm.fullName,
        email: inquiryForm.email,
        phone_e164: inquiryForm.phone,
        service_requested: inquiryForm.serviceName,
        notes: inquiryForm.notes,
        status: 'new'
      });
      if (error) throw error;
      
      setView('CHECKOUT');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiatePayment = async () => {
    setIsSubmitting(true);
    try {
      const stripe = await getStripe();
      if (!stripe) throw new Error('Stripe failed to initialize.');

      // Mocking the backend call to /payments/create-intent
      console.log('HandyHearts: Initiating payment for $', quote?.total ? quote.total / 100 : 0);
      
      // Simulation of a successful payment redirect
      setTimeout(() => {
        alert('Payment successful! Mission is now live.');
        fetchMyInquiries();
        setView('MY_INQUIRIES');
        setIsSubmitting(false);
      }, 1500);
    } catch (err: any) {
      alert(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-yellow-300">
      <nav className="border-b-8 border-black p-8 flex flex-col md:flex-row justify-between items-center sticky top-0 bg-white z-40 gap-4">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter">HandyHearts</h2>
        <div className="flex flex-wrap gap-2 md:gap-4">
          <button onClick={() => setView('SERVICES')} className={`px-4 py-2 md:px-6 md:py-3 text-[10px] font-black uppercase border-4 border-black transition-all ${view === 'SERVICES' ? 'bg-black text-white' : 'hover:bg-slate-100'}`}>Catalog</button>
          <button onClick={() => setView('MY_INQUIRIES')} className={`px-4 py-2 md:px-6 md:py-3 text-[10px] font-black uppercase border-4 border-black transition-all ${view === 'MY_INQUIRIES' ? 'bg-black text-white' : 'hover:bg-slate-100'}`}>My Signals</button>
          <button onClick={onLogout} className="px-4 py-2 md:px-6 md:py-3 text-[10px] font-black uppercase text-red-600 border-4 border-transparent hover:border-red-600 transition-all">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-20">
        {view === 'SERVICES' && (
          <div className="space-y-16">
            <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter italic leading-none">Care<br/>Catalog</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {services.map(s => (
                <div key={s.id} className="border-8 border-black p-10 hover:shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] transition-all bg-white flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-4xl font-black uppercase mb-4 italic leading-tight">{s.name}</h3>
                    <p className="text-lg font-bold text-slate-500 mb-8 leading-snug">"{s.description}"</p>
                    <div className="p-6 bg-slate-100 border-l-8 border-black mb-8 space-y-2">
                      <p className="text-[10px] font-black uppercase opacity-40">Operational Rate</p>
                      <p className="text-4xl font-black">${(s.base_rate_cents/100).toFixed(2)} / HR</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Min Deployment: {s.min_hours} Hours</p>
                    </div>
                  </div>
                  <button onClick={() => handleServiceSelection(s)} className="w-full bg-black text-white py-6 font-black uppercase text-xl hover:bg-red-600 transition-colors">Select Module</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'INQUIRY' && (
          <div className="max-w-3xl mx-auto border-8 border-black p-8 md:p-16 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] bg-white">
            <h2 className="text-5xl font-black uppercase italic mb-10 leading-none">Mission Parameters</h2>
            <form onSubmit={handleInquirySubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Service Module</label>
                  <input readOnly value={inquiryForm.serviceName} className="w-full border-4 border-black p-5 font-black text-xl bg-slate-50 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Target Hours</label>
                  <input 
                    type="number" 
                    min={selectedService?.min_hours || 1} 
                    value={inquiryForm.hours} 
                    onChange={e => {
                      const h = parseInt(e.target.value);
                      setInquiryForm({...inquiryForm, hours: h});
                      if(selectedService) {
                        setQuote(PricingEngine.calculate(
                          { name: selectedService.name, baseRate: selectedService.base_rate_cents, minHours: selectedService.min_hours },
                          h
                        ));
                      }
                    }}
                    className="w-full border-4 border-black p-5 font-black text-xl outline-none focus:bg-yellow-50" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Mission Briefing / Notes</label>
                <textarea 
                  required 
                  rows={4} 
                  value={inquiryForm.notes} 
                  onChange={e => setInquiryForm({...inquiryForm, notes: e.target.value})} 
                  className="w-full border-4 border-black p-5 font-black text-xl outline-none focus:bg-yellow-50" 
                  placeholder="Enter specific care requirements or technical tasks..." 
                />
              </div>

              {quote && (
                <div className="border-t-4 border-black pt-8 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest">Est. Deployment Total:</span>
                    <span className="text-4xl font-black">${(quote.total/100).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full bg-black text-white py-8 font-black uppercase text-2xl hover:bg-emerald-500 hover:text-black transition-all">
                {isSubmitting ? 'TRANSMITTING...' : 'INITIATE DISPATCH'}
              </button>
              <button type="button" onClick={() => setView('SERVICES')} className="w-full py-4 font-black uppercase text-xs opacity-40 hover:opacity-100">← Return to Catalog</button>
            </form>
          </div>
        )}

        {view === 'CHECKOUT' && (
          <div className="max-w-2xl mx-auto border-8 border-black p-8 md:p-16 bg-white shadow-[30px_30px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-6xl font-black uppercase italic mb-4 leading-none tracking-tighter text-red-600">Secure<br/>Checkout</h2>
            <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-12 italic">Transaction Node: {user.id.slice(0,8)}</p>
            
            <div className="bg-slate-50 border-4 border-black p-8 mb-12 space-y-6">
              <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2">Receipt Breakdown</h3>
              {quote?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center font-bold text-sm">
                  <span>{item.label}</span>
                  <span>${(item.amount/100).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center border-t-4 border-black pt-4 text-3xl font-black uppercase">
                <span>Total Due</span>
                <span>${(quote?.total ? quote.total/100 : 0).toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={initiatePayment} 
              disabled={isSubmitting}
              className="w-full bg-emerald-500 text-black py-8 font-black uppercase text-2xl border-8 border-black hover:bg-black hover:text-white transition-all shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-x-2 active:translate-y-2 active:shadow-none"
            >
              {isSubmitting ? 'AUTHORIZING...' : 'PAY NOW VIA STRIPE'}
            </button>
            <p className="text-center text-[8px] font-black uppercase mt-8 opacity-30 tracking-widest leading-relaxed">
              Payments processed by Stripe. 256-bit encrypted operational tunnel established.
            </p>
          </div>
        )}

        {view === 'MY_INQUIRIES' && (
          <div className="space-y-16">
            <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-none">Signal Log</h1>
            <div className="grid gap-8">
              {inquiries.length === 0 ? (
                <div className="border-8 border-dashed border-slate-200 p-20 text-center uppercase font-black text-slate-300 text-2xl italic">No Missions Logged</div>
              ) : (
                inquiries.map(i => (
                  <div key={i.id} className="border-8 border-black p-10 bg-white flex flex-col md:flex-row justify-between items-start md:items-center group transition-all hover:bg-slate-50">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest ${i.status === 'new' ? 'bg-yellow-400 text-black' : 'bg-black text-white'}`}>{i.status}</span>
                        <span className="text-[10px] font-black opacity-30 uppercase">REF: {i.id.slice(0, 12)}</span>
                      </div>
                      <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight">{i.service_requested}</h3>
                      <p className="font-bold text-slate-500 mt-4 max-w-xl line-clamp-2">"{i.notes}"</p>
                    </div>
                    <div className="text-right w-full md:w-auto">
                      <p className="font-black uppercase text-xl md:text-2xl italic">{new Date(i.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] font-black uppercase opacity-20 tracking-widest mt-2">Authenticated Timestamp</p>
                    </div>
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

export default FamilyPortal;
