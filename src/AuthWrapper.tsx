import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from './firebase';
import { LandingPage } from './components/LandingPage';
import App from './App';

export interface LocalUser {
  uid: string;
  displayName: string;
  email: string;
  role?: string;
}

export const AuthWrapper: React.FC = () => {
  const [user, setUser] = useState<User | LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for saved session
    const saved = localStorage.getItem('tf_user_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.uid) {
          setUser(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem('tf_user_session');
      }
    }

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      const activeSaved = localStorage.getItem('tf_user_session');
      if (!activeSaved) {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLocalLogin = (localUser: LocalUser) => {
    localStorage.setItem('tf_user_session', JSON.stringify(localUser));
    setUser(localUser);
  };

  const handleSignOut = async () => {
    localStorage.removeItem('tf_user_session');
    try {
      await auth.signOut();
    } catch (e) {
      // ignore
    }
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLocalLogin={handleLocalLogin} />;
  }

  return <App user={user} onSignOut={handleSignOut} />;
};

