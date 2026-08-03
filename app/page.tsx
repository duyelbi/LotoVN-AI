'use client';

import React, { useState, useEffect } from 'react';
import { LotteryType } from '@/lib/types';
import { Navbar, NavTab } from '@/components/Navbar';
import { DashboardTab } from '@/components/DashboardTab';
import { SuggestionsTab } from '@/components/SuggestionsTab';
import { ChatTab } from '@/components/ChatTab';
import { EducationTab } from '@/components/EducationTab';
import { AuthModal } from '@/components/AuthModal';
import { Footer } from '@/components/Footer';
import { auth, onAuthStateChanged, logOut, User } from '@/lib/firebase';

export default function LotoVnAiPage() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedLottery, setSelectedLottery] = useState<LotteryType>('mega645');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [favoriteNumbers, setFavoriteNumbers] = useState<number[]>([]);

  // Subscribe to optional Firebase auth changes
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (current) => {
      setUser(current);
    });
    return () => unsubscribe();
  }, []);

  // Load favorites from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`lotovn_fav_${selectedLottery}`);
      const parsed = saved ? JSON.parse(saved) : [];
      const timer = setTimeout(() => {
        setFavoriteNumbers(parsed);
      }, 0);
      return () => clearTimeout(timer);
    } catch (e) {
      console.warn('Cannot read favorites from localStorage');
    }
  }, [selectedLottery]);

  const handleToggleFavorite = (num: number) => {
    setFavoriteNumbers((prev) => {
      const exists = prev.includes(num);
      const updated = exists ? prev.filter((x) => x !== num) : [...prev, num];
      try {
        localStorage.setItem(`lotovn_fav_${selectedLottery}`, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const handleLogout = async () => {
    await logOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200 pb-20 md:pb-0">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectedLottery={selectedLottery}
        onSelectLottery={setSelectedLottery}
        user={user}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardTab
            selectedLottery={selectedLottery}
            favoriteNumbers={favoriteNumbers}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'suggestions' && (
          <SuggestionsTab
            selectedLottery={selectedLottery}
            userId={user?.uid}
            favoriteNumbers={favoriteNumbers}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab selectedLottery={selectedLottery} />
        )}

        {activeTab === 'education' && <EducationTab />}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {}}
      />

      <Footer />
    </div>
  );
}
