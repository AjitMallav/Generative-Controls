import * as Diff from 'diff';                                                                                                                                  
import './App.css';
import { useState, useRef, useEffect } from 'react';                                                                                                           
import {                                                                                                                                                       
  Send,                                                                                                                                                        
  SlidersHorizontal,                                                                                                                                           
  AlertCircle,                                                                                                                                                 
  Zap,                                                                                                                                                         
  RefreshCw,                                                                                                                                                   
  RotateCcw,                                                                                                                                                   
  Plus,                                                                                                                                                        
  Eye,                                                                                                                                                         
  EyeOff,                                                                                                                                                      
  ArrowRight,                                                                                                                                                  
  Database,                                                                                                                                                    
  ChevronDown,
  ChevronUp,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
  Trash2,
} from 'lucide-react';
                                                                                                                                                              
type Message = {                                                                                                                                               
  id: string;                                                                                                                                                  
  role: 'user' | 'ai';                                                                                                                                         
  content: string;                                                                                                                                             
  isSteering?: boolean;                                                                                                                                        
  cacheHit?: boolean;                                                                                                                                          
  baselineContent?: string;                                                                                                                                    
  steeredAxis?: string;                                                                                                                                        
  steeredValue?: number;                                                                                                                                       
};                                                                                                                                                             
                                                                                                                                                              
type Axis = {
  index: number;                                                                                                                                               
  label: string;                                                                                                                                               
  positive_example: string;                                                                                                                                    
  negative_example: string;                                                                                                                                    
  currentValue: number;                                                                                                                                        
  variance: number;                                                                                                                                            
  coherence?: number;                                                                                                                                          
  source?: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const STARTER_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'ai',
    content:
      'Hello. Enter a prompt and I’ll discover PCA steering axes from sampled model completions.',
  },
];

const CHAT_HISTORY_STORAGE_KEY = 'generative-controls-chat-history-v1';

const makeConversationId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getConversationTitle = (messages: Message[]) => {
  const firstPrompt = messages.find((message) => message.role === 'user')?.content;
  return firstPrompt ? truncate(firstPrompt, 42) : 'New chat';
};

const createConversation = (): Conversation => ({
  id: makeConversationId(),
  title: 'New chat',
  messages: STARTER_MESSAGES,
  updatedAt: Date.now(),
});

const loadConversations = (): Conversation[] => {
  if (typeof window === 'undefined') return [createConversation()];

  try {
    const stored = JSON.parse(window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY) || '[]');

    if (Array.isArray(stored) && stored.length > 0) {
      const validConversations = stored.filter(
        (conversation): conversation is Conversation =>
          typeof conversation?.id === 'string' &&
          typeof conversation?.title === 'string' &&
          Array.isArray(conversation?.messages)
      );

      if (validConversations.length > 0) return validConversations;
    }
  } catch {
    // A malformed or inaccessible localStorage entry should not block the app.
  }

  return [createConversation()];
};
                                                                                                                                                              
const API_BASE_URL = (                                                                                                                                         
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||                                                                                         
  'http://127.0.0.1:8001'                                                                                                                                      
).replace(/\/+$/, '');                                                                                                                                         
                                                                                                                                                              
const API_HEADERS = {                                                                                                                                          
  'Content-Type': 'application/json',                                                                                                                          
  'Bypass-Tunnel-Reminder': 'true',                                                                                                                            
  'bypass-tunnel-reminder': 'true',                                                                                                                            
  'ngrok-skip-browser-warning': 'true',                                                                                                                        
};                                                                                                                                                             
                                                                                                                                                              
const AXIS_COLORS = ['#1D4ED8', '#6D28D9', '#0891B2', '#4F46E5', '#475569'];                                                                                   
                                                                                                                                                              
const formatAlpha = (sliderValue?: number) => {                                                                                                                
  if (sliderValue === undefined || sliderValue === null) return '0.0α';                                                                                        
  const alpha = (sliderValue / 50) * 3;                                                                                                                        
  return `${alpha > 0 ? '+' : ''}${alpha.toFixed(1)}α`;                                                                                                        
};                                                                                                                                                             
                                                                                                                                                              
const truncate = (text: string | undefined, max = 34) => {                                                                                                     
  if (!text) return 'No example available';                                                                                                                    
  const clean = text.replace(/\s+/g, ' ').trim();                                                                                                              
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;                                                                                               
};                                                                                                                                                             
                                                                                                                                                              
const DiffHighlighter = ({                                                                                                                                     
  baseline,                                                                                                                                                    
  steered,                                                                                                                                                     
}: {                                                                                                                                                           
  baseline: string;                                                                                                                                            
  steered: string;                                                                                                                                             
}) => {                                                                                                                                                        
  const diff = Diff.diffWords(baseline, steered);                                                                                                              
                                                                                                                                                              
  return (                                                                                                                                                     
    <div className="diff-text">                                                                                                                                
      {diff.map((part, index) => {                                                                                                                             
        if (part.added) {                                                                                                                                      
          return (                                                                                                                                             
            <mark key={index} className="diff-added">                                                                                                          
              {part.value}                                                                                                                                     
            </mark>                                                                                                                                            
          );                                                                                                                                                   
        }                                                                                                                                                      
                                                                                                                                                              
        if (part.removed) {                                                                                                                                    
          return (                                                                                                                                             
            <del key={index} className="diff-removed">                                                                                                         
              {part.value}                                                                                                                                     
            </del>                                                                                                                                             
          );                                                                                                                                                   
        }                                                                                                                                                      
                                                                                                                                                              
        return <span key={index}>{part.value}</span>;                                                                                                          
      })}                                                                                                                                                      
    </div>                                                                                                                                                     
  );                                                                                                                                                           
};                                                                                                                                                             
                                                                                                                                                              
