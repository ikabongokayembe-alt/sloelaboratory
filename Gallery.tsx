import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { DEMOS, CATEGORIES, getDemosByCategory, type Category, type Demo } from '../demos';

export function Gallery() {
  const [activeCategory, setActiveCategory] = useState<Category>('Featured');
  const visibleDemos = getDemosByCategory(activeCategory);
  const heroDemo = DEMOS.find(d => d.featured) || DEMOS[0];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 leading-tight mb-3">
            Operating systems, built for your business
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Browse pre-built OS demos across industries. Click any one to explore it live — then build yours in under 5 minutes.
          </p>
        </div>

        {/* Category tabs */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                activeCategory === cat
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
              )}
            >
              {cat === 'Featured' && <span className="mr-1.5">★</span>}
              {cat}
            </button>
          ))}
        </div>

        {/* Hero card — only on Featured */}
        {activeCategory === 'Featured' && (
          <Link
            to={`/demo/${heroDemo.id}`}
            className="block mb-8 rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm hover:shadow-md group"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-md mb-4">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Featured</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 leading-tight mb-2">
                    {heroDemo.name}
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {heroDemo.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900 group-hover:gap-3 transition-all">
                  Explore this OS
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div
                className="min-h-[240px] flex items-center justify-center p-8"
                style={{ background: heroDemo.heroGradient }}
              >
                <HeroPreview demo={heroDemo} />
              </div>
            </div>
          </Link>
        )}

        {/* Grid of demo cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {visibleDemos.map(demo => (
            <DemoCard key={demo.id} demo={demo} />
          ))}
        </div>

        {/* Build your own CTA */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-center">
          <div className="max-w-xl mx-auto">
            <h3 className="text-2xl font-semibold text-white mb-2">
              Don't see your industry? Build your own.
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Talk to the Architect. Describe your business in 5 minutes. Get an OS shaped to your operation, ready to activate.
            </p>
            <Link
              to="/build"
              className="inline-flex items-center gap-2 bg-white text-slate-900 text-sm font-medium px-5 py-3 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
            >
              Start building
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Individual demo card
// ──────────────────────────────────────────────────────────────

function DemoCard({ demo }: { demo: Demo }) {
  return (
    <Link
      to={`/demo/${demo.id}`}
      className="group block rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
    >
      <div
        className="aspect-[16/10] relative overflow-hidden"
        style={{ background: demo.heroGradient }}
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <HeroPreview demo={demo} compact />
        </div>
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded border border-white/30">
            {demo.category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 leading-tight mb-1 group-hover:text-slate-700">
          {demo.name}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
          {demo.tagline}
        </p>
      </div>
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────
// Hero preview — a stylized mini-mockup of the OS inside the card
// ──────────────────────────────────────────────────────────────

function HeroPreview({ demo, compact }: { demo: Demo; compact?: boolean }) {
  const scale = compact ? 'scale-90' : 'scale-100';
  return (
    <div className={cn("w-full max-w-[320px] transform", scale)}>
      <div className="bg-white/95 rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* Fake browser chrome */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
          </div>
          <div className="flex-1 text-center">
            <span className="text-[8px] font-mono text-slate-400">{demo.id}.sloeos.app</span>
          </div>
        </div>
        {/* Fake OS content */}
        <div className="p-3 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ background: demo.heroGradient }}
            >
              <span className="text-white text-[8px] font-bold">{demo.name.charAt(0)}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-700 truncate">{demo.name}</span>
          </div>
          <div className="space-y-1">
            {demo.vocabulary.stages.slice(0, 3).map((stage, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="text-[8px] text-slate-400 w-14 truncate">{stage}</div>
                <div className="flex-1 flex gap-0.5">
                  {Array.from({ length: 3 + i }).map((_, j) => (
                    <div key={j} className="h-1 bg-slate-200 rounded-sm flex-1"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[8px] text-slate-400">{demo.vocabulary.record}</span>
            <span className="text-[8px] font-semibold text-slate-700">{12 + demo.modules.length * 3}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
