  import * as Diff from 'diff';                                                                                                                                                        
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
     Server,                                                                                                                                                                            
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
                                                                                                                                                                                        
   const API_BASE_URL = (                                                                                                                                                               
     (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||                                                                                                               
     'http://127.0.0.1:8000'                                                                                                                                                            
   ).replace(/\/+$/, '');                                                                                                                                                               
                                                                                                                                                                                        
   const API_HEADERS = {                                                                                                                                                                
     'Content-Type': 'application/json',                                                                                                                                                
     'Bypass-Tunnel-Reminder': 'true',                                                                                                                                                  
     'bypass-tunnel-reminder': 'true',                                                                                                                                                  
     'ngrok-skip-browser-warning': 'true',                                                                                                                                              
   };                                                                                                                                                                                   
                                                                                                                                                                                        
   const AXIS_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];                                                                                                         
                                                                                                                                                                                        
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
                                                                                                                                                                                        
   const DiffHighlighter = ({ baseline, steered }: { baseline: string; steered: string }) => {                                                                                          
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
     const [messages, setMessages] = useState<Message[]>([                                                                                                                              
       {                                                                                                                                                                                
         id: '1',                                                                                                                                                                       
         role: 'ai',                                                                                                                                                                    
         content: 'Hello. Enter a prompt and I’ll discover PCA steering axes from sampled model completions.',                                                                          
       },                                                                                                                                                                               
     ]);                                                                                                                                                                                
                                                                                                                                                                                        
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
                                                                                                                                                                                        
     const generationCache = useRef<Record<string, string>>({});                                                                                                                        
     const chatEndRef = useRef<HTMLDivElement>(null);                                                                                                                                   
     const inputRef = useRef<HTMLTextAreaElement>(null);                                                                                                                                
                                                                                                                                                                                        
     useEffect(() => {                                                                                                                                                                  
       chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });                                                                                                                      
     }, [messages]);                                                                                                                                                                    
                                                                                                                                                                                        
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
                                                                                                                                                                                        
       const userMsg: Message = {                                                                                                                                                       
         id: Date.now().toString(),                                                                                                                                                     
         role: 'user',                                                                                                                                                                  
         content: inputText,                                                                                                                                                            
       };                                                                                                                                                                               
                                                                                                                                                                                        
       setMessages((prev) => [...prev, userMsg]);                                                                                                                                       
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
           num_variations: 30,                                                                                                                                                          
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
                                                                                                                                                                                        
         setMessages((prev) => [                                                                                                                                                        
           ...prev,                                                                                                                                                                     
           {                                                                                                                                                                            
             id: Date.now().toString(),                                                                                                                                                 
             role: 'ai',                                                                                                                                                                
             content: baselineText,                                                                                                                                                     
             baselineContent: baselineText,                                                                                                                                             
           },                                                                                                                                                                           
         ]);                                                                                                                                                                            
       } catch (error) {                                                                                                                                                                
         console.error('Discovery failed:', error);                                                                                                                                     
         alert(                                                                                                                                                                         
           `Failed to connect to backend. Make sure Colab is running and the tunnel URL is unlocked in your browser.\n\n${error}`                                                       
         );                                                                                                                                                                             
       }                                                                                                                                                                                
                                                                                                                                                                                        
       setIsProcessing(false);                                                                                                                                                          
     };                                                                                                                                                                                 
                                                                                                                                                                                        
     const handleAddCustomAxis = async () => {                                                                                                                                          
       if (!customConcept.trim() || isCustomProcessing || axes.length === 0) return;                                                                                                    
                                                                                                                                                                                        
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
         alert('Failed to generate custom axis. Check backend logs.');                                                                                                                  
       }                                                                                                                                                                                
                                                                                                                                                                                        
       setIsCustomProcessing(false);                                                                                                                                                    
     };                                                                                                                                                                                 
                                                                                                                                                                                        
     const handleSteer = async (axisIndex: number, coefficient: number) => {                                                                                                            
       const targetAxis = axes.find((a) => a.index === axisIndex);                                                                                                                      
                                                                                                                                                                                        
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
                                                                                                                                                                                        
         setMessages((prev) => {                                                                                                                                                        
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
           setMessages((curr) =>                                                                                                                                                        
             curr.map((m) =>                                                                                                                                                            
               m.id === targetMessageId ? { ...m, cacheHit: false } : m                                                                                                                 
             )                                                                                                                                                                          
           );                                                                                                                                                                           
         }, 1600);                                                                                                                                                                      
                                                                                                                                                                                        
         return;                                                                                                                                                                        
       }                                                                                                                                                                                
                                                                                                                                                                                        
       setSteerLoadingId(targetMessageId);                                                                                                                                              
                                                                                                                                                                                        
       setMessages((prev) => {                                                                                                                                                          
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
                                                                                                                                                                                        
         setMessages((prev) => {                                                                                                                                                        
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
         alert('Steering failed. Check Colab/backend logs.');                                                                                                                           
                                                                                                                                                                                        
         setMessages((prev) => {                                                                                                                                                        
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
                                                                                                                                                                                        
     return (                                                                                                                                                                           
       <>                                                                                                                                                                               
         <style>{`                                                                                                                                                                      
           @import                                                                                                                                                                      
 url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&display=swap');         
                                                                                                                                                                                        
           *, *::before, *::after {                                                                                                                                                     
             box-sizing: border-box;                                                                                                                                                    
           }                                                                                                                                                                            
                                                                                                                                                                                        
           html, body, #root {                                                                                                                                                          
             width: 100%;                                                                                                                                                               
             min-height: 100%;                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           :root {                                                                                                                                                                      
             --font-body: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;                                                                                            
             --font-serif: 'Source Serif 4', Georgia, serif;                                                                                                                            
             --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;                                                                                              
                                                                                                                                                                                        
             --bg: #f4f5f7;                                                                                                                                                             
             --surface: #ffffff;                                                                                                                                                        
             --surface-soft: #f8fafc;                                                                                                                                                   
             --surface-muted: #f1f5f9;                                                                                                                                                  
                                                                                                                                                                                        
             --border: #e5e7eb;                                                                                                                                                         
             --border-strong: #d1d5db;                                                                                                                                                  
                                                                                                                                                                                        
             --text-primary: #111827;                                                                                                                                                   
             --text-secondary: #374151;                                                                                                                                                 
             --text-muted: #6b7280;                                                                                                                                                     
             --text-faint: #9ca3af;                                                                                                                                                     
                                                                                                                                                                                        
             --accent: #2563eb;                                                                                                                                                         
             --accent-hover: #1d4ed8;                                                                                                                                                   
             --accent-soft: #eff6ff;                                                                                                                                                    
             --accent-border: #bfdbfe;                                                                                                                                                  
                                                                                                                                                                                        
             --success: #059669;                                                                                                                                                        
             --warning: #d97706;                                                                                                                                                        
                                                                                                                                                                                        
             --radius-lg: 18px;                                                                                                                                                         
             --radius-md: 12px;                                                                                                                                                         
             --radius-sm: 8px;                                                                                                                                                          
                                                                                                                                                                                        
             --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);                                                                                                                             
             --shadow-md: 0 10px 25px rgba(15, 23, 42, 0.08);                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           body {                                                                                                                                                                       
             margin: 0;                                                                                                                                                                 
             background: var(--bg);                                                                                                                                                     
             color: var(--text-primary);                                                                                                                                                
             font-family: var(--font-body);                                                                                                                                             
             -webkit-font-smoothing: antialiased;                                                                                                                                       
             text-rendering: optimizeLegibility;                                                                                                                                        
           }                                                                                                                                                                            
                                                                                                                                                                                        
           button, input, textarea {                                                                                                                                                    
             font: inherit;                                                                                                                                                             
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .app {                                                                                                                                                                       
             display: flex;                                                                                                                                                             
             height: 100vh;                                                                                                                                                             
             overflow: hidden;                                                                                                                                                          
             background:                                                                                                                                                                
               radial-gradient(circle at top left, rgba(37, 99, 235, 0.05), transparent 28rem),                                                                                         
               var(--bg);                                                                                                                                                               
           }                                                                                                                                                                            
                                                                                                                                                                                        
           /* Header / Chat layout */                                                                                                                                                   
           .chat-pane {                                                                                                                                                                 
             flex: 1;                                                                                                                                                                   
             min-width: 0;                                                                                                                                                              
             display: flex;                                                                                                                                                             
             flex-direction: column;                                                                                                                                                    
             position: relative;                                                                                                                                                        
             background: transparent;                                                                                                                                                   
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .chat-header {                                                                                                                                                               
             height: 68px;                                                                                                                                                              
             padding: 0 32px;                                                                                                                                                           
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 12px;                                                                                                                                                                 
             border-bottom: 1px solid var(--border);                                                                                                                                    
             background: rgba(255, 255, 255, 0.86);                                                                                                                                     
             backdrop-filter: blur(12px);                                                                                                                                               
             z-index: 20;                                                                                                                                                               
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .logo {                                                                                                                                                                      
             width: 34px;                                                                                                                                                               
             height: 34px;                                                                                                                                                              
             border-radius: 10px;                                                                                                                                                       
             background: var(--text-primary);                                                                                                                                           
             color: #fff;                                                                                                                                                               
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             justify-content: center;                                                                                                                                                   
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.7rem;                                                                                                                                                         
             font-weight: 500;                                                                                                                                                          
             letter-spacing: -0.03em;                                                                                                                                                   
             box-shadow: var(--shadow-sm);                                                                                                                                              
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .header-main {                                                                                                                                                               
             display: flex;                                                                                                                                                             
             flex-direction: column;                                                                                                                                                    
             gap: 2px;                                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .header-title {                                                                                                                                                              
             font-size: 0.93rem;                                                                                                                                                        
             font-weight: 700;                                                                                                                                                          
             letter-spacing: -0.02em;                                                                                                                                                   
             color: var(--text-primary);                                                                                                                                                
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .header-sub {                                                                                                                                                                
             font-size: 0.74rem;                                                                                                                                                        
             color: var(--text-muted);                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .status-pill {                                                                                                                                                               
             margin-left: auto;                                                                                                                                                         
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 8px;                                                                                                                                                                  
             padding: 7px 10px;                                                                                                                                                         
             border: 1px solid var(--border);                                                                                                                                           
             border-radius: 999px;                                                                                                                                                      
             background: var(--surface-soft);                                                                                                                                           
             color: var(--text-muted);                                                                                                                                                  
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.67rem;                                                                                                                                                        
             max-width: 360px;                                                                                                                                                          
             overflow: hidden;                                                                                                                                                          
             white-space: nowrap;                                                                                                                                                       
             text-overflow: ellipsis;                                                                                                                                                   
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .live-dot {                                                                                                                                                                  
             width: 7px;                                                                                                                                                                
             height: 7px;                                                                                                                                                               
             border-radius: 999px;                                                                                                                                                      
             background: var(--success);                                                                                                                                                
             box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);                                                                                                                             
             flex-shrink: 0;                                                                                                                                                            
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .chat-messages {                                                                                                                                                             
             flex: 1;                                                                                                                                                                   
             overflow-y: auto;                                                                                                                                                          
             padding: 36px 36px 150px;                                                                                                                                                  
             scrollbar-width: thin;                                                                                                                                                     
             scrollbar-color: var(--border-strong) transparent;                                                                                                                         
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .chat-messages::-webkit-scrollbar {                                                                                                                                          
             width: 5px;                                                                                                                                                                
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .chat-messages::-webkit-scrollbar-thumb {                                                                                                                                    
             background: var(--border-strong);                                                                                                                                          
             border-radius: 999px;                                                                                                                                                      
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .messages-inner {                                                                                                                                                            
             width: 100%;                                                                                                                                                               
             max-width: 840px;                                                                                                                                                          
             margin: 0 auto;                                                                                                                                                            
             display: flex;                                                                                                                                                             
             flex-direction: column;                                                                                                                                                    
             gap: 22px;                                                                                                                                                                 
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .msg-user {                                                                                                                                                                  
             display: flex;                                                                                                                                                             
             justify-content: flex-end;                                                                                                                                                 
             animation: fadein 0.18s ease;                                                                                                                                              
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .msg-user-bubble {                                                                                                                                                           
             max-width: 70%;                                                                                                                                                            
             background: var(--text-primary);                                                                                                                                           
             color: #fff;                                                                                                                                                               
             border-radius: 18px 18px 4px 18px;                                                                                                                                         
             padding: 12px 16px;                                                                                                                                                        
             font-size: 0.91rem;                                                                                                                                                        
             line-height: 1.58;                                                                                                                                                         
             box-shadow: var(--shadow-sm);                                                                                                                                              
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .msg-ai {                                                                                                                                                                    
             display: flex;                                                                                                                                                             
             gap: 12px;                                                                                                                                                                 
             align-items: flex-start;                                                                                                                                                   
             animation: fadein 0.18s ease;                                                                                                                                              
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .ai-avatar {                                                                                                                                                                 
             width: 32px;                                                                                                                                                               
             height: 32px;                                                                                                                                                              
             border-radius: 10px;                                                                                                                                                       
             background: var(--surface);                                                                                                                                                
             border: 1px solid var(--border);                                                                                                                                           
             color: var(--text-secondary);                                                                                                                                              
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             justify-content: center;                                                                                                                                                   
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.68rem;                                                                                                                                                        
             font-weight: 500;                                                                                                                                                          
             box-shadow: var(--shadow-sm);                                                                                                                                              
             flex-shrink: 0;                                                                                                                                                            
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .ai-content {                                                                                                                                                                
             flex: 1;                                                                                                                                                                   
             min-width: 0;                                                                                                                                                              
             padding-top: 2px;                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .ai-text {                                                                                                                                                                   
             color: var(--text-primary);                                                                                                                                                
             transition: opacity 0.2s ease;                                                                                                                                             
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .ai-text.loading {                                                                                                                                                           
             opacity: 0.35;                                                                                                                                                             
             pointer-events: none;                                                                                                                                                      
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .ai-plain-text {                                                                                                                                                             
             background: rgba(255, 255, 255, 0.78);                                                                                                                                     
             border: 1px solid var(--border);                                                                                                                                           
             border-radius: var(--radius-md);                                                                                                                                           
             padding: 16px 18px;                                                                                                                                                        
             font-family: var(--font-serif);                                                                                                                                            
             font-size: 1rem;                                                                                                                                                           
             line-height: 1.78;                                                                                                                                                         
             box-shadow: var(--shadow-sm);                                                                                                                                              
             white-space: pre-wrap;                                                                                                                                                     
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .status-line {                                                                                                                                                               
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 8px;                                                                                                                                                                  
             color: var(--text-muted);                                                                                                                                                  
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.72rem;                                                                                                                                                        
             margin-top: 10px;                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .spin {                                                                                                                                                                      
             animation: spin 0.85s linear infinite;                                                                                                                                     
           }                                                                                                                                                                            
                                                                                                                                                                                        
           /* Split view */                                                                                                                                                             
           .split-view {                                                                                                                                                                
             display: grid;                                                                                                                                                             
             grid-template-columns: 1fr auto 1fr;                                                                                                                                       
             width: 100%;                                                                                                                                                               
             background: var(--surface);                                                                                                                                                
             border: 1px solid var(--border);                                                                                                                                           
             border-radius: var(--radius-lg);                                                                                                                                           
             overflow: hidden;                                                                                                                                                          
             box-shadow: var(--shadow-sm);                                                                                                                                              
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .split-col {                                                                                                                                                                 
             min-width: 0;                                                                                                                                                              
             padding: 18px;                                                                                                                                                             
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .split-baseline {                                                                                                                                                            
             background: var(--surface-soft);                                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .split-steered {                                                                                                                                                             
             background: var(--surface);                                                                                                                                                
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .split-divider {                                                                                                                                                             
             width: 34px;                                                                                                                                                               
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             justify-content: center;                                                                                                                                                   
             color: var(--text-faint);                                                                                                                                                  
             background: linear-gradient(to bottom, var(--surface-soft), var(--surface));                                                                                               
             border-left: 1px solid var(--border);                                                                                                                                      
             border-right: 1px solid var(--border);                                                                                                                                     
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .split-label {                                                                                                                                                               
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.67rem;                                                                                                                                                        
             font-weight: 500;                                                                                                                                                          
             text-transform: uppercase;                                                                                                                                                 
             letter-spacing: 0.08em;                                                                                                                                                    
             color: var(--text-muted);                                                                                                                                                  
             margin-bottom: 10px;                                                                                                                                                       
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .split-label-row {                                                                                                                                                           
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             justify-content: space-between;                                                                                                                                            
             gap: 10px;                                                                                                                                                                 
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .split-actions {                                                                                                                                                             
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 7px;                                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .split-body {                                                                                                                                                                
             font-family: var(--font-serif);                                                                                                                                            
             font-size: 0.94rem;                                                                                                                                                        
             line-height: 1.75;                                                                                                                                                         
             color: var(--text-secondary);                                                                                                                                              
             white-space: pre-wrap;                                                                                                                                                     
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .split-body-primary {                                                                                                                                                        
             color: var(--text-primary);                                                                                                                                                
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-badge {                                                                                                                                                                
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.65rem;                                                                                                                                                        
             padding: 4px 8px;                                                                                                                                                          
             border-radius: 999px;                                                                                                                                                      
             background: var(--accent-soft);                                                                                                                                            
             color: var(--accent);                                                                                                                                                      
             border: 1px solid var(--accent-border);                                                                                                                                    
             white-space: nowrap;                                                                                                                                                       
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .icon-btn {                                                                                                                                                                  
             height: 26px;                                                                                                                                                              
             min-width: 28px;                                                                                                                                                           
             padding: 0 7px;                                                                                                                                                            
             border: 1px solid var(--border);                                                                                                                                           
             border-radius: 8px;                                                                                                                                                        
             background: var(--surface);                                                                                                                                                
             color: var(--text-muted);                                                                                                                                                  
             display: inline-flex;                                                                                                                                                      
             align-items: center;                                                                                                                                                       
             justify-content: center;                                                                                                                                                   
             cursor: pointer;                                                                                                                                                           
             transition: all 0.15s ease;                                                                                                                                                
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .icon-btn:hover {                                                                                                                                                            
             border-color: var(--border-strong);                                                                                                                                        
             color: var(--text-primary);                                                                                                                                                
             background: var(--surface-soft);                                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .cache-icon {                                                                                                                                                                
             color: var(--warning);                                                                                                                                                     
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .diff-text {                                                                                                                                                                 
             font-family: var(--font-serif);                                                                                                                                            
             font-size: 0.94rem;                                                                                                                                                        
             line-height: 1.75;                                                                                                                                                         
             white-space: pre-wrap;                                                                                                                                                     
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .diff-added {                                                                                                                                                                
             background: rgba(5, 150, 105, 0.12);                                                                                                                                       
             color: #047857;                                                                                                                                                            
             padding: 1px 3px;                                                                                                                                                          
             border-radius: 4px;                                                                                                                                                        
             font-weight: 500;                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .diff-removed {                                                                                                                                                              
             background: rgba(220, 38, 38, 0.09);                                                                                                                                       
             color: #b91c1c;                                                                                                                                                            
             padding: 1px 3px;                                                                                                                                                          
             border-radius: 4px;                                                                                                                                                        
             opacity: 0.78;                                                                                                                                                             
           }                                                                                                                                                                            
                                                                                                                                                                                        
           /* Input */                                                                                                                                                                  
           .input-wrap {                                                                                                                                                                
             position: absolute;                                                                                                                                                        
             left: 0;                                                                                                                                                                   
             right: 0;                                                                                                                                                                  
             bottom: 0;                                                                                                                                                                 
             padding: 22px 36px 28px;                                                                                                                                                   
             display: flex;                                                                                                                                                             
             justify-content: center;                                                                                                                                                   
             background: linear-gradient(transparent, var(--bg) 36%);                                                                                                                   
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .input-inner {                                                                                                                                                               
             width: 100%;                                                                                                                                                               
             max-width: 760px;                                                                                                                                                          
             display: flex;                                                                                                                                                             
             align-items: flex-end;                                                                                                                                                     
             gap: 10px;                                                                                                                                                                 
             padding: 12px 12px 12px 16px;                                                                                                                                              
             background: rgba(255, 255, 255, 0.96);                                                                                                                                     
             border: 1px solid var(--border-strong);                                                                                                                                    
             border-radius: 18px;                                                                                                                                                       
             box-shadow: var(--shadow-md);                                                                                                                                              
             transition: border-color 0.15s ease, box-shadow 0.15s ease;                                                                                                                
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .input-inner:focus-within {                                                                                                                                                  
             border-color: var(--accent);                                                                                                                                               
             box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10), var(--shadow-md);                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .input-textarea {                                                                                                                                                            
             flex: 1;                                                                                                                                                                   
             min-height: 24px;                                                                                                                                                          
             max-height: 140px;                                                                                                                                                         
             resize: none;                                                                                                                                                              
             overflow-y: auto;                                                                                                                                                          
             border: none;                                                                                                                                                              
             outline: none;                                                                                                                                                             
             background: transparent;                                                                                                                                                   
             color: var(--text-primary);                                                                                                                                                
             font-size: 0.92rem;                                                                                                                                                        
             line-height: 1.55;                                                                                                                                                         
             scrollbar-width: none;                                                                                                                                                     
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .input-textarea::-webkit-scrollbar {                                                                                                                                         
             display: none;                                                                                                                                                             
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .input-textarea::placeholder {                                                                                                                                               
             color: var(--text-faint);                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .send-btn {                                                                                                                                                                  
             height: 40px;                                                                                                                                                              
             padding: 0 16px;                                                                                                                                                           
             border: none;                                                                                                                                                              
             border-radius: 12px;                                                                                                                                                       
             background: var(--accent);                                                                                                                                                 
             color: #fff;                                                                                                                                                               
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 7px;                                                                                                                                                                  
             font-weight: 600;                                                                                                                                                          
             font-size: 0.86rem;                                                                                                                                                        
             cursor: pointer;                                                                                                                                                           
             transition: all 0.15s ease;                                                                                                                                                
             white-space: nowrap;                                                                                                                                                       
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .send-btn:hover:not(:disabled) {                                                                                                                                             
             background: var(--accent-hover);                                                                                                                                           
             transform: translateY(-1px);                                                                                                                                               
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .send-btn:active:not(:disabled) {                                                                                                                                            
             transform: translateY(0);                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .send-btn:disabled {                                                                                                                                                         
             background: #d1d5db;                                                                                                                                                       
             color: #f9fafb;                                                                                                                                                            
             cursor: not-allowed;                                                                                                                                                       
             transform: none;                                                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           /* Controls pane */                                                                                                                                                          
           .controls-pane {                                                                                                                                                             
             width: 370px;                                                                                                                                                              
             flex-shrink: 0;                                                                                                                                                            
             background: rgba(255, 255, 255, 0.92);                                                                                                                                     
             border-left: 1px solid var(--border);                                                                                                                                      
             display: flex;                                                                                                                                                             
             flex-direction: column;                                                                                                                                                    
             overflow: hidden;                                                                                                                                                          
             box-shadow: -10px 0 30px rgba(15, 23, 42, 0.03);                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .controls-header {                                                                                                                                                           
             height: 68px;                                                                                                                                                              
             padding: 0 20px;                                                                                                                                                           
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             justify-content: space-between;                                                                                                                                            
             border-bottom: 1px solid var(--border);                                                                                                                                    
             background: var(--surface);                                                                                                                                                
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .controls-title {                                                                                                                                                            
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 9px;                                                                                                                                                                  
             color: var(--text-primary);                                                                                                                                                
             font-size: 0.82rem;                                                                                                                                                        
             font-weight: 700;                                                                                                                                                          
             letter-spacing: -0.01em;                                                                                                                                                   
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axes-chip {                                                                                                                                                                 
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.67rem;                                                                                                                                                        
             padding: 4px 8px;                                                                                                                                                          
             border-radius: 999px;                                                                                                                                                      
             background: var(--surface-muted);                                                                                                                                          
             color: var(--text-muted);                                                                                                                                                  
             border: 1px solid var(--border);                                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .controls-scroll {                                                                                                                                                           
             flex: 1;                                                                                                                                                                   
             overflow-y: auto;                                                                                                                                                          
             padding: 16px;                                                                                                                                                             
             display: flex;                                                                                                                                                             
             flex-direction: column;                                                                                                                                                    
             gap: 12px;                                                                                                                                                                 
             scrollbar-width: thin;                                                                                                                                                     
             scrollbar-color: var(--border-strong) transparent;                                                                                                                         
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .empty-state {                                                                                                                                                               
             flex: 1;                                                                                                                                                                   
             padding: 56px 30px;                                                                                                                                                        
             display: flex;                                                                                                                                                             
             flex-direction: column;                                                                                                                                                    
             align-items: center;                                                                                                                                                       
             text-align: center;                                                                                                                                                        
             color: var(--text-muted);                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .empty-icon {                                                                                                                                                                
             width: 48px;                                                                                                                                                               
             height: 48px;                                                                                                                                                              
             border-radius: 14px;                                                                                                                                                       
             border: 1px solid var(--border);                                                                                                                                           
             background: var(--surface-soft);                                                                                                                                           
             color: var(--text-faint);                                                                                                                                                  
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             justify-content: center;                                                                                                                                                   
             margin-bottom: 14px;                                                                                                                                                       
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .empty-title {                                                                                                                                                               
             font-weight: 700;                                                                                                                                                          
             color: var(--text-primary);                                                                                                                                                
             margin-bottom: 6px;                                                                                                                                                        
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .empty-desc {                                                                                                                                                                
             font-size: 0.84rem;                                                                                                                                                        
             line-height: 1.55;                                                                                                                                                         
             max-width: 230px;                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-card {                                                                                                                                                                 
             background: var(--surface);                                                                                                                                                
             border: 1px solid var(--border);                                                                                                                                           
             border-radius: var(--radius-lg);                                                                                                                                           
             padding: 15px;                                                                                                                                                             
             box-shadow: var(--shadow-sm);                                                                                                                                              
             transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-card.active {                                                                                                                                                          
             box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.06), var(--shadow-sm);                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-card.disabled {                                                                                                                                                        
             opacity: 0.5;                                                                                                                                                              
             pointer-events: none;                                                                                                                                                      
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-header {                                                                                                                                                               
             display: flex;                                                                                                                                                             
             align-items: flex-start;                                                                                                                                                   
             justify-content: space-between;                                                                                                                                            
             gap: 12px;                                                                                                                                                                 
             margin-bottom: 14px;                                                                                                                                                       
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-left {                                                                                                                                                                 
             min-width: 0;                                                                                                                                                              
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 9px;                                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-dot {                                                                                                                                                                  
             width: 8px;                                                                                                                                                                
             height: 8px;                                                                                                                                                               
             border-radius: 999px;                                                                                                                                                      
             flex-shrink: 0;                                                                                                                                                            
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-name-wrap {                                                                                                                                                            
             min-width: 0;                                                                                                                                                              
             display: flex;                                                                                                                                                             
             flex-direction: column;                                                                                                                                                    
             gap: 3px;                                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-name {                                                                                                                                                                 
             color: var(--text-primary);                                                                                                                                                
             font-size: 0.91rem;                                                                                                                                                        
             font-weight: 700;                                                                                                                                                          
             letter-spacing: -0.02em;                                                                                                                                                   
             white-space: nowrap;                                                                                                                                                       
             overflow: hidden;                                                                                                                                                          
             text-overflow: ellipsis;                                                                                                                                                   
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-meta {                                                                                                                                                                 
             display: flex;                                                                                                                                                             
             gap: 6px;                                                                                                                                                                  
             flex-wrap: wrap;                                                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-var {                                                                                                                                                                  
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.62rem;                                                                                                                                                        
             color: var(--text-muted);                                                                                                                                                  
             background: var(--surface-muted);                                                                                                                                          
             border: 1px solid var(--border);                                                                                                                                           
             padding: 2px 6px;                                                                                                                                                          
             border-radius: 999px;                                                                                                                                                      
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-right {                                                                                                                                                                
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 7px;                                                                                                                                                                  
             flex-shrink: 0;                                                                                                                                                            
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-value {                                                                                                                                                                
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.77rem;                                                                                                                                                        
             color: var(--text-muted);                                                                                                                                                  
             min-width: 48px;                                                                                                                                                           
             text-align: right;                                                                                                                                                         
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-value.active {                                                                                                                                                         
             font-weight: 700;                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .reset-btn {                                                                                                                                                                 
             height: 26px;                                                                                                                                                              
             padding: 0 9px;                                                                                                                                                            
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 5px;                                                                                                                                                                  
             border: 1px solid var(--border);                                                                                                                                           
             border-radius: 9px;                                                                                                                                                        
             background: var(--surface-soft);                                                                                                                                           
             color: var(--text-muted);                                                                                                                                                  
             font-size: 0.72rem;                                                                                                                                                        
             cursor: pointer;                                                                                                                                                           
             transition: all 0.15s ease;                                                                                                                                                
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .reset-btn:hover {                                                                                                                                                           
             color: var(--text-primary);                                                                                                                                                
             border-color: var(--border-strong);                                                                                                                                        
             background: var(--surface-muted);                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .slider-wrap {                                                                                                                                                               
             position: relative;                                                                                                                                                        
             margin-bottom: 10px;                                                                                                                                                       
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .slider-input {                                                                                                                                                              
             width: 100%;                                                                                                                                                               
             height: 5px;                                                                                                                                                               
             border-radius: 999px;                                                                                                                                                      
             outline: none;                                                                                                                                                             
             cursor: pointer;                                                                                                                                                           
             -webkit-appearance: none;                                                                                                                                                  
             appearance: none;                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .slider-input::-webkit-slider-thumb {                                                                                                                                        
             -webkit-appearance: none;                                                                                                                                                  
             width: 18px;                                                                                                                                                               
             height: 18px;                                                                                                                                                              
             border-radius: 999px;                                                                                                                                                      
             background: #fff;                                                                                                                                                          
             border: 2px solid var(--border-strong);                                                                                                                                    
             box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);                                                                                                                              
             cursor: pointer;                                                                                                                                                           
             transition: transform 0.1s ease;                                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .slider-input:not(:disabled)::-webkit-slider-thumb:hover {                                                                                                                   
             transform: scale(1.12);                                                                                                                                                    
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .slider-input::-moz-range-thumb {                                                                                                                                            
             width: 18px;                                                                                                                                                               
             height: 18px;                                                                                                                                                              
             border-radius: 999px;                                                                                                                                                      
             background: #fff;                                                                                                                                                          
             border: 2px solid var(--border-strong);                                                                                                                                    
             cursor: pointer;                                                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .center-mark {                                                                                                                                                               
             position: absolute;                                                                                                                                                        
             top: 50%;                                                                                                                                                                  
             left: 50%;                                                                                                                                                                 
             width: 1px;                                                                                                                                                                
             height: 12px;                                                                                                                                                              
             background: var(--border-strong);                                                                                                                                          
             transform: translate(-50%, -50%);                                                                                                                                          
             pointer-events: none;                                                                                                                                                      
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-labels {                                                                                                                                                               
             display: grid;                                                                                                                                                             
             grid-template-columns: 1fr 1fr;                                                                                                                                            
             gap: 8px;                                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-label {                                                                                                                                                                
             padding: 8px 9px;                                                                                                                                                          
             border-radius: 10px;                                                                                                                                                       
             background: var(--surface-soft);                                                                                                                                           
             color: var(--text-muted);                                                                                                                                                  
             border: 1px solid var(--border);                                                                                                                                           
             font-family: var(--font-serif);                                                                                                                                            
             font-size: 0.75rem;                                                                                                                                                        
             line-height: 1.35;                                                                                                                                                         
             font-style: italic;                                                                                                                                                        
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .axis-label.right {                                                                                                                                                          
             text-align: right;                                                                                                                                                         
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .custom-box {                                                                                                                                                                
             padding: 14px;                                                                                                                                                             
             border-radius: var(--radius-lg);                                                                                                                                           
             border: 1px dashed var(--border-strong);                                                                                                                                   
             background: var(--surface-soft);                                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .custom-label {                                                                                                                                                              
             display: block;                                                                                                                                                            
             margin-bottom: 9px;                                                                                                                                                        
             color: var(--text-muted);                                                                                                                                                  
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.67rem;                                                                                                                                                        
             text-transform: uppercase;                                                                                                                                                 
             letter-spacing: 0.08em;                                                                                                                                                    
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .custom-row {                                                                                                                                                                
             display: flex;                                                                                                                                                             
             gap: 8px;                                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .custom-input {                                                                                                                                                              
             min-width: 0;                                                                                                                                                              
             flex: 1;                                                                                                                                                                   
             height: 38px;                                                                                                                                                              
             border-radius: 11px;                                                                                                                                                       
             border: 1px solid var(--border);                                                                                                                                           
             background: var(--surface);                                                                                                                                                
             color: var(--text-primary);                                                                                                                                                
             padding: 0 12px;                                                                                                                                                           
             font-size: 0.86rem;                                                                                                                                                        
             outline: none;                                                                                                                                                             
             transition: border-color 0.15s ease, box-shadow 0.15s ease;                                                                                                                
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .custom-input:focus {                                                                                                                                                        
             border-color: var(--accent);                                                                                                                                               
             box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);                                                                                                                             
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .custom-input::placeholder {                                                                                                                                                 
             color: var(--text-faint);                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .custom-btn {                                                                                                                                                                
             width: 40px;                                                                                                                                                               
             height: 38px;                                                                                                                                                              
             border: none;                                                                                                                                                              
             border-radius: 11px;                                                                                                                                                       
             background: var(--text-primary);                                                                                                                                           
             color: #fff;                                                                                                                                                               
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             justify-content: center;                                                                                                                                                   
             cursor: pointer;                                                                                                                                                           
             transition: all 0.15s ease;                                                                                                                                                
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .custom-btn:hover:not(:disabled) {                                                                                                                                           
             background: #000;                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .custom-btn:disabled {                                                                                                                                                       
             background: #d1d5db;                                                                                                                                                       
             cursor: not-allowed;                                                                                                                                                       
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .cloud-section {                                                                                                                                                             
             border: 1px solid var(--border);                                                                                                                                           
             border-radius: var(--radius-lg);                                                                                                                                           
             overflow: hidden;                                                                                                                                                          
             background: var(--surface);                                                                                                                                                
             box-shadow: var(--shadow-sm);                                                                                                                                              
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .cloud-toggle {                                                                                                                                                              
             width: 100%;                                                                                                                                                               
             height: 44px;                                                                                                                                                              
             padding: 0 14px;                                                                                                                                                           
             border: none;                                                                                                                                                              
             background: var(--surface);                                                                                                                                                
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             justify-content: space-between;                                                                                                                                            
             cursor: pointer;                                                                                                                                                           
             color: var(--text-secondary);                                                                                                                                              
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .cloud-toggle:hover {                                                                                                                                                        
             background: var(--surface-soft);                                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .cloud-toggle-title {                                                                                                                                                        
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 8px;                                                                                                                                                                  
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.68rem;                                                                                                                                                        
             text-transform: uppercase;                                                                                                                                                 
             letter-spacing: 0.08em;                                                                                                                                                    
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .cloud-list {                                                                                                                                                                
             padding: 10px;                                                                                                                                                             
             border-top: 1px solid var(--border);                                                                                                                                       
             max-height: 280px;                                                                                                                                                         
             overflow-y: auto;                                                                                                                                                          
             display: flex;                                                                                                                                                             
             flex-direction: column;                                                                                                                                                    
             gap: 7px;                                                                                                                                                                  
             background: var(--surface-soft);                                                                                                                                           
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .cloud-item {                                                                                                                                                                
             padding: 9px 10px;                                                                                                                                                         
             border-radius: 10px;                                                                                                                                                       
             background: var(--surface);                                                                                                                                                
             border: 1px solid var(--border);                                                                                                                                           
             color: var(--text-secondary);                                                                                                                                              
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.7rem;                                                                                                                                                         
             line-height: 1.5;                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .controls-footer {                                                                                                                                                           
             height: 48px;                                                                                                                                                              
             padding: 0 18px;                                                                                                                                                           
             border-top: 1px solid var(--border);                                                                                                                                       
             background: var(--surface);                                                                                                                                                
             display: flex;                                                                                                                                                             
             align-items: center;                                                                                                                                                       
             gap: 8px;                                                                                                                                                                  
           }                                                                                                                                                                            
                                                                                                                                                                                        
           .footer-text {                                                                                                                                                               
             color: var(--text-muted);                                                                                                                                                  
             font-family: var(--font-mono);                                                                                                                                             
             font-size: 0.67rem;                                                                                                                                                        
             text-transform: uppercase;                                                                                                                                                 
             letter-spacing: 0.06em;                                                                                                                                                    
           }                                                                                                                                                                            
                                                                                                                                                                                        
           @keyframes spin {                                                                                                                                                            
             to {                                                                                                                                                                       
               transform: rotate(360deg);                                                                                                                                               
             }                                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           @keyframes fadein {                                                                                                                                                          
             from {                                                                                                                                                                     
               opacity: 0;                                                                                                                                                              
               transform: translateY(4px);                                                                                                                                              
             }                                                                                                                                                                          
             to {                                                                                                                                                                       
               opacity: 1;                                                                                                                                                              
               transform: translateY(0);                                                                                                                                                
             }                                                                                                                                                                          
           }                                                                                                                                                                            
                                                                                                                                                                                        
           @media (max-width: 980px) {                                                                                                                                                  
             .controls-pane {                                                                                                                                                           
               width: 330px;                                                                                                                                                            
             }                                                                                                                                                                          
                                                                                                                                                                                        
             .split-view {                                                                                                                                                              
               grid-template-columns: 1fr;                                                                                                                                              
             }                                                                                                                                                                          
                                                                                                                                                                                        
             .split-divider {                                                                                                                                                           
               display: none;                                                                                                                                                           
             }                                                                                                                                                                          
                                                                                                                                                                                        
             .split-baseline {                                                                                                                                                          
               border-bottom: 1px solid var(--border);                                                                                                                                  
             }                                                                                                                                                                          
           }                                                                                                                                                                            
         `}</style>                                                                                                                                                                     
                                                                                                                                                                                        
         <div className="app">                                                                                                                                                          
           <div className="chat-pane">                                                                                                                                                  
             <div className="chat-header">                                                                                                                                              
               <div className="logo" aria-hidden="true">                                                                                                                                
                 PCA                                                                                                                                                                    
               </div>                                                                                                                                                                   
                                                                                                                                                                                        
               <div className="header-main">                                                                                                                                            
                 <span className="header-title">Generative Controls</span>                                                                                                              
                 <span className="header-sub">Prompt-local PCA activation steering</span>                                                                                               
               </div>                                                                                                                                                                   
                                                                                                                                                                                        
               <div className="status-pill" title={API_BASE_URL}>                                                                                                                       
                 <Server size={13} />                                                                                                                                                   
                 <span>{API_BASE_URL}</span>                                                                                                                                            
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
                             <div className="status-line">                                                                                                                              
                               <RefreshCw size={12} className="spin" />                                                                                                                 
                               Applying PCA steering vector…                                                                                                                            
                             </div>                                                                                                                                                     
                           )}                                                                                                                                                           
                         </div>                                                                                                                                                         
                       </div>                                                                                                                                                           
                     )}                                                                                                                                                                 
                   </div>                                                                                                                                                               
                 ))}                                                                                                                                                                    
                                                                                                                                                                                        
                 {isProcessing && (                                                                                                                                                     
                   <div className="status-line" style={{ paddingLeft: 44 }}>                                                                                                            
                     <RefreshCw size={12} className="spin" />                                                                                                                           
                     Sampling completions, extracting activations, and fitting PCA…                                                                                                     
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
                                                                                                                                                                                        
                 <button                                                                                                                                                                
                   className="send-btn"                                                                                                                                                 
                   onClick={handleSendMessage}                                                                                                                                          
                   disabled={isProcessing || !inputText.trim() || steerLoadingId !== null}                                                                                              
                 >                                                                                                                                                                      
                   <Send size={14} />                                                                                                                                                   
                   Send                                                                                                                                                                 
                 </button>                                                                                                                                                              
               </div>                                                                                                                                                                   
             </div>                                                                                                                                                                     
           </div>                                                                                                                                                                       
                                                                                                                                                                                        
           <div className="controls-pane">                                                                                                                                              
             <div className="controls-header">                                                                                                                                          
               <div className="controls-title">                                                                                                                                         
                 <SlidersHorizontal size={15} />                                                                                                                                        
                 PCA controls                                                                                                                                                           
               </div>                                                                                                                                                                   
                                                                                                                                                                                        
               {axes.length > 0 && <span className="axes-chip">{axes.length} axes</span>}                                                                                               
             </div>                                                                                                                                                                     
                                                                                                                                                                                        
             {axes.length === 0 ? (                                                                                                                                                     
               <div className="empty-state">                                                                                                                                            
                 <div className="empty-icon">                                                                                                                                           
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
                   const neutral = '#e5e7eb';                                                                                                                                           
                                                                                                                                                                                        
                   const trackBg =                                                                                                                                                      
                     axis.currentValue === 0                                                                                                                                            
                       ? `linear-gradient(to right, ${neutral} 0%, ${neutral} 100%)`                                                                                                    
                       : axis.currentValue > 0                                                                                                                                          
                         ? `linear-gradient(to right, ${neutral} 0%, ${neutral} 50%, ${color}55 50%, ${color} ${pct}%, ${neutral} ${pct}%, ${neutral} 100%)`                            
                         : `linear-gradient(to right, ${neutral} 0%, ${neutral} ${pct}%, ${color} ${pct}%, ${color}55 50%, ${neutral} 50%, ${neutral} 100%)`;                           
                                                                                                                                                                                        
                   return (                                                                                                                                                             
                     <div                                                                                                                                                               
                       key={axis.index}                                                                                                                                                 
                       className={`axis-card${isActive ? ' active' : ''}${steerLoadingId !== null ? ' disabled' : ''}`}                                                                 
                       style={isActive ? { borderColor: `${color}66` } : {}}                                                                                                            
                     >                                                                                                                                                                  
                       <div className="axis-header">                                                                                                                                    
                         <div className="axis-left">                                                                                                                                    
                           <div className="axis-dot" style={{ background: color }} />                                                                                                   
                                                                                                                                                                                        
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
                             >                                                                                                                                                          
                               <RotateCcw size={11} />                                                                                                                                  
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
                           style={{ background: trackBg }}                                                                                                                              
                           onChange={(e) => {                                                                                                                                           
                             if (!steerLoadingId) {                                                                                                                                     
                               setAxes((prev) =>                                                                                                                                        
                                 prev.map((a) =>                                                                                                                                        
                                   a.index === axis.index                                                                                                                               
                                     ? { ...a, currentValue: parseInt(e.target.value) }                                                                                                 
                                     : a                                                                                                                                                
                                 )                                                                                                                                                      
                               );                                                                                                                                                       
                             }                                                                                                                                                          
                           }}                                                                                                                                                           
                           onMouseUp={(e) => {                                                                                                                                          
                             if (!steerLoadingId) {                                                                                                                                     
                               handleSteer(                                                                                                                                             
                                 axis.index,                                                                                                                                            
                                 parseInt((e.target as HTMLInputElement).value)                                                                                                         
                               );                                                                                                                                                       
                             }                                                                                                                                                          
                           }}                                                                                                                                                           
                           onTouchEnd={(e) => {                                                                                                                                         
                             if (!steerLoadingId) {                                                                                                                                     
                               handleSteer(                                                                                                                                             
                                 axis.index,                                                                                                                                            
                                 parseInt((e.target as HTMLInputElement).value)                                                                                                         
                               );                                                                                                                                                       
                             }                                                                                                                                                          
                           }}                                                                                                                                                           
                           disabled={steerLoadingId !== null}                                                                                                                           
                         />                                                                                                                                                             
                                                                                                                                                                                        
                         <div className="center-mark" />                                                                                                                                
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
                   <label className="custom-label">Optional custom axis</label>                                                                                                         
                                                                                                                                                                                        
                   <div className="custom-row">                                                                                                                                         
                     <input                                                                                                                                                             
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
                       disabled={                                                                                                                                                       
                         isCustomProcessing ||                                                                                                                                          
                         !customConcept.trim() ||                                                                                                                                       
                         steerLoadingId !== null                                                                                                                                        
                       }                                                                                                                                                                
                     >                                                                                                                                                                  
                       {isCustomProcessing ? (                                                                                                                                          
                         <RefreshCw size={15} className="spin" />                                                                                                                       
                       ) : (                                                                                                                                                            
                         <Plus size={16} />                                                                                                                                             
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
                         <Database size={13} />                                                                                                                                         
                         Latent cloud samples                                                                                                                                           
                       </span>                                                                                                                                                          
                                                                                                                                                                                        
                       {showVariations ? (                                                                                                                                              
                         <ChevronUp size={15} color="var(--text-muted)" />                                                                                                              
                       ) : (                                                                                                                                                            
                         <ChevronDown size={15} color="var(--text-muted)" />                                                                                                            
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
               <div className="live-dot" />                                                                                                                                             
               <span className="footer-text">PyTorch GPU · PCA steering backend</span>                                                                                                  
             </div>                                                                                                                                                                     
           </div>                                                                                                                                                                       
         </div>                                                                                                                                                                         
       </>                                                                                                                                                                              
     );                                                                                                                                                                                 
   }

