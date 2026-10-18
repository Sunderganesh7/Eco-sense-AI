import { useEffect } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { FeatureHero } from '../components/ui/FeatureHero';
import { Button } from '../components/ui/Button';
import { WelcomeArea } from '../components/ai-coach/WelcomeArea';
import { ChatMessage as ChatMessageComponent } from '../components/ai-coach/ChatMessage';
import { ChatInput } from '../components/ai-coach/ChatInput';
import { LoadingIndicator } from '../components/ai-coach/LoadingIndicator';
import { ErrorMessage } from '../components/ai-coach/ErrorMessage';
import { CarbonInsightCard } from '../components/ai-coach/CarbonInsightCard';
import { useAiCoach } from '../hooks/useAiCoach';

/**
 * New AI Coach page – completely replaces the old implementation.
 * Utilises the fresh ai‑coach component library and the useAiCoach hook.
 */
export function AICoach() {
  const {
    messages,
    isLoading,
    error,
    carbonData,
    carbonResult,
    sendMessage,
    retryLast,
    clearChat,
  } = useAiCoach();

  // Ensure the page starts at the top when navigated to
  useEffect(() => {
    // The app uses a global overflow container in Layout.tsx, so we target it.
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  // Quick prompts (fixed list as per requirements)
  const quickPrompts = [
    'Analyze my carbon footprint',
    'What affects my footprint most?',
    'How can I reduce my emissions?',
    'Give me a sustainability challenge',
    'How can I reduce electricity usage?',
    'How can I reduce waste?',
  ];

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleSend = (msg: string) => {
    sendMessage(msg);
  };

  return (
    <PageLayout>
      <FeatureHero
        label="Intelligent Guidance"
        title="AI Sustainability Coach"
        description="Get personalized, data-driven recommendations from our AI to strategically reduce your environmental footprint."
        imageUrl="/ai_sustainability_coach_hero.jpg"
        layout="overlay"
        actions={
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={clearChat}>
            Clear Chat
          </Button>
        }
      />

      <div className="grid lg:grid-cols-12 gap-6 items-start min-h-[600px]">
        {/* Chat Interface (Left Column) */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_12px_rgb(0,0,0,0.04)] flex flex-col relative">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">CarbonWise Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-slate-500 font-medium">Online & ready to help</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat stream */}
            <div
              className="p-6 space-y-6"
              role="log"
              aria-label="Chat messages"
              aria-live="polite"
            >
              {messages.map((msg, idx) => (
                <ChatMessageComponent
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp instanceof Date ? msg.timestamp.toISOString() : undefined}
                />
              ))}
              {isLoading && <LoadingIndicator />}
              {error && <ErrorMessage onRetry={retryLast} />}
            </div>

            {/* Input area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </div>
        </div>

        {/* Sidebar Context (Right Column) */}
        <div className="lg:col-span-3 space-y-6 sticky top-6">
          {/* Carbon insight – show if we have carbon data */}
          {carbonData && carbonResult && (
            <CarbonInsightCard carbonData={carbonData} carbonResult={carbonResult} />
          )}

          {/* Welcome screen / Suggested Prompts */}
          <WelcomeArea prompts={quickPrompts} onPrompt={handlePromptClick} disabled={isLoading} />
        </div>
      </div>
    </PageLayout>
  );
}
