import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, testConnection, handleFirestoreError } from './lib/firebase';
import { OperationType, type Item } from './types';
import { Header } from './components/Header';
import { ThoughtInput } from './components/ThoughtInput';
import { ItemList } from './components/ItemList';
import { SignInPrompt } from './components/SignInPrompt';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Test Firestore connection on boot as mandated by security specification
  useEffect(() => {
    testConnection().catch((err) => {
      console.warn('Initial Firestore ping:', err);
    });
  }, []);

  // Listen for Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for user's items scoped to /users/{uid}/items
  useEffect(() => {
    if (!user) {
      setItems([]);
      setItemsLoading(false);
      return;
    }

    setItemsLoading(true);
    setFirestoreError(null);

    const itemsPath = `users/${user.uid}/items`;
    const itemsQuery = query(
      collection(db, 'users', user.uid, 'items'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const fetchedItems: Item[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            text: data.text || '',
            summary: data.summary || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            createdAt: data.createdAt || null,
          };
        });
        setItems(fetchedItems);
        setItemsLoading(false);
      },
      (error) => {
        console.error('Snapshot error on', itemsPath, error);
        setFirestoreError(error.message);
        setItemsLoading(false);
        handleFirestoreError(error, OperationType.GET, itemsPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const getTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] paper-grid text-[#2D2124] font-sans selection:bg-[#F8CDD5] selection:text-[#661223]">
      {/* Top Navigation */}
      <Header user={user} loading={authLoading} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 flex flex-col relative">
        {firestoreError && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-[#FFF6F7] border border-[#F2A9B6] text-[#BA1B35] text-xs sm:text-sm w-full shadow-xs">
            <span className="font-serif font-bold block mb-1">Database synchronization error:</span>
            {firestoreError}
          </div>
        )}

        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 my-auto">
            <div className="w-10 h-10 rounded-full border-2 border-[#F8CDD5] border-t-[#BA1B35] animate-spin" />
            <p className="text-xs text-[#BA1B35] font-mono font-medium">Opening your knowledge vault...</p>
          </div>
        ) : user ? (
          <div className="flex-1 flex flex-col">
            {/* Greeting Header */}
            <header className="w-full max-w-2xl text-center mb-10 mx-auto relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDECEF] text-[#BA1B35] text-[11px] font-mono uppercase tracking-widest border border-[#F8CDD5] mb-3 shadow-2xs">
                <span>✦</span>
                <span>DESK JOURNAL</span>
                <span>✦</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif text-[#561320] mb-3 tracking-tight leading-[1.15]">
                {getTimeGreeting()},{' '}
                <span className="italic font-normal text-[#BA1B35]">
                  {user.displayName ? user.displayName.split(' ')[0] : 'friend'}
                </span>
                .
              </h1>

              <p className="text-[#661223]/80 text-sm sm:text-base font-sans leading-relaxed max-w-lg mx-auto">
                A quiet, tactile repository for your thoughts & curiosities.{' '}
                <span className="inline-block font-mono font-semibold text-[#751225] bg-[#FAF2EB] px-2 py-0.5 rounded-md border border-[#E8DFC8]">
                  {items.length} {items.length === 1 ? 'thought' : 'thoughts'} indexed
                </span>
              </p>
            </header>

            {/* Input Thought Box */}
            <ThoughtInput uid={user.uid} pastItems={items} />

            {/* List of Recent Items */}
            <ItemList items={items} loading={itemsLoading} uid={user.uid} />
          </div>
        ) : (
          <SignInPrompt />
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-[#BA1B35]/15 bg-[#FAF7F2]/80 backdrop-blur-xs py-8 text-center text-xs text-[#8E162B]/70 font-sans">
        <div className="max-w-md mx-auto px-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-[#BA1B35]/50 font-mono text-[10px] tracking-widest">
            <span>✧</span>
            <span>RE:MIND KNOWLEDGE ARCHIVE</span>
            <span>✧</span>
          </div>
          <p className="text-[11px] text-[#661223]/75">
            Handcrafted with thoughtful care &bull; Encrypted & authenticated under your account
          </p>
        </div>
      </footer>
    </div>
  );
}
