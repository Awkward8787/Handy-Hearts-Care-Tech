
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchAndMapUser(session.user);
      }
      setLoading(false);
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchAndMapUser(session.user);
      } else {
        setUser(null);
      }
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
      console.error('HandyHearts: Context Mapping Failed:', e);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-10">
          <div className="w-24 h-24 border-[14px] border-black border-t-red-500 animate-spin"></div>
          <h2 className="text-3xl font-black uppercase tracking-[0.4em] italic leading-none animate-pulse">HandyHearts</h2>
        </div>
      </div>
    );
  }

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
      return <div className="p-20 text-center font-black uppercase">Unauthorized Role State.</div>;
  }
};

export default App;