const SplitMessageView = ({                                                                                                                                    
  msg,                                                                                                                                                         
  showDiff,                                                                                                                                                    
  onToggleDiff,                                                                                                                                                
}: {                                                                                                                                                           
  msg: Message;                                                                                                                                                
  showDiff: boolean;                                                                                                                                           
  onToggleDiff: () => void;                                                                                                                                    
}) => (                                                                                                                                                        
  <div className="split-view">                                                                                                                                 
    <div className="split-col split-baseline">                                                                                                                 
      <div className="split-label">Baseline</div>                                                                                                              
      <div className="split-body">{msg.baselineContent}</div>                                                                                                  
    </div>                                                                                                                                                     
                                                                                                                                                              
    <div className="split-divider" aria-hidden="true">                                                                                                         
      <ArrowRight size={14} />                                                                                                                                 
    </div>                                                                                                                                                     
                                                                                                                                                              
    <div className="split-col split-steered">                                                                                                                  
      <div className="split-label split-label-row">                                                                                                            
        <span>Steered variant</span>                                                                                                                           
                                                                                                                                                              
        <div className="split-actions">                                                                                                                        
          {msg.steeredAxis && (                                                                                                                                
            <span className="axis-badge">                                                                                                                      
              {msg.steeredAxis} {formatAlpha(msg.steeredValue)}                                                                                                
            </span>                                                                                                                                            
          )}                                                                                                                                                   
                                                                                                                                                              
          <button                                                                                                                                              
            className="icon-btn"                                                                                                                               
            onClick={onToggleDiff}                                                                                                                             
            title={showDiff ? 'Hide diff' : 'Show diff'}                                                                                                       
            aria-label={showDiff ? 'Hide changes' : 'Show changes'}                                                                                            
          >                                                                                                                                                    
            {showDiff ? <EyeOff size={13} /> : <Eye size={13} />}                                                                                              
          </button>                                                                                                                                            
                                                                                                                                                              
          {msg.cacheHit && (                                                                                                                                   
            <Zap size={13} className="cache-icon" aria-label="Cached response" />                                                                              
          )}                                                                                                                                                   
        </div>                                                                                                                                                 
      </div>                                                                                                                                                   
                                                                                                                                                              
      {showDiff ? (                                                                                                                                            
        <DiffHighlighter baseline={msg.baselineContent || ''} steered={msg.content} />                                                                         
      ) : (                                                                                                                                                    
        <div className="split-body split-body-primary">{msg.content}</div>                                                                                     
      )}                                                                                                                                                       
    </div>                                                                                                                                                     
  </div>                                                                                                                                                       
);                                                                                                                                                             
                                                                                                                                                              
