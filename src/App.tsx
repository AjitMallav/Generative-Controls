import { useState, useRef, useEffect } from 'react';
import { Send, Wand2, RefreshCw, SlidersHorizontal, AlertCircle } from 'lucide-react';

type Message = { id: string; role: 'user' | 'ai'; content: string; isSteering?: boolean };
type Axis = { index: number; label: string; positive_example: string; negative_example: string; currentValue: number };
type BackendAxis = { index: number; label: string; positive_example: string; negative_example: string };

const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'https://petite-cups-jog.loca.lt').replace(/\/+$/, '');
const API_HEADERS = {
  'Content-Type': 'application/json',
  'Bypass-Tunnel-Reminder': 'true',
  'bypass-tunnel-reminder': 'true',
  'ngrok-skip-browser-warning': 'true',
};

const dedupeAxesByLabel = (axes: BackendAxis[]): Axis[] => {
  const seen = new Set<string>();
  const unique: Axis[] = [];

  for (const axis of axes) {
    const key = axis.label.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...axis, currentValue: 0 });
  }

  return unique;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: 'Hello! What would you like me to write?' }
  ]);
  const [inputText, setInputText] = useState("Write a one-sentence text message to my boss canceling on work party tonight.");
  const [axes, setAxes] = useState<Axis[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [demoMode, setDemoMode] = useState(false); 
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const callBackend = async (path: '/discover' | '/steer', payload: Record<string, unknown>) => {
    const endpoint = `${API_BASE_URL}${path}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(payload),
    });

    const rawBody = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const parsedBody = isJson ? JSON.parse(rawBody) : null;

    if (!response.ok) {
      const bodyPreview = rawBody.slice(0, 160).replace(/\s+/g, ' ');
      throw new Error(`HTTP ${response.status} from ${endpoint}. Body: ${bodyPreview}`);
    }

    if (!isJson) {
      const bodyPreview = rawBody.slice(0, 160).replace(/\s+/g, ' ');
      throw new Error(`Non-JSON response from ${endpoint}. Body: ${bodyPreview}`);
    }

    const data = parsedBody;
    if (data?.status !== 'success') {
      throw new Error(data?.message || data?.error || `Backend non-success from ${endpoint}`);
    }

    return data;
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // core API logic 
  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsProcessing(true);
    setAxes([]);

    // fallback in case nothing works
    if (demoMode) {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "Hey, I'm really sorry but something came up and I can't make it to the party tonight. Let's catch up soon!" }]);
        setAxes([
          { index: 0, label: "Enthusiasm", positive_example: "I'm so sorry, hope you have a blast!", negative_example: "I have a prior commitment.", currentValue: 0 },
          { index: 1, label: "Verbosity", positive_example: "Hi! I wanted to let you know that unfortunately...", negative_example: "Can't make it.", currentValue: 0 }
        ]);
        setIsProcessing(false);
      }, 1000);
      return;
    }

    // CoLab backend request
    try {
      const data = await callBackend('/discover', { prompt: userMsg.content, num_variations: 5, n_axes: 4 });
      const newAxes = dedupeAxesByLabel(data.axes as BackendAxis[]);
      setAxes(newAxes);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: newAxes[0]?.positive_example || "Generated successfully." }]);
    } catch (error) {
      console.error("Connection failed:", error);
      alert(`Failed to connect to backend: ${API_BASE_URL}\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nIf the response looks like HTML, your tunnel URL is likely showing an interstitial/password page. Open the tunnel URL in a browser first or rotate tunnel URL.`);
    }
    setIsProcessing(false);
  };

  const handleSteer = async (axisIndex: number, coefficient: number) => {
    setAxes(prev => prev.map((a) => a.index === axisIndex ? { ...a, currentValue: coefficient } : a));
    
    setMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs[newMsgs.length - 1].role === 'ai') newMsgs[newMsgs.length - 1].isSteering = true;
      return newMsgs;
    });

    if (demoMode) {
      setTimeout(() => {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content: `[Mock Steered Text] Coefficient: ${coefficient}`, isSteering: false };
          return newMsgs;
        });
      }, 500);
      return;
    }

    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || "";
      const data = await callBackend('/steer', { prompt: lastUserMsg, axis_index: axisIndex, coefficient });
      
      console.log("Python Backend Response:", data); 

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { 
          ...newMsgs[newMsgs.length - 1], 
          content: data.generated_text || data.text || "Error: Backend returned empty text", 
          isSteering: false 
        };
        return newMsgs;
      });
    } catch (error) {
      console.error("Steering failed:", error);
      setMessages(prev => {
        const newMsgs = [...prev];
        if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'ai') {
          newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], isSteering: false };
        }
        return newMsgs;
      });
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f9fafb' }}>
      
      {/* LEFT PANE: Chat Interface */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wand2 size={24} color="#3b82f6" /> Latent-Steer Chat
          </h2>
          <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input type="checkbox" checked={demoMode} onChange={(e) => setDemoMode(e.target.checked)} />
            Safe Demo Mode
          </label>
        </div>

        {/* Chat History */}
        <div style={{ flex: '1', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: '12px',
                backgroundColor: msg.role === 'user' ? '#3b82f6' : '#f3f4f6',
                color: msg.role === 'user' ? '#ffffff' : '#1f2937',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                opacity: msg.isSteering ? 0.5 : 1, transition: 'opacity 0.2s'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div style={{ display: 'flex', gap: '8px', color: '#6b7280', padding: '10px' }}>
              <RefreshCw className="animate-spin" size={20} /> Extracting Latent Concepts...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Box */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              value={inputText} onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your prompt here..."
              style={{ flex: '1', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none' }}
              disabled={isProcessing}
            />
            <button 
              onClick={handleSendMessage} disabled={isProcessing}
              style={{ padding: '0 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Send size={18} /> Send
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Control Panel */}
      <div style={{ width: '400px', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb', padding: '20px', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#374151' }}>
          <SlidersHorizontal size={20} /> Discovered Dimensions
        </h3>

        {axes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '50px' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
            <p>Send a message to extract<br/>latent control dimensions.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {axes.map((axis) => {
              
              // NEW: Determine salience based on PCA rank
              let salienceLabel = "Minor Dimension";
              let badgeColor = "#e5e7eb";
              let textColor = "#6b7280";
              
              if (axis.index === 0) {
                salienceLabel = "Primary (Most Salient)";
                badgeColor = "#dbeafe";
                textColor = "#1d4ed8";
              } else if (axis.index === 1) {
                salienceLabel = "Secondary";
                badgeColor = "#f3f4f6";
                textColor = "#374151";
              } else if (axis.index === 2) {
                salienceLabel = "Tertiary";
              }

              return (
                <div key={axis.index} style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  
                  {/* NEW: Updated Header with Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '1.1rem' }}>{axis.label}</span>
                      <span style={{ 
                        backgroundColor: badgeColor, 
                        color: textColor, 
                        fontSize: '0.7rem', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {salienceLabel}
                      </span>
                    </div>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                      {axis.currentValue > 0 ? '+' : ''}{axis.currentValue.toFixed(1)}
                    </span>
                  </div>
                  
                  {/* The Slider */}
                  <input 
                    type="range" min="-50" max="50" step="10.0" value={axis.currentValue}
                    onChange={(e) => setAxes(prev => prev.map((a) => a.index === axis.index ? { ...a, currentValue: parseFloat(e.target.value) } : a))}
                    onMouseUp={(e) => handleSteer(axis.index, parseFloat((e.target as HTMLInputElement).value))}
                    style={{ width: '100%', cursor: 'grab' }}
                  />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginTop: '10px' }}>
                    <span style={{ width: '45%' }}>➖ {axis.negative_example.substring(0, 30)}...</span>
                    <span style={{ width: '45%', textAlign: 'right' }}>➕ {axis.positive_example.substring(0, 30)}...</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
    </div>
  );
}