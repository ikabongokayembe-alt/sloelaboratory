import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Send, User, LayoutDashboard, Users, Briefcase, Search, FileText, Sparkles, BarChart3, Settings, Bell, Calendar, CheckCircle2, ArrowRight, MessageSquare, Target, TrendingUp, Clock, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { getDemoById } from '../demos';

interface DetectedModule {
  module: string;
  confidence: number;
  evidence: string;
  confirmed: boolean;
}

interface ArchitectState {
  phase?: "opening" | "ingesting" | "analyzing" | "confirming_understanding" | "asking_targeted" | "proposing" | "awaiting_build_permission" | "previewing" | "wrapping";
  source_received?: "url" | "instagram" | "linkedin" | "description" | "gallery_context" | "none";
  source_value?: string | null;
  company_name?: string | null;
  industry_signal?: string | null;
  their_language?: {
    record_they_track?: string;
    pipeline_stages?: string[];
    the_other_side?: string;
  };
  detected_modules?: DetectedModule[];
  confirmed_modules?: string[];
  custom_requirements?: string[];
  pain_points_named?: string[];
  magic_wand_answer?: string | null;
  understanding_confirmed?: boolean;
  proposal_confirmed?: boolean;
  build_permission_granted?: boolean;
  ready_to_book?: boolean;
  notes_for_founder?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  visibleText: string;
}

function extractState(text: string): { visibleText: string, state: ArchitectState | null } {
  if (!text) return { visibleText: "", state: null };
  const startIndex = text.indexOf("<architect_state>");
  const endIndex = text.indexOf("</architect_state>");

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const visibleText = text.substring(0, startIndex).trim() + "\n" + text.substring(endIndex + "</architect_state>".length).trim();
    const jsonStr = text.substring(startIndex + "<architect_state>".length, endIndex).trim();
    const cleanJsonStr = jsonStr.replace(/^\s*```(json)?/m, "").replace(/```\s*$/m, "").trim();

    try {
      const state = JSON.parse(cleanJsonStr);
      return { visibleText: visibleText.trim(), state };
    } catch (e) {
      console.error("Failed to parse architect_state:", e);
      return { visibleText: text.replace(/<architect_state>[\s\S]*?<\/architect_state>/g, '').trim(), state: null };
    }
  }

  return { visibleText: text, state: null };
}

const MODULE_REGISTRY: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  pipeline: { label: 'Pipeline', icon: Target, description: 'Records moving through stages' },
  crm: { label: 'Relationships', icon: Users, description: 'People & organizations you track' },
  relationships: { label: 'Relationships', icon: Users, description: 'People & organizations you track' },
  matching: { label: 'Matcher', icon: Search, description: 'Connects one side to the other' },
  matching_engine: { label: 'Matcher', icon: Search, description: 'Connects one side to the other' },
  intake: { label: 'Intake', icon: MessageSquare, description: 'Conversational qualification' },
  conversation_intake: { label: 'Intake', icon: MessageSquare, description: 'Conversational qualification' },
  documents: { label: 'Documents', icon: FileText, description: 'Contracts, invoices, reports' },
  document_generation: { label: 'Documents', icon: FileText, description: 'Contracts, invoices, reports' },
  ai_assistant: { label: 'Assistant', icon: Sparkles, description: 'Drafts, summaries, answers' },
  assistant: { label: 'Assistant', icon: Sparkles, description: 'Drafts, summaries, answers' },
  dashboard: { label: 'Dashboard', icon: LayoutDashboard, description: 'What needs attention today' },
  analytics: { label: 'Analytics', icon: BarChart3, description: 'Performance & trends' },
  localization: { label: 'Localization', icon: Settings, description: 'Multi-language support' },
};

function getModuleMeta(name: string) {
  const key = name.toLowerCase().replace(/\s+/g, '_');
  return MODULE_REGISTRY[key] || { label: name.replace(/_/g, ' '), icon: Briefcase, description: 'Custom capability' };
}

function generateMockRecords(state: ArchitectState | null): Array<{ name: string; stage: string; owner: string }> {
  if (!state) return [];
  const noun = state.their_language?.record_they_track || 'record';
  const stages = state.their_language?.pipeline_stages?.length
    ? state.their_language.pipeline_stages
    : ['New', 'In Progress', 'Active', 'Closed'];

  const sampleNames = [
    'Omar Al-Sayed', 'Fatima Hassan', 'Lucas Silva', 'Priya Nair',
    'Adeola Adebayo', 'Marcus Chen', 'Sofia Rossi', 'Yusuf Ibrahim'
  ];

  return sampleNames.slice(0, 5).map((n, i) => ({
    name: `${n} — ${noun}`,
    stage: stages[i % stages.length],
    owner: 'You',
  }));
}