export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConversationId, setActiveConversationId] = useState(
    () => conversations[0]?.id || createConversation().id
  );
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );
  const messages = activeConversation?.messages || STARTER_MESSAGES;
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [chatSearch, setChatSearch] = useState('');
  const normalizedChatSearch = chatSearch.trim().toLocaleLowerCase();
  const visibleConversations = normalizedChatSearch
    ? conversations.filter((conversation) =>
        [conversation.title, ...conversation.messages.map((message) => message.content)]
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalizedChatSearch)
      )
    : conversations;
                                                                                                                                                              
  const [inputText, setInputText] = useState(                                                                                                                  
    'Write a short message to your team cancelling a meeting.'                                                                                                 
  );                                                                                                                                                           
                                                                                                                                                              
  const [customConcept, setCustomConcept] = useState('');                                                                                                      
  const [axes, setAxes] = useState<Axis[]>([]);                                                                                                                
  const [cloudVariations, setCloudVariations] = useState<string[]>([]);                                                                                        
  const [showVariations, setShowVariations] = useState(false);                                                                                                 
  const [showDiff, setShowDiff] = useState(false);                                                                                                             
                                                                                                                                                              
  const [isProcessing, setIsProcessing] = useState(false);                                                                                                     
  const [isCustomProcessing, setIsCustomProcessing] = useState(false);                                                                                         
  const [steerLoadingId, setSteerLoadingId] = useState<string | null>(null);                                                                                   
  const [errorMessage, setErrorMessage] = useState<string | null>(null);                                                                                       
                                                                                                                                                              
  const generationCache = useRef<Record<string, string>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historySearchRef = useRef<HTMLInputElement>(null);
                                                                                                                                                              
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // The app remains usable if storage is unavailable or full.
    }
  }, [conversations]);

  const updateActiveMessages = (
    update: Message[] | ((previous: Message[]) => Message[])
  ) => {
    setConversations((previous) =>
      previous.map((conversation) => {
        if (conversation.id !== activeConversationId) return conversation;

        const nextMessages =
          typeof update === 'function' ? update(conversation.messages) : update;

        return {
          ...conversation,
          title: getConversationTitle(nextMessages),
          messages: nextMessages,
          updatedAt: Date.now(),
        };
      })
    );
  };
                                                                                                                                                              
  const callBackend = async (path: string, payload: Record<string, unknown>) => {                                                                              
    const endpoint = `${API_BASE_URL}${path}`;                                                                                                                 
                                                                                                                                                              
    const response = await fetch(endpoint, {                                                                                                                   
      method: 'POST',                                                                                                                                          
      headers: API_HEADERS,                                                                                                                                    
      body: JSON.stringify(payload),                                                                                                                           
    });                                                                                                                                                        
                                                                                                                                                              
    if (!response.ok) {                                                                                                                                        
      throw new Error(`HTTP ${response.status} from ${endpoint}`);                                                                                             
    }                                                                                                                                                          
                                                                                                                                                              
    const data = await response.json();                                                                                                                        
                                                                                                                                                              
    if (data?.status !== 'success') {                                                                                                                          
      throw new Error(data?.message || data?.error || 'Backend error');                                                                                        
    }                                                                                                                                                          
                                                                                                                                                              
    return data;                                                                                                                                               
  };                                                                                                                                                           
                                                                                                                                                              
  const handleSendMessage = async () => {                                                                                                                      
    if (!inputText.trim() || isProcessing) return;                                                                                                             
                                                                                                                                                              
    setErrorMessage(null);                                                                                                                                     
                                                                                                                                                              
    const userMsg: Message = {
      id: makeConversationId(),
      role: 'user',                                                                                                                                            
      content: inputText,                                                                                                                                      
    };                                                                                                                                                         
                                                                                                                                                              
    updateActiveMessages((prev) => [...prev, userMsg]);
    setInputText('');                                                                                                                                          
    setIsProcessing(true);                                                                                                                                     
    setAxes([]);                                                                                                                                               
    setCloudVariations([]);                                                                                                                                    
    setShowVariations(false);                                                                                                                                  
    setShowDiff(false);                                                                                                                                        
    generationCache.current = {};                                                                                                                              
                                                                                                                                                              
    try {                                                                                                                                                      
      const data = await callBackend('/discover', {                                                                                                            
        prompt: userMsg.content,                                                                                                                               
        num_variations: 10,                                                                                                                                    
        n_axes: 2,                                                                                                                                             
      });                                                                                                                                                      
                                                                                                                                                              
      const newAxes = data.axes.map((ax: Axis) => ({                                                                                                           
        ...ax,                                                                                                                                                 
        currentValue: 0,                                                                                                                                       
      }));                                                                                                                                                     
                                                                                                                                                              
      setAxes(newAxes);                                                                                                                                        
      setCloudVariations(data.variations || []);                                                                                                               
                                                                                                                                                              
      const baselineText = data.baseline || 'Generated successfully.';                                                                                         
                                                                                                                                                              
      newAxes.forEach((ax: Axis) => {                                                                                                                          
        generationCache.current[`${ax.index}_0`] = baselineText;                                                                                               
      });                                                                                                                                                      
                                                                                                                                                              
      updateActiveMessages((prev) => [
        ...prev,                                                                                                                                               
        {                                                                                                                                                      
          id: makeConversationId(),
          role: 'ai',                                                                                                                                          
          content: baselineText,                                                                                                                               
          baselineContent: baselineText,                                                                                                                       
        },                                                                                                                                                     
      ]);                                                                                                                                                      
    } catch (error) {                                                                                                                                          
      console.error('Discovery failed:', error);                                                                                                               
      setErrorMessage(                                                                                                                                         
        `Failed to connect to backend. Make sure Colab is running and the tunnel URL is unlocked in your browser. ${String(                                    
          error                                                                                                                                                
        )}`                                                                                                                                                    
      );                                                                                                                                                       
    }                                                                                                                                                          
                                                                                                                                                              
    setIsProcessing(false);                                                                                                                                    
  };                                                                                                                                                           
                                                                                                                                                              
  const handleAddCustomAxis = async () => {                                                                                                                    
    if (!customConcept.trim() || isCustomProcessing || axes.length === 0) return;                                                                              
                                                                                                                                                              
    setErrorMessage(null);                                                                                                                                     
    setIsCustomProcessing(true);                                                                                                                               
                                                                                                                                                              
    try {                                                                                                                                                      
      const data = await callBackend('/custom_axis', {                                                                                                         
        concept: customConcept.trim(),                                                                                                                         
      });                                                                                                                                                      
                                                                                                                                                              
      const newAxis = {                                                                                                                                        
        ...data.axis,                                                                                                                                          
        currentValue: 0,                                                                                                                                       
      };                                                                                                                                                       
                                                                                                                                                              
      setAxes((prev) => [...prev, newAxis]);                                                                                                                   
                                                                                                                                                              
      const baselineText = generationCache.current['0_0'] || '';                                                                                               
      generationCache.current[`${newAxis.index}_0`] = baselineText;                                                                                            
                                                                                                                                                              
      setCustomConcept('');                                                                                                                                    
    } catch (error) {                                                                                                                                          
      console.error('Custom axis failed:', error);                                                                                                             
      setErrorMessage(`Failed to generate custom axis. Check backend logs. ${String(error)}`);                                                                 
    }                                                                                                                                                          
                                                                                                                                                              
    setIsCustomProcessing(false);                                                                                                                              
  };                                                                                                                                                           
                                                                                                                                                              
  const handleSteer = async (axisIndex: number, coefficient: number) => {                                                                                      
    const targetAxis = axes.find((a) => a.index === axisIndex);                                                                                                
                                                                                                                                                              
    setErrorMessage(null);                                                                                                                                     
                                                                                                                                                              
    setAxes((prev) =>                                                                                                                                          
      prev.map((a) =>                                                                                                                                          
        a.index === axisIndex                                                                                                                                  
          ? { ...a, currentValue: coefficient }                                                                                                                
          : { ...a, currentValue: 0 }                                                                                                                          
      )                                                                                                                                                        
    );                                                                                                                                                         
                                                                                                                                                              
    const cacheKey = `${axisIndex}_${coefficient}`;                                                                                                            
    const targetMessageId = messages[messages.length - 1].id;                                                                                                  
                                                                                                                                                              
    if (generationCache.current[cacheKey] !== undefined) {                                                                                                     
      const cachedContent = generationCache.current[cacheKey];                                                                                                 
                                                                                                                                                              
      updateActiveMessages((prev) => {
        const newMsgs = [...prev];                                                                                                                             
        newMsgs[newMsgs.length - 1] = {                                                                                                                        
          ...newMsgs[newMsgs.length - 1],                                                                                                                      
          content: cachedContent,                                                                                                                              
          isSteering: false,                                                                                                                                   
          cacheHit: true,                                                                                                                                      
          steeredAxis: targetAxis?.label,                                                                                                                      
          steeredValue: coefficient,                                                                                                                           
        };                                                                                                                                                     
        return newMsgs;                                                                                                                                        
      });                                                                                                                                                      
                                                                                                                                                              
      setTimeout(() => {                                                                                                                                       
        updateActiveMessages((curr) =>
          curr.map((m) =>                                                                                                                                      
            m.id === targetMessageId ? { ...m, cacheHit: false } : m                                                                                           
          )                                                                                                                                                    
        );                                                                                                                                                     
      }, 1600);                                                                                                                                                
                                                                                                                                                              
      return;                                                                                                                                                  
    }                                                                                                                                                          
                                                                                                                                                              
    setSteerLoadingId(targetMessageId);                                                                                                                        
                                                                                                                                                              
    updateActiveMessages((prev) => {
      const newMsgs = [...prev];                                                                                                                               
      const last = newMsgs[newMsgs.length - 1];                                                                                                                
      newMsgs[newMsgs.length - 1] = { ...last, isSteering: true };                                                                                             
      return newMsgs;                                                                                                                                          
    });                                                                                                                                                        
                                                                                                                                                              
    try {                                                                                                                                                      
      const lastUserMsg =                                                                                                                                      
        [...messages].reverse().find((m) => m.role === 'user')?.content || '';                                                                                 
                                                                                                                                                              
      const data = await callBackend('/steer', {                                                                                                               
        prompt: lastUserMsg,                                                                                                                                   
        axis_index: axisIndex,                                                                                                                                 
        coefficient,                                                                                                                                           
        max_tokens: 180,                                                                                                                                       
      });                                                                                                                                                      
                                                                                                                                                              
      generationCache.current[cacheKey] = data.generated_text;                                                                                                 
                                                                                                                                                              
      updateActiveMessages((prev) => {
        const newMsgs = [...prev];                                                                                                                             
        const idx = newMsgs.findIndex((m) => m.id === targetMessageId);                                                                                        
                                                                                                                                                              
        if (idx !== -1) {                                                                                                                                      
          newMsgs[idx] = {                                                                                                                                     
            ...newMsgs[idx],                                                                                                                                   
            content: data.generated_text,                                                                                                                      
            isSteering: false,                                                                                                                                 
            steeredAxis: targetAxis?.label,                                                                                                                    
            steeredValue: coefficient,                                                                                                                         
          };                                                                                                                                                   
        }                                                                                                                                                      
                                                                                                                                                              
        return newMsgs;                                                                                                                                        
      });                                                                                                                                                      
    } catch (error) {                                                                                                                                          
      console.error('Steering failed:', error);                                                                                                                
      setErrorMessage(`Steering failed. Check Colab/backend logs. ${String(error)}`);                                                                          
                                                                                                                                                              
      updateActiveMessages((prev) => {
        const newMsgs = [...prev];                                                                                                                             
        const last = newMsgs[newMsgs.length - 1];                                                                                                              
        newMsgs[newMsgs.length - 1] = { ...last, isSteering: false };                                                                                          
        return newMsgs;                                                                                                                                        
      });                                                                                                                                                      
    }                                                                                                                                                          
                                                                                                                                                              
    setSteerLoadingId(null);                                                                                                                                   
  };                                                                                                                                                           
                                                                                                                                                              
  const handleReset = (axisIndex: number) => {
    if (!steerLoadingId) handleSteer(axisIndex, 0);
  };

  const handleNewChat = () => {
    if (isProcessing || steerLoadingId) return;

    const conversation = createConversation();
    setConversations((previous) => [conversation, ...previous]);
    setActiveConversationId(conversation.id);
    setInputText('');
    setAxes([]);
    setCloudVariations([]);
    setShowVariations(false);
    setShowDiff(false);
    setErrorMessage(null);
    generationCache.current = {};
  };

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId === activeConversationId || isProcessing || steerLoadingId) return;

    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;

    setActiveConversationId(conversation.id);
    setInputText('');
    setAxes([]);
    setCloudVariations([]);
    setShowVariations(false);
    setShowDiff(false);
    setErrorMessage(null);
    generationCache.current = {};
  };

  const handleOpenHistorySearch = () => {
    setIsHistoryOpen(true);
    window.setTimeout(() => historySearchRef.current?.focus(), 0);
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (isProcessing || steerLoadingId) return;

    const remainingConversations = conversations.filter(
      (conversation) => conversation.id !== conversationId
    );
    const nextConversations =
      remainingConversations.length > 0 ? remainingConversations : [createConversation()];

    setConversations(nextConversations);

    if (conversationId === activeConversationId) {
      const nextConversation = nextConversations[0];
      setActiveConversationId(nextConversation.id);
      setInputText('');
      setAxes([]);
      setCloudVariations([]);
      setShowVariations(false);
      setShowDiff(false);
      setErrorMessage(null);
      generationCache.current = {};
    }
  };

  return (
      <div className="app">
        <aside
          className={`history-sidebar${isHistoryOpen ? '' : ' closed'}`}
          aria-label="Chat history"
        >
          <div className="history-brand">
            <div className="history-brand-mark" aria-hidden="true">P</div>
            <span>Generative Controls</span>
            <button
              className="history-close-btn"
              onClick={() => setIsHistoryOpen(false)}
              aria-label="Close chat history"
              title="Close chat history"
            >
              <PanelLeftClose size={17} aria-hidden="true" />
            </button>
          </div>

          <button
            className="history-open-btn"
            onClick={() => setIsHistoryOpen(true)}
            aria-label="Open chat history"
            title="Open chat history"
          >
            <PanelLeftOpen size={18} aria-hidden="true" />
          </button>

          <button className="new-chat-btn" onClick={handleNewChat} disabled={isProcessing || steerLoadingId !== null}>
            <Plus size={16} aria-hidden="true" />
            <span className="new-chat-label">New chat</span>
          </button>

          <button
            className="history-search-btn"
            onClick={handleOpenHistorySearch}
            aria-label="Search chats"
            title="Search chats"
          >
            <Search size={16} aria-hidden="true" />
          </button>

          <div className="chat-search">
            <Search size={15} aria-hidden="true" />
            <input
              ref={historySearchRef}
              value={chatSearch}
              onChange={(event) => setChatSearch(event.target.value)}
              placeholder="Search chats"
              aria-label="Search chat history"
            />
            {chatSearch && (
              <button
                onClick={() => setChatSearch('')}
                aria-label="Clear chat search"
                title="Clear chat search"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <nav className="history-list" aria-label="Saved chats">
            <span className="history-label">Recent</span>
            {visibleConversations.map((conversation) => (
              <div key={conversation.id} className="history-row">
                <button
                  className={`history-item${conversation.id === activeConversationId ? ' active' : ''}`}
                  onClick={() => handleSelectConversation(conversation.id)}
                  aria-current={conversation.id === activeConversationId ? 'page' : undefined}
                  title={conversation.title}
                >
                  <MessageSquare size={15} aria-hidden="true" />
                  <span>{conversation.title}</span>
                </button>
                <button
                  className="history-delete-btn"
                  onClick={() => handleDeleteConversation(conversation.id)}
                  aria-label={`Delete chat: ${conversation.title}`}
                  title="Delete chat"
                  disabled={isProcessing || steerLoadingId !== null}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
            {visibleConversations.length === 0 && (
              <p className="history-no-results">No chats found</p>
            )}
          </nav>

          <div className="history-footer">Saved on this device</div>
        </aside>

        <main className="chat-pane" aria-label="PCA steering chat interface">
          <header className="chat-header">
            <div className="logo" aria-hidden="true">
              PCA                                                                                                                                              
            </div>                                                                                                                                             
                                                                                                                                                              
            <div className="header-main">                                                                                                                      
              <span className="header-title">Generative Controls</span>                                                                                        
              <span className="header-sub">                                                                                                                    
                Prompt-local PCA activation steering                                                                                                           
              </span>                                                                                                                                          
            </div>                                                                                                                                             
                                                                                                                                                              
          </header>                                                                                                                                            
                                                                                                                                                              
          <div                                                                                                                                                 
            className="chat-messages"                                                                                                                          
            role="log"                                                                                                                                         
            aria-live="polite"                                                                                                                                 
            aria-relevant="additions"                                                                                                                          
          >                                                                                                                                                    
            <div className="messages-inner">                                                                                                                   
              {errorMessage && (                                                                                                                               
                <div className="error-banner" role="alert">                                                                                                    
                  <AlertCircle size={16} aria-hidden="true" />                                                                                                 
                  <span>{errorMessage}</span>                                                                                                                  
                </div>                                                                                                                                         
              )}                                                                                                                                               
                                                                                                                                                              
              {messages.map((msg) => (                                                                                                                         
                <div key={msg.id}>                                                                                                                             
                  {msg.role === 'user' && (                                                                                                                    
                    <div className="msg-user">                                                                                                                 
                      <div className="msg-user-bubble">{msg.content}</div>                                                                                     
                    </div>                                                                                                                                     
                  )}                                                                                                                                           
                                                                                                                                                              
                  {msg.role === 'ai' && (                                                                                                                      
                    <div className="msg-ai">                                                                                                                   
                      <div className="ai-avatar" aria-hidden="true">                                                                                           
                        AI                                                                                                                                     
                      </div>                                                                                                                                   
                                                                                                                                                              
                      <div className="ai-content">                                                                                                             
                        <div className={`ai-text${msg.isSteering ? ' loading' : ''}`}>                                                                         
                          {msg.baselineContent && msg.content !== msg.baselineContent ? (                                                                      
                            <SplitMessageView                                                                                                                  
                              msg={msg}                                                                                                                        
                              showDiff={showDiff}                                                                                                              
                              onToggleDiff={() => setShowDiff((p) => !p)}                                                                                      
                            />                                                                                                                                 
                          ) : (                                                                                                                                
                            <div className="ai-plain-text">{msg.content}</div>                                                                                 
                          )}                                                                                                                                   
                        </div>                                                                                                                                 
                                                                                                                                                              
                        {steerLoadingId === msg.id && (                                                                                                        
                          <div className="status-line" role="status" aria-live="polite">                                                                       
                            <RefreshCw size={12} className="spin" aria-hidden="true" />                                                                        
                            Applying PCA steering vector…                                                                                                      
                          </div>                                                                                                                               
                        )}                                                                                                                                     
                      </div>                                                                                                                                   
                    </div>                                                                                                                                     
                  )}                                                                                                                                           
                </div>                                                                                                                                         
              ))}                                                                                                                                              
                                                                                                                                                              
              {isProcessing && (                                                                                                                               
                <div                                                                                                                                           
                  className="status-line"                                                                                                                      
                  style={{ paddingLeft: 44 }}                                                                                                                  
                  role="status"                                                                                                                                
                  aria-live="polite"                                                                                                                           
                >                                                                                                                                              
                  <RefreshCw size={12} className="spin" aria-hidden="true" />                                                                                  
                  Sampling completions, extracting activations, and fitting PCA…                                                                               
                </div>                                                                                                                                         
              )}                                                                                                                                               
                                                                                                                                                              
              <div ref={chatEndRef} />                                                                                                                         
            </div>                                                                                                                                             
          </div>                                                                                                                                               
                                                                                                                                                              
          <div className="input-wrap">                                                                                                                         
            <div className="input-inner">                                                                                                                      
              <label htmlFor="prompt-input" className="visually-hidden">                                                                                       
                Prompt input                                                                                                                                   
              </label>                                                                                                                                         
                                                                                                                                                              
              <textarea                                                                                                                                        
                id="prompt-input"                                                                                                                              
                ref={inputRef}                                                                                                                                 
                className="input-textarea"                                                                                                                     
                value={inputText}                                                                                                                              
                aria-label="Prompt input"                                                                                                                      
                aria-describedby="prompt-help"                                                                                                                 
                onChange={(e) => {                                                                                                                             
                  setInputText(e.target.value);                                                                                                                
                  e.target.style.height = 'auto';                                                                                                              
                  e.target.style.height = `${e.target.scrollHeight}px`;                                                                                        
                }}                                                                                                                                             
                onKeyDown={(e) => {                                                                                                                            
                  if (e.key === 'Enter' && !e.shiftKey) {                                                                                                      
                    e.preventDefault();                                                                                                                        
                    handleSendMessage();                                                                                                                       
                  }                                                                                                                                            
                }}                                                                                                                                             
                placeholder="Enter a prompt to discover PCA control axes…"                                                                                     
                rows={1}                                                                                                                                       
                disabled={isProcessing || steerLoadingId !== null}                                                                                             
              />                                                                                                                                               
                                                                                                                                                              
              <span id="prompt-help" className="visually-hidden">                                                                                              
                Press Enter to submit. Press Shift Enter to insert a line break.                                                                               
              </span>                                                                                                                                          
                                                                                                                                                              
              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={isProcessing || !inputText.trim() || steerLoadingId !== null}
                aria-label="Send message"
                title="Send message"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </div>                                                                                                                                             
          </div>                                                                                                                                               
        </main>                                                                                                                                                
                                                                                                                                                              
        <aside className="controls-pane" aria-label="PCA steering controls">                                                                                   
          <div className="controls-header">                                                                                                                    
            <div>                                                                                                                                              
              <div className="controls-title">                                                                                                                 
                <SlidersHorizontal size={15} aria-hidden="true" />                                                                                             
                PCA controls                                                                                                                                   
              </div>                                                                                                                                           
              <div className="controls-subtitle">                                                                                                              
                Prompt-local latent dimensions discovered from sampled completions.                                                                            
              </div>                                                                                                                                           
            </div>                                                                                                                                             
                                                                                                                                                              
            {axes.length > 0 && <span className="axes-chip">{axes.length} axes</span>}                                                                         
          </div>                                                                                                                                               
                                                                                                                                                              
          {axes.length === 0 ? (                                                                                                                               
            <div className="empty-state">                                                                                                                      
              <div className="empty-icon" aria-hidden="true">                                                                                                  
                <AlertCircle size={20} />                                                                                                                      
              </div>                                                                                                                                           
              <div className="empty-title">No controls yet</div>                                                                                               
              <div className="empty-desc">                                                                                                                     
                Submit a prompt to sample completions, extract hidden activations, and                                                                         
                discover the top principal steering directions.                                                                                                
              </div>                                                                                                                                           
            </div>                                                                                                                                             
          ) : (                                                                                                                                                
            <div className="controls-scroll">                                                                                                                  
              {axes.map((axis, i) => {                                                                                                                         
                const color = AXIS_COLORS[i % AXIS_COLORS.length];                                                                                             
                const isActive = axis.currentValue !== 0;                                                                                                      
                const pct = ((axis.currentValue + 50) / 100) * 100;                                                                                            
                const neutral = '#d8dee8';                                                                                                                     
                                                                                                                                                              
                const trackBg =                                                                                                                                
                  axis.currentValue === 0                                                                                                                      
                    ? `linear-gradient(to right, ${neutral} 0%, ${neutral} 100%)`                                                                              
                    : axis.currentValue > 0                                                                                                                    
                      ? `linear-gradient(to right, ${neutral} 0%, ${neutral} 50%, ${color}55 50%, ${color} ${pct}%, ${neutral} ${pct}%, ${neutral} 100%)`      
                      : `linear-gradient(to right, ${neutral} 0%, ${neutral} ${pct}%, ${color} ${pct}%, ${color}55 50%, ${neutral} 50%, ${neutral} 100%)`;     
                                                                                                                                                              
                return (                                                                                                                                       
                  <div                                                                                                                                         
                    key={axis.index}                                                                                                                           
                    className={`axis-card${isActive ? ' active' : ''}${                                                                                        
                      steerLoadingId !== null ? ' disabled' : ''                                                                                               
                    }`}                                                                                                                                        
                    style={isActive ? { borderColor: `${color}66` } : {}}                                                                                      
                  >                                                                                                                                            
                    <div className="axis-header">                                                                                                              
                      <div className="axis-left">                                                                                                              
                        <div                                                                                                                                   
                          className="axis-dot"                                                                                                                 
                          style={{ background: color }}                                                                                                        
                          aria-hidden="true"                                                                                                                   
                        />                                                                                                                                     
                                                                                                                                                              
                        <div className="axis-name-wrap">                                                                                                       
                          <span className="axis-name">{axis.label}</span>                                                                                      
                                                                                                                                                              
                          <div className="axis-meta">                                                                                                          
                            <span className="axis-var">                                                                                                        
                              {(axis.variance * 100).toFixed(1)}% var                                                                                          
                            </span>                                                                                                                            
                                                                                                                                                              
                            {axis.coherence !== undefined && (                                                                                                 
                              <span className="axis-var">                                                                                                      
                                {axis.coherence.toFixed(1)}/10 coherence                                                                                       
                              </span>                                                                                                                          
                            )}                                                                                                                                 
                          </div>                                                                                                                               
                        </div>                                                                                                                                 
                      </div>                                                                                                                                   
                                                                                                                                                              
                      <div className="axis-right">                                                                                                             
                        <span                                                                                                                                  
                          className={`axis-value${isActive ? ' active' : ''}`}                                                                                 
                          style={isActive ? { color } : {}}                                                                                                    
                        >                                                                                                                                      
                          {formatAlpha(axis.currentValue)}                                                                                                     
                        </span>                                                                                                                                
                                                                                                                                                              
                        {isActive && (                                                                                                                         
                          <button                                                                                                                              
                            className="reset-btn"                                                                                                              
                            onClick={() => handleReset(axis.index)}                                                                                            
                            aria-label={`Reset ${axis.label}`}                                                                                                 
                          >                                                                                                                                    
                            <RotateCcw size={11} aria-hidden="true" />                                                                                         
                            Reset                                                                                                                              
                          </button>                                                                                                                            
                        )}                                                                                                                                     
                      </div>                                                                                                                                   
                    </div>                                                                                                                                     
                                                                                                                                                              
                    <div className="slider-wrap">                                                                                                              
                      <input                                                                                                                                   
                        type="range"                                                                                                                           
                        className="slider-input"                                                                                                               
                        min="-50"                                                                                                                              
                        max="50"                                                                                                                               
                        step="10"                                                                                                                              
                        value={axis.currentValue}                                                                                                              
                        aria-label={`Steer ${axis.label}`}                                                                                                     
                        aria-valuemin={-50}                                                                                                                    
                        aria-valuemax={50}                                                                                                                     
                        aria-valuenow={axis.currentValue}                                                                                                      
                        aria-valuetext={`${axis.label}, ${formatAlpha(                                                                                         
                          axis.currentValue                                                                                                                    
                        )}`}                                                                                                                                   
                        style={{ background: trackBg }}                                                                                                        
                        onChange={(e) => {                                                                                                                     
                          if (!steerLoadingId) {                                                                                                               
                            setAxes((prev) =>                                                                                                                  
                              prev.map((a) =>                                                                                                                  
                                a.index === axis.index                                                                                                         
                                  ? {                                                                                                                          
                                      ...a,                                                                                                                    
                                      currentValue: parseInt(e.target.value),                                                                                  
                                    }                                                                                                                          
                                  : a                                                                                                                          
                              )                                                                                                                                
                            );                                                                                                                                 
                          }                                                                                                                                    
                        }}                                                                                                                                     
                        onPointerUp={(e) => {                                                                                                                  
                          if (!steerLoadingId) {                                                                                                               
                            handleSteer(                                                                                                                       
                              axis.index,                                                                                                                      
                              parseInt((e.target as HTMLInputElement).value)                                                                                   
                            );                                                                                                                                 
                          }                                                                                                                                    
                        }}                                                                                                                                     
                        onKeyUp={(e) => {                                                                                                                      
                          if (                                                                                                                                 
                            !steerLoadingId &&                                                                                                                 
                            [                                                                                                                                  
                              'ArrowLeft',                                                                                                                     
                              'ArrowRight',                                                                                                                    
                              'ArrowUp',                                                                                                                       
                              'ArrowDown',                                                                                                                     
                              'Home',                                                                                                                          
                              'End',                                                                                                                           
                            ].includes(e.key)                                                                                                                  
                          ) {                                                                                                                                  
                            handleSteer(                                                                                                                       
                              axis.index,                                                                                                                      
                              parseInt((e.target as HTMLInputElement).value)                                                                                   
                            );                                                                                                                                 
                          }                                                                                                                                    
                        }}                                                                                                                                     
                        disabled={steerLoadingId !== null}                                                                                                     
                      />                                                                                                                                       
                                                                                                                                                              
                      <div className="center-mark" aria-hidden="true" />                                                                                       
                    </div>                                                                                                                                     
                                                                                                                                                              
                    <div className="axis-labels">                                                                                                              
                      <span className="axis-label">                                                                                                            
                        “{truncate(axis.negative_example, 42)}”                                                                                                
                      </span>                                                                                                                                  
                      <span className="axis-label right">                                                                                                      
                        “{truncate(axis.positive_example, 42)}”                                                                                                
                      </span>                                                                                                                                  
                    </div>                                                                                                                                     
                  </div>                                                                                                                                       
                );                                                                                                                                             
              })}                                                                                                                                              
                                                                                                                                                              
              <div className="custom-box">                                                                                                                     
                <label className="custom-label" htmlFor="custom-axis-input">                                                                                   
                  Optional custom axis                                                                                                                         
                </label>                                                                                                                                       
                                                                                                                                                              
                <div className="custom-row">                                                                                                                   
                  <input                                                                                                                                       
                    id="custom-axis-input"                                                                                                                     
                    className="custom-input"                                                                                                                   
                    value={customConcept}                                                                                                                      
                    onChange={(e) => setCustomConcept(e.target.value)}                                                                                         
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAxis()}                                                                              
                    placeholder="e.g. Sarcastic"                                                                                                               
                    disabled={isCustomProcessing || steerLoadingId !== null}                                                                                   
                  />                                                                                                                                           
                                                                                                                                                              
                  <button                                                                                                                                      
                    className="custom-btn"                                                                                                                     
                    onClick={handleAddCustomAxis}                                                                                                              
                    aria-label="Add custom axis"                                                                                                               
                    disabled={                                                                                                                                 
                      isCustomProcessing ||                                                                                                                    
                      !customConcept.trim() ||                                                                                                                 
                      steerLoadingId !== null                                                                                                                  
                    }                                                                                                                                          
                  >                                                                                                                                            
                    {isCustomProcessing ? (                                                                                                                    
                      <RefreshCw size={15} className="spin" aria-hidden="true" />                                                                              
                    ) : (                                                                                                                                      
                      <Plus size={16} aria-hidden="true" />                                                                                                    
                    )}                                                                                                                                         
                  </button>                                                                                                                                    
                </div>                                                                                                                                         
              </div>                                                                                                                                           
                                                                                                                                                              
              {cloudVariations.length > 0 && (                                                                                                                 
                <div className="cloud-section">                                                                                                                
                  <button                                                                                                                                      
                    className="cloud-toggle"                                                                                                                   
                    onClick={() => setShowVariations((v) => !v)}                                                                                               
                    aria-expanded={showVariations}                                                                                                             
                  >                                                                                                                                            
                    <span className="cloud-toggle-title">                                                                                                      
                      <Database size={13} aria-hidden="true" />                                                                                                
                      Latent cloud samples                                                                                                                     
                    </span>                                                                                                                                    
                                                                                                                                                              
                    {showVariations ? (                                                                                                                        
                      <ChevronUp size={15} color="var(--text-muted)" aria-hidden="true" />                                                                     
                    ) : (                                                                                                                                      
                      <ChevronDown                                                                                                                             
                        size={15}                                                                                                                              
                        color="var(--text-muted)"                                                                                                              
                        aria-hidden="true"                                                                                                                     
                      />                                                                                                                                       
                    )}                                                                                                                                         
                  </button>                                                                                                                                    
                                                                                                                                                              
                  {showVariations && (                                                                                                                         
                    <div className="cloud-list">                                                                                                               
                      {cloudVariations.map((v, idx) => (                                                                                                       
                        <div key={idx} className="cloud-item">                                                                                                 
                          {v}                                                                                                                                  
                        </div>                                                                                                                                 
                      ))}                                                                                                                                      
                    </div>                                                                                                                                     
                  )}                                                                                                                                           
                </div>                                                                                                                                         
              )}                                                                                                                                               
            </div>                                                                                                                                             
          )}                                                                                                                                                   
                                                                                                                                                              
          <div className="controls-footer">                                                                                                                    
            <div className="live-dot" aria-hidden="true" />                                                                                                    
            <span className="footer-text">PyTorch GPU · PCA steering backend</span>                                                                            
          </div>                                                                                                                                               
        </aside>                                                                                                                                               
      </div>
  );                                                                                                                                                           
}
