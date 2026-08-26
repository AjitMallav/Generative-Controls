import * as Diff from 'diff';                                                                                                                                  
import './App.css';
import {
  getPrecomputedCombinedSteeredText,
  getPrecomputedPoleExamples,
} from './precomputedVariants';
import { useState, useRef, useEffect, type ChangeEvent, type CSSProperties } from 'react';
import {                                                                                                                                                       
  Send,                                                                                                                                                        
  SlidersHorizontal,                                                                                                                                           
  AlertCircle,                                                                                                                                                 
  Zap,                                                                                                                                                         
  RefreshCw,                                                                                                                                                   
  Plus,
  Eye,                                                                                                                                                         
  EyeOff,                                                                                                                                                      
  Database,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
  Trash2,
  User,
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
  steeredSummary?: string;
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
  userId?: string;
  promptIndex?: number;
  presetPrompt?: string;
  isPromptSession?: boolean;
};

const STARTER_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'ai',
    content:
      'Hello. Enter a prompt and I’ll discover PCA steering axes from sampled model completions.',
  },
];

const APP_RUN_ID = __APP_RUN_ID__;
const CHAT_HISTORY_STORAGE_PREFIX = 'generative-controls-chat-history-v4';
const LEGACY_CHAT_HISTORY_STORAGE_KEYS = ['generative-controls-chat-history-v3'];
const CHAT_HISTORY_STORAGE_KEY = `${CHAT_HISTORY_STORAGE_PREFIX}:${APP_RUN_ID}`;

const makeConversationId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getConversationTitle = (messages: Message[]) => {
  const firstPrompt = messages.find((message) => message.role === 'user')?.content;
  return getPromptDisplayTitle(firstPrompt);
};

const createConversation = (
  title = 'New chat',
  metadata: Partial<Pick<Conversation, 'userId' | 'promptIndex' | 'presetPrompt' | 'isPromptSession'>> = {}
): Conversation => ({
  id: makeConversationId(),
  title,
  messages: STARTER_MESSAGES,
  updatedAt: Date.now(),
  ...metadata,
});

const cleanupStaleConversationStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      const isPreviousRunKey =
        key?.startsWith(CHAT_HISTORY_STORAGE_PREFIX) && key !== CHAT_HISTORY_STORAGE_KEY;
      const isLegacyKey = key ? LEGACY_CHAT_HISTORY_STORAGE_KEYS.includes(key) : false;

      if (key && (isPreviousRunKey || isLegacyKey)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage cleanup is best-effort only.
  }
};

