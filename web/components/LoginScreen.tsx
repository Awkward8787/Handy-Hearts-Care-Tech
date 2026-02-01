
import React, { useState } from 'react';
import { User, UserRole } from '../../types/entities';
import { supabase } from '../../lib/supabase';

interface LoginScreenProps {
  onLogin: (u: User) => void;
}

const ADMIN_EMAIL = 'awkwardjmusic@gmail.com';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
        if (password !== confirmPassword) throw new Error('Secret keys do not match.');
        
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: activeForm.role,
              full_name: fullName,
            }
          }
        });
        
        if (signupError) throw signupError;
        if (!data.session) {
          setMessage('Account Created. Please verify your email to activate the terminal.');
        } else {
          // If session is immediately available, App.tsx will handle the shift
          onLogin({
             id: data.user?.id || '',
             email: email,
             name: fullName,
             role: activeForm.role,
             is_approved: activeForm.role === UserRole.ADMIN || email === ADMIN_EMAIL
          });
        }
      } else {
        const { error: signinError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signinError) throw signinError;
      }
    } catch (err: any) {
      setError(err.message || 'Authentication sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  if (activeForm) {
    const isSignup = activeForm.mode === 'signup';
    const isAdminRole = activeForm.role === UserRole.ADMIN;
    
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full neo-card p-10 md:p-14 space-y-10">
          <div className="flex justify-between items-center border-b-4 border-black pb-6">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">
              {isAdminRole ? (isSignup ? 'Init Admin' : 'Terminal') : activeForm.mode === 'signup' ? 'Join' : 'Login'}
            </h2>
            <button onClick={() => setActiveForm(null)} className="font-black text-xs uppercase underline">Back</button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignup && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>

            {isSignup && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
            )}

            {error && <p className="text-red-600 font-black text-xs uppercase p-4 bg-red-50 border-2 border-red-600">{error}</p>}
            {message && <p className="text-emerald-600 font-black text-xs uppercase p-4 bg-emerald-50 border-2 border-emerald-600">{message}</p>}

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-6 neo-btn-primary ${isAdminRole ? 'bg-red-600 hover:bg-black' : ''}`}
            >
              {loading ? 'Processing...' : isSignup ? 'Initialize Account' : 'Access Dashboard'}
            </button>
            
            <button 
              type="button"
              onClick={() => setActiveForm({ ...activeForm, mode: isSignup ? 'signin' : 'signup' })}
              className="w-full text-center text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100"
            >
              {isSignup ? 'Already have an account? Log in' : 'New here? Create account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-8 border-b-4 border-black flex justify-between items-center bg-white">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">HandyHearts</h1>
        <button 
          onClick={() => setActiveForm({role: UserRole.ADMIN, mode: 'signin'})}
          className="text-[10px] font-black uppercase tracking-widest opacity-20 hover:opacity-100 hover:text-red-600"
        >
          Admin Portal
        </button>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 max-w-7xl mx-auto w-full">
        <div className="neo-card p-12 flex flex-col justify-between hover:bg-blue-600 hover:text-white transition-all group">
          <div className="space-y-6">
            <h2 className="text-7xl font-black uppercase leading-[0.9] italic tracking-tighter">I Need<br/>Support</h2>
            <p className="font-bold text-xl leading-snug">Elite care tech and assistance for your senior family members.</p>
          </div>
          <div className="mt-12 space-y-4">
            <button 
              onClick={() => setActiveForm({role: UserRole.FAMILY, mode: 'signup'})}
              className="w-full py-6 bg-black text-white font-black uppercase tracking-widest border-4 border-black group-hover:bg-white group-hover:text-black"
            >
              Get Started
            </button>
            <button 
              onClick={() => setActiveForm({role: UserRole.FAMILY, mode: 'signin'})}
              className="w-full py-6 border-4 border-black font-black uppercase tracking-widest group-hover:border-white"
            >
              Login
            </button>
          </div>
        </div>

        <div className="neo-card p-12 flex flex-col justify-between bg-black text-white hover:bg-emerald-500 transition-all group">
          <div className="space-y-6">
            <h2 className="text-7xl font-black uppercase leading-[0.9] italic tracking-tighter text-emerald-500 group-hover:text-white">Become<br/>A Pro</h2>
            <p className="font-bold text-xl leading-snug">Deploy your skills and earn by providing elite care tech services.</p>
          </div>
          <div className="mt-12 space-y-4">
            <button 
              onClick={() => setActiveForm({role: UserRole.PROVIDER, mode: 'signup'})}
              className="w-full py-6 bg-white text-black font-black uppercase tracking-widest border-4 border-white group-hover:bg-black group-hover:text-white group-hover:border-black"
            >
              Apply Now
            </button>
            <button 
              onClick={() => setActiveForm({role: UserRole.PROVIDER, mode: 'signin'})}
              className="w-full py-6 border-4 border-white font-black uppercase tracking-widest group-hover:border-black group-hover:text-black"
            >
              Pro Login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginScreen;
