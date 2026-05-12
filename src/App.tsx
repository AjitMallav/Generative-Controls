import * as Diff from 'diff';
import { useState, useRef, useEffect } from 'react';
import { Send, SlidersHorizontal, AlertCircle, Zap, RefreshCw, RotateCcw, Plus, Eye, EyeOff, ArrowRight, Database, ChevronDown, ChevronUp } from 'lucide-react';

type Message = {
  id: string; role: 'user' | 'ai'; content: string; isSteering?: boolean; cacheHit?: boolean;
  baselineContent?: string; steeredAxis?: string; steeredValue?: number;
};
type Axis = { index: number; label: string; positive_example: string; negative_example: string; currentValue: number; variance: number };

const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'https://light-points-push.loca.lt').replace(/\/+$/, '');
const API_HEADERS = {
  'Content-Type': 'application/json',
  'Bypass-Tunnel-Reminder': 'true',
  'bypass-tunnel-reminder': 'true',
  'ngrok-skip-browser-warning': 'true',
};

// Muted, academic-appropriate axis colors
const AXIS_COLORS = ['#4f81c7', '#c27d3a', '#5a9e73', '#9d5aae', '#c25a5a'];

const DiffHighlighter = ({ baseline, steered }: { baseline: string; steered: string }) => {
  const diff = Diff.diffWords(baseline, steered);
  return (
    <div style={{ fontSize: '0.875rem', lineHeight: '1.75', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)' }}>
      {diff.map((part, index) => {
        if (part.added) return <mark key={index} style={{ background: 'rgba(90,158,115,0.15)', color: '#2d7a50', padding: '1px 3px', borderRadius: '2px', fontWeight: 500 }}>{part.value}</mark>;
        if (part.removed) return <del key={index} style={{ background: 'rgba(194,90,90,0.10)', color: '#b05050', padding: '1px 3px', borderRadius: '2px', opacity: 0.75 }}>{part.value}</del>;
        return <span key={index}>{part.value}</span>;
      })}
    </div>
  );
};

const SplitMessageView = ({ msg, showDiff, onToggleDiff }: { msg: Message; showDiff: boolean; onToggleDiff: () => void }) => (
  <div className="split-view">
    <div className="split-col split-baseline">
      <div className="split-label">Baseline output</div>
      <div className="split-body">{msg.baselineContent}</div>
    </div>
    <div className="split-divider" aria-hidden="true"><ArrowRight size={14} /></div>
    <div className="split-col split-steered">
      <div className="split-label">
        <span>Steered variant</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {msg.steeredAxis && (
            <span className="axis-badge">{msg.steeredAxis} {msg.steeredValue && msg.steeredValue > 0 ? '+' : ''}{msg.steeredValue}</span>
          )}
          <button className="icon-btn" onClick={onToggleDiff} title={showDiff ? 'Hide diff' : 'Show diff'} aria-label={showDiff ? 'Hide changes' : 'Show changes'}>
            {showDiff ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          {msg.cacheHit && <Zap size={13} style={{ color: '#c27d3a' }} aria-label="Cached response" />}
        </div>
      </div>
      {showDiff
        ? <DiffHighlighter baseline={msg.baselineContent || ''} steered={msg.content} />
        : <div className="split-body" style={{ color: 'var(--text-primary)' }}>{msg.content}</div>}
    </div>
  </div>
);

export default function App() {
  const [messages, setMessages] = useState<Message[]>([{ id: '1', role: 'ai', content: 'Hello! What would you like me to write?' }]);
  const [inputText, setInputText] = useState('Write a short message to your team cancelling a meeting.');
  const [customConcept, setCustomConcept] = useState('');
  const [axes, setAxes] = useState<Axis[]>([]);
  const [cloudVariations, setCloudVariations] = useState<string[]>([]);
  const [showVariations, setShowVariations] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCustomProcessing, setIsCustomProcessing] = useState(false);
  const [steerLoadingId, setSteerLoadingId] = useState<string | null>(null);
  const generationCache = useRef<Record<string, string>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const callBackend = async (path: string, payload: Record<string, unknown>) => {
    const endpoint = `${API_BASE_URL}${path}`;
    const response = await fetch(endpoint, { method: 'POST', headers: API_HEADERS, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${endpoint}`);
    const data = await response.json();
    if (data?.status !== 'success') throw new Error(data?.message || data?.error || 'Backend error');
    return data;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);
    setAxes([]);
    setCloudVariations([]);
    setShowVariations(false);
    generationCache.current = {};
    try {
      const data = await callBackend('/discover', { prompt: userMsg.content, num_variations: 10, n_axes: 3 });
      const newAxes = data.axes.map((ax: Axis) => ({ ...ax, currentValue: 0 }));
      setAxes(newAxes);
      setCloudVariations(data.variations || []);
      const baselineText = data.baseline || 'Generated successfully.';
      newAxes.forEach((ax: Axis) => { generationCache.current[`${ax.index}_0`] = baselineText; });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: baselineText, baselineContent: baselineText }]);
    } catch (error) {
      console.error('Discovery failed:', error);
      alert(`Failed to connect to backend. Make sure your Colab is running and you unlocked the tunnel URL in your browser first! Error: ${error}`);
    }
    setIsProcessing(false);
  };

  const handleAddCustomAxis = async () => {
    if (!customConcept.trim() || isCustomProcessing || axes.length === 0) return;
    setIsCustomProcessing(true);
    try {
      const data = await callBackend('/custom_axis', { concept: customConcept.trim() });
      const newAxis = { ...data.axis, currentValue: 0 };
      setAxes(prev => [...prev, newAxis]);
      const baselineText = generationCache.current['0_0'] || '';
      generationCache.current[`${newAxis.index}_0`] = baselineText;
      setCustomConcept('');
    } catch (error) {
      console.error('Custom Axis failed:', error);
      alert('Failed to generate custom dimension.');
    }
    setIsCustomProcessing(false);
  };

  const handleSteer = async (axisIndex: number, coefficient: number) => {
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
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
      const data = await callBackend('/steer', { prompt: lastUserMsg, axis_index: axisIndex, coefficient });
      generationCache.current[cacheKey] = data.generated_text;
      setMessages(prev => {
        const newMsgs = [...prev];
        const idx = newMsgs.findIndex(m => m.id === targetMessageId);
        if (idx !== -1) newMsgs[idx] = { ...newMsgs[idx], content: data.generated_text, isSteering: false, steeredAxis: targetAxis?.label, steeredValue: coefficient };
        return newMsgs;
      });
    } catch (error) {
      console.error('Steering failed:', error);
      alert('Steering failed. Check Colab logs for errors.');
      setMessages(prev => { const newMsgs = [...prev]; newMsgs[newMsgs.length - 1].isSteering = false; return newMsgs; });
    }
    setSteerLoadingId(null);
  };

  const handleReset = (axisIndex: number) => { if (!steerLoadingId) handleSteer(axisIndex, 0); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,500;1,8..60,300;1,8..60,400&family=Sora:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --font-body: 'Sora', sans-serif;
          --font-mono: 'IBM Plex Mono', monospace;
          --font-serif: 'Source Serif 4', Georgia, serif;

          --bg: #fafaf8;
          --surface: #ffffff;
          --surface-2: #f4f3ef;
          --surface-3: #eceae4;

          --border: rgba(0,0,0,0.07);
          --border-md: rgba(0,0,0,0.12);
          --border-strong: rgba(0,0,0,0.18);

          --text-primary: #1a1917;
          --text-secondary: #4a4844;
          --text-muted: #8a8780;
          --text-dim: #b8b6b0;

          --accent: #2a4d8f;
          --accent-soft: rgba(42,77,143,0.08);
          --accent-border: rgba(42,77,143,0.22);

          --user-bg: #f0ede6;
        }

        body { background: var(--bg); color: var(--text-primary); font-family: var(--font-body); -webkit-font-smoothing: antialiased; }

        .app { display: flex; height: 100vh; overflow: hidden; background: var(--bg); }

        /* ── Chat pane ─────────────────────────────────── */
        .chat-pane { flex: 1; display: flex; flex-direction: column; min-width: 0; position: relative; background: var(--bg); }

        .chat-header {
          position: absolute; top: 0; left: 0; right: 0; z-index: 10;
          padding: 18px 36px;
          display: flex; align-items: center; gap: 12px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
        }

        .logo { width: 28px; height: 28px; border: 1.5px solid var(--border-strong); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--text-secondary); flex-shrink: 0; }
        .header-title { font-size: 0.82rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-secondary); }
        .header-sep { width: 1px; height: 14px; background: var(--border-md); }
        .header-sub { font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #3a8f5a; animation: blink 2.4s ease-in-out infinite; flex-shrink: 0; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .chat-messages { flex: 1; overflow-y: auto; padding: 80px 36px 148px; scrollbar-width: thin; scrollbar-color: var(--surface-3) transparent; }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--surface-3); border-radius: 4px; }

        .messages-inner { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }

        /* User bubble */
        .msg-user { display: flex; justify-content: flex-end; animation: fadein 0.2s ease; }
        .msg-user-bubble {
          background: var(--user-bg);
          border: 1px solid var(--border-md);
          border-radius: 16px 16px 3px 16px;
          padding: 11px 16px;
          max-width: 68%;
          font-size: 0.875rem;
          line-height: 1.65;
          color: var(--text-primary);
        }

        /* AI message */
        .msg-ai { display: flex; gap: 14px; align-items: flex-start; width: 100%; animation: fadein 0.2s ease; }
        .ai-avatar {
          width: 26px; height: 26px; flex-shrink: 0;
          border: 1.5px solid var(--border-strong);
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono); font-size: 10px; color: var(--text-secondary);
          margin-top: 1px;
        }
        .ai-content { flex: 1; min-width: 0; }
        .ai-text { font-family: var(--font-serif); font-size: 0.9375rem; line-height: 1.8; color: var(--text-primary); transition: opacity 0.2s; }
        .ai-text.loading { opacity: 0.25; pointer-events: none; }

        /* Split view */
        .split-view { display: flex; gap: 0; width: 100%; border: 1px solid var(--border-md); border-radius: 8px; overflow: hidden; background: var(--surface); }
        .split-col { flex: 1; padding: 16px 18px; min-width: 0; }
        .split-baseline { background: var(--surface-2); border-right: 1px solid var(--border-md); }
        .split-steered { background: var(--surface); }
        .split-divider { display: flex; align-items: center; color: var(--text-dim); padding: 0 4px; flex-shrink: 0; align-self: center; }
        .split-label {
          font-family: var(--font-mono); font-size: 0.65rem; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-muted); margin-bottom: 10px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .split-body { font-family: var(--font-serif); font-size: 0.875rem; line-height: 1.75; color: var(--text-secondary); }

        .axis-badge {
          font-family: var(--font-mono); font-size: 0.62rem;
          background: var(--accent-soft); color: var(--accent);
          border: 1px solid var(--accent-border);
          padding: 2px 7px; border-radius: 3px; letter-spacing: 0.03em;
        }

        .icon-btn {
          background: none; border: 1px solid var(--border-md); color: var(--text-muted);
          border-radius: 4px; padding: 2px 5px; cursor: pointer;
          display: flex; align-items: center; transition: all 0.15s;
        }
        .icon-btn:hover { border-color: var(--border-strong); color: var(--text-secondary); }

        /* Status lines */
        .status-line { display: flex; align-items: center; gap: 7px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); margin-top: 10px; }
        .spin { animation: spin 0.9s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Input area */
        .input-wrap {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 16px 36px 28px;
          background: linear-gradient(transparent, var(--bg) 28%);
          display: flex; justify-content: center;
        }
        .input-inner {
          width: 100%; max-width: 680px;
          background: var(--surface);
          border: 1px solid var(--border-strong);
          border-radius: 10px;
          display: flex; align-items: flex-end; gap: 10px;
          padding: 11px 12px 11px 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-inner:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(42,77,143,0.08); }
        .input-textarea {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text-primary); font-family: var(--font-body);
          font-size: 0.875rem; line-height: 1.55; resize: none;
          min-height: 22px; max-height: 120px; overflow-y: auto; scrollbar-width: none;
        }
        .input-textarea::placeholder { color: var(--text-dim); }
        .input-textarea::-webkit-scrollbar { display: none; }
        .send-btn {
          height: 36px; padding: 0 16px; flex-shrink: 0;
          background: var(--accent); border: none; border-radius: 7px;
          color: #fff; display: flex; align-items: center; gap: 6px;
          font-family: var(--font-body); font-size: 0.8rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .send-btn:hover:not(:disabled) { background: #3460b0; }
        .send-btn:active:not(:disabled) { transform: scale(0.98); }
        .send-btn:disabled { background: var(--surface-3); color: var(--text-dim); cursor: not-allowed; }

        /* ── Controls pane ─────────────────────────────── */
        .controls-pane {
          width: 340px; flex-shrink: 0;
          background: var(--surface);
          border-left: 1px solid var(--border-md);
          display: flex; flex-direction: column; overflow: hidden;
        }

        .controls-header {
          padding: 18px 20px 16px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .controls-title {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 0.68rem; font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary);
        }
        .axes-chip {
          font-family: var(--font-mono); font-size: 0.65rem;
          background: var(--surface-2); border: 1px solid var(--border-md);
          color: var(--text-muted); padding: 2px 8px; border-radius: 3px;
        }

        .controls-scroll {
          flex: 1; overflow-y: auto; padding: 16px;
          scrollbar-width: thin; scrollbar-color: var(--surface-3) transparent;
          display: flex; flex-direction: column; gap: 10px;
        }

        /* Empty state */
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 24px; text-align: center; color: var(--text-muted); }
        .empty-icon { width: 40px; height: 40px; border: 1px solid var(--border-md); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--text-dim); margin-bottom: 4px; }
        .empty-title { font-size: 0.84rem; font-weight: 500; color: var(--text-secondary); }
        .empty-desc { font-size: 0.78rem; line-height: 1.65; color: var(--text-muted); max-width: 200px; }

        /* Axis card */
        .axis-card {
          background: var(--surface);
          border: 1px solid var(--border-md);
          border-radius: 8px;
          padding: 14px 16px 12px;
          transition: border-color 0.2s;
        }
        .axis-card.active { background: #fafaf8; }
        .axis-card.disabled { opacity: 0.38; pointer-events: none; }

        .axis-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .axis-left { display: flex; align-items: center; gap: 8px; }
        .axis-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .axis-name { font-size: 0.84rem; font-weight: 500; color: var(--text-primary); }
        .axis-var {
          font-family: var(--font-mono); font-size: 0.62rem;
          background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text-muted); padding: 1px 6px; border-radius: 2px;
        }
        .axis-right { display: flex; align-items: center; gap: 8px; }
        .axis-value { font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted); min-width: 28px; text-align: right; }
        .axis-value.active { font-weight: 500; }

        .reset-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 3px 9px; height: 24px;
          background: transparent; border: 1px solid var(--border-md);
          border-radius: 4px; color: var(--text-muted);
          font-family: var(--font-body); font-size: 0.72rem;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .reset-btn:hover { background: var(--surface-2); border-color: var(--border-strong); color: var(--text-secondary); }

        /* Slider */
        .slider-wrap { position: relative; margin-bottom: 10px; }
        .slider-input {
          width: 100%; -webkit-appearance: none; appearance: none;
          height: 4px; border-radius: 2px; outline: none; cursor: pointer;
        }
        .slider-input:disabled { cursor: not-allowed; }
        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px;
          border-radius: 50%; background: var(--surface);
          border: 1.5px solid var(--border-strong);
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          cursor: pointer; transition: transform 0.1s;
        }
        .slider-input:not(:disabled)::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .slider-input::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--surface); border: 1.5px solid var(--border-strong); cursor: pointer;
        }
        .center-mark {
          position: absolute; left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: 1px; height: 10px;
          background: var(--border-strong); pointer-events: none; border-radius: 0;
        }

        .axis-labels { display: flex; justify-content: space-between; gap: 6px; }
        .axis-label { font-family: var(--font-serif); font-style: italic; font-size: 0.72rem; color: var(--text-muted); line-height: 1.4; flex: 1; }
        .axis-label.right { text-align: right; }

        /* Custom dimension */
        .custom-box {
          border: 1px dashed var(--border-md); border-radius: 8px;
          padding: 14px 14px 12px; background: var(--surface-2);
        }
        .custom-label { display: block; font-family: var(--font-mono); font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 8px; }
        .custom-row { display: flex; gap: 7px; }
        .custom-input {
          flex: 1; background: var(--surface); border: 1px solid var(--border-md);
          padding: 8px 12px; border-radius: 6px;
          color: var(--text-primary); font-family: var(--font-body); font-size: 0.84rem;
          outline: none; transition: border-color 0.15s;
        }
        .custom-input:focus { border-color: var(--accent); }
        .custom-input::placeholder { color: var(--text-dim); }
        .custom-btn {
          background: var(--accent); border: none; color: #fff;
          padding: 0 13px; border-radius: 6px; cursor: pointer;
          display: flex; align-items: center; transition: all 0.15s;
        }
        .custom-btn:hover:not(:disabled) { background: #3460b0; }
        .custom-btn:disabled { background: var(--surface-3); color: var(--text-dim); cursor: not-allowed; }

        /* Cloud explorer */
        .cloud-section { border: 1px solid var(--border-md); border-radius: 8px; overflow: hidden; }
        .cloud-toggle {
          padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;
          cursor: pointer; background: var(--surface-2); transition: background 0.15s;
          border: none; width: 100%; text-align: left;
        }
        .cloud-toggle:hover { background: var(--surface-3); }
        .cloud-toggle-title { display: flex; align-items: center; gap: 7px; font-family: var(--font-mono); font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-secondary); }
        .cloud-list { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; background: var(--surface); border-top: 1px solid var(--border); }
        .cloud-item { font-family: var(--font-mono); font-size: 0.70rem; color: var(--text-secondary); background: var(--surface-2); padding: 7px 10px; border-radius: 5px; border-left: 2px solid var(--border-md); line-height: 1.5; }

        /* Footer */
        .controls-footer {
          padding: 12px 18px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; gap: 8px;
        }
        .footer-text { font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted); letter-spacing: 0.04em; text-transform: uppercase; }

        @keyframes fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="app">
        {/* ── Chat pane ── */}
        <div className="chat-pane">
          <div className="chat-header">
            <div className="logo" aria-hidden="true">LE</div>
            <span className="header-title">Latent Engine</span>
            <div className="header-sep" />
            <span className="header-sub">Activation steering interface</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="live-dot" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected</span>
            </div>
          </div>

          <div className="chat-messages">
            <div className="messages-inner">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'user' && (
                    <div className="msg-user">
                      <div className="msg-user-bubble">{msg.content}</div>
                    </div>
                  )}
                  {msg.role === 'ai' && (
                    <div className="msg-ai">
                      <div className="ai-avatar" aria-hidden="true">AI</div>
                      <div className="ai-content">
                        <div className={`ai-text${msg.isSteering ? ' loading' : ''}`}>
                          {msg.baselineContent && msg.content !== msg.baselineContent ? (
                            <SplitMessageView msg={msg} showDiff={showDiff} onToggleDiff={() => setShowDiff(p => !p)} />
                          ) : (
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', lineHeight: '1.8', paddingTop: 2 }}>{msg.content}</div>
                          )}
                        </div>
                        {steerLoadingId === msg.id && (
                          <div className="status-line"><RefreshCw size={12} className="spin" /> Applying latent steering vector…</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="status-line" style={{ paddingLeft: 40 }}>
                  <RefreshCw size={12} className="spin" /> Decomposing latent space…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="input-wrap">
            <div className="input-inner">
              <textarea
                ref={inputRef}
                className="input-textarea"
                value={inputText}
                onChange={(e) => { setInputText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder="Enter a prompt to begin…"
                rows={1}
                disabled={isProcessing || steerLoadingId !== null}
              />
              <button className="send-btn" onClick={handleSendMessage} disabled={isProcessing || !inputText.trim() || steerLoadingId !== null}>
                <Send size={13} /> Send
              </button>
            </div>
          </div>
        </div>

        {/* ── Controls pane ── */}
        <div className="controls-pane">
          <div className="controls-header">
            <div className="controls-title"><SlidersHorizontal size={13} /> Latent controls</div>
            {axes.length > 0 && <span className="axes-chip">{axes.length} axes</span>}
          </div>

          {axes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><AlertCircle size={18} /></div>
              <div className="empty-title">No axes loaded</div>
              <div className="empty-desc">Submit a prompt to extract principal variation axes from the latent space.</div>
            </div>
          ) : (
            <div className="controls-scroll">
              {axes.map((axis, i) => {
                const color = AXIS_COLORS[i % AXIS_COLORS.length];
                const isActive = axis.currentValue !== 0;
                const pct = ((axis.currentValue + 50) / 100) * 100;
                const neutral = 'rgba(0,0,0,0.12)';
                const trackBg = axis.currentValue === 0
                  ? `linear-gradient(to right, ${neutral} 0%, ${neutral} 100%)`
                  : axis.currentValue > 0
                  ? `linear-gradient(to right, ${neutral} 0%, ${neutral} 50%, ${color}50 50%, ${color} ${pct}%, ${neutral} ${pct}%, ${neutral} 100%)`
                  : `linear-gradient(to right, ${neutral} 0%, ${neutral} ${pct}%, ${color} ${pct}%, ${color}50 50%, ${neutral} 50%, ${neutral} 100%)`;
                return (
                  <div key={axis.index} className={`axis-card${isActive ? ' active' : ''}${steerLoadingId !== null ? ' disabled' : ''}`}
                    style={isActive ? { borderColor: color + '55' } : {}}>
                    <div className="axis-header">
                      <div className="axis-left">
                        <div className="axis-dot" style={{ background: color }} />
                        <span className="axis-name">{axis.label}</span>
                        <span className="axis-var">{(axis.variance * 100).toFixed(1)}%</span>
                      </div>
                      <div className="axis-right">
                        <span className={`axis-value${isActive ? ' active' : ''}`} style={isActive ? { color } : {}}>
                          {axis.currentValue > 0 ? '+' : ''}{axis.currentValue}
                        </span>
                        {isActive && (
                          <button className="reset-btn" onClick={() => handleReset(axis.index)}>
                            <RotateCcw size={10} /> Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="slider-wrap">
                      <input
                        type="range" className="slider-input" min="-50" max="50" step="10"
                        value={axis.currentValue} style={{ background: trackBg }}
                        onChange={(e) => { if (!steerLoadingId) setAxes(prev => prev.map((a) => a.index === axis.index ? { ...a, currentValue: parseInt(e.target.value) } : a)); }}
                        onMouseUp={(e) => { if (!steerLoadingId) handleSteer(axis.index, parseInt((e.target as HTMLInputElement).value)); }}
                        onTouchEnd={(e) => { if (!steerLoadingId) handleSteer(axis.index, parseInt((e.target as HTMLInputElement).value)); }}
                        disabled={steerLoadingId !== null}
                      />
                      <div className="center-mark" />
                    </div>
                    <div className="axis-labels">
                      <span className="axis-label">"{axis.negative_example.substring(0, 26)}…"</span>
                      <span className="axis-label right">"{axis.positive_example.substring(0, 26)}…"</span>
                    </div>
                  </div>
                );
              })}

              <div className="custom-box">
                <label className="custom-label">Add custom axis</label>
                <div className="custom-row">
                  <input
                    className="custom-input" value={customConcept}
                    onChange={(e) => setCustomConcept(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomAxis()}
                    placeholder="e.g. Sarcastic…"
                    disabled={isCustomProcessing || steerLoadingId !== null}
                  />
                  <button className="custom-btn" onClick={handleAddCustomAxis} disabled={isCustomProcessing || !customConcept.trim() || steerLoadingId !== null}>
                    {isCustomProcessing ? <RefreshCw size={14} className="spin" /> : <Plus size={15} />}
                  </button>
                </div>
              </div>

              {cloudVariations.length > 0 && (
                <div className="cloud-section">
                  <button className="cloud-toggle" onClick={() => setShowVariations(v => !v)} aria-expanded={showVariations}>
                    <span className="cloud-toggle-title"><Database size={12} /> Latent cloud samples</span>
                    {showVariations ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                  </button>
                  {showVariations && (
                    <div className="cloud-list">
                      {cloudVariations.map((v, idx) => <div key={idx} className="cloud-item">{v}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="controls-footer">
            <div className="live-dot" />
            <span className="footer-text">PyTorch GPU · Model connected</span>
          </div>
        </div>
      </div>
    </>
  );
}