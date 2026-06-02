import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';

const HIDE_NAV_ROUTES = ['/auth', '/login', '/register', '/forgot-password', '/setup'];

export const MobileLayout = () => {
  const { session } = useAuth();
  const { pathname } = useLocation();

  const showNav = session && !HIDE_NAV_ROUTES.some(r => pathname.startsWith(r));

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground relative overflow-hidden">
      <AppHeader />
      <main className="flex-1 w-full overflow-y-auto pb-24 mobile-scroll custom-scrollbar">
        <Outlet />
      </main>
      {showNav && <BottomNav />}
    </div>
  );
};
