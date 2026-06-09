import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';

const HIDE_NAV_ROUTES = ['/auth', '/login', '/register', '/forgot-password', '/setup', '/index'];

export const WebLayout = () => {
  const { session } = useAuth();
  const { pathname } = useLocation();

  // Landing page gating
  const isLandingPage = pathname === '/' || pathname === '/index';
  const showNav = session && !isLandingPage && !HIDE_NAV_ROUTES.some(r => pathname.startsWith(r));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative w-full">
      {/* 
        Premium Web Command Center Layout 
        Features AppHeader for navigation, with BottomNav for mobile viewports.
      */}
      <AppHeader />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <Outlet />
      </main>

      {showNav && <BottomNav />}
    </div>
  );
};
