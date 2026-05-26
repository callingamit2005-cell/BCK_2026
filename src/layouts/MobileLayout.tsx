import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/contexts/AuthContext';

export const MobileLayout = () => {
  const { session } = useAuth();
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden w-full h-full max-w-[100vw]">
      {/* 
        Native Android Mobile Layout 
        No AppHeader, relies on BottomNav
      */}
      <main className="flex-1 w-full pb-24">
        <Outlet />
      </main>
      
      {session && <BottomNav />}
    </div>
  );
};