export function Build() {
  const [searchParams] = useSearchParams();
  const fromDemoId = searchParams.get('from');
  const inheritedIndustry = searchParams.get('industry');
  const sourceDemo = fromDemoId ? getDemoById(fromDemoId) : undefined;

  // Build the initial opening message based on whether they came from Gallery or direct
  const initialGreeting = sourceDemo
    ? `Hi — I'm the Architect. I saw you were exploring the ${sourceDemo.name}. Quick question to shape yours: what's the name of your business, and in one or two lines, what do you do that's distinct from other ${sourceDemo.category.toLowerCase()} operations?`
    : `Hi — I'm the Architect. I help you shape the operating system your business needs. To get started, you can share whichever feels easiest — a link to your website, your Instagram, your LinkedIn, or just tell me about your business in your own words. Whatever works for you.`;

  const [messages, setMessages] = useState<Message[]>([{
    id: 'init',
    role: 'assistant',
    content: initialGreeting,
    visibleText: initialGreeting
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentState, setCurrentState] = useState<ArchitectState | null>(null);
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (currentState?.ready_to_book && !bookingSubmitted) {
      setShowBooking(true);
    }
  }, [currentState?.ready_to_book, bookingSubmitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      visibleText: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      // Pass inherited gallery context to the server
      const galleryContext = sourceDemo ? {
        from_demo: sourceDemo.id,
        demo_name: sourceDemo.name,
        industry: sourceDemo.industry,
        category: sourceDemo.category,
        suggested_modules: sourceDemo.modules,
        suggested_vocabulary: sourceDemo.vocabulary,
      } : (inheritedIndustry ? { industry: inheritedIndustry } : null);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, galleryContext }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const { visibleText, state } = extractState(data.reply);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        visibleText: visibleText || "Let me think..."
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (state) setCurrentState(state);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const companyName = currentState?.company_name || 'Your Company';
  const industry = currentState?.industry_signal || sourceDemo?.industry || '';
  const detectedModules = currentState?.detected_modules || [];
  const confirmedModuleNames = currentState?.confirmed_modules || [];
  const recordNoun = currentState?.their_language?.record_they_track || 'records';
  const otherSide = currentState?.their_language?.the_other_side || '';
  const stages = currentState?.their_language?.pipeline_stages || [];
  const painPoints = currentState?.pain_points_named || [];
  const mockRecords = generateMockRecords(currentState);

  const previewUnlocked = !!currentState?.build_permission_granted;

  const activeModuleList = confirmedModuleNames.length > 0
    ? confirmedModuleNames.map(name => ({ module: name, confidence: 1, evidence: '', confirmed: true }))
    : detectedModules;

  const sidebarModules = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...activeModuleList.map(m => {
      const meta = getModuleMeta(m.module);
      return { key: m.module.toLowerCase(), label: meta.label, icon: meta.icon };
    })
  ];

  const phase = currentState?.phase || 'opening';
  const phaseLabel = {
    opening: 'Waiting for you to share',
    ingesting: 'Reading what you shared',
    analyzing: 'Thinking through your business',
    confirming_understanding: 'Making sure I understood you',
    asking_targeted: 'Filling in the details',
    proposing: 'Shaping the proposal',
    awaiting_build_permission: 'Ready to sketch — say the word',
    previewing: 'Building your preview',
    wrapping: 'Wrapping up',
  }[phase] || 'Listening';

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* LEFT: Conversation with the Architect */}
      <div className="flex flex-col w-[44%] min-w-[460px] h-full border-r border-slate-200 bg-white">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 sticky top-0 z-20 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-semibold tracking-tight">A</span>
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-slate-900">The Architect</h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {sourceDemo ? `Shaping from ${sourceDemo.name}` : 'Your OS, designed in conversation'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-emerald-600">Online</span>
          </div>
        </div>

        {sourceDemo && (
          <Link
            to={`/demo/${sourceDemo.id}`}
            className="px-6 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to {sourceDemo.name}
          </Link>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                key={msg.id}
                className={cn(
                  "flex w-full items-start gap-4",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold leading-none tracking-tight">A</span>
                  </div>
                )}
                <div className={cn(
                  "px-5 py-3.5 rounded-2xl max-w-[85%] leading-relaxed text-[15px]",
                  msg.role === 'user'
                    ? "bg-slate-100 text-slate-800 rounded-tr-sm"
                    : "bg-white border border-slate-100 shadow-sm text-slate-800 rounded-tl-sm markdown-body"
                )}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.visibleText}</ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.visibleText}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-full items-center gap-4 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold leading-none tracking-tight">A</span>
              </div>
              <div className="flex space-x-1.5 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm rounded-tl-sm">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
              </div>
            </motion.div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <AnimatePresence>
            {showBooking && !bookingSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="mb-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900">Your {companyName} OS is ready.</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Book a 20-min call with King Kay to activate. Ships in 2 days.</p>
                  </div>
                  <button
                    onClick={() => setBookingSubmitted(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    Deploy
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
            {bookingSubmitted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center"
              >
                <p className="text-sm font-semibold text-emerald-900">Booked. King Kay will reach out within 24 hours.</p>
                <p className="text-xs text-emerald-700 mt-1">Everything you built here has been saved to My OS.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-slate-400 focus-within:border-transparent transition-all shadow-inner"
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Share a link, a handle, or tell me about your business..."
              className="flex-1 max-h-32 min-h-[24px] bg-transparent resize-none outline-none text-[15px] placeholder:text-slate-400 leading-relaxed py-1"
              rows={1}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="mb-0.5 p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: Preview — gated behind build_permission_granted */}
      <div className="flex-1 bg-slate-100 h-full overflow-hidden hidden md:flex">
        {!previewUnlocked ? (
          <div className="w-full h-full flex items-center justify-center p-12">
            <div className="max-w-md text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center mx-auto mb-6">
                {phase === 'ingesting' || phase === 'analyzing' ? (
                  <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
                ) : phase === 'awaiting_build_permission' ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                ) : (
                  <LayoutDashboard className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                {phase === 'opening' ? 'Your OS preview will appear here' :
                 phase === 'awaiting_build_permission' ? "The Architect is ready to sketch" :
                 'The Architect is working'}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                {phase === 'opening'
                  ? "Share a link, a handle, or describe your business in the chat. The Architect will listen, check her understanding with you, and only sketch the preview once you give her the green light."
                  : phase === 'awaiting_build_permission'
                  ? "Tell her yes in the chat and your system will appear here."
                  : "She's checking her understanding with you before she builds anything. This is on purpose."}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                {phaseLabel}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col">
            <div className="bg-slate-200/60 border-b border-slate-300/60 px-4 py-2.5 flex items-center gap-2 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
              </div>
              <div className="flex-1 text-center">
                <div className="inline-block bg-white rounded-md px-4 py-1 text-xs text-slate-500 font-mono">
                  {companyName.toLowerCase().replace(/\s+/g, '')}.sloeos.app
                </div>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-700 rounded border border-amber-200">
                Preview
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex overflow-hidden"
            >
              <div className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="px-5 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-bold">
                        {companyName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{companyName}</p>
                      {industry && <p className="text-[11px] text-slate-500 truncate">{industry}</p>}
                    </div>
                  </div>
                </div>

                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                  {sidebarModules.map((mod) => {
                    const Icon = mod.icon;
                    const isActive = activeModule === mod.key;
                    return (
                      <button
                        key={mod.key}
                        onClick={() => setActiveModule(mod.key)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                          isActive
                            ? "bg-slate-900 text-white font-medium shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{mod.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="p-3 border-t border-slate-100">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50">
                <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 capitalize">
                      {sidebarModules.find(m => m.key === activeModule)?.label || 'Dashboard'}
                    </h2>
                    <p className="text-xs text-slate-500">Welcome back — here's what's happening today</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Bell className="h-5 w-5 text-slate-400" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"></span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  {(activeModule === 'dashboard' || !sidebarModules.find(m => m.key === activeModule)) && (
                    <DashboardView
                      recordNoun={recordNoun}
                      otherSide={otherSide}
                      stages={stages}
                      mockRecords={mockRecords}
                      painPoints={painPoints}
                      detectedModules={activeModuleList}
                    />
                  )}
                  {activeModule !== 'dashboard' && sidebarModules.find(m => m.key === activeModule) && (
                    <ModuleView
                      moduleName={activeModule}
                      recordNoun={recordNoun}
                      stages={stages}
                      mockRecords={mockRecords}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardView({
  recordNoun, otherSide, stages, mockRecords, painPoints, detectedModules
}: {
  recordNoun: string;
  otherSide: string;
  stages: string[];
  mockRecords: Array<{ name: string; stage: string; owner: string }>;
  painPoints: string[];
  detectedModules: DetectedModule[];
}) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-4 gap-4">
        <KPICard label={`Active ${recordNoun}`} value="47" trend="+12%" icon={Target} />
        <KPICard label={otherSide ? otherSide : 'Relationships'} value="128" trend="+8%" icon={Users} />
        <KPICard label="This week" value="14" trend="+3" icon={Calendar} />
        <KPICard label="Needs action" value="6" trend="" icon={Clock} highlight />
      </div>

      {stages.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-900 capitalize">{recordNoun} pipeline</h3>
            <span className="text-xs text-slate-500">{mockRecords.length} {recordNoun}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto">
            {stages.map((stage, i) => (
              <div key={i} className="flex-1 min-w-[140px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{stage}</span>
                  <span className="text-[10px] text-slate-400">{Math.floor(mockRecords.length / stages.length) + (i === 0 ? 1 : 0)}</span>
                </div>
                <div className="space-y-2">
                  {mockRecords.filter((_, idx) => idx % stages.length === i).map((r, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-xs font-medium text-slate-800 truncate">{r.name.split('—')[0]}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{r.owner}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-900">The Architect is watching</h3>
          </div>
          {painPoints.length > 0 ? (
            <ul className="space-y-3">
              {painPoints.slice(0, 3).map((p, i) => (
                <li key={i} className="flex gap-2.5 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                  <span className="text-slate-600 leading-relaxed">Monitoring: {p}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Still learning what to watch.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900">Active modules</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {detectedModules.length > 0 ? detectedModules.map((m, i) => {
              const meta = getModuleMeta(m.module);
              const Icon = meta.icon;
              return (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md">
                  <Icon className="h-3 w-3 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-800">{meta.label}</span>
                </div>
              );
            }) : (
              <p className="text-xs text-slate-400 italic">No modules detected yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleView({
  moduleName, recordNoun, stages, mockRecords
}: {
  moduleName: string;
  recordNoun: string;
  stages: string[];
  mockRecords: Array<{ name: string; stage: string; owner: string }>;
}) {
  const meta = getModuleMeta(moduleName);
  const Icon = meta.icon;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{meta.label}</h3>
            <p className="text-xs text-slate-500">{meta.description}</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-2.5 grid grid-cols-12 gap-3 border-b border-slate-200">
            <div className="col-span-5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider capitalize">{recordNoun}</div>
            <div className="col-span-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stage</div>
            <div className="col-span-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Owner</div>
            <div className="col-span-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Action</div>
          </div>
          {mockRecords.map((r, i) => (
            <div key={i} className="px-4 py-3 grid grid-cols-12 gap-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
              <div className="col-span-5 text-sm text-slate-800 font-medium truncate">{r.name.split('—')[0]}</div>
              <div className="col-span-3">
                <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                  {r.stage}
                </span>
              </div>
              <div className="col-span-2 text-xs text-slate-500">{r.owner}</div>
              <div className="col-span-2 text-right">
                <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Open →</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5">
        <p className="text-xs text-indigo-900 leading-relaxed">
          <span className="font-semibold">Preview note:</span> this is a live sketch of your {meta.label.toLowerCase()} module using your own vocabulary. King Kay will finalize the specific fields, workflows, and integrations on your activation call.
        </p>
      </div>
    </div>
  );
}

function KPICard({ label, value, trend, icon: Icon, highlight }: {
  label: string;
  value: string;
  trend: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "bg-white rounded-xl border p-4",
      highlight ? "border-amber-200 bg-amber-50/50" : "border-slate-200"
    )}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate capitalize">{label}</span>
        <Icon className={cn("h-4 w-4 shrink-0", highlight ? "text-amber-500" : "text-slate-400")} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {trend && <span className="text-[11px] font-medium text-emerald-600 mb-1">{trend}</span>}
      </div>
    </div>
  );
}
