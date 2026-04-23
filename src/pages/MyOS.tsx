import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, ArrowRight, Sparkles } from 'lucide-react';

export function MyOS() {
  // Empty state — in production this reads from persistent storage
  const hasBuilds = false;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-10 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 leading-tight mb-3">
            My OS
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Every system you've shaped with the Architect — in progress, ready to deploy, or already live.
          </p>
        </div>

        {!hasBuilds ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-6">
                <FolderKanban className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Nothing here yet</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Your builds will land here once you've shaped one with the Architect. Start by browsing the Gallery for something close to your business, or build from scratch.
              </p>
              <div className="flex items-center gap-3 justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  Browse Gallery
                </Link>
                <Link
                  to="/build"
                  className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  Build from scratch
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
