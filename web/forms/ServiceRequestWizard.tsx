
import React, { useState } from 'react';
import { Service, DeviceDetail, PriceBreakdown } from '../../types/entities';
import { PricingEngine } from '../../domain/pricingEngine';
import { ChevronRight, ChevronLeft, Plus, Laptop, Smartphone, Tv, Wifi, Printer, ShieldCheck, HelpCircle } from 'lucide-react';

interface WizardProps {
  services: Service[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ServiceRequestWizard: React.FC<WizardProps> = ({ services, onSubmit, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    urgency: 'low',
    devices: [] as DeviceDetail[],
    seniorName: '',
    comfortLevel: 'beginner',
    accessibility: [] as string[],
    serviceType: 'in_home',
    address: '',
    preferredDate: '',
    preferredTime: 'anytime',
    notes: ''
  });

  const categories = [
    { id: 'device_setup', label: 'Device Setup', icon: <Laptop className="w-8 h-8"/> },
    { id: 'troubleshooting', label: 'Fix/Repair', icon: <ShieldCheck className="w-8 h-8"/> },
    { id: 'training', label: 'Learning', icon: <HelpCircle className="w-8 h-8"/> },
    { id: 'wifi_setup', label: 'WiFi/Network', icon: <Wifi className="w-8 h-8"/> },
    { id: 'printer_setup', label: 'Printers', icon: <Printer className="w-8 h-8"/> }
  ];

  const addDevice = () => {
    setFormData({
      ...formData,
      devices: [...formData.devices, { deviceType: 'smartphone_iphone', brand: '', model: '', issueDescription: '' }]
    });
  };

  const updateDevice = (index: number, field: keyof DeviceDetail, value: string) => {
    const newDevices = [...formData.devices];
    newDevices[index] = { ...newDevices[index], [field]: value };
    setFormData({ ...formData, devices: newDevices });
  };

  const calculateTotal = (): PriceBreakdown => {
    const baseService = services.find(s => s.name.toLowerCase().includes(formData.category.replace('_', ' '))) || services[0];
    return PricingEngine.calculate(
      { name: baseService.name, baseRate: baseService.base_rate_cents, minHours: baseService.min_hours },
      baseService.min_hours,
      false,
      formData.urgency !== 'low'
    );
  };

  const quote = step === 6 ? calculateTotal() : null;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex justify-between mb-12">
        {[1, 2, 3, 4, 5, 6].map(s => (
          <div key={s} className={`h-2 flex-1 mx-1 ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        ))}
      </div>

      <div className="neo-card p-10 md:p-16">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic">1. What do you need?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setFormData({...formData, category: c.id})}
                  className={`p-8 border-4 border-black flex flex-col items-center gap-4 font-bold uppercase text-xs transition-all ${formData.category === c.id ? 'bg-blue-600 text-white translate-x-1 translate-y-1 shadow-none' : 'bg-white hover:bg-blue-50'}`}
                >
                  {c.icon}
                  {c.label}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <p className="font-black uppercase text-xs opacity-50">Is this urgent?</p>
              <div className="flex gap-4">
                {['low', 'medium', 'high'].map(u => (
                  <button 
                    key={u}
                    onClick={() => setFormData({...formData, urgency: u as any})}
                    className={`px-6 py-3 border-4 border-black font-black uppercase text-[10px] ${formData.urgency === u ? 'bg-black text-white' : 'bg-white'}`}
                  >
                    {u === 'low' ? 'Standard' : u === 'medium' ? 'Expedited (+$15)' : 'Emergency (+$25)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic">2. Device Details</h2>
            {formData.devices.map((d, idx) => (
              <div key={idx} className="p-6 border-4 border-black bg-slate-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    value={d.deviceType} 
                    onChange={e => updateDevice(idx, 'deviceType', e.target.value)}
                    className="w-full"
                  >
                    <option value="smartphone_iphone">iPhone</option>
                    <option value="smartphone_android">Android</option>
                    <option value="laptop_mac">Macbook</option>
                    <option value="laptop_windows">Windows PC</option>
                    <option value="smart_tv">Smart TV</option>
                  </select>
                  <input 
                    placeholder="Brand (e.g. Apple, Samsung)" 
                    value={d.brand} 
                    onChange={e => updateDevice(idx, 'brand', e.target.value)}
                  />
                </div>
                <textarea 
                  placeholder="What's wrong with this device?" 
                  value={d.issueDescription}
                  onChange={e => updateDevice(idx, 'issueDescription', e.target.value)}
                  className="w-full"
                  rows={2}
                />
              </div>
            ))}
            <button onClick={addDevice} className="flex items-center gap-2 font-black uppercase text-sm border-b-4 border-black pb-1 hover:text-blue-600 transition-all">
              <Plus className="w-4 h-4"/> Add Another Device
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic">3. Senior Info</h2>
            <div className="space-y-6">
              <input 
                placeholder="Senior's Name" 
                className="w-full text-2xl font-black"
                value={formData.seniorName}
                onChange={e => setFormData({...formData, seniorName: e.target.value})}
              />
              <div className="space-y-2">
                <p className="font-black uppercase text-xs opacity-50">Tech Comfort Level</p>
                <div className="grid grid-cols-3 gap-4">
                  {['beginner', 'intermediate', 'advanced'].map(lvl => (
                    <button 
                      key={lvl}
                      onClick={() => setFormData({...formData, comfortLevel: lvl as any})}
                      className={`p-4 border-4 border-black font-black uppercase text-[10px] ${formData.comfortLevel === lvl ? 'bg-black text-white' : 'bg-white'}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic">4. Scheduling</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setFormData({...formData, serviceType: 'in_home'})} className={`p-6 border-4 border-black font-bold uppercase ${formData.serviceType === 'in_home' ? 'bg-blue-600 text-white' : ''}`}>In-Home Visit</button>
                <button onClick={() => setFormData({...formData, serviceType: 'remote'})} className={`p-6 border-4 border-black font-bold uppercase ${formData.serviceType === 'remote' ? 'bg-blue-600 text-white' : ''}`}>Remote Help</button>
              </div>
              <input type="date" className="w-full" value={formData.preferredDate} onChange={e => setFormData({...formData, preferredDate: e.target.value})} />
              {formData.serviceType === 'in_home' && (
                <textarea placeholder="Deployment Address" className="w-full" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic">5. Final Briefing</h2>
            <textarea 
              placeholder="Any special instructions for our helper? (e.g. 'My mom gets anxious, please call first')" 
              className="w-full h-48"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        )}

        {step === 6 && quote && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black uppercase italic">6. Review & Submit</h2>
            <div className="bg-slate-50 border-4 border-black p-8 space-y-4">
              <div className="flex justify-between font-black uppercase text-xs border-b-2 border-black pb-2">
                <span>Deployment Module</span>
                <span className="text-blue-600">{formData.category.replace('_', ' ')}</span>
              </div>
              {quote.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm font-bold opacity-60">
                  <span>{item.label}</span>
                  <span>${(item.amount/100).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between text-3xl font-black border-t-4 border-black pt-4">
                <span>TOTAL EST.</span>
                <span>${(quote.total/100).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase text-slate-400">By submitting, you authorize a payment hold on your card. Charge occurs only after deployment completion.</p>
          </div>
        )}

        <div className="mt-12 flex justify-between gap-4">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-8 py-4 border-4 border-black font-black uppercase text-xs flex items-center gap-2 hover:bg-slate-100">
              <ChevronLeft className="w-4 h-4"/> Back
            </button>
          ) : (
            <button onClick={onCancel} className="px-8 py-4 font-black uppercase text-xs text-red-600">Cancel</button>
          )}

          {step < 6 ? (
            <button onClick={() => setStep(step + 1)} className="neo-btn-primary px-12 py-4 flex items-center gap-2">
              Next Step <ChevronRight className="w-4 h-4"/>
            </button>
          ) : (
            <button onClick={() => onSubmit(formData)} className="bg-emerald-500 text-white border-4 border-black px-12 py-4 font-black uppercase italic tracking-tighter shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-[-4px] active:translate-y-0">
              Launch Dispatch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestWizard;
