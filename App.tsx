
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types/entities';
import AdminPortal from './web/AdminPortal';
import FamilyPortal from './web/FamilyPortal';
import ProviderPortal from './web/ProviderPortal';
import LoginScreen from './web/components/LoginScreen';
import { supabase } from './lib/supabase';

const ADMIN_EMAIL = 'awkwardjmusic@gmail.com';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchAndMapUser(session.user);
      }
      setInitializing(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchAndMapUser(session.user);
      } else {
        setUser(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const fetchAndMapUser = async (sbUser: any, retryCount = 0) => {
    // 1. Check for hardcoded Admin override immediately
    if (sbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setUser({
        id: sbUser.id,
        email: sbUser.email,
        name: sbUser.user_metadata?.full_name || 'Administrator',
        role: UserRole.ADMIN,
        is_approved: true,
        is_banned: false
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('app_user')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      if (error || !data) {
        if (retryCount < 5) {
          setTimeout(() => fetchAndMapUser(sbUser, retryCount + 1), 1000);
          return;
        }
        
        // Fallback mapping
        setUser({
          id: sbUser.id,
          email: sbUser.email || '',
          name: sbUser.user_metadata?.full_name || 'User',
          role: (sbUser.user_metadata?.role as UserRole || UserRole.FAMILY),
          is_approved: false,
          is_banned: false
        });
      } else {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          is_approved: data.is_approved,
          is_banned: data.is_banned
        });
      }
    } catch (e) {
      console.error('HandyHearts: Profile Mapping Error', e);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-black border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen">
      {user.role === UserRole.ADMIN && <AdminPortal user={user} onLogout={handleLogout} />}
      {user.role === UserRole.FAMILY && <FamilyPortal user={user} onLogout={handleLogout} />}
      {user.role === UserRole.PROVIDER && <ProviderPortal user={user} onLogout={handleLogout} />}
    </div>
  );
};

export default App;
