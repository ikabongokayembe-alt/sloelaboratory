import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, LayoutDashboard, Users, Target, Search, MessageSquare, FileText, Sparkles, BarChart3, Settings, Briefcase } from 'lucide-react';
import { getDemoById } from '../demos';

const MODULE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  pipeline: { label: 'Pipeline', icon: Target, description: 'Track every record moving through your stages' },
  crm: { label: 'Relationships', icon: Users, description: 'Keep every contact and organization organized' },
  matching: { label: 'Matcher', icon: Search, description: 'AI connects the right parties automatically' },
  intake: { label: 'Intake', icon: MessageSquare, description: 'Conversational qualification for new inquiries' },
  documents: { label: 'Documents', icon: FileText, description: 'Generate contracts, invoices, and reports' },
  ai_assistant: { label: 'Assistant', icon: Sparkles, description: 'Drafts outreach, summarizes, answers' },
  dashboard: { label: 'Dashboard', icon: LayoutDashboard, description: 'What needs attention today' },
  analytics: { label: 'Analytics', icon: BarChart3, description: 'Performance and trends over time' },
  localization: { label: 'Localization', icon: Settings, description: 'Multi-language support built in' },
};

export function DemoDetail() {
  const { id } = useParams<{ id: string }>();
  const demo = id ? getDemoById(id) : undefined;

  if (!demo) return <Navigate to="/" replace />;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to gallery
        </Link>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md mb-4">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">{demo.category}</span>
            </div>
            <h1 className="text-4xl font-semibold text-slate-900 leading-tight mb-3">
              {demo.name}
            </h1>
            <p className="text-base text-slate-700 leading-relaxed mb-4">
              {demo.tagline}
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {demo.description}
            </p>
            <div className="flex items-center gap-3">
              <Link
                to={`/build?industry=${demo.industrySlug}&from=${demo.id}`}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-5 py-3 rounded-xl transition-colors shadow-sm"
              >
                Build mine like this
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium px-5 py-3 rounded-xl transition-colors">
                Explore live demo
              </button>
            </div>
          </div>
          <div
            className="rounded-2xl p-10 min-h-[360px] flex items-center justify-center"
            style={{ background: demo.heroGradient }}
          >
            <DemoPreview demo={demo} />
          </div>
        </div>

        {/* Modules grid */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">What's inside</h2>
          <p className="text-sm text-slate-500 mb-6">Every {demo.name} comes with these capabilities, shaped to your business.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {demo.modules.map(moduleKey => {
              const meta = MODULE_META[moduleKey] || { label: moduleKey, icon: Briefcase, description: '' };
              const Icon = meta.icon;
              return (
                <div key={moduleKey} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{meta.label}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{meta.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vocabulary callout */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-12">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">The vocabulary of this OS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tracks</p>
              <p className="text-slate-900 capitalize font-medium">{demo.vocabulary.record}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Stages</p>
              <p className="text-slate-900 font-medium">{demo.vocabulary.stages.join(' → ')}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Works with</p>
              <p className="text-slate-900 capitalize font-medium">{demo.vocabulary.otherSide}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            When you build yours, the Architect will use your company's actual language — not these placeholders.
          </p>
        </div>

        {/* Final CTA */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-center">
          <div className="max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full mb-4">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider">5-minute build</span>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              Ready to build yours?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              The Architect will shape {demo.name} for your specific business — your vocabulary, your stages, your modules. Book the activation call when it feels right.
            </p>
            <Link
              to={`/build?industry=${demo.industrySlug}&from=${demo.id}`}
              className="inline-flex items-center gap-2 bg-white text-slate-900 text-sm font-medium px-5 py-3 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
            >
              Build mine
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Enlarged preview for the demo detail hero
// ──────────────────────────────────────────────────────────────

function DemoPreview({ demo }: { demo: ReturnType<typeof getDemoById> }) {
  if (!demo) return null;
  return (
    <div className="w-full max-w-md">
      <div className="bg-white/95 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          </div>
          <div className="flex-1 text-center">
            <span className="text-[9px] font-mono text-slate-400">{demo.id}.sloeos.app</span>
          </div>
        </div>
        <div className="p-5 bg-white">
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: demo.heroGradient }}
            >
              <span className="text-white text-xs font-bold">{demo.name.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{demo.name}</p>
              <p className="text-[9px] text-slate-500 truncate">{demo.industry}</p>
            </div>
          </div>

          {/* Pipeline kanban stub */}
          <div className="mb-3">
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 capitalize">{demo.vocabulary.record} pipeline</p>
            <div className="flex gap-1.5">
              {demo.vocabulary.stages.slice(0, 4).map((stage, i) => (
                <div key={i} className="flex-1 bg-slate-50 rounded p-1.5 border border-slate-100">
                  <p className="text-[8px] font-semibold text-slate-600 uppercase tracking-wider mb-1 truncate">{stage}</p>
                  <div className="space-y-0.5">
                    {Array.from({ length: 2 + (i === 1 ? 1 : 0) }).map((_, j) => (
                      <div key={j} className="h-1.5 bg-white rounded-sm border border-slate-100"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-1.5">
            {['Active', 'This week', 'Needs action'].map((label, i) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded p-1.5">
                <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</p>
                <p className="text-xs font-bold text-slate-900">{[47, 14, 6][i]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
