import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '@/components/layout/AppHeader';

export const WebLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative w-full">
      {/* 
        Premium Web Command Center Layout 
        Features AppHeader for navigation, no BottomNav.
      */}
      <AppHeader />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
