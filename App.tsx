import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types/entities';
import AdminPortal from './web/AdminPortal';
import FamilyPortal from './web/FamilyPortal';
import ProviderPortal from './web/ProviderPortal';
import LoginScreen from './web/components/LoginScreen';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("HandyHearts: Session retrieval error:", sessionError);
        }

        if (session?.user) {
          await fetchAndMapUser(session.user);
        }
      } catch (e) {
        console.error("HandyHearts: Critical Boot Failure:", e);
      } finally {
        setLoading(false);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchAndMapUser(session.user);
      } else {
        setUser(null);
        setSyncError(false);
      }
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const fetchAndMapUser = async (sbUser: any, retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('app_user')
        .select('role, name, is_approved, is_banned')
        .eq('id', sbUser.id)
        .single();

      if (error || !data) {
        // If it's a new user, the trigger might be lagging. Retry up to 3 times.
        if (retryCount < 3) {
          console.log(`HandyHearts: Profile sync lag. Retry ${retryCount + 1}...`);
          setTimeout(() => fetchAndMapUser(sbUser, retryCount + 1), 1500);
          return;
        }
        
        // Fallback if database record still hasn't appeared
        console.warn('HandyHearts: Public profile missing, using auth metadata fallback.');
        setUser({
          id: sbUser.id,
          email: sbUser.email || '',
          name: sbUser.user_metadata?.full_name || 'User',
          role: (sbUser.user_metadata?.role as UserRole) || UserRole.FAMILY,
          is_approved: false,
          is_banned: false
        });
        setSyncError(true);
      } else {
        setUser({
          id: sbUser.id,
          email: sbUser.email || '',
          name: data.name || 'User',
          role: data.role as UserRole,
          is_approved: data.is_approved,
          is_banned: data.is_banned
        });
        setSyncError(false);
      }
    } catch (e) {
      console.error('HandyHearts: Profile Sync Failed:', e);
      setSyncError(true);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-8 border-black border-t-blue-600 animate-spin mb-4"></div>
        <p className="font-black uppercase text-xs tracking-widest">Establishing Link...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={(u) => setUser(u)} />;
  }

  // If there's a persistent sync error, show a warning but allow access if fallback role is safe
  const SyncWarning = () => syncError ? (
    <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 border-4 border-black font-black uppercase text-[10px] z-[9999] animate-bounce">
      Profile Sync Delayed: Some features may be restricted.
    </div>
  ) : null;

  return (
    <>
      <SyncWarning />
      {user.role === UserRole.ADMIN ? (
        <AdminPortal user={user} onLogout={handleLogout} />
      ) : user.role === UserRole.FAMILY ? (
        <FamilyPortal user={user} onLogout={handleLogout} />
      ) : user.role === UserRole.PROVIDER ? (
        <ProviderPortal user={user} onLogout={handleLogout} />
      ) : (
        <div className="min-h-screen flex items-center justify-center p-20 text-center font-black uppercase flex-col gap-4">
          <span className="text-6xl">🚫</span>
          <span>Unauthorized Role State.</span>
          <button onClick={handleLogout} className="underline text-sm">Return to Terminal</button>
        </div>
      )}
    </>
  );
};

export default App;