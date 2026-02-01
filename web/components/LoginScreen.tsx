import React, { useState } from 'react';
import { User, UserRole } from '../../types/entities';
import { supabase } from '../../lib/supabase';

interface LoginScreenProps {
  onLogin: (u: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [activeForm, setActiveForm] = useState<{role: UserRole, mode: 'signin' | 'signup'} | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (activeForm.mode === 'signup') {
        if (!fullName || !email || !phone || !password || !confirmPassword) {
          throw new Error('All operational parameters are required.');
        }

        if (password !== confirmPassword) {
          throw new Error('Secret keys do not match. Verify and retry.');
        }

        if (password.length < 6) {
          throw new Error('Security keys must be at least 6 characters.');
        }

        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: activeForm.role,
              full_name: fullName,
              phone_e164: phone,
            }
          }
        });
        
        if (signupError) throw signupError;
        
        if (data.user && data.session) {
          setMessage('Node Initialized. Link established.');
        } else {
          setMessage('Sequence Initiated. Check your email for the activation code.');
        }
      } else {
        const { error: signinError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signinError) throw signinError;
      }
    } catch (err: any) {
      console.error('HandyHearts Auth Error:', err);
      
      if (err.message?.includes('Database error saving new user')) {
        setError('CRITICAL: Database Profile Trigger failed. Please run the provided SQL setup script in your Supabase Dashboard to enable profile sync.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('VERIFICATION REQUIRED: Please check your inbox for the activation link.');
      } else {
        setError(err.message || 'Authentication sequence failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActiveForm(null);
    setError('');
    setMessage('');
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
  };

  if (activeForm) {
    const isCareTech = activeForm.role === UserRole.PROVIDER;
    const isAdmin = activeForm.role === UserRole.ADMIN;
    const isSignup = activeForm.mode === 'signup';
    
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${
        isAdmin ? 'bg-white text-black' : isCareTech ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <div className={`max-w-md w-full border-[8px] p-8 md:p-12 space-y-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.15)] ${
          isAdmin ? 'border-red-600 shadow-red-100' : isCareTech ? 'border-white' : 'border-black'
        }`}>
          <div className="flex justify-between items-center">
            <button 
              onClick={resetForm}
              className={`text-sm font-black uppercase underline decoration-4 underline-offset-8 hover:opacity-50 transition-opacity ${isAdmin ? 'decoration-red-600' : ''}`}
            >
              ← BACK
            </button>
            {!isAdmin && (
              <button 
                onClick={() => setActiveForm({ ...activeForm, mode: isSignup ? 'signin' : 'signup' })}
                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 border-2 ${isCareTech ? 'border-white text-white' : 'border-black'}`}
              >
                {isSignup ? 'SWITCH TO LOGIN' : 'SWITCH TO REGISTRATION'}
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            <h2 className={`text-5xl font-black uppercase tracking-tight italic ${isAdmin ? 'text-red-600' : ''}`}>
              {isAdmin ? (isSignup ? 'REGISTER NODE' : 'TERMINAL') : isSignup ? 'JOIN US' : 'LOGIN'}
            </h2>
            <p className={`font-bold uppercase tracking-[0.2em] text-xs opacity-60`}>
              {activeForm.role} ACCESS
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              {isSignup && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em]">Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full border-4 p-4 text-lg font-bold transition-all outline-none ${
                        isAdmin ? 'bg-white border-red-600 text-black placeholder:text-slate-300' :
                        isCareTech ? 'border-white bg-black text-white focus:bg-white focus:text-black placeholder:text-slate-700' : 
                        'border-black bg-white text-black focus:bg-black focus:text-white placeholder:text-slate-300'
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em]">Phone Number *</label>
                    <input 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full border-4 p-4 text-lg font-bold transition-all outline-none ${
                        isAdmin ? 'bg-white border-red-600 text-black placeholder:text-slate-300' :
                        isCareTech ? 'border-white bg-black text-white focus:bg-white focus:text-black placeholder:text-slate-700' : 
                        'border-black bg-white text-black focus:bg-black focus:text-white placeholder:text-slate-300'
                      }`}
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.3em]">Email Address *</label>
                <input 
                  type="email" 
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border-4 p-4 text-lg font-bold transition-all outline-none ${
                    isAdmin ? 'bg-white border-red-600 text-black placeholder:text-slate-300' :
                    isCareTech ? 'border-white bg-black text-white focus:bg-white focus:text-black placeholder:text-slate-700' : 
                    'border-black bg-white text-black focus:bg-black focus:text-white placeholder:text-slate-300'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.3em]">Password *</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border-4 p-4 text-lg font-bold transition-all outline-none ${
                    isAdmin ? 'bg-white border-red-600 text-black placeholder:text-slate-300' :
                    isCareTech ? 'border-white bg-black text-white focus:bg-white focus:text-black placeholder:text-slate-700' : 
                    'border-black bg-white text-black focus:bg-black focus:text-white placeholder:text-slate-300'
                  }`}
                  required
                />
              </div>

              {isSignup && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em]">Confirm Password *</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full border-4 p-4 text-lg font-bold transition-all outline-none ${
                      isAdmin ? 'bg-white border-red-600 text-black placeholder:text-slate-300' :
                      isCareTech ? 'border-white bg-black text-white focus:bg-white focus:text-black placeholder:text-slate-700' : 
                      'border-black bg-white text-black focus:bg-black focus:text-white placeholder:text-slate-300'
                    }`}
                    required
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="border-4 p-4 border-red-600 bg-red-600/10">
                <p className="font-black text-[10px] uppercase text-red-600 leading-tight">{error}</p>
              </div>
            )}
            
            {message && (
              <div className="border-4 p-4 border-emerald-600 bg-emerald-600/10 text-emerald-600">
                <p className="font-black text-xs uppercase">{message}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-6 text-2xl font-black uppercase tracking-widest transition-all active:scale-[0.98] ${
                isAdmin ? 'bg-red-600 text-white hover:bg-black' :
                isCareTech ? 'bg-white text-black hover:bg-slate-200' : 
                'bg-black text-white hover:invert'
              }`}
            >
              {loading ? 'PROCESSING...' : isSignup ? 'INITIALIZE NODE' : 'ACCESS NODE'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col selection:bg-black selection:text-white overflow-x-hidden">
      <header className="p-8 md:p-12 border-b-8 border-black">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">HandyHearts</h1>
          <div className="hidden lg:flex items-center gap-2">
            <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Node Online</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row items-stretch p-4 md:p-12 gap-8 md:gap-12 max-w-7xl mx-auto w-full">
        <section className="flex-1 flex flex-col justify-between p-10 md:p-16 border-[8px] border-black bg-white transition-all hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] group">
          <div>
            <div className="flex items-center gap-4 mb-10">
              <span className="w-16 h-[8px] bg-black"></span>
              <span className="text-sm font-black uppercase tracking-[0.5em]">Family Node</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-10 italic">Request<br/>Support</h2>
            <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-tight">Elite technical and personal care for your loved ones.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16">
            <button onClick={() => setActiveForm({role: UserRole.FAMILY, mode: 'signin'})} className="bg-black text-white py-8 text-xl font-black uppercase tracking-widest hover:invert transition-all">Log In</button>
            <button onClick={() => setActiveForm({role: UserRole.FAMILY, mode: 'signup'})} className="border-[6px] border-black py-8 text-xl font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Join Us</button>
          </div>
        </section>

        <section className="flex-1 flex flex-col justify-between p-10 md:p-16 border-[8px] border-black bg-black text-white transition-all hover:shadow-[20px_20px_0px_0px_rgba(0,0,0,0.1)] group">
          <div>
            <div className="flex items-center gap-4 mb-10">
              <span className="w-16 h-[8px] bg-white"></span>
              <span className="text-sm font-black uppercase tracking-[0.5em]">Provider Node</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-10 italic">Deploy<br/>Care</h2>
            <p className="text-2xl md:text-3xl font-medium text-slate-300 leading-tight">Professional grade care delivery systems.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-16">
            <button onClick={() => setActiveForm({role: UserRole.PROVIDER, mode: 'signin'})} className="bg-white text-black py-8 text-xl font-black uppercase tracking-widest hover:invert transition-all">Log In</button>
            <button onClick={() => setActiveForm({role: UserRole.PROVIDER, mode: 'signup'})} className="border-[6px] border-white py-8 text-xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Apply</button>
          </div>
        </section>
      </main>

      <footer className="p-12 border-t-8 border-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-400">© 2025 HANDYHEARTS TECHNOLOGY CORP</div>
          <button 
            onClick={() => setActiveForm({role: UserRole.ADMIN, mode: 'signin'})} 
            className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-200 hover:text-red-600 transition-colors"
          >
            System Terminal
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LoginScreen;