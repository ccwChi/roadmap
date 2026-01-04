'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sparkles, Moon, Sun, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
        aria-label="切換主題"
      >
        {mounted && (
          resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-foreground" />
          )
        )}
      </button>

      {/* Logo */}
      <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-8">
        <Sparkles className="w-12 h-12 text-white" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-2">AI Roadmap</h1>
      <p className="text-muted-foreground mb-8">互動式學習路線圖</p>

      {/* Main Links */}
      <div className="flex flex-col sm:flex-row gap-4">

        <Link
          href="/map"
          className="flex items-center gap-2 px-6 py-3 bg-secondary text-foreground font-medium rounded-xl hover:bg-secondary/80 transition-colors shadow-lg border border-border"
        >
          學習路線圖
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
