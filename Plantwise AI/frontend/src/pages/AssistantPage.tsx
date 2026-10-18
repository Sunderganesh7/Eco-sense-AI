import React, { useState } from 'react';
import {
  Send,
  FileText,
  Copy,
  Check,
  Download,
  Bot
} from 'lucide-react';
import { api } from '../services/api';
import type { AssistantChatResponse, DocumentDraftResponse } from '../types';
import { ComplianceDisclaimer } from '../components/common/ComplianceDisclaimer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  statutoryCitations?: string[];
  suggestedAction?: string;
}

interface AssistantPageProps {
  initialContext?: any;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({ initialContext }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'drafter'>('chat');
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello. I can assist with legal guidelines under the Maharashtra Tree Act 1975, Forest Conservation Act, and CRZ regulations, or help draft formal Tree Officer NOC requests.',
      statutoryCitations: ['Maharashtra Tree Act 1975', 'CRZ Notification 2019', 'FCA 1980'],
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Document drafter state
  const [docType, setDocType] = useState<string>('tree_officer_noc_request');
  const [applicantName, setApplicantName] = useState<string>('Priyanshu Sharma');
  const [applicantRole, setApplicantRole] = useState<string>('Citizen / Environmental Lead');
  const [applicantAddress, setApplicantAddress] = useState<string>('Plot 14, Bandra West, Mumbai, Maharashtra 400050');
  const [locationName, setLocationName] = useState<string>(initialContext?.siteName || 'Bandra Seaside Promenade, Mumbai');
  const [landType, setLandType] = useState<string>(initialContext?.landType || 'Municipal Public Ground');
  const [treesCount, setTreesCount] = useState<number>(initialContext?.targetTrees || 50);
  const [speciesList, setSpeciesList] = useState<string>('Neem (Azadirachta indica), Karanj (Pongamia pinnata), Bakul (Mimusops elengi)');
  const [authorityName, setAuthorityName] = useState<string>('The Tree Officer & Deputy Municipal Commissioner (Gardens), BMC');
  
  const [draftResult, setDraftResult] = useState<DocumentDraftResponse | null>(null);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const sampleQuestions = [
    'What documents are required to plant on Municipal land in Mumbai?',
    'Can I plant trees inside CRZ-I or CRZ-II coastal regulation zones?',
    'What does Section 8 of Maharashtra Tree Act say about compensatory plantation?',
    'What is the minimum road setback required by NHAI for highway plantation?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsChatLoading(true);

    try {
      const res: AssistantChatResponse = await api.chatWithAssistant({
        message: text,
        land_type: initialContext?.landType || 'municipal_public',
        location_name: initialContext?.siteName || 'Maharashtra',
        trees_count: initialContext?.targetTrees || 50,
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.reply,
        statutoryCitations: res.cited_rules,
        suggestedAction: res.suggested_actions?.[0],
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while evaluating the query. Please try again.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDraftDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDrafting(true);
    try {
      const res = await api.draftDocument({
        document_type: docType,
        applicant_name: applicantName,
        applicant_role: applicantRole,
        applicant_address: applicantAddress,
        location_name: locationName,
        land_type: landType,
        trees_count: treesCount,
        species_list: speciesList.split(',').map(s => s.trim()).filter(Boolean),
        authority_name: authorityName,
      });
      setDraftResult(res);
      setCopied(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = () => {
    if (!draftResult) return;
    navigator.clipboard.writeText(draftResult.content_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDoc = () => {
    if (!draftResult) return;
    const element = document.createElement('a');
    const file = new Blob([draftResult.content_markdown], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${draftResult.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="py-8 px-6 sm:px-10 lg:px-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-forest-100 text-forest-800 dark:bg-forest-900/60 dark:text-forest-300 border border-forest-200 dark:border-forest-800">
              Legal Assistant
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Regulatory Assistant & Document Drafter
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Statutory Q&A grounded in Maharashtra Tree Act 1975 and automated NOC letter drafting.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-surface-elevated dark:bg-zinc-800 p-0.5 rounded-lg border border-border dark:border-zinc-700 text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-forest-700 text-white shadow-xs font-semibold dark:bg-forest-600'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Legal Q&A
          </button>
          <button
            onClick={() => setActiveTab('drafter')}
            className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'drafter'
                ? 'bg-forest-700 text-white shadow-xs font-semibold dark:bg-forest-600'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Draft Letters
          </button>
        </div>
      </div>

      <ComplianceDisclaimer compact />

      {activeTab === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Chat (8 Cols) */}
          <div className="lg:col-span-8 p-5 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 shadow-card flex flex-col h-[540px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed space-y-1.5 shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-forest-700 text-white'
                        : 'bg-surface-elevated dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-border dark:border-zinc-700'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>

                    {msg.statutoryCitations && msg.statutoryCitations.length > 0 && (
                      <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-700 flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Citations:</span>
                        {msg.statutoryCitations.map((cite, cIdx) => (
                          <span
                            key={cIdx}
                            className="px-2 py-0.5 rounded text-[10px] bg-earth-100 dark:bg-earth-950/60 text-earth-800 dark:text-earth-300 border border-earth-200 dark:border-earth-800 font-mono"
                          >
                            {cite}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="text-xs text-zinc-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-forest-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Evaluating statutory rules...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-3 border-t border-border dark:border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask a regulatory question (e.g. BMC Tree Officer NOC, felling penalties)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !inputText.trim()}
                  className="px-4 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium disabled:opacity-50 cursor-pointer transition-colors shadow-subtle"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Helper Queries (4 Cols) */}
          <div className="lg:col-span-4 p-5 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 shadow-card space-y-2.5">
            <h3 className="font-semibold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-forest-600"></span>
              Common Regulatory Inquiries
            </h3>
            <div className="space-y-1.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left p-2.5 rounded-lg border border-border dark:border-zinc-800 hover:border-forest-300 dark:hover:border-forest-700 hover:bg-forest-50/50 dark:hover:bg-forest-950/30 text-xs text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer leading-normal"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* DRAFTER */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 p-6 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 shadow-card space-y-3 text-xs">
            <h2 className="font-semibold text-sm text-zinc-900 dark:text-white border-b border-border dark:border-zinc-800 pb-2">
              Document Parameters
            </h2>

            <form onSubmit={handleDraftDocument} className="space-y-2.5">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-2.5 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer"
                >
                  <option value="tree_officer_noc_request">Formal Tree Officer NOC Application</option>
                  <option value="plantation_proposal">Detailed Project Proposal (CSR / DPR)</option>
                  <option value="maintenance_undertaking">3-Year Maintenance Undertaking</option>
                  <option value="compliance_report">Compliance Self-Assessment Report</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Applicant Name
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-2.5 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  required
                  value={applicantAddress}
                  onChange={(e) => setApplicantAddress(e.target.value)}
                  className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-2.5 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Location Name
                  </label>
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-2.5 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Trees Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={treesCount}
                    onChange={(e) => setTreesCount(Number(e.target.value))}
                    className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-2.5 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Addressed Authority
                </label>
                <input
                  type="text"
                  required
                  value={authorityName}
                  onChange={(e) => setAuthorityName(e.target.value)}
                  className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-2.5 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Planted Species
                </label>
                <input
                  type="text"
                  required
                  value={speciesList}
                  onChange={(e) => setSpeciesList(e.target.value)}
                  className="w-full bg-surface-elevated dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-2.5 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600"
                />
              </div>

              <button
                type="submit"
                disabled={isDrafting}
                className="w-full py-2.5 mt-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium cursor-pointer transition-colors shadow-subtle"
              >
                {isDrafting ? 'Drafting...' : 'Generate Document Draft'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 p-6 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 shadow-card space-y-3">
            {draftResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border dark:border-zinc-800 pb-2.5">
                  <h3 className="font-semibold text-xs text-zinc-900 dark:text-white">
                    {draftResult.title}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded-md bg-surface-elevated dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-border dark:border-zinc-700 text-xs hover:bg-forest-50 hover:text-forest-800 hover:border-forest-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-forest-700" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleDownloadDoc}
                      className="px-2.5 py-1 rounded-md bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-surface-elevated dark:bg-zinc-800/80 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-[440px] overflow-y-auto border border-border dark:border-zinc-700">
                  {draftResult.content_markdown}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-400 space-y-1">
                <FileText className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700" />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">No Document Drafted Yet</p>
                <p className="text-[11px] text-zinc-500">Fill the form on the left to generate statutory NOC letters.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