const loadConversations = (): Conversation[] => {
  if (typeof window === 'undefined') return [];

  cleanupStaleConversationStorage();

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

  return [];
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
                                                                                                                                                              
const AXIS_COLORS = ['#0072B2', '#D55E00', '#009E73', '#CC79A7', '#E69F00'];

const STANDARD_PROMPTS = [
  'Describe the chaotic energy of a packed night market in a bustling city.',
  'Describe a sudden thunderstorm hitting a quiet, open field during a hot afternoon.',
  'Write a brief, encouraging announcement message for a team channel celebrating a successful project launch.',
  'Write a brief, urgent Slack message asking teammates to hop onto a bridge call to fix a sudden production crash.',
];

const USER_1_PICKED_PROMPT =
  'Can you write me a message asking my professor to extend a deadline for a homework assignment.';
const USER_2_PICKED_PROMPT =
  'Write an email to my manager asking if they would be willing to write a recommendation letter for future product management roles.';
const USER_3_PICKED_PROMPT =
  'Talking with my family in korean, How do you say “I heard she got into a study abroad program with good accommodations” in korean';
const USER_4_PICKED_PROMPT =
  'Write an email about how my security key was shipped to the wrong address, and how I would need to retreive a new one.';
const USER_5_PICKED_PROMPT =
  'What are a few options for commuting from Sunnyvale, CA to Menlo Park, CA?';

const USER_PICKED_PROMPTS = [
  USER_1_PICKED_PROMPT,
  USER_2_PICKED_PROMPT,
  USER_3_PICKED_PROMPT,
  USER_4_PICKED_PROMPT,
  USER_5_PICKED_PROMPT,
  ...Array.from({ length: 7 }, () => ''),
];

const STANDARD_PROMPT_TITLES = [
  'Night market energy',
  'Open-field thunderstorm',
  'Project launch announcement',
  'Production crash bridge call',
];

const USER_PICKED_PROMPT_TITLES = [
  'Deadline extension request',
  'Recommendation letter request',
  'Korean family translation',
  'Security key replacement',
  'Sunnyvale to Menlo Park commute',
  ...Array.from({ length: 7 }, () => 'User-selected prompt'),
];

type PrecomputedGeneration = {
  generatedText: string;
  generationTimeSeconds: number;
};

const normalizePromptKey = (prompt: string) => prompt.replace(/\s+/g, ' ').trim();

const PRECOMPUTED_AXIS_LABELS = new Map<string, string[]>([
  [normalizePromptKey(STANDARD_PROMPTS[0]), ['Vivid', 'Sensational', 'Atmosphere']],
  [normalizePromptKey(STANDARD_PROMPTS[1]), ['Vividness', 'Sensory', 'Dissonance']],
  [normalizePromptKey(STANDARD_PROMPTS[2]), ['Formality', 'Enthusiasm', 'Tone']],
  [normalizePromptKey(STANDARD_PROMPTS[3]), ['Urgency', 'Formality', 'Directness']],
  [normalizePromptKey(USER_1_PICKED_PROMPT), ['Formality', 'Persuasiveness', 'Politeness']],
  [normalizePromptKey(USER_2_PICKED_PROMPT), ['Formality', 'Deference', 'Persuasion']],
  [normalizePromptKey(USER_3_PICKED_PROMPT), ['Formality', 'Naturalness', 'Detail']],
  [normalizePromptKey(USER_4_PICKED_PROMPT), ['Formality', 'Detail', 'Urgency']],
  [normalizePromptKey(USER_5_PICKED_PROMPT), ['Detail Level', 'Concise', 'Enthusiasm']],
]);

const createPrecomputedAxes = (prompt: string): Axis[] => {
  const labels = PRECOMPUTED_AXIS_LABELS.get(normalizePromptKey(prompt)) || [];
  const variances = [0.34, 0.24, 0.16];

  return labels.map((label, index) => {
    const poleExamples = getPrecomputedPoleExamples(prompt, label);

    return {
      index,
      label,
      positive_example:
        poleExamples.positive || `Reserved for a high-${label.toLowerCase()} example.`,
      negative_example:
        poleExamples.negative || `Reserved for a low-${label.toLowerCase()} example.`,
      currentValue: 0,
      variance: variances[index] ?? 0.1,
      source: 'precomputed',
    };
  });
};

const PRECOMPUTED_GENERATIONS = new Map<string, PrecomputedGeneration>([
  [
    normalizePromptKey(STANDARD_PROMPTS[0]),
    {
      generationTimeSeconds: 23.7,
      generatedText: `The air here is a thick, intoxicating stew: **spicy Sichuan peppercorns** biting at the tongue, **sizzling pork belly** sending waves of steam into the humid night, and the sharp tang of **grilled charcoal**. It's a sensory riot where silence is an alien concept.

Every inch of cobblestone is a stage for chaos. A **motorbike weaves through the crowd like a silver needle**, its headlight cutting a beam through the fog of smoke and shouting. Above, neon signs flicker—*Crispy Wings*, *Szechuan Hot Pot*—casting a garish purple and electric blue glow on the faces of haggling vendors and laughing tourists.

A vendor's cart tips precariously as a child tugs too hard, triggering a **domino effect of laughter and scrambling feet**. Steam rises from steaming bowls of noodles, blurring the eyes of passersby. The rhythm is frantic: the clatter of metal woks, the roar of the street, the rhythmic *thump-thump-thump* of a DJ speaker hidden behind a stall, and the endless, overlapping chatter of a thousand languages colliding in a vibrant, chaotic symphony. Here, order dissolves into pure, unfiltered life.`,
    },
  ],
  [
    normalizePromptKey(STANDARD_PROMPTS[1]),
    {
      generationTimeSeconds: 28.51,
      generatedText: `The air hangs heavy and still, smelling of dry dust and scorching sun as the heat waves shimmer off the golden grass. A lone cicada buzzes in an endless loop, the only sound breaking the oppressive silence.

Then, the sky shudders.

In a heartbeat, the azure dome fractures into a bruised purple. Within seconds, the air pressure drops so sharply it feels like a physical weight, stealing the breath from the insects' legs and freezing the sweat on your skin. The heat suddenly vanishes, replaced by a biting, electric chill.

A distant rumble vibrates through the soles of your boots before the first drop falls. It isn't rain yet; it is a thousand sharp, staccato taps, each one striking the dry earth with a sound like a pistol shot. Instantly, the sky erupts into a violent, swirling vortex of black and gray.

Within moments, the world dissolves into a blinding white flash, followed by a crack that echoes like a thunderclap splitting the world in two. The wind picks up with terrifying force, tearing through the tall grass with a howl that drowns out the remaining insects. Then, the heavens open.

It doesn't fall gently; it pours. A relentless, blinding sheet of water crashes down, turning the open field into a churning river of mud and debris. The sound is deafening—a roaring torrent that swallows the horizon. The air, once stagnant, becomes thick with the scent of wet grass and ozone, carrying the electric tang of the storm's fury. For a brief, chaotic second, the world is no longer quiet; it is screaming.`,
    },
  ],
  [
    normalizePromptKey(STANDARD_PROMPTS[2]),
    {
      generationTimeSeconds: 8.36,
      generatedText: `🎉 **Huge Congratulations!** 🚀

Our recent project launch was a massive success! Thanks to your hard work, creativity, and collaboration, we've achieved something truly special.

Take a moment to celebrate this win—it's a testament to what this team can do together. Let's keep the momentum going and tackle our next challenge with the same energy. You did it! 💪✨

#TeamSuccess #ProjectLaunch #WellDone`,
    },
  ],
  [
    normalizePromptKey(STANDARD_PROMPTS[3]),
    {
      generationTimeSeconds: 5.61,
      generatedText: `🚨 **CRITICAL: Prod Crash Detected** 🚨

Our services just went down. Please hop on the bridge immediately to triage and restore stability.

Link: [Insert Bridge Link]
⏰ Start time: 2 mins ago

Let's get this fixed ASAP! 🛠️`,
    },
  ],
  [
    normalizePromptKey(USER_1_PICKED_PROMPT),
    {
      generationTimeSeconds: 13.24,
      generatedText: `Subject: Request for Deadline Extension – [Course Name] – [Your Name]

Dear Professor [Last Name],

I hope you are having a good week.

I am writing to respectfully request an extension of the deadline for our upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason, e.g., an unexpected personal matter / a scheduling conflict], I will be unable to submit my work by the original due date of [Date].

I am committed to ensuring high quality and would like to submit the assignment by [Proposed New Date]. Would it be possible to extend the deadline until then?

Thank you for your time and understanding. I appreciate your consideration.

Best regards,

[Your Name]
[Student ID Number]`,
    },
  ],
  [
    normalizePromptKey(USER_2_PICKED_PROMPT),
    {
      generationTimeSeconds: 14.61,
      generatedText: `Subject: Request for Reference – Product Management Roles

Hi [Manager's Name],

I hope you're having a great week.

As I look ahead to exploring new opportunities in product management, I'd love to leverage your support. Given our work together on [mention specific project or achievement], I believe your perspective would add significant value to my application.

Would you be open to writing a formal recommendation letter for future product leadership roles? If so, I'd be happy to share my resume and a draft of potential talking points to help ensure it highlights the key skills we developed during our time working together.

No pressure at all if you're too busy right now, but I'd really appreciate your thoughts if you might be able to take this on.

Thanks so much for your continued mentorship!

Best regards,

[Your Name]`,
    },
  ],
  [
    normalizePromptKey(USER_3_PICKED_PROMPT),
    {
      generationTimeSeconds: 9.12,
      generatedText: `"그녀가 좋은 숙소가 있는 해외연수 프로그램에 들어갔다는 소식을 들었습니다."

**Breakdown of the phrase:**
*   **그녀가** (Geunyeoga): She (subject marker)
*   **좋은 숙소가 있는** (Joheun soko-ga inneun): Having good accommodations (good = 좋은, accommodation = 숙소, having = 있는)
*   **해외연수 프로그램에** (Hwaeye-yeonsu progeureume): Into an overseas study-abroad program
*   **들었습니다** (Deul-eotseumnida): Heard (polite past tense)`,
    },
  ],
  [
    normalizePromptKey(USER_4_PICKED_PROMPT),
    {
      generationTimeSeconds: 19.43,
      generatedText: `Subject: Issue with Security Key Delivery – Request for Replacement

Dear Support Team,

I am writing to report that my recent security key order appears to have been shipped to the wrong address. After checking my order details, I realized the package was sent to a different location than my registered shipping address.

Could you please assist me with the following:

1. Confirm whether the key was lost in transit or shipped to an incorrect recipient.
2. Provide instructions for retrieving the package if possible or issuing a replacement unit.
3. Let me know whether any additional verification steps or fees are required for the replacement.

My order number is [Insert Order Number], and I placed the order on [Insert Date].

Please let me know what information you need from me to expedite this process. I apologize for any inconvenience this may cause.

Best regards,

[Your Name]
[Your Account Email/Username]
[Phone Number]`,
    },
  ],
  [
    normalizePromptKey(USER_5_PICKED_PROMPT),
    {
      generationTimeSeconds: 25.41,
      generatedText: `Here are a few efficient ways to commute between Sunnyvale and Menlo Park:

*   **High-Speed Train (VTA):** This is the most scenic and direct option. Take the VTA Red Line (or the newer Blue/Yellow lines depending on current service) from Sunnyvale Station directly to **Menlo Park Station**. The ride takes about 15–20 minutes, and you'll enjoy a view of the San Francisco Bay while skipping traffic.
*   **Bike & Walk:** Both cities are bike-friendly. You can ride your e-bike from downtown Sunnyvale across the Bay Bridge to Menlo Park, then take a short walk or another quick bike ride through the park's hills to your destination.
*   **Rideshare/Carpool:** Apps like Uber or Lyft offer a door-to-door service, though it can be pricier than public transit. Alternatively, check if your workplace or local clubs have carpools to share gas costs and avoid parking fees in Menlo Park.
*   **Bus + Bike:** If trains are unavailable, take a bus to the nearest VTA station or the Bay Bridge area, then finish the journey by biking or taking a short taxi ride into Menlo Park.

**Pro Tip:** Check local weather conditions before biking or walking, as fog or rain can make the Bay Bridge crossing tricky!`,
    },
  ],
]);

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const MIN_STATIC_STEERING_DELAY_MS = 5000;
const MAX_STATIC_STEERING_DELAY_MS = 8000;
const STATIC_STEERING_FULL_DELAY_CHARS = 2200;

const getStaticSteeringDelayMs = (generatedText: string) => {
  const normalizedLength = generatedText.replace(/\s+/g, ' ').trim().length;
  const lengthRatio = Math.min(normalizedLength / STATIC_STEERING_FULL_DELAY_CHARS, 1);

  return Math.round(
    MIN_STATIC_STEERING_DELAY_MS +
      lengthRatio * (MAX_STATIC_STEERING_DELAY_MS - MIN_STATIC_STEERING_DELAY_MS)
  );
};

function getPromptDisplayTitle(prompt: string | undefined, fallback = 'New chat') {
  const clean = prompt?.replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;

  const standardIndex = STANDARD_PROMPTS.indexOf(clean);
  if (standardIndex !== -1) return STANDARD_PROMPT_TITLES[standardIndex];

  const userPickedIndex = USER_PICKED_PROMPTS.indexOf(clean);
  if (userPickedIndex !== -1) return USER_PICKED_PROMPT_TITLES[userPickedIndex];

  const title = clean
    .replace(/^(write|describe)\s+(a|an|the)?\s*/i, '')
    .replace(/[.!?]$/, '')
    .trim();
  const normalizedTitle = title.charAt(0).toUpperCase() + title.slice(1);

  return truncate(normalizedTitle || clean, 38);
}

type UserProfile = {
  id: string;
  label: string;
  prompts: string[];
};

const USER_PROFILES: UserProfile[] = Array.from({ length: 12 }, (_, index) => {
  const label = `User ${index + 1}`;

  const userPickedPrompt = USER_PICKED_PROMPTS[index];

  return {
    id: `user-${index + 1}`,
    label,
    prompts: userPickedPrompt
      ? [...STANDARD_PROMPTS, userPickedPrompt]
      : [...STANDARD_PROMPTS],
  };
});

const DEFAULT_USER_ID = USER_PROFILES[0].id;
const DEFAULT_PROMPT_INDEX = 0;

const createInitialPromptDrafts = () =>
  Object.fromEntries(
    USER_PROFILES.map((profile) => [profile.id, [...profile.prompts]])
  ) as Record<string, string[]>;

const getPromptConversationId = (userId: string, promptIndex: number) =>
  `${userId}-prompt-${promptIndex + 1}`;

const getUserPrompts = (userId: string) =>
  USER_PROFILES.find((profile) => profile.id === userId)?.prompts || USER_PROFILES[0].prompts;

const createPromptConversation = (userId: string, promptIndex: number): Conversation => ({
  id: getPromptConversationId(userId, promptIndex),
  title: `Prompt ${promptIndex + 1}`,
  messages: STARTER_MESSAGES,
  updatedAt: Date.now() - promptIndex,
  userId,
  promptIndex,
  presetPrompt: getUserPrompts(userId)[promptIndex],
  isPromptSession: true,
});

const ensureUserPromptConversations = (
  conversationList: Conversation[],
  userId: string
) => {
  const existingIds = new Set(conversationList.map((conversation) => conversation.id));
  const missingPromptConversations = getUserPrompts(userId)
    .map((_, promptIndex) => createPromptConversation(userId, promptIndex))
    .filter((conversation) => !existingIds.has(conversation.id));

  return [...missingPromptConversations, ...conversationList];
};

const orderConversationsForSidebar = (conversationList: Conversation[]) => {
  const promptSessions = conversationList
    .filter((conversation) => conversation.isPromptSession)
    .sort((a, b) => (a.promptIndex ?? 0) - (b.promptIndex ?? 0));
  const otherConversations = conversationList
    .filter((conversation) => !conversation.isPromptSession)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return [...otherConversations, ...promptSessions];
};

const QWEN_SAFE_ALPHA_BOUND = 0.75;
const sliderValueToAlpha = (sliderValue = 0) =>
  (sliderValue / 50) * QWEN_SAFE_ALPHA_BOUND;
                                                                                                                                                              
const formatAlpha = (sliderValue?: number) => {                                                                                                                
  if (sliderValue === undefined || sliderValue === null) return '0.00α';
  const alpha = sliderValueToAlpha(sliderValue);
  return `${alpha > 0 ? '+' : ''}${alpha.toFixed(2)}α`;
};

const formatSteeringSummary = (axes: Axis[]) =>
  axes
    .filter((axis) => axis.currentValue !== 0)
    .map((axis) => `${axis.label} ${formatAlpha(axis.currentValue)}`)
    .join(' · ');
                                                                                                                                                              
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
                                                                                                                                                              
const SteeredMessageView = ({
  msg,
  showDiff,
  onToggleDiff,
}: {
  msg: Message;
  showDiff: boolean;
  onToggleDiff: () => void;
}) => (
  <div className="steered-view">
    <div className="split-label split-label-row">
      <span>{showDiff ? 'Changes from baseline' : 'Steered variant'}</span>

      <div className="split-actions">
        {(msg.steeredSummary || msg.steeredAxis) && (
          <span className="axis-badge">
            {msg.steeredSummary || `${msg.steeredAxis} ${formatAlpha(msg.steeredValue)}`}
          </span>
        )}

        <button
          className="icon-btn"
          onClick={onToggleDiff}
          title={showDiff ? 'Hide differences' : 'Show differences from baseline'}
          aria-label={showDiff ? 'Hide differences' : 'Show differences from baseline'}
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
);

export default function App() {
  const [selectedUserId, setSelectedUserId] = useState(DEFAULT_USER_ID);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(
    DEFAULT_PROMPT_INDEX
  );
  const [userPromptDrafts, setUserPromptDrafts] = useState<Record<string, string[]>>(
    createInitialPromptDrafts
  );
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    ensureUserPromptConversations(loadConversations(), DEFAULT_USER_ID)
  );
  const [activeConversationId, setActiveConversationId] = useState(() =>
    getPromptConversationId(DEFAULT_USER_ID, DEFAULT_PROMPT_INDEX)
  );
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );
  const messages = activeConversation?.messages || STARTER_MESSAGES;
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [chatSearch, setChatSearch] = useState('');
  const selectedUser =
    USER_PROFILES.find((profile) => profile.id === selectedUserId) || USER_PROFILES[0];
  const normalizedChatSearch = chatSearch.trim().toLocaleLowerCase();
  const selectedUserConversations = orderConversationsForSidebar(
    conversations.filter((conversation) => conversation.userId === selectedUserId)
  );
  const visibleConversations = normalizedChatSearch
    ? selectedUserConversations.filter((conversation) =>
        [conversation.title, ...conversation.messages.map((message) => message.content)]
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalizedChatSearch)
      )
    : selectedUserConversations;
                                                                                                                                                              
  const [inputText, setInputText] = useState(
    USER_PROFILES[0].prompts[DEFAULT_PROMPT_INDEX]
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
    if (!import.meta.env.DEV) return undefined;

    let isMounted = true;

    const checkRunId = async () => {
      try {
        const response = await fetch('/__app_run_id', { cache: 'no-store' });
        if (!response.ok) return;

        const data = (await response.json()) as { runId?: string };

        if (isMounted && data.runId && data.runId !== APP_RUN_ID) {
          window.localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
          window.location.reload();
        }
      } catch {
        // The dev server may be temporarily unavailable while it restarts.
      }
    };

    checkRunId();
    const intervalId = window.setInterval(checkRunId, 1500);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

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
          title: conversation.isPromptSession
            ? conversation.title
            : getConversationTitle(nextMessages),
          messages: nextMessages,
          updatedAt: Date.now(),
        };
      })
    );
  };

  const resizePromptInput = () => {
    window.requestAnimationFrame(() => {
      const textarea = inputRef.current;
      if (!textarea) return;

      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  };

  const resetSteeringState = () => {
    setAxes([]);
    setCloudVariations([]);
    setShowVariations(false);
    setShowDiff(false);
    setErrorMessage(null);
    generationCache.current = {};
  };

  const loadPromptChat = (userId: string, promptIndex: number) => {
    if (isProcessing || steerLoadingId) return;

    const profile = USER_PROFILES.find((candidate) => candidate.id === userId) || USER_PROFILES[0];
    const prompts = userPromptDrafts[userId] || profile.prompts;
    const prompt = prompts[promptIndex] || profile.prompts[promptIndex] || '';
    const conversationId = getPromptConversationId(userId, promptIndex);

    setSelectedUserId(userId);
    setSelectedPromptIndex(promptIndex);
    setInputText(prompt);
    setConversations((previous) => ensureUserPromptConversations(previous, userId));
    setActiveConversationId(conversationId);
    setChatSearch('');
    resetSteeringState();
    resizePromptInput();
  };

  const handleUserChange = (event: ChangeEvent<HTMLSelectElement>) => {
    loadPromptChat(event.target.value, DEFAULT_PROMPT_INDEX);
  };

  const handleComposerChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextText = event.target.value;

    setInputText(nextText);

    if (selectedPromptIndex !== null) {
      setUserPromptDrafts((previous) => {
        const drafts = previous[selectedUserId] || [...selectedUser.prompts];
        const nextDrafts = [...drafts];
        nextDrafts[selectedPromptIndex] = nextText;

        return {
          ...previous,
          [selectedUserId]: nextDrafts,
        };
      });
    }

    event.target.style.height = 'auto';
    event.target.style.height = `${event.target.scrollHeight}px`;
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
    setSelectedPromptIndex(null);
    setInputText('');                                                                                                                                          
    setIsProcessing(true);                                                                                                                                     
    setAxes([]);
    setCloudVariations([]);
    setShowVariations(false);                                                                                                                                  
    setShowDiff(false);
    generationCache.current = {};                                                                                                                              

    const precomputed = PRECOMPUTED_GENERATIONS.get(normalizePromptKey(userMsg.content));
    if (precomputed) {
      await wait(precomputed.generationTimeSeconds * 1000);

      const precomputedAxes = createPrecomputedAxes(userMsg.content);
      setAxes(precomputedAxes);
      precomputedAxes.forEach((axis) => {
        generationCache.current[`${axis.index}_0`] = precomputed.generatedText;
      });

      updateActiveMessages((prev) => [
        ...prev,
        {
          id: makeConversationId(),
          role: 'ai',
          content: precomputed.generatedText,
          baselineContent: precomputed.generatedText,
        },
      ]);

      setIsProcessing(false);
      return;
    }
                                                                                                                                                              
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

    const nextAxes = axes.map((a) => {
      if (a.index === axisIndex) return { ...a, currentValue: coefficient };

      return targetAxis?.source === 'precomputed'
        ? a
        : { ...a, currentValue: 0 };
    });

    setAxes(nextAxes);

    const targetMessageId = messages[messages.length - 1]?.id;
    const targetMessage = messages[messages.length - 1];

    if (targetAxis?.source === 'precomputed') {
      const lastUserMsg =
        [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      const baselineText =
        targetMessage?.baselineContent || generationCache.current[`${axisIndex}_0`] || '';
      const steeredText = getPrecomputedCombinedSteeredText(
        lastUserMsg,
        nextAxes.map(({ label, currentValue }) => ({
          label,
          coefficient: currentValue,
        })),
        baselineText
      );
      const steeringSummary = formatSteeringSummary(nextAxes);

      if (!targetMessageId || !steeredText) {
        setErrorMessage('No static steering output is available for this slider value.');
        return;
      }

      setSteerLoadingId(targetMessageId);

      updateActiveMessages((prev) =>
        prev.map((m) =>
          m.id === targetMessageId
            ? { ...m, isSteering: true, cacheHit: false }
            : m
        )
      );

      await wait(getStaticSteeringDelayMs(steeredText));

      updateActiveMessages((prev) =>
        prev.map((m) =>
          m.id === targetMessageId
            ? {
                ...m,
                content: steeredText,
                isSteering: false,
                cacheHit: true,
                steeredAxis: targetAxis.label,
                steeredValue: coefficient,
                steeredSummary: steeringSummary,
              }
            : m
        )
      );

      setSteerLoadingId(null);

      window.setTimeout(() => {
        updateActiveMessages((curr) =>
          curr.map((m) =>
            m.id === targetMessageId ? { ...m, cacheHit: false } : m
          )
        );
      }, 700);

      return;
    }

    const alphaCoefficient = sliderValueToAlpha(coefficient);
    const cacheKey = `${axisIndex}_${alphaCoefficient.toFixed(4)}`;

    if (!targetMessageId) return;
                                                                                                                                                              
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
          steeredSummary: undefined,
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
        coefficient: alphaCoefficient,
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
            steeredSummary: undefined,
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
                                                                                                                                                              
  const handleNewChat = () => {
    if (isProcessing || steerLoadingId) return;

    const conversation = createConversation('New chat', { userId: selectedUserId });
    setSelectedPromptIndex(null);
    setConversations((previous) => [conversation, ...previous]);
    setActiveConversationId(conversation.id);
    setInputText('');
    resetSteeringState();
    resizePromptInput();
  };

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId === activeConversationId || isProcessing || steerLoadingId) return;

    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;

    const nextUserId = conversation.userId || selectedUserId;
    const nextPromptIndex = conversation.isPromptSession
      ? conversation.promptIndex ?? null
      : null;
    const promptDraft =
      nextPromptIndex !== null
        ? userPromptDrafts[nextUserId]?.[nextPromptIndex] ||
          conversation.presetPrompt ||
          getUserPrompts(nextUserId)[nextPromptIndex]
        : '';

    setActiveConversationId(conversation.id);
    setSelectedUserId(nextUserId);
    setSelectedPromptIndex(nextPromptIndex);
    setInputText(promptDraft);
    resetSteeringState();
    resizePromptInput();
  };

  const handleOpenHistorySearch = () => {
    setIsHistoryOpen(true);
    window.setTimeout(() => historySearchRef.current?.focus(), 0);
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (isProcessing || steerLoadingId) return;

    const targetConversation = conversations.find(
      (conversation) => conversation.id === conversationId
    );
    if (targetConversation?.isPromptSession) return;

    const remainingConversations = conversations.filter(
      (conversation) => conversation.id !== conversationId
    );
    const nextConversations = ensureUserPromptConversations(
      remainingConversations,
      selectedUserId
    );

    setConversations(nextConversations);

    if (conversationId === activeConversationId) {
      const nextConversation = nextConversations.find(
        (conversation) => conversation.userId === selectedUserId
      );
      if (!nextConversation) return;

      const nextPromptIndex = nextConversation.isPromptSession
        ? nextConversation.promptIndex ?? DEFAULT_PROMPT_INDEX
        : null;
      const promptDraft =
        nextPromptIndex !== null
          ? userPromptDrafts[selectedUserId]?.[nextPromptIndex] ||
            nextConversation.presetPrompt ||
            getUserPrompts(selectedUserId)[nextPromptIndex]
          : '';

      setActiveConversationId(nextConversation.id);
      setSelectedPromptIndex(nextPromptIndex);
      setInputText(promptDraft);
      resetSteeringState();
      resizePromptInput();
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
            <span>DimSteer</span>
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

          <button
            className="collapsed-user-btn"
            onClick={() => setIsHistoryOpen(true)}
            aria-label={`Open user profile: ${selectedUser.label}`}
            title={selectedUser.label}
          >
            <User size={17} aria-hidden="true" />
          </button>

          <div className="user-profile-block">
            <label className="history-label user-profile-label" htmlFor="user-profile-select">
              User profile
            </label>
            <select
              id="user-profile-select"
              className="user-profile-select"
              value={selectedUserId}
              onChange={handleUserChange}
              disabled={isProcessing || steerLoadingId !== null}
            >
              {USER_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </div>

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
                {!conversation.isPromptSession && (
                  <button
                    className="history-delete-btn"
                    onClick={() => handleDeleteConversation(conversation.id)}
                    aria-label={`Delete chat: ${conversation.title}`}
                    title="Delete chat"
                    disabled={isProcessing || steerLoadingId !== null}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                )}
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
              <span className="header-title">DimSteer</span>                                                                                        
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
                            <SteeredMessageView
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
                            Generating steered variant…
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
                onChange={handleComposerChange}
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
                const sliderFillStyle = {
                  left: axis.currentValue < 0 ? `${50 + axis.currentValue}%` : '50%',
                  width: `${Math.abs(axis.currentValue)}%`,
                } as CSSProperties;

                return (
                  <div                                                                                                                                         
                    key={axis.index}                                                                                                                           
                    className={`axis-card${isActive ? ' active' : ''}${                                                                                        
                      steerLoadingId !== null ? ' disabled' : ''                                                                                               
                    }`}
                    style={{ '--axis-color': color } as CSSProperties}
                  >                                                                                                                                            
                    <div className="axis-header">                                                                                                              
                      <div className="axis-left">                                                                                                              
                        <div                                                                                                                                   
                          className="axis-dot"                                                                                                                 
                          aria-hidden="true"                                                                                                                   
                        />                                                                                                                                     
                                                                                                                                                              
                        <div className="axis-name-wrap">                                                                                                       
                          <span className="axis-name">{axis.label}</span>                                                                                      
                        </div>                                                                                                                                 
                      </div>                                                                                                                                   
                                                                                                                                                              
                      <div className="axis-right">                                                                                                             
                        <span                                                                                                                                  
                          className={`axis-value${isActive ? ' active' : ''}`}                                                                                 
                        >                                                                                                                                      
                          {formatAlpha(axis.currentValue)}
                        </span>                                                                                                                                
                      </div>
                    </div>                                                                                                                                     
                                                                                                                                                              
                    <div className="slider-wrap">                                                                                                              
                      <div className="slider-track-base" aria-hidden="true" />
                      <div
                        className={`slider-fill${axis.currentValue < 0 ? ' negative' : ''}${
                          axis.currentValue > 0 ? ' positive' : ''
                        }`}
                        style={sliderFillStyle}
                        aria-hidden="true"
                      />

                      <input
                        type="range"                                                                                                                           
                        className="slider-input"                                                                                                               
                        min="-50"                                                                                                                              
                        max="50"                                                                                                                               
                        step="25"
                        value={axis.currentValue}                                                                                                              
                        aria-label={`Steer ${axis.label}`}                                                                                                     
                        aria-valuemin={-50}                                                                                                                    
                        aria-valuemax={50}                                                                                                                     
                        aria-valuenow={axis.currentValue}                                                                                                      
                        aria-valuetext={`${axis.label}, ${formatAlpha(axis.currentValue)}`}
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
                        {truncate(axis.negative_example, 120)}
                      </span>
                      <span className="axis-label right">
                        {truncate(axis.positive_example, 120)}
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
