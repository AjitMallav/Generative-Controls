import * as Diff from 'diff';
import { useState, useRef, useEffect } from 'react';
import { Send, SlidersHorizontal, AlertCircle, Zap, RefreshCw, RotateCcw, Plus, Eye, EyeOff, ArrowRight, Database, ChevronDown, ChevronUp } from 'lucide-react';

type Message = { 
  id: string; role: 'user' | 'ai'; content: string; isSteering?: boolean; cacheHit?: boolean;
  baselineContent?: string; steeredAxis?: string; steeredValue?: number;
};
type Axis = { index: number; label: string; positive_example: string; negative_example: string; currentValue: number; variance: number };

const MOCK_AXES: Axis[] = [
  { index: 0, label: "Enthusiasm", positive_example: "I'm so incredibly sorry, please have a blast!", negative_example: "I am not coming.", currentValue: 0, variance: 0.452 },
  { index: 1, label: "Verbosity", positive_example: "Hello, I am writing to sincerely apologize...", negative_example: "Can't make it.", currentValue: 0, variance: 0.281 },
  { index: 2, label: "Formality", positive_example: "Please accept my apologies, I must respectfully...", negative_example: "yo can't make the party.", currentValue: 0, variance: 0.153 }
];

const MOCK_VARIATIONS = [
  "I cannot make the party.",
  "Unfortunately, I'll be absent tonight due to personal matters.",
  "Gonna have to pass on the gathering, have fun!",
  "I deeply regret that I won't attend the festivities.",
  "Can't make it to the party later.",
  "I will not be present at the function this evening.",
  "Skipping the party tonight, sorry everyone!",
  "Please excuse my absence this evening.",
  "I won't be there tonight.",
  "Unable to join the festivities, catch you next time."
];

const BASELINE_RESPONSE = "Hi boss, I'm really sorry but I can't make the party tonight.";

const MOCK_RESPONSES: Record<string, string> = {
  "0_-50": "I will not be at the party tonight.",
  "0_50": "Hey boss! I'm really sad to miss the party! Please have an amazing time celebrating, I'll be cheering you all on from afar!!",
  "1_-50": "Boss, I can't attend.",
  "1_50": "Hi boss, I am writing to let you know that unfortunately, due to some unforeseen circumstances that have come up, I will not be able to join you.",
  "2_-50": "Hey boss, I think I'm going to sit this one out tonight!",
  "2_50": "Please accept my sincere apologies, but I must respectfully decline my invitation to this evening's corporate function."
};

const AXIS_COLORS = ['#818cf8', '#fbbf24', '#34d399', '#f472b6', '#38bdf8'];

