
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
      }
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const fetchAndMapUser = async (sbUser: any) => {
    try {
      const { data, error } = await supabase
        .from('app_user')
        .select('role, name, is_approved, is_banned')
        .eq('id', sbUser.id)
        .single();

      if (!error && data) {
        setUser({
          id: sbUser.id,
          email: sbUser.email || '',
          name: data.name || 'User',
          role: data.role as UserRole,
          is_approved: data.is_approved,
          is_banned: data.is_banned
        });
      } else {
        // Fallback for new users or sync delays
        setUser({
          id: sbUser.id,
          email: sbUser.email || '',
          name: sbUser.user_metadata?.full_name || 'New User',
          role: (sbUser.user_metadata?.role as UserRole) || UserRole.FAMILY,
          is_approved: false,
          is_banned: false
        });
      }
    } catch (e) {
      console.error('HandyHearts: Profile Sync Failed:', e);
      // Even if database profile fails, we set a basic user object based on auth metadata
      setUser({
        id: sbUser.id,
        email: sbUser.email || '',
        name: sbUser.user_metadata?.full_name || 'User',
        role: (sbUser.user_metadata?.role as UserRole) || UserRole.FAMILY,
        is_approved: false,
        is_banned: false
      });
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  // Loading screen removed per user request. 
  // The app will now show the LoginScreen until a session is established.

  if (!user) {
    return <LoginScreen onLogin={(u) => setUser(u)} />;
  }

  switch (user.role) {
    case UserRole.ADMIN:
      return <AdminPortal user={user} onLogout={handleLogout} />;
    case UserRole.FAMILY:
      return <FamilyPortal user={user} onLogout={handleLogout} />;
    case UserRole.PROVIDER:
      return <ProviderPortal user={user} onLogout={handleLogout} />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center p-20 text-center font-black uppercase flex-col gap-4">
          <span className="text-6xl">🚫</span>
          <span>Unauthorized Role State.</span>
          <button onClick={handleLogout} className="underline text-sm">Return to Terminal</button>
        </div>
      );
  }
};

export default App;