const DiffHighlighter = ({ baseline, steered }: { baseline: string, steered: string }) => {
  const diff = Diff.diffWords(baseline, steered);
  return (
    <div style={{ fontSize: '0.97rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
      {diff.map((part, index) => {
        if (part.added) return <span key={index} style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '2px 4px', borderRadius: '4px', fontWeight: 500, margin: '0 1px' }}>{part.value}</span>;
        if (part.removed) return <span key={index} style={{ backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#f87171', textDecoration: 'line-through', padding: '2px 4px', borderRadius: '4px', opacity: 0.8, margin: '0 1px' }}>{part.value}</span>;
        return <span key={index} style={{ color: 'var(--text-primary)' }}>{part.value}</span>;
      })}
    </div>
  );
};

const SplitMessageView = ({ msg }: { msg: Message }) => {
  const [showDiff, setShowDiff] = useState(false);
  return (
    <div className="split-view-container">
      <div className="split-left">
        <div className="split-header">Original Output</div>
        <div style={{ fontSize: '0.97rem', lineHeight: '1.6' }}>{msg.baselineContent}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--border-strong)' }}>
        <ArrowRight size={20} />
      </div>
      <div className="split-right">
        <div className="split-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Steered Variant</span>
            <button onClick={() => setShowDiff(!showDiff)} className="toggle-diff-btn" title={showDiff ? "Hide Changes" : "Show Changes"}>
              {showDiff ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <span className="steered-badge">{msg.steeredAxis} {msg.steeredValue && msg.steeredValue > 0 ? '+' : ''}{msg.steeredValue}</span>
        </div>
        {showDiff ? <DiffHighlighter baseline={msg.baselineContent || ""} steered={msg.content} /> : <div style={{ fontSize: '0.97rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>{msg.content}</div>}
        {msg.cacheHit && <span style={{ position: 'absolute', right: '-10px', top: '-10px', color: '#eab308', animation: 'pulse 1s ease-in-out', backgroundColor: 'var(--surface)', borderRadius: '50%', padding: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}><Zap size={16} fill="#eab308" /></span>}
      </div>
    </div>
  );
};
 
export default function App() {
  const [messages, setMessages] = useState<Message[]>([{ id: '1', role: 'ai', content: 'Hello! What would you like me to write?' }]);
  const [inputText, setInputText] = useState("Write a one-sentence text message to my boss canceling on work party tonight.");
  const [customConcept, setCustomConcept] = useState("");
  
  const [axes, setAxes] = useState<Axis[]>([]);
  const [cloudVariations, setCloudVariations] = useState<string[]>([]);
  const [showVariations, setShowVariations] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCustomProcessing, setIsCustomProcessing] = useState(false);
  const [steerLoadingId, setSteerLoadingId] = useState<string | null>(null);
  
  const generationCache = useRef<Record<string, string>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
 
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
 
  const handleSendMessage = () => {
    if (!inputText.trim() || isProcessing) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsProcessing(true);
    setAxes([]);
    setCloudVariations([]); 
    setShowVariations(false);
    generationCache.current = { '0_0': BASELINE_RESPONSE, '1_0': BASELINE_RESPONSE, '2_0': BASELINE_RESPONSE };
    
    setTimeout(() => {
      setAxes(MOCK_AXES);
      setCloudVariations(MOCK_VARIATIONS); 
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: BASELINE_RESPONSE, baselineContent: BASELINE_RESPONSE }]);
      setIsProcessing(false);
    }, 2000);
  };
 
  const handleAddCustomAxis = () => {
    if (!customConcept.trim() || isCustomProcessing || axes.length === 0) return;
    setIsCustomProcessing(true);
    setTimeout(() => {
      const newAxis: Axis = { index: axes.length, label: customConcept.charAt(0).toUpperCase() + customConcept.slice(1), positive_example: `A response dominated by ${customConcept}...`, negative_example: `A response devoid of ${customConcept}...`, currentValue: 0, variance: Math.random() * 0.15 + 0.05 };
      setAxes(prev => [...prev, newAxis]);
      const cacheBase = newAxis.index;
      MOCK_RESPONSES[`${cacheBase}_-50`] = `Mock negative steered response for ${newAxis.label}.`;
      MOCK_RESPONSES[`${cacheBase}_50`] = `Mock positive steered response for ${newAxis.label}!`;
      generationCache.current[`${cacheBase}_0`] = BASELINE_RESPONSE;
      setCustomConcept(""); setIsCustomProcessing(false);
    }, 1200);
  };

  const handleSteer = (axisIndex: number, coefficient: number) => {
    const targetAxis = axes.find(a => a.index === axisIndex);
    setAxes(prev => prev.map((a) => a.index === axisIndex ? { ...a, currentValue: coefficient } : { ...a, currentValue: 0 }));
    const cacheKey = `${axisIndex}_${coefficient}`;
    const targetMessageId = messages[messages.length - 1].id;
 
    if (generationCache.current[cacheKey] !== undefined) {
      const cachedContent = generationCache.current[cacheKey];
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content: cachedContent, isSteering: false, cacheHit: true, steeredAxis: targetAxis?.label, steeredValue: coefficient };
        return newMsgs;
      });
      setTimeout(() => { setMessages(curr => curr.map(m => m.id === targetMessageId ? { ...m, cacheHit: false } : m)); }, 1800);
      return;
    }
 
    setSteerLoadingId(targetMessageId);
    setMessages(prev => { const newMsgs = [...prev]; newMsgs[newMsgs.length - 1].isSteering = true; return newMsgs; });
 
    const randomDelay = Math.floor(Math.random() * 4000) + 1000;
    setTimeout(() => {
      const generatedText = MOCK_RESPONSES[cacheKey] || `Mock generated response for ${targetAxis?.label} at ${coefficient}.`;
      generationCache.current[cacheKey] = generatedText;
      setMessages(prev => {
        const newMsgs = [...prev];
        const idx = newMsgs.findIndex(m => m.id === targetMessageId);
        if (idx !== -1) newMsgs[idx] = { ...newMsgs[idx], content: generatedText, isSteering: false, steeredAxis: targetAxis?.label, steeredValue: coefficient };
        return newMsgs;
      });
      setSteerLoadingId(null);
    }, randomDelay);
  };
 
  const handleReset = (axisIndex: number) => { if (!steerLoadingId) handleSteer(axisIndex, 0); };
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --bg: #0c0c0f; --surface: #141418; --surface-2: #1d1d24; --border: rgba(255,255,255,0.10); --border-strong: rgba(255,255,255,0.18); --text-primary: #f0f0f8; --text-secondary: #c0c0d8; --text-muted: #8888a8; --text-dim: #555570; --accent: #7c6cfa; --user-bubble: #1e1e2e; }
        body { background: var(--bg); }
        .app { display: flex; height: 100vh; font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text-primary); overflow: hidden; }
        .chat-pane { flex: 1; display: flex; flex-direction: column; position: relative; min-width: 0; }
        .chat-header { position: absolute; top: 0; left: 0; right: 0; z-index: 20; padding: 20px 32px; display: flex; align-items: center; gap: 12px; background: linear-gradient(to bottom, var(--bg) 60%, transparent); }
        .logo-mark { width: 32px; height: 32px; background: linear-gradient(135deg, #7c6cfa, #a78bfa); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 20px rgba(124,108,250,0.3); }
        .chat-title { font-weight: 600; font-size: 0.92rem; color: var(--text-primary); letter-spacing: 0.01em; }
        .chat-badge { background: var(--surface-2); border: 1px solid var(--border-strong); color: var(--text-muted); font-family: 'Geist Mono', monospace; font-size: 0.65rem; padding: 3px 9px; border-radius: 4px; letter-spacing: 0.06em; text-transform: uppercase; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 88px 32px 140px; display: flex; flex-direction: column; align-items: center; scrollbar-width: thin; scrollbar-color: var(--surface-2) transparent; }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--surface-2); border-radius: 4px; }
        .messages-inner { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 28px; }
        .msg-user { display: flex; justify-content: flex-end; }
        .msg-user-bubble { background: var(--user-bubble); border: 1px solid var(--border-strong); padding: 13px 18px; border-radius: 18px 18px 4px 18px; max-width: 72%; font-size: 0.93rem; lineHeight: 1.6; color: var(--text-primary); }
        .msg-ai { display: flex; gap: 14px; align-items: flex-start; width: 100%; }
        .ai-avatar { width: 30px; height: 30px; flex-shrink: 0; background: linear-gradient(135deg, #7c6cfa, #a78bfa); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 0 16px rgba(124,108,250,0.2); margin-top: 2px; }
        .ai-content { display: flex; flex-direction: column; gap: 7px; min-width: 0; width: 100%; }
        .ai-text { font-size: 0.97rem; line-height: 1.75; color: var(--text-primary); transition: opacity 0.25s ease; width: 100%; }
        .ai-text.loading { opacity: 0.28; pointer-events: none; }
        .split-view-container { display: flex; gap: 16px; width: 100%; align-items: stretch; }
        .split-left { flex: 1; background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: 12px; padding: 16px; color: var(--text-secondary); }
        .split-right { flex: 1; background: rgba(124, 108, 250, 0.05); border: 1px solid rgba(124, 108, 250, 0.25); border-radius: 12px; padding: 16px; color: var(--text-primary); position: relative; box-shadow: 0 4px 20px rgba(124, 108, 250, 0.05); }
        .split-header { font-family: 'Geist Mono', monospace; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
        .split-left .split-header { color: var(--text-muted); }
        .split-right .split-header { display: flex; justify-content: space-between; align-items: center; color: #a78bfa; }
        .steered-badge { background: rgba(124, 108, 250, 0.15); color: #c4b5fd; padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; }
        .toggle-diff-btn { background: transparent; border: 1px solid rgba(167, 139, 250, 0.3); color: #a78bfa; border-radius: 6px; padding: 2px 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .toggle-diff-btn:hover { background: rgba(167, 139, 250, 0.15); border-color: rgba(167, 139, 250, 0.5); }
        .toggle-diff-btn:active { transform: scale(0.95); }
        .steering-status { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.81rem; font-family: 'Geist Mono', monospace; letter-spacing: 0.02em; }
        .typing-indicator { display: flex; align-items: center; gap: 10px; color: var(--text-muted); font-size: 0.82rem; font-family: 'Geist Mono', monospace; letter-spacing: 0.02em; }
        .input-wrap { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 32px 28px; background: linear-gradient(transparent, var(--bg) 35%); display: flex; justify-content: center; }
        .input-inner { width: 100%; max-width: 680px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 16px; display: flex; align-items: flex-end; gap: 10px; padding: 14px 14px 14px 18px; box-shadow: 0 4px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03); transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .input-inner:focus-within { border-color: rgba(124,108,250,0.5); box-shadow: 0 4px 40px rgba(0,0,0,0.4), 0 0 24px rgba(124,108,250,0.1); }
        .input-textarea { flex: 1; background: transparent; border: none; outline: none; color: var(--text-primary); font-family: 'DM Sans', sans-serif; font-size: 0.93rem; line-height: 1.55; resize: none; min-height: 24px; max-height: 120px; overflow-y: auto; scrollbar-width: none; }
        .input-textarea::placeholder { color: var(--text-dim); }
        .input-textarea::-webkit-scrollbar { display: none; }
        .send-btn { height: 40px; padding: 0 16px; flex-shrink: 0; background: var(--accent); border: none; border-radius: 10px; color: #fff; display: flex; align-items: center; gap: 7px; font-family: 'DM Sans', sans-serif; font-size: 0.84rem; font-weight: 600; letter-spacing: 0.01em; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 2px 14px rgba(124,108,250,0.35); white-space: nowrap; }
        .send-btn:hover:not(:disabled) { background: #8b7cfa; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(124,108,250,0.5); }
        .send-btn:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 10px rgba(124,108,250,0.3); }
        .send-btn:disabled { background: var(--surface-2); color: var(--text-dim); box-shadow: none; cursor: not-allowed; }
        .controls-pane { width: 368px; flex-shrink: 0; background: var(--surface); border-left: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
        .controls-header { padding: 22px 24px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .controls-title { display: flex; align-items: center; gap: 9px; font-weight: 700; font-size: 0.78rem; color: var(--text-secondary); letter-spacing: 0.08em; text-transform: uppercase; }
        .axes-chip { font-family: 'Geist Mono', monospace; font-size: 0.70rem; font-weight: 500; color: var(--text-secondary); background: rgba(255,255,255,0.07); border: 1px solid var(--border-strong); padding: 2px 10px; border-radius: 20px; letter-spacing: 0.03em; }
        .controls-scroll { flex: 1; overflow-y: auto; padding: 18px; scrollbar-width: thin; scrollbar-color: var(--surface-2) transparent; display: flex; flex-direction: column; gap: 12px; }
        .controls-scroll::-webkit-scrollbar { width: 3px; }
        .controls-scroll::-webkit-scrollbar-thumb { background: var(--surface-2); }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; flex: 1; padding: 40px 24px; text-align: center; }
        .empty-icon { width: 48px; height: 48px; background: var(--surface-2); border: 1px solid var(--border-strong); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); margin-bottom: 4px; }
        .empty-title { font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); }
        .empty-desc { font-size: 0.81rem; color: var(--text-muted); line-height: 1.65; }
        .axis-card { background: var(--surface-2); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px 14px; transition: border-color 0.2s; }
        .axis-card.disabled { opacity: 0.42; pointer-events: none; }
        .axis-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .axis-left { display: flex; align-items: center; gap: 9px; }
        .axis-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; transition: box-shadow 0.2s; }
        .axis-name { font-size: 0.91rem; font-weight: 600; color: var(--text-primary); }
        .axis-var { font-family: 'Geist Mono', monospace; font-size: 0.68rem; color: var(--text-muted); background: rgba(255,255,255,0.05); border: 1px solid var(--border); padding: 2px 7px; border-radius: 4px; letter-spacing: 0.02em; }
        .axis-right { display: flex; align-items: center; gap: 8px; }
        .axis-value { font-family: 'Geist Mono', monospace; font-size: 0.85rem; font-weight: 500; color: var(--text-muted); min-width: 32px; text-align: right; transition: color 0.15s; }
        .axis-value.nonzero { font-weight: 700; }
        .reset-btn { display: flex; align-items: center; gap: 5px; padding: 4px 11px; height: 28px; background: rgba(255,255,255,0.07); border: 1px solid var(--border-strong); border-radius: 7px; color: var(--text-secondary); font-family: 'DM Sans', sans-serif; font-size: 0.74rem; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
        .reset-btn:hover { background: rgba(255,255,255,0.13); border-color: rgba(255,255,255,0.30); color: var(--text-primary); }
        .reset-btn:active { background: rgba(255,255,255,0.08); transform: scale(0.97); }
        .slider-track { position: relative; margin-bottom: 12px; }
        .slider-input { width: 100%; -webkit-appearance: none; appearance: none; height: 5px; border-radius: 3px; outline: none; cursor: pointer; }
        .slider-input:disabled { cursor: not-allowed; }
        .slider-input::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #f0f0f8; border: 2.5px solid var(--bg); box-shadow: 0 1px 8px rgba(0,0,0,0.5); cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; }
        .slider-input:not(:disabled)::-webkit-slider-thumb:hover { transform: scale(1.25); box-shadow: 0 2px 14px rgba(0,0,0,0.6); }
        .slider-input::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #f0f0f8; border: 2.5px solid var(--bg); cursor: pointer; }
        .center-tick { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 1.5px; height: 12px; background: rgba(255,255,255,0.22); pointer-events: none; border-radius: 1px; }
        .axis-labels { display: flex; justify-content: space-between; gap: 8px; }
        .axis-label { font-size: 0.71rem; color: var(--text-muted); line-height: 1.45; font-style: italic; flex: 1; }
        .axis-label.right { text-align: right; }
        .custom-dimension-box { margin-top: 8px; padding: 16px; border-radius: 14px; border: 1px dashed var(--border-strong); background: rgba(255,255,255,0.02); }
        .custom-dimension-label { display: block; font-size: 0.80rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; letter-spacing: 0.02em; }
        .custom-input-row { display: flex; gap: 8px; }
        .custom-input { flex: 1; background: var(--surface); border: 1px solid var(--border); padding: 10px 14px; border-radius: 8px; color: var(--text-primary); font-family: 'DM Sans', sans-serif; font-size: 0.88rem; outline: none; transition: border-color 0.2s; }
        .custom-input:focus { border-color: var(--accent); }
        .custom-input::placeholder { color: var(--text-dim); }
        .custom-btn { background: var(--accent); border: none; color: white; padding: 0 14px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .custom-btn:hover:not(:disabled) { background: #8b7cfa; }
        .custom-btn:disabled { background: var(--surface-2); color: var(--text-dim); cursor: not-allowed; }
        
        .cloud-explorer { margin-top: 16px; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: var(--surface-2); transition: all 0.3s ease; }
        .cloud-header { padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: rgba(255,255,255,0.02); }
        .cloud-header:hover { background: rgba(255,255,255,0.05); }
        .cloud-title { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .cloud-content { padding: 0 16px 16px 16px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; }
        .cloud-item { font-family: 'Geist Mono', monospace; font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 6px; border-left: 2px solid var(--border-strong); line-height: 1.4; }
        
        .controls-footer { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
        .footer-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 7px rgba(52,211,153,0.6); animation: pulse 2s infinite; flex-shrink: 0; }
        .footer-text { font-family: 'Geist Mono', monospace; font-size: 0.70rem; color: var(--text-muted); letter-spacing: 0.04em; text-transform: uppercase; }
        .spin { animation: spin 0.9s linear infinite; transform-origin: center; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes appear { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .msg-user, .msg-ai { animation: appear 0.25s ease forwards; }
      `}</style>
 
      <div className="app">
        <div className="chat-pane">
          <div className="chat-header">
            <div className="logo-mark">✦</div>
            <span className="chat-title">Latent Engine</span>
            <span className="chat-badge">Demo</span>
          </div>
 
          <div className="chat-messages">
            <div className="messages-inner">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'user' && <div className="msg-user"><div className="msg-user-bubble">{msg.content}</div></div>}
                  {msg.role === 'ai' && (
                    <div className="msg-ai">
                      <div className="ai-avatar">✦</div>
                      <div className="ai-content">
                        <div className={`ai-text${msg.isSteering ? ' loading' : ''}`}>
                          {msg.baselineContent && msg.content !== msg.baselineContent ? <SplitMessageView msg={msg} /> : <div style={{ fontSize: '0.97rem', lineHeight: '1.6', paddingTop: '4px' }}>{msg.content}</div>}
                        </div>
                        {steerLoadingId === msg.id && <div className="steering-status" style={{ marginTop: '12px' }}><RefreshCw size={13} className="spin" /> Modifying latent activations…</div>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && <div className="typing-indicator" style={{ paddingLeft: '44px' }}><RefreshCw size={13} className="spin" /> Mapping latent space…</div>}
              <div ref={chatEndRef} />
            </div>
          </div>
 
          <div className="input-wrap">
            <div className="input-inner">
              <textarea
                ref={inputRef} className="input-textarea" value={inputText}
                onChange={(e) => { setInputText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Message the model…" rows={1} disabled={isProcessing || steerLoadingId !== null}
              />
              <button className="send-btn" onClick={handleSendMessage} disabled={isProcessing || !inputText.trim() || steerLoadingId !== null}><Send size={14} /> Send</button>
            </div>
          </div>
        </div>
 
        <div className="controls-pane">
          <div className="controls-header">
            <div className="controls-title"><SlidersHorizontal size={14} /> Latent Controls</div>
            {axes.length > 0 && <span className="axes-chip">{axes.length} axes</span>}
          </div>
 
          {axes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><AlertCircle size={22} /></div>
              <div className="empty-title">No axes loaded</div>
              <div className="empty-desc">Send a prompt to extract latent steering dimensions from the model output.</div>
            </div>
          ) : (
            <div className="controls-scroll">
              {axes.map((axis, i) => {
                const color = AXIS_COLORS[i % AXIS_COLORS.length];
                const isActive = axis.currentValue !== 0;
                return (
                  <div key={axis.index} className={`axis-card${steerLoadingId !== null ? ' disabled' : ''}`} style={isActive ? { borderColor: color + '55' } : {}}>
                    <div className="axis-header">
                      <div className="axis-left">
                        <div className="axis-dot" style={{ background: color, boxShadow: isActive ? `0 0 8px ${color}80` : 'none' }} />
                        <span className="axis-name">{axis.label}</span>
                        <span className="axis-var">{(axis.variance * 100).toFixed(1)}% var</span>
                      </div>
                      <div className="axis-right">
                        <span className={`axis-value${isActive ? ' nonzero' : ''}`} style={isActive ? { color } : {}}>{axis.currentValue > 0 ? '+' : ''}{axis.currentValue}</span>
                        {isActive && <button className="reset-btn" onClick={() => handleReset(axis.index)}><RotateCcw size={11} /> Reset</button>}
                      </div>
                    </div>
                    <div className="slider-track">
                      <input
                        type="range" className="slider-input" min="-50" max="50" step="10" value={axis.currentValue}
                        style={{
                          background: (() => {
                            const pct = ((axis.currentValue + 50) / 100) * 100;
                            const neutral = 'rgba(255,255,255,0.10)';
                            if (axis.currentValue === 0) return `linear-gradient(to right, ${neutral} 0%, ${neutral} 100%)`;
                            if (axis.currentValue > 0) return `linear-gradient(to right, ${neutral} 0%, ${neutral} 50%, ${color}60 50%, ${color} ${pct}%, ${neutral} ${pct}%, ${neutral} 100%)`;
                            return `linear-gradient(to right, ${neutral} 0%, ${neutral} ${pct}%, ${color} ${pct}%, ${color}60 50%, ${neutral} 50%, ${neutral} 100%)`;
                          })()
                        }}
                        onChange={(e) => { if (!steerLoadingId) setAxes(prev => prev.map((a) => a.index === axis.index ? { ...a, currentValue: parseInt(e.target.value) } : a)); }}
                        onMouseUp={(e) => { if (!steerLoadingId) handleSteer(axis.index, parseInt((e.target as HTMLInputElement).value)); }}
                        onTouchEnd={(e) => { if (!steerLoadingId) handleSteer(axis.index, parseInt((e.target as HTMLInputElement).value)); }}
                        disabled={steerLoadingId !== null}
                      />
                      <div className="center-tick" />
                    </div>
                    <div className="axis-labels">
                      <span className="axis-label">&ldquo;{axis.negative_example.substring(0, 28)}…&rdquo;</span>
                      <span className="axis-label right">&ldquo;{axis.positive_example.substring(0, 28)}…&rdquo;</span>
                    </div>
                  </div>
                );
              })}

              <div className="custom-dimension-box">
                <label className="custom-dimension-label">Add Custom Dimension</label>
                <div className="custom-input-row">
                  <input className="custom-input" value={customConcept} onChange={(e) => setCustomConcept(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAxis()} placeholder="e.g. Sarcastic..." disabled={isCustomProcessing || steerLoadingId !== null} />
                  <button className="custom-btn" onClick={handleAddCustomAxis} disabled={isCustomProcessing || !customConcept.trim() || steerLoadingId !== null}>{isCustomProcessing ? <RefreshCw size={15} className="spin" /> : <Plus size={16} />}</button>
                </div>
              </div>

              {cloudVariations.length > 0 && (
                <div className="cloud-explorer">
                  <div className="cloud-header" onClick={() => setShowVariations(!showVariations)}>
                    <div className="cloud-title"><Database size={14} /> Latent Cloud Data</div>
                    {showVariations ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                  {showVariations && (
                    <div className="cloud-content">
                      {cloudVariations.map((v, idx) => (
                        <div key={idx} className="cloud-item">{v}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
 
          <div className="controls-footer"><div className="footer-dot" /><span className="footer-text">Model connected · Local inference</span></div>
        </div>
      </div>
    </>
  );
}
