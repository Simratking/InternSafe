import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Compass,
  Building2,
  Users,
  Bell,
  FileText,
  Layers,
  Sparkles,
  History,
  Search,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Menu,
  X,
  Play,
  RotateCcw,
  Plus,
  Clock,
  ArrowRight,
  Lock,
  Info,
  Check,
  Trash2,
  SlidersHorizontal,
  Sun,
  Moon,
} from 'lucide-react';
import { api, API_BASE_URL, INITIAL_OPPORTUNITIES, normalizeOpportunities } from './api';
import {
  AgentStep,
  ApplicationStatus,
  BatchCompareResponse,
  CampusNotice,
  CommunityReport,
  CompanyVerifyResponse,
  LocationType,
  Opportunity,
  OpportunityType,
  PageId,
  ReminderItem,
  RunRecord,
  ScamCheckResponse,
  ScamPattern,
  ScamSourceType,
  SearchResultItem,
  StudentProfile,
  SystemStatusResponse,
} from './types';

const DEFAULT_PROFILE: StudentProfile = {
  name: 'Demo Student',
  university: 'GGSIPU (USICT)',
  degree: 'B.Tech CSE-AI (1st Year)',
  secondary_track: 'BS in Data Science & Applications',
  skills: ['C++', 'Python', 'DSA', 'AI/ML', 'FastAPI'],
  github: 'https://github.com/demo-student',
  resume_url: 'https://example.com/resume.pdf',
};

// Trust Score Color Scale Helper (80-100 Green, 60-79 Amber, 40-59 Orange, 0-39 Red)
function getTrustTheme(score: number) {
  if (score >= 80) {
    return {
      label: 'Safe',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      stroke: '#10B981',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    };
  }
  if (score >= 60) {
    return {
      label: 'Caution',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      stroke: '#F59E0B',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    };
  }
  if (score >= 40) {
    return {
      label: 'Suspicious',
      text: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      stroke: '#F97316',
      badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    };
  }
  return {
    label: 'High Risk',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    stroke: '#EF4444',
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
  };
}

// Circular SVG Trust Gauge
const TrustScoreGauge: React.FC<{ score: number; size?: number }> = ({
  score,
  size = 148,
}) => {
  const theme = getTrustTheme(score);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#1E293B"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={theme.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold tracking-tight text-white">
          {score}
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wider mt-0.5 ${theme.text}`}>
          {theme.label}
        </span>
      </div>
    </div>
  );
};

function Hint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const half = 140; // half of tooltip max width
    setPos({
      top: r.bottom + 8,
      left: Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8),
    });
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="More info"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="cursor-help text-slate-500 hover:text-orange-400 focus:text-orange-400 focus:outline-none ml-1 select-none"
      >
        (?)
      </button>
      {open &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
            className="fixed z-[9999] w-max max-w-[280px] px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-xs font-normal normal-case tracking-normal leading-relaxed text-slate-100 shadow-2xl pointer-events-none"
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}

/* ================= SafeLink Sandbox ================= */
interface LinkSignal {
  label: string;
  detail: string;
  points: number;
  severity: 'Critical' | 'High' | 'Medium';
}
interface LinkAnalysis {
  ok: boolean;
  host: string;
  score: number;
  signals: LinkSignal[];
}

const BRAND_DOMAINS: Record<string, string[]> = {
  google: ['google.com'], zoom: ['zoom.us'], microsoft: ['microsoft.com', 'office.com', 'live.com'],
  hackerrank: ['hackerrank.com'], linkedin: ['linkedin.com'], github: ['github.com', 'github.io'],
  infosys: ['infosys.com'], tcs: ['tcs.com'], wipro: ['wipro.com'], naukri: ['naukri.com'],
  internshala: ['internshala.com'], unstop: ['unstop.com'], gmail: ['gmail.com'], amazon: ['amazon.com', 'amazon.in'],
};
const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'rb.gy', 'cutt.ly', 'is.gd', 'shorturl.at'];
const RISKY_TLDS = ['.xyz', '.top', '.click', '.icu', '.buzz', '.tk', '.ml', '.ga', '.cf', '.gq', '.work', '.rest', '.zip'];
const FREE_BUILDERS = ['blogspot.com', 'wixsite.com', 'weebly.com', '000webhostapp.com'];
const SENSITIVE_WORDS = ['login', 'signin', 'verify', 'secure', 'password', 'otp', 'kyc', 'wallet', 'bank', 'payment'];

function analyzeLink(raw: string): LinkAnalysis {
  const input = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { ok: false, host: '', score: 0, signals: [] };
  }
  const signals: LinkSignal[] = [];
  const add = (label: string, detail: string, points: number, severity: LinkSignal['severity']) =>
    signals.push({ label, detail, points, severity });

  const host = url.hostname.toLowerCase();
  const full = (url.hostname + url.pathname).toLowerCase();
  const isOn = (d: string) => host === d || host.endsWith('.' + d);

  if (/^http:\/\//i.test(input))
    add('Not using HTTPS', 'The connection is not encrypted. Real login or onboarding pages use HTTPS.', 20, 'High');
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host))
    add('Raw IP address instead of a domain', 'Legitimate companies use proper domain names.', 35, 'Critical');
  if (url.username || url.password)
    add('Hidden "@" trick in the link', 'Text before an @ is ignored by browsers, so the real destination differs from what you see.', 30, 'Critical');
  if (host.split('.').some((p) => p.startsWith('xn--')))
    add('Look-alike characters in the domain', 'Punycode domains can imitate real brand names using similar-looking letters.', 30, 'Critical');
  if (SHORTENERS.includes(host))
    add('Shortened link hides the destination', 'You cannot see where it leads until you open it.', 20, 'High');
  if (FREE_BUILDERS.some(isOn))
    add('Company page on a free site builder', 'Real companies host careers and assessments on their own domains.', 20, 'High');
  if (RISKY_TLDS.some((t) => host.endsWith(t)))
    add('Domain ending often abused for scams', 'Cheap domain endings are favoured by throwaway scam sites.', 15, 'Medium');
  for (const [brand, officials] of Object.entries(BRAND_DOMAINS)) {
    if (host.includes(brand) && !officials.some(isOn)) {
      add(`Pretends to be "${brand}"`, `The domain contains "${brand}" but is not an official ${brand} domain (${officials[0]}).`, 35, 'Critical');
      break;
    }
  }
  if ((host.match(/-/g) || []).length >= 3)
    add('Many hyphens in the domain', 'Long hyphenated names are a common look-alike pattern.', 10, 'Medium');
  if (host.split('.').length > 4)
    add('Unusually many subdomains', 'Scammers stack subdomains to bury the real domain.', 10, 'Medium');
  if (SENSITIVE_WORDS.some((w) => full.includes(w)))
    add('Asks you to log in, verify or pay', 'Contains words like login, verify or payment. Real sites use these too, so judge it with the other signals.', 8, 'Medium');

  const score = Math.max(4, Math.min(98, 95 - signals.reduce((s, x) => s + x.points, 0)));
  return { ok: true, host, score, signals };
}

const SEVERITY_STYLE: Record<LinkSignal['severity'], string> = {
  Critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  High: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const SafeLinkSandbox: React.FC = () => {
  const [link, setLink] = useState('');
  const [result, setResult] = useState<LinkAnalysis | null>(null);
  const examples = [
    ['Fake Google Meet', 'http://meet-google-interview.xyz/login/verify'],
    ['Fake HackerRank test', 'https://hackerrank-assessment.blogspot.com/otp-verify'],
    ['Real Google Meet', 'https://meet.google.com/abc-defg-hij'],
  ];
  const theme = result && result.ok ? getTrustTheme(result.score) : null;

  return (
    <div className="p-6 rounded-2xl bg-[#0F1623] border border-slate-800 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white">SafeLink Sandbox</h3>
        <p className="text-xs text-slate-400 mt-1">
          Got a suspicious interview, assessment or onboarding link? Paste it here. We analyze the link itself, and nothing is opened in your browser.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono text-slate-200 focus:outline-none focus:border-orange-500/50"
        />
        <button
          type="button"
          onClick={() => setResult(analyzeLink(link))}
          disabled={!link.trim()}
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-slate-950 text-sm font-semibold"
        >
          Analyze Link
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {examples.map(([label, url]) => (
          <button
            key={label}
            type="button"
            onClick={() => { setLink(url); setResult(analyzeLink(url)); }}
            className="text-xs px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Try: {label}
          </button>
        ))}
      </div>

      {result && !result.ok && (
        <p className="text-xs text-red-300">That does not look like a valid link.</p>
      )}

      {result && result.ok && theme && (
        <div className="space-y-3 pt-2">
          <div className={`flex items-center gap-4 p-4 rounded-xl border ${theme.bg} ${theme.border}`}>
            <TrustScoreGauge score={result.score} size={84} />
            <div className="min-w-0">
              <p className={`text-sm font-bold ${theme.text}`}>{theme.label}</p>
              <p className="text-xs text-slate-300 font-mono break-all">{result.host}</p>
              <p className="text-xs text-slate-400 mt-1">
                {result.signals.length === 0
                  ? 'No red flags in the link itself. Still confirm the sender through an official channel.'
                  : `${result.signals.length} warning sign(s) found in this link.`}
              </p>
            </div>
          </div>

          {result.signals.map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-100">{s.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${SEVERITY_STYLE[s.severity]}`}>{s.severity}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{s.detail}</p>
            </div>
          ))}

          <p className="text-[11px] text-slate-500">
            This checks the link’s structure only. To inspect the page content, paste the URL into the scam scanner above.
          </p>
        </div>
      )}
    </div>
  );
};

/* ================= Tailored Cover Letter ================= */
const CoverLetterGenerator: React.FC<{ profile: StudentProfile; opp: Opportunity }> = ({ profile, opp }) => {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const build = () => {
    const mine = profile.skills.map((s) => s.toLowerCase());
    const matched = opp.skills_matched.filter((s) => mine.includes(s.toLowerCase()));
    const skills = (matched.length ? matched : profile.skills).slice(0, 4);
    const skillText =
      skills.length > 1
        ? `${skills.slice(0, -1).join(', ')} and ${skills[skills.length - 1]}`
        : skills[0] ?? 'my technical skills';
    const kind =
      opp.opportunity_type === 'Hackathon' ? 'hackathon'
      : opp.opportunity_type === 'Scholarship' ? 'scholarship'
      : 'opportunity';

    const para2 = [
      `My strongest skills for this role are ${skillText}.`,
      profile.secondary_track ? `Alongside my degree, I am also pursuing ${profile.secondary_track}.` : '',
      profile.github ? `You can see my projects at ${profile.github}.` : '',
    ].filter(Boolean).join(' ');

    const para3 = [
      'I would welcome the chance to contribute and learn from your team.',
      profile.resume_url ? `My resume is available here: ${profile.resume_url}.` : '',
      'Thank you for your time and consideration.',
    ].filter(Boolean).join(' ');

    setText(
      `Dear ${opp.company} Hiring Team,\n\n` +
      `I am ${profile.name}, a ${profile.degree} student at ${profile.university}, and I am excited to apply for ${opp.title}. ` +
      `This ${kind} fits where I am in my studies and the skills I am building.\n\n` +
      `${para2}\n\n${para3}\n\nSincerely,\n${profile.name}`
    );
    setCopied(false);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={build}
        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
      >
        {text ? 'Regenerate Cover Letter' : 'Generate Cover Letter'}
      </button>

      {text && (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={13}
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-orange-500/50"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">Draft built from your profile and this listing. Personalize it before sending.</p>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(text); setCopied(true); }}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-semibold"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= Find Alumni ================= */
const AlumniFinder: React.FC<{ company: string; university: string }> = ({ company, university }) => {
  const [copied, setCopied] = useState(false);
  const parts = university.split(/[()]/).map((s) => s.trim()).filter(Boolean);
  const terms = parts.length ? parts : [university];
  const query = `site:linkedin.com/in (${terms.map((t) => `"${t}"`).join(' OR ')}) "${company}"`;
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${company} ${terms[0]}`)}`;
  const message =
    `Hi! I'm a ${university} student and I received an internship offer from ${company}. ` +
    `I couldn't verify it online. Could you tell me if this is a genuine opportunity? Thank you!`;

  return (
    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-3">
      <div>
        <p className="text-sm font-semibold text-white">Verify with an Alum</p>
        <p className="text-xs text-slate-300 mt-1">
          This company did not score as fully safe. Find {terms[0]} students or alumni who work there and ask them directly.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={googleUrl} target="_blank" rel="noreferrer"
           className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200">
          Search alumni on Google
        </a>
        <a href={linkedinUrl} target="_blank" rel="noreferrer"
           className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200">
          Search on LinkedIn
        </a>
        <button type="button"
          onClick={() => { navigator.clipboard.writeText(message); setCopied(true); }}
          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-xs font-semibold text-slate-950">
          {copied ? 'Message copied!' : 'Copy intro message'}
        </button>
      </div>
    </div>
  );
};

export function App() {
  // Navigation & UI Drawers
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('internsafe_onboarded') !== 'true';
  });

  // Mode & Backend Connectivity
  const [liveMode, setLiveMode] = useState<boolean>(true);
  const [lightMode, setLightMode] = useState<boolean>(
  () => localStorage.getItem('internsafe_theme') === 'light'
);

useEffect(() => {
  document.documentElement.style.filter = lightMode
    ? 'invert(0.92) hue-rotate(180deg)'
    : '';
  localStorage.setItem('internsafe_theme', lightMode ? 'light' : 'dark');
}, [lightMode]);
  const [apiFallbackBanner, setApiFallbackBanner] = useState<boolean>(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatusResponse | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'warn' | 'info' }[]>([]);
  const addToast = (message: string, type: 'success' | 'warn' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Persisted Student Profile
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('internsafe_profile_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });
  const [newSkillInput, setNewSkillInput] = useState('');

  useEffect(() => {
    localStorage.setItem('internsafe_profile_v2', JSON.stringify(profile));
  }, [profile]);

  // Persisted Saved Opportunities Statuses
  const [savedStatuses, setSavedStatuses] = useState<Record<string, ApplicationStatus>>(() => {
    const saved = localStorage.getItem('internsafe_saved_statuses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { opp_1: 'Saved', opp_5: 'Applied', opp_6: 'Flagged' };
      }
    }
    return { opp_1: 'Saved', opp_5: 'Applied', opp_6: 'Flagged' };
  });

  useEffect(() => {
    localStorage.setItem('internsafe_saved_statuses', JSON.stringify(savedStatuses));
  }, [savedStatuses]);

  // Persisted Reminders
  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const saved = localStorage.getItem('internsafe_reminders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('internsafe_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Persisted Checklist ticks
  const [checkedRules, setCheckedRules] = useState<Record<number, boolean>>(() => {
    const saved = localStorage.getItem('internsafe_checked_rules');
    return saved ? JSON.parse(saved) : { 0: true, 1: true };
  });

  useEffect(() => {
    localStorage.setItem('internsafe_checked_rules', JSON.stringify(checkedRules));
  }, [checkedRules]);

  // Shared Agent Activity Drawer State
  const [activeRunId, setActiveRunId] = useState<string>('run_tf_init01');
  const [activeRunTool, setActiveRunTool] = useState<string>('mcp__tinyfish__search');
  const [activeRunStatus, setActiveRunStatus] = useState<
    'IDLE' | 'EXECUTING' | 'COMPLETED' | 'CANCELLED' | 'RECOVERED'
  >('COMPLETED');
  const [activeRunSteps, setActiveRunSteps] = useState<AgentStep[]>([
    {
      timestamp: new Date().toTimeString().split(' ')[0],
      type: 'init',
      message: 'InternSafe Agent initialized. Ready to inspect portals & scan for scams.',
    },
  ]);
  const [visibleStepCount, setVisibleStepCount] = useState<number>(1);
  const [lastCreditsUsed, setLastCreditsUsed] = useState<number>(0);

  // Typing / Streaming Step Effect
  useEffect(() => {
    setVisibleStepCount(1);
    if (activeRunSteps.length <= 1) return;
    const interval = setInterval(() => {
      setVisibleStepCount((prev) => {
        if (prev >= activeRunSteps.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [activeRunId, activeRunSteps]);

  const pushRunActivity = async (
    run_id: string,
    tool: string,
    status: 'EXECUTING' | 'COMPLETED' | 'CANCELLED' | 'RECOVERED',
    credits = 0,
    explicitSteps?: AgentStep[]
  ) => {
    setActiveRunId(run_id);
    setActiveRunTool(tool);
    setActiveRunStatus(status);
    setLastCreditsUsed(credits);
    if (explicitSteps && explicitSteps.length > 0) {
      setActiveRunSteps(explicitSteps);
    } else {
      const stepRes = await api.getRunSteps(run_id, liveMode);
      setActiveRunSteps(stepRes.data.steps);
    }
  };

  // Initial System Status & Scam Library Load
  const [scamLibrary, setScamLibrary] = useState<{
    patterns: ScamPattern[];
    safe_application_checklist: string[];
  }>({
    patterns: [],
    safe_application_checklist: [
      'Never pay money for an internship offer letter, training, laptop deposit, or certificate.',
      "Check that the recruiter's email domain exactly matches the company's official website.",
      "Cross-check the opening on the company's official Careers page or verified Unstop/LinkedIn page.",
      'Never share OTPs or sensitive government ID numbers before verifying the company and completing a real interview.',
    ],
  });

  useEffect(() => {
    api
      .getStatus(liveMode, () => setApiFallbackBanner(true))
      .then((res) => {
        setSystemStatus(res.data);
        if (!res.fromMock) setApiFallbackBanner(false);
      });
    api.getScamLibrary(liveMode).then((res) => setScamLibrary(res.data));
  }, [liveMode]);

  // ==========================================
  // PAGE 2 STATE: OPPORTUNITIES
  // ==========================================
  const [oppTab, setOppTab] = useState<'feed' | 'kanban' | 'live-search'>('feed');
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
  const [oppLoading, setOppLoading] = useState(false);
  const [oppQuery, setOppQuery] = useState('');
  const [oppType, setOppType] = useState<OpportunityType>('All');
  const [oppLocation, setOppLocation] = useState<LocationType>('All');
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Live Web Search inside Opportunities
  const [liveSearchQuery, setLiveSearchQuery] = useState(
    'AI, Data Science & Open Innovation Hackathons Delhi NCR'
  );
  const [liveSearchResults, setLiveSearchResults] = useState<SearchResultItem[]>([]);
  const [liveSearchLoading, setLiveSearchLoading] = useState(false);

  // Debounced Opportunity Filter Fetch
  useEffect(() => {
    const timer = setTimeout(async () => {
      setOppLoading(true);
      const res = await api.getOpportunities(
        {
          query: oppQuery,
          opportunity_type: oppType,
          location_type: oppLocation,
          skills: profile.skills,
          only_verified: onlyVerified,
        },
        savedStatuses,
        liveMode,
        () => setApiFallbackBanner(true)
      );
      setOpportunities(normalizeOpportunities(res.data.opportunities));
      setOppLoading(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [oppQuery, oppType, oppLocation, onlyVerified, liveMode]);

  const handleStatusChange = async (oppId: string, newStatus: ApplicationStatus) => {
    setSavedStatuses((prev) => ({ ...prev, [oppId]: newStatus }));
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, application_status: newStatus } : o))
    );
    if (selectedOpportunity?.id === oppId) {
      setSelectedOpportunity((prev) =>
        prev ? { ...prev, application_status: newStatus } : null
      );
    }
    await api.trackOpportunity(oppId, newStatus, liveMode);
    addToast(`Updated application status to "${newStatus}"`, 'success');
  };

  const handleToggleReminder = (opp: Opportunity) => {
    const exists = reminders.some((r) => r.opportunity_id === opp.id);
    if (exists) {
      setReminders((prev) => prev.filter((r) => r.opportunity_id !== opp.id));
      addToast(`Removed reminder for ${opp.title}`, 'info');
    } else {
      const item: ReminderItem = {
        id: `rem_${Date.now()}`,
        opportunity_id: opp.id,
        title: opp.title,
        company: opp.company,
        deadline: opp.deadline,
        days_left: opp.days_left,
        created_at: 'Just now',
      };
      setReminders((prev) => [item, ...prev]);
      addToast(`Reminder set! Due in ${opp.days_left} days (${opp.deadline})`, 'success');
    }
  };

  const handleRunLiveSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!liveSearchQuery.trim()) return;
    setLiveSearchLoading(true);
    const res = await api.liveSearch(liveSearchQuery, liveMode, () =>
      setApiFallbackBanner(true)
    );
    setLiveSearchResults(res.data.results);
    await pushRunActivity(res.data.run_id, 'mcp__tinyfish__search', 'COMPLETED', 0);
    setLiveSearchLoading(false);
    addToast('Fetched live web listings via TinyFish Search (0 credits)', 'success');
  };

  // ==========================================
  // PAGE 3 STATE: SCAM DETECTOR
  // ==========================================
  const [scamSourceType, setScamSourceType] = useState<ScamSourceType>('whatsapp_message');
  const [scamContent, setScamContent] = useState(
    'Congratulations! You have been selected directly for our 6-month AI & Data Science Internship at TechNova Global. Stipend is ₹45,000/month with no interview required. To confirm your slot and get your offer letter, please pay a fully refundable laptop security deposit of ₹1,499 via UPI to our HR manager immediately and share your OTP.'
  );
  const [scamUrl, setScamUrl] = useState('');
  const [scamCompany, setScamCompany] = useState('TechNova Global Solutions');
  const [scamEmail, setScamEmail] = useState('hr.technovaglobal@gmail.com');
  const [scamLoading, setScamLoading] = useState(false);
  const [scamResult, setScamResult] = useState<ScamCheckResponse | null>(null);
  useEffect(() => {
  const raw = new URLSearchParams(window.location.search).get('scam');
  if (!raw) return;
  try {
    const bin = atob(raw);
    const json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
    const p = JSON.parse(json);
    setScamResult({
      run_id: 'shared-report',
      trust_score: p.s,
      trust_label: p.l,
      recommended_action: p.a,
      community_matches: p.m ?? 0,
      red_flags: p.f ?? [],
      credits_used: 0,
    });
    setActivePage('scam-detector');
    window.history.replaceState({}, '', window.location.pathname);
  } catch {
    /* ignore a malformed link */
  }
}, []);
  const [expandedFlags, setExpandedFlags] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const loadScamExample = (preset: 'whatsapp_fee' | 'fake_mnc' | 'legit_post') => {
    if (preset === 'whatsapp_fee') {
      setScamSourceType('whatsapp_message');
      setScamCompany('TechNova Global Solutions');
      setScamEmail('hr.technovaglobal@gmail.com');
      setScamUrl('');
      setScamContent(
        'Congratulations! You have been selected directly for our 6-month AI & Data Science Internship at TechNova Global. Stipend is ₹45,000/month with no interview required. To confirm your slot and get your offer letter, please pay a refundable laptop security deposit of ₹1,499 via UPI within 1 hour and share your verification OTP.'
      );
    } else if (preset === 'fake_mnc') {
      setScamSourceType('offer_letter');
      setScamCompany('Infosys / Global Careers India');
      setScamEmail('hr.onboarding.infosys.india@outlook.com');
      setScamUrl('http://infosys-career-onboarding.blogspot.com');
      setScamContent(
        'Dear Candidate, Based on your resume on our portal, you are directly shortlisted for the System Engineer role (₹8.5 LPA) with 100% guaranteed selection and no technical interview. Please deposit ₹3,500 training & certificate fee via UPI today to receive your joining kit.'
      );
    } else {
      setScamSourceType('job_post');
      setScamCompany('SafeStack AI Labs');
      setScamEmail('careers@safestack.ai');
      setScamUrl('https://safestack.ai/careers/ai-intern');
      setScamContent(
        'SafeStack AI Labs is hiring Software & AI Engineering Interns for our Summer 2026 cohort. Requirements: Proficiency in Python, FastAPI, and foundational Data Science. Stipend: ₹20,000/month (Remote). Process includes resume review, a coding round, and an engineering interview. Note: We never charge any registration, training, or laptop fees from candidates.'
      );
    }
  };

  const handleRunScamScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scamContent.trim() && !scamUrl.trim()) {
      addToast('Please paste a message or URL to scan.', 'warn');
      return;
    }
    setScamLoading(true);
    setAgentDrawerOpen(true);
    const res = await api.detectScam(
      {
        source_type: scamSourceType,
        content: scamContent,
        url: scamUrl || undefined,
        company_name: scamCompany || undefined,
        recruiter_email: scamEmail || undefined,
      },
      liveMode,
      () => setApiFallbackBanner(true)
    );
    setScamResult(res.data);
    setExpandedFlags({ 0: true, 1: true });
    await pushRunActivity(
      res.data.run_id,
      'mcp__tinyfish__fetch_content',
      'COMPLETED',
      res.data.credits_used
    );
    setScamLoading(false);
    addToast(`Scan finished: Trust Score ${res.data.trust_score}/100 (${res.data.trust_label})`, 'info');
  };

  // ==========================================
  // PAGE 4 STATE: COMPANY VERIFIER
  // ==========================================
  const [verCompany, setVerCompany] = useState('SafeStack AI Labs');
  const [verWebsite, setVerWebsite] = useState('https://safestack.ai');
  const [verEmail, setVerEmail] = useState('careers@safestack.ai');
  const [verRole, setVerRole] = useState('Software & AI Engineering Intern');
  const [verLoading, setVerLoading] = useState(false);
  const [verResult, setVerResult] = useState<CompanyVerifyResponse | null>(null);

  const handleVerifyCompany = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerLoading(true);
    setAgentDrawerOpen(true);
    const res = await api.verifyCompany(
      {
        company_name: verCompany,
        official_website: verWebsite,
        recruiter_email: verEmail,
        job_title: verRole,
      },
      liveMode,
      () => setApiFallbackBanner(true)
    );
    setVerResult(res.data);
    await pushRunActivity(
      res.data.run_id,
      'mcp__tinyfish__fetch_content',
      'COMPLETED',
      0
    );
    setVerLoading(false);
    addToast(`Verified ${res.data.company_name} (${res.data.trust_score}/100)`, 'success');
  };

  // ==========================================
  // PAGE 5 STATE: COMMUNITY SAFETY LAYER
  // ==========================================
  const [commTab, setCommTab] = useState<'reports' | 'patterns' | 'checklist'>('reports');
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [moderationNotice, setModerationNotice] = useState(
    'Reports are student opinions, not proof.'
  );
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [newRepCompany, setNewRepCompany] = useState('');
  const [newRepContact, setNewRepContact] = useState('');
  const [newRepTag, setNewRepTag] = useState('Received a fee request');
  const [newRepComment, setNewRepComment] = useState('');
  const [expandedPatternIdx, setExpandedPatternIdx] = useState<number | null>(0);

  useEffect(() => {
    api.getCommunityReports(liveMode).then((res) => {
      setReports(res.data.reports);
      setModerationNotice(res.data.moderation_notice);
    });
  }, [liveMode]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepCompany.trim() || !newRepComment.trim()) return;
    const res = await api.createCommunityReport(
      {
        company_name: newRepCompany,
        recruiter_contact: newRepContact || 'Not specified',
        tag: newRepTag,
        comment: newRepComment,
      },
      liveMode
    );
    setReports((prev) => [res.data.report, ...prev]);
    setReportModalOpen(false);
    setNewRepCompany('');
    setNewRepContact('');
    setNewRepComment('');
    addToast('Report published to Community Safety Layer', 'success');
  };

  // ==========================================
  // PAGE 6 STATE: CAMPUS NOTICES
  // ==========================================
  const [noticeUrl, setNoticeUrl] = useState('http://www.ipu.ac.in/notices.php');
  const [noticeBranch, setNoticeBranch] = useState(profile.degree);
  const [notices, setNotices] = useState<CampusNotice[]>([]);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

  const handleFetchNotices = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setNoticeLoading(true);
    setAgentDrawerOpen(true);
    const res = await api.fetchNotices(noticeUrl, noticeBranch, liveMode, () =>
      setApiFallbackBanner(true)
    );
    setNotices(res.data.notices);
    await pushRunActivity(
      res.data.run_id,
      'mcp__tinyfish__fetch_content',
      'COMPLETED',
      res.data.credits_used
    );
    setNoticeLoading(false);
    addToast('Synced latest university notices (0 credits)', 'success');
  };

  useEffect(() => {
    if (activePage === 'campus-notices' && notices.length === 0) {
      handleFetchNotices();
    }
  }, [activePage]);

  // ==========================================
  // PAGE 7 STATE: COMPARE PORTALS
  // ==========================================
  const [batchUrlsText, setBatchUrlsText] = useState(
    [
      'https://unstop.com/hackathons/azinhack-2026-usar-ggsipu-1763832',
      'https://www.sih.gov.in/sih2026ProblemStatements',
      'https://usict.acm.org/techspace-sprint-2026',
      'https://internshala.com/internships/data-science-delhi-ncr',
    ].join('\n')
  );
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchCompareResponse | null>(null);

  const handleRunBatchCompare = async () => {
    const urls = batchUrlsText
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 4);
    if (urls.length < 2) {
      addToast('Please enter at least 2 URLs to compare.', 'warn');
      return;
    }
    setBatchLoading(true);
    setAgentDrawerOpen(true);
    const res = await api.batchCompare(urls, liveMode, () =>
      setApiFallbackBanner(true)
    );
    setBatchResult(res.data);
    await pushRunActivity(
      res.data.batch_id,
      'mcp__tinyfish__batch_create',
      'COMPLETED',
      0
    );
    setBatchLoading(false);
    addToast(`Compared ${urls.length} portals in parallel!`, 'success');
  };

  // ==========================================
  // PAGE 8 STATE: AUTO-APPLY (SMART AUTOFILL)
  // ==========================================
  const [autoFormUrl, setAutoFormUrl] = useState(
    'https://unstop.com/hackathons/azinhack-2026-usar-ggsipu-1763832/register'
  );
  const [simulateTimeout, setSimulateTimeout] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState<{
    run_id: string;
    status: string;
    guardrail_triggered: boolean;
    message?: string;
    steps: AgentStep[];
  } | null>(null);
  const [humanConfirmedSubmit, setHumanConfirmedSubmit] = useState(false);

  const handleRunAutoApply = async () => {
    setAutoLoading(true);
    setHumanConfirmedSubmit(false);
    setAgentDrawerOpen(true);
    const res = await api.autoApply(
      {
        form_url: autoFormUrl,
        student_profile: profile,
        simulate_timeout: simulateTimeout,
      },
      liveMode,
      () => setApiFallbackBanner(true)
    );
    setAutoResult(res.data);
    await pushRunActivity(
      res.data.run_id,
      'mcp__tinyfish__run_web_automation',
      res.data.guardrail_triggered ? 'RECOVERED' : 'COMPLETED',
      0,
      res.data.steps
    );
    setAutoLoading(false);
    if (res.data.guardrail_triggered) {
      addToast('Timeout caught! Blind retry blocked & run recovered via get_run.', 'warn');
    } else {
      addToast('Fields mapped & filled! Ready for your final review.', 'success');
    }
  };

  // ==========================================
  // PAGE 9 STATE: RUN HISTORY
  // ==========================================
  const [runsList, setRunsList] = useState<RunRecord[]>([]);
  const [selectedHistoryRun, setSelectedHistoryRun] = useState<RunRecord | null>(null);
  const [historyTab, setHistoryTab] = useState<'steps' | 'json' | 'prior'>('steps');

  const refreshRunHistory = async () => {
    const res = await api.listRuns(liveMode);
    setRunsList(res.data.runs);
    if (!selectedHistoryRun && res.data.runs.length > 0) {
      setSelectedHistoryRun(res.data.runs[0]);
    }
  };

  useEffect(() => {
    if (activePage === 'run-history') {
      refreshRunHistory();
    }
  }, [activePage, activeRunId]);

  const handleCancelActiveRun = async (runId: string) => {
    await api.cancelRun(runId, liveMode);
    setActiveRunStatus('CANCELLED');
    addToast(`Run ${runId} cancelled via mcp__tinyfish__cancel_run`, 'warn');
    refreshRunHistory();
  };

  // Filtered Closing Soon (days_left <= 7)
  const closingSoonOpps = useMemo(
    () => opportunities.filter((o) => o.days_left <= 7 && o.trust_score >= 60),
    [opportunities]
  );

  // Navigation items
  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
    { id: 'opportunities', label: 'Opportunities', icon: <Compass className="w-4 h-4" /> },
    {
      id: 'scam-detector',
      label: 'Scam Detector',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: 'AI',
    },
    {
      id: 'company-verifier',
      label: 'Company Verifier',
      icon: <Building2 className="w-4 h-4" />,
    },
    { id: 'community', label: 'Community', icon: <Users className="w-4 h-4" /> },
    {
      id: 'campus-notices',
      label: 'Campus Notices',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'compare-portals',
      label: 'Compare Portals',
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
    { id: 'auto-apply', label: 'Auto-Apply', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'run-history', label: 'Run History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 h-16 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-slate-950 transition-all">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  InternSafe
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  GGSIPU Edition
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Top Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* System Status Pill + Popover */}
          <div className="relative">
            <button
              onClick={() => setStatusPopoverOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition"
              title="Shows whether the backend, TinyFish agents and credits are available"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">System Status</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {statusPopoverOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl p-5 z-50 text-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-semibold text-white">
                    {systemStatus?.service || 'InternSafe FastAPI Backend'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <div className="space-y-2.5 mt-3 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Container:</span>
                    <span className="font-mono text-slate-200">
                      {systemStatus?.container || 'Dockerized (FastAPI v2.0)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TinyFish MCP:</span>
                    <span className="text-emerald-400 font-medium">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Free Tier Tools:</span>
                    <span className="font-mono text-slate-200">search, fetch_content</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sponsor Credits:</span>
                    <span className="text-orange-400 font-semibold">
                      {systemStatus?.credits_remaining || '$13.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">API Base URL:</span>
                    <span className="font-mono text-slate-400">{API_BASE_URL}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Demo / Live Mode Toggle */}
          <button
            onClick={() => {
              setLiveMode((prev) => !prev);
              addToast(
                !liveMode
                  ? `Switched to Live FastAPI Mode (${API_BASE_URL})`
                  : 'Switched to Demo Simulation Mode (0 credits)',
                'info'
              );
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium transition"
            title="Toggle between Live FastAPI calls and instant local simulation"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                liveMode ? 'bg-orange-400' : 'bg-slate-400'
              }`}
            />
            <span className="text-slate-200">
              {liveMode ? 'Live API' : 'Demo Mode'}
            </span>
          </button>

          {/* Light / Dark Toggle */}
          <button
            onClick={() => setLightMode((v) => !v)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Toggle light / dark mode"
            aria-label="Toggle light / dark mode"
          >
            {lightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Reminders / Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((v) => !v)}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
              aria-label="Reminders and notifications"
            >
              <Bell className="w-4 h-4" />
              {reminders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                  {reminders.length}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#111827] border border-slate-800 shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <span className="font-semibold text-sm text-white">
                    Deadline Reminders ({reminders.length})
                  </span>
                  {reminders.length > 0 && (
                    <button
                      onClick={() => setReminders([])}
                      className="text-xs text-slate-400 hover:text-red-400"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {reminders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-5 text-center">
                    No reminders set yet. Click the bell icon on any closing-soon opportunity.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800/80 max-h-64 overflow-y-auto mt-2">
                    {reminders.map((rem) => (
                      <div key={rem.id} className="py-2.5 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium text-white">{rem.title}</p>
                          <p className="text-[11px] text-slate-400">
                            {rem.company} • Due {rem.deadline} ({rem.days_left}d left)
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setReminders((prev) => prev.filter((r) => r.id !== rem.id))
                          }
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agent Activity Drawer Trigger */}
          <button
            onClick={() => setAgentDrawerOpen((v) => !v)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 text-xs font-mono text-slate-300 transition"
          >
            <Terminal className="w-3.5 h-3.5 text-orange-400" />
            <span>{activeRunId}</span>
          </button>

          {/* Student Profile Avatar */}
          <button
            onClick={() => setProfileDrawerOpen(true)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition"
          >
            <div className="w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 flex items-center justify-center text-xs font-bold">
              {profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <span className="hidden md:inline text-xs font-medium text-slate-200">
              {profile.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </header>

      {/* FRIENDLY FALLBACK BANNER IF BACKEND UNREACHABLE IN LIVE MODE */}
      {liveMode && apiFallbackBanner && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 lg:px-8 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Local FastAPI server at <code className="font-mono">{API_BASE_URL}</code> wasn&apos;t
              reached — seamlessly serving realistic fallback data so your demo never breaks.
            </span>
          </div>
          <button
            onClick={() => setApiFallbackBanner(false)}
            className="text-amber-300 hover:text-white underline ml-4 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN BODY LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR (Desktop) */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between bg-[#0B101B] border-r border-slate-800/80 p-5">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-orange-500 text-slate-950 font-semibold shadow-lg shadow-orange-500/15'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-orange-500/15 text-orange-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Compact Student Card in Sidebar */}
          <div className="mt-8 p-4 rounded-2xl bg-[#111827]/90 border border-slate-800/90">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Profile
              </span>
              <button
                onClick={() => setProfileDrawerOpen(true)}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium"
              >
                Edit
              </button>
            </div>
            <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
            <p className="text-xs text-slate-400 truncate">{profile.degree}</p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {profile.university}
            </p>
            <div className="flex flex-wrap gap-1 mt-3">
              {profile.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* MOBILE DRAWER NAVIGATION */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-full bg-[#0B101B] border-r border-slate-800 p-5 flex flex-col justify-between z-10">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <span className="font-bold text-lg text-white">InternSafe</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-1.5">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                        activePage === item.id
                          ? 'bg-orange-500 text-slate-950 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* CENTER SCROLLABLE WORKSPACE */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* ==========================================
                PAGE 1: DASHBOARD
               ========================================== */}
            {activePage === 'dashboard' && (
              <div className="space-y-8">
                {/* First-Run Onboarding Hint */}
                {showOnboarding && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/15 via-slate-900 to-slate-900 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-orange-400 text-xs font-semibold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>Hackathon Demo Ready</span>
                      </div>
                      <p className="text-sm text-slate-200">
                        Welcome, <strong>{profile.name}</strong>! Try scanning a suspicious
                        WhatsApp message in the <strong>Scam Detector</strong>, comparing
                        hackathons in parallel, or testing the <strong>Guarded Auto-Apply</strong>{' '}
                        agent.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowOnboarding(false);
                        localStorage.setItem('internsafe_onboarded', 'true');
                      }}
                      className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 shrink-0"
                    >
                      Got it
                    </button>
                  </div>
                )}

                {/* Welcome Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      Welcome back, {profile.name.split(' ')[0]}
                    </h1>
                    <p className="text-slate-400 mt-1">
                      {profile.degree} • {profile.university} • Secondary:{' '}
                      {profile.secondary_track}
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePage('scam-detector')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-orange-500/20"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Scan a Message for Scams</span>
                  </button>
                </div>

                {/* 4 Quick-Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <button
                    onClick={() => setActivePage('scam-detector')}
                    className="text-left p-6 rounded-2xl bg-[#111827] border border-slate-800/90 hover:border-orange-500/50 transition group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-white text-base">
                      Check a message for scams
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Get an instant 0–100 Trust Score & red-flag breakdown.
                    </p>
                  </button>

                  <button
                    onClick={() => setActivePage('opportunities')}
                    className="text-left p-6 rounded-2xl bg-[#111827] border border-slate-800/90 hover:border-emerald-500/50 transition group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                      <Compass className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-white text-base">
                      Find opportunities
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Verified internships, hackathons & scholarships matched to you.
                    </p>
                  </button>

                  <button
                    onClick={() => setActivePage('company-verifier')}
                    className="text-left p-6 rounded-2xl bg-[#111827] border border-slate-800/90 hover:border-blue-500/50 transition group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-white text-base">
                      Verify a company
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Cross-check recruiter email domain & live careers page.
                    </p>
                  </button>

                  <button
                    onClick={() => setActivePage('auto-apply')}
                    className="text-left p-6 rounded-2xl bg-[#111827] border border-slate-800/90 hover:border-purple-500/50 transition group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-white text-base">
                      Auto-fill a form
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Guarded browser automation using your Student Profile Vault.
                    </p>
                  </button>
                </div>

                {/* Two-Column Lower Section: Closing Soon + Stay Safe Checklist */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Closing Soon List (7 cols) */}
                  <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          Closing Soon (Next 7 Days)
                        </h2>
                        <p className="text-xs text-slate-400">
                          Verified opportunities with approaching deadlines
                        </p>
                      </div>
                      <button
                        onClick={() => setActivePage('opportunities')}
                        className="text-xs font-medium text-orange-400 hover:text-orange-300 flex items-center gap-1"
                      >
                        <span>View all</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {closingSoonOpps.map((opp) => {
                        const hasReminder = reminders.some(
                          (r) => r.opportunity_id === opp.id
                        );
                        return (
                          <div
                            key={opp.id}
                            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-white text-sm truncate">
                                  {opp.title}
                                </span>
                                <span
                                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                    opp.days_left <= 3
                                      ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  {opp.days_left} days left
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {opp.company} • {opp.stipend_or_prize}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleToggleReminder(opp)}
                                className={`p-2 rounded-xl border text-xs transition ${
                                  hasReminder
                                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                                    : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:text-white'
                                }`}
                                title={
                                  hasReminder ? 'Remove reminder' : 'Set deadline reminder'
                                }
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOpportunity(opp);
                                  setActivePage('opportunities');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stay Safe Checklist (5 cols) */}
                  <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          Stay Safe Checklist
                        </h2>
                        <p className="text-xs text-slate-400">
                          Golden rules before accepting any offer
                        </p>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="space-y-3">
                      {scamLibrary.safe_application_checklist.map((item, idx) => {
                        const checked = !!checkedRules[idx];
                        return (
                          <label
                            key={idx}
                            onClick={() =>
                              setCheckedRules((prev) => ({ ...prev, [idx]: !prev[idx] }))
                            }
                            className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800/70 cursor-pointer hover:border-slate-700 transition"
                          >
                            <div
                              className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition ${
                                checked
                                  ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                  : 'border-slate-600 bg-slate-800'
                              }`}
                            >
                              {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span
                              className={`text-xs leading-relaxed ${
                                checked ? 'text-slate-300' : 'text-slate-400'
                              }`}
                            >
                              {item}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                PAGE 2: OPPORTUNITIES (UNIFIED FEED + KANBAN + LIVE SEARCH)
               ========================================== */}
            {activePage === 'opportunities' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      Verified Opportunity Feed
                    </h1>
                    <p className="text-sm text-slate-400">
                      Internships, hackathons, scholarships, and open-source programs with
                      pre-computed Trust Scores
                    </p>
                  </div>

                  {/* View Switcher Tabs */}
                  <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                      onClick={() => setOppTab('feed')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        oppTab === 'feed'
                          ? 'bg-orange-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Unified Feed
                    </button>
                    <button
                      onClick={() => setOppTab('kanban')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        oppTab === 'kanban'
                          ? 'bg-orange-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      My Applications
                    </button>
                    <button
                      onClick={() => setOppTab('live-search')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        oppTab === 'live-search'
                          ? 'bg-orange-500 text-slate-950 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live Web Search
                    </button>
                  </div>
                </div>

                {oppTab === 'feed' && (
                  <>
                    {/* Filter Bar */}
                    <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-5 relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={oppQuery}
                            onChange={(e) => setOppQuery(e.target.value)}
                            placeholder="Search by role, company, or skill (C++, Python, AI)..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div className="md:col-span-4">
                          <select
                            value={oppLocation}
                            onChange={(e) => setOppLocation(e.target.value as LocationType)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
                          >
                            <option value="All">All Locations</option>
                            <option value="Remote">Remote</option>
                            <option value="Delhi NCR">Delhi NCR</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>

                        <div className="md:col-span-3 flex items-center">
                          <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-slate-300">
                            <input
                              type="checkbox"
                              checked={onlyVerified}
                              onChange={(e) => setOnlyVerified(e.target.checked)}
                              className="w-4 h-4 rounded accent-orange-500"
                            />
                            <span>Verified Safe Only (80+)</span>
                          </label>
                        </div>
                      </div>

                      {/* Type Chips */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {(
                          [
                            'All',
                            'Internship',
                            'Hackathon',
                            'Scholarship',
                            'Open-Source',
                            'Full-Time',
                          ] as OpportunityType[]
                        ).map((t) => (
                          <button
                            key={t}
                            onClick={() => setOppType(t)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                              oppType === t
                                ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cards Grid */}
                    {oppLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className="h-56 rounded-2xl bg-[#111827] border border-slate-800/80 p-6 animate-pulse"
                          />
                        ))}
                      </div>
                    ) : opportunities.length === 0 ? (
                      <div className="p-12 rounded-2xl bg-[#111827] border border-slate-800 text-center space-y-3">
                        <p className="text-base font-semibold text-white">
                          No matching opportunities found
                        </p>
                        <p className="text-sm text-slate-400">
                          Try clearing your search filter or disabling &quot;Verified Safe Only&quot;.
                        </p>
                        <button
                          onClick={() => {
                            setOppQuery('');
                            setOppType('All');
                            setOppLocation('All');
                            setOnlyVerified(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-orange-500 text-slate-950 font-semibold text-xs"
                        >
                          Reset Filters
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {opportunities.map((opp) => {
                          const trustTheme = getTrustTheme(opp.trust_score);
                          return (
                            <div
                              key={opp.id}
                              className="p-6 rounded-2xl bg-[#111827] border border-slate-800/90 hover:border-slate-700 transition flex flex-col justify-between gap-5"
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                        {opp.opportunity_type}
                                      </span>
                                      <span
                                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${trustTheme.badge}`}
                                      >
                                        Trust {opp.trust_score}/100 • {trustTheme.label}
                                      </span>
                                    </div>
                                    <h3 className="text-base font-bold text-white pt-1">
                                      {opp.title}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                      {opp.company} • {opp.location}
                                    </p>
                                  </div>

                                  {/* Match Score Ring */}
                                  <div className="shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                                    <span className="text-xs font-bold text-emerald-400">
                                      {opp.match_score}%
                                    </span>
                                    <span className="text-[10px] text-slate-400">Match</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-1">
                                  <span className="font-semibold text-slate-200">
                                    {opp.stipend_or_prize}
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      opp.days_left <= 3
                                        ? 'text-red-400 font-semibold'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {opp.days_left} days left ({opp.deadline})
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {opp.skills_matched.map((skill) => (
                                    <span
                                      key={skill}
                                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleStatusChange(
                                        opp.id,
                                        opp.application_status === 'Saved'
                                          ? 'Not Applied'
                                          : 'Saved'
                                      )
                                    }
                                    className={`p-2 rounded-xl border transition ${
                                      opp.application_status === 'Saved'
                                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                    title="Bookmark opportunity"
                                  >
                                    <Bookmark className="w-4 h-4" />
                                  </button>

                                  <select
                                    value={opp.application_status}
                                    onChange={(e) =>
                                      handleStatusChange(
                                        opp.id,
                                        e.target.value as ApplicationStatus
                                      )
                                    }
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                                  >
                                    <option value="Not Applied">Status: Not Applied</option>
                                    <option value="Saved">Saved</option>
                                    <option value="Applied">Applied</option>
                                    <option value="Interviewing">Interviewing</option>
                                    <option value="Offer">Offer</option>
                                    <option value="Flagged">Flagged</option>
                                  </select>
                                </div>

                                <button
                                  onClick={() => setSelectedOpportunity(opp)}
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition"
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* KANBAN MY APPLICATIONS TAB */}
                {oppTab === 'kanban' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {(
                      ['Saved', 'Applied', 'Interviewing', 'Offer', 'Flagged'] as ApplicationStatus[]
                    ).map((colStatus) => {
                      const items = INITIAL_OPPORTUNITIES.map((o) => ({
                        ...o,
                        application_status: savedStatuses[o.id] || o.application_status,
                      })).filter((o) => o.application_status === colStatus);

                      return (
                        <div
                          key={colStatus}
                          className="p-4 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-3"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                              {colStatus}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                              {items.length}
                            </span>
                          </div>
                          {items.length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center">
                              No items in {colStatus}
                            </p>
                          ) : (
                            items.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => setSelectedOpportunity(item)}
                                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer space-y-1.5"
                              >
                                <p className="text-xs font-semibold text-white">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-slate-400">{item.company}</p>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[10px] text-orange-400">
                                    Due {item.deadline}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Trust {item.trust_score}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* LIVE WEB SEARCH TAB */}
                {oppTab === 'live-search' && (
                  <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-5">
                    <div>
                      <h2 className="text-base font-semibold text-white">
                        Live Opportunity Web Search (mcp__tinyfish__search)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Queries live portals for fresh hackathons and internships (Free Tier: 0
                        credits)
                      </p>
                    </div>
                    <form onSubmit={handleRunLiveSearch} className="flex gap-3">
                      <input
                        type="text"
                        value={liveSearchQuery}
                        onChange={(e) => setLiveSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-orange-500"
                        placeholder="e.g., AI & Data Science hackathons Delhi NCR..."
                      />
                      <button
                        type="submit"
                        disabled={liveSearchLoading}
                        className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm shrink-0"
                      >
                        {liveSearchLoading ? 'Searching...' : 'Search Web'}
                      </button>
                    </form>

                    {liveSearchResults.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {liveSearchResults.map((r) => (
                          <div
                            key={r.id}
                            className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-white">
                                  {r.title}
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
                                  {r.platform}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">{r.snippet}</p>
                              <p className="text-[11px] font-mono text-slate-500">{r.url}</p>
                            </div>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 shrink-0 self-start sm:self-center"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ==========================================
                PAGE 3: SCAM DETECTOR (HERO FEATURE)
               ========================================== */}
            {activePage === 'scam-detector' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                      AI Scam Detector • TinyFish Fetch + Heuristic Engine
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                      Verify Any Internship Message or Offer Letter
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      Detects upfront UPI/training fee traps, fake recruiter domains, and
                      OTP/identity harvesting in seconds.
                    </p>
                  </div>

                  {/* 3 One-Click Demo Presets */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => loadScamExample('whatsapp_fee')}
                      className="px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 text-xs font-medium transition"
                    >
                      Try: WhatsApp Fee Scam
                    </button>
                    <button
                      onClick={() => loadScamExample('fake_mnc')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-medium transition"
                    >
                      Try: Fake MNC Offer
                    </button>
                    <button
                      onClick={() => loadScamExample('legit_post')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-medium transition"
                    >
                      Try: Legit Internship
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Input Form Panel (7 cols) */}
                  <form
                    onSubmit={handleRunScamScan}
                    className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-5"
                  >
                    {/* Source Type Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
                      {(
                        [
                          { id: 'whatsapp_message', label: 'WhatsApp / Chat' },
                          { id: 'offer_letter', label: 'Offer Letter' },
                          { id: 'job_post', label: 'Job Post' },
                          { id: 'company_url', label: 'Company URL' },
                        ] as { id: ScamSourceType; label: string }[]
                      ).map((tab) => (
                        <button
                          type="button"
                          key={tab.id}
                          onClick={() => setScamSourceType(tab.id)}
                          className={`py-2 px-2.5 rounded-lg text-xs font-medium transition ${
                            scamSourceType === tab.id
                              ? 'bg-orange-500 text-slate-950 font-semibold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-2">
                        Paste Message, Offer Letter Text, or Job Description
                      </label>
                      <textarea
                        rows={5}
                        value={scamContent}
                        onChange={(e) => setScamContent(e.target.value)}
                        placeholder="Paste the recruiter's WhatsApp/Telegram message, email text, or internship offer details here..."
                        className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          Company Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={scamCompany}
                          onChange={(e) => setScamCompany(e.target.value)}
                          placeholder="e.g., TechNova Global"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          Recruiter Email (Optional)
                        </label>
                        <input
                          type="text"
                          value={scamEmail}
                          onChange={(e) => setScamEmail(e.target.value)}
                          placeholder="e.g., hr@gmail.com"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        Target URL to Inspect with TinyFish Fetch (Optional)
                      </label>
                      <input
                        type="text"
                        value={scamUrl}
                        onChange={(e) => setScamUrl(e.target.value)}
                        placeholder="https://example-internship-portal.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-400">
                        Uses <code className="font-mono text-slate-300">fetch_content</code> •
                        Free: 0 credits
                      </span>
                      <button
                        type="submit"
                        disabled={scamLoading}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-orange-500/20"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>{scamLoading ? 'Analyzing...' : 'Scan for Scam Signals'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Result Panel (5 cols) */}
                  <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-[#111827] border border-slate-800/90 flex flex-col justify-between space-y-6">
                    {!scamResult ? (
                      <div className="my-auto text-center py-12 space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-orange-400">
                          <ShieldCheck className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-semibold text-white">
                          Ready to Analyze
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          Click &quot;Scan for Scam Signals&quot; or pick one of the 3 preset
                          examples above to see the Trust Score gauge and red-flag breakdown.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                          <div>
                            <span className="text-xs font-mono text-slate-400">
                              {scamResult.run_id}
                            </span>
                            <h3 className="text-lg font-bold text-white">
                              Trust Assessment
                            </h3>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                            Free: {scamResult.credits_used} credits
                          </span>
                        </div>

                        {/* Circular Gauge */}
                        <div className="flex flex-col items-center justify-center py-2">
                          <TrustScoreGauge score={scamResult.trust_score} />
                        </div>

                        {/* Recommended Action Box */}
                        <div
                          className={`p-4 rounded-xl border ${
                            getTrustTheme(scamResult.trust_score).bg
                          } ${getTrustTheme(scamResult.trust_score).border}`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                            Recommended Action
                          </p>
                          <p className="text-sm font-medium text-white">
                            {scamResult.recommended_action}
                          </p>
                        </div>

                        {/* Export / Share */}
                        <div className="flex gap-2 pt-1 print:hidden">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-200 transition-colors"
                          >
                            Download PDF Report
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const payload = {
                                s: scamResult.trust_score,
                                l: scamResult.trust_label,
                                a: scamResult.recommended_action,
                                m: scamResult.community_matches,
                                f: scamResult.red_flags,
                              };
                              const bytes = new TextEncoder().encode(JSON.stringify(payload));
                              const encoded = btoa(String.fromCharCode(...bytes));
                              const shareUrl = `${window.location.origin}/?scam=${encodeURIComponent(encoded)}`;
                              navigator.clipboard.writeText(shareUrl);
                              addToast('Shareable warning link copied to clipboard!', 'success');
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-200 transition-colors"
                          >
                            Copy Shareable Link
                          </button>
                        </div>

                        {/* Community Matches Callout */}
                        {scamResult.community_matches > 0 && (
                          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                            <span className="text-xs text-amber-200">
                              <strong>{scamResult.community_matches} student(s)</strong> reported
                              concerns about this company.
                            </span>
                            <button
                              onClick={() => setActivePage('community')}
                              className="text-xs font-semibold text-amber-300 hover:underline shrink-0"
                            >
                              View Reports →
                            </button>
                          </div>
                        )}

                        {/* Expandable Red Flags List */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Detected Signals ({scamResult.red_flags.length})
                            <Hint text="Each signal is a scam warning sign found in the text. Every one lowers the trust score. Click a card to see why it matters." />
                          </h4>
                          {scamResult.red_flags.map((rf, idx) => {
                            const isOpen = !!expandedFlags[idx];
                            const sevColor =
                              rf.severity === 'Critical'
                                ? 'bg-red-500/15 text-red-300 border-red-500/30'
                                : rf.severity === 'High'
                                ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                                : rf.severity === 'Medium'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

                            return (
                              <div
                                key={idx}
                                className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedFlags((prev) => ({
                                      ...prev,
                                      [idx]: !prev[idx],
                                    }))
                                  }
                                  className="w-full p-3.5 flex items-center justify-between gap-2 text-left"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${sevColor}`}
                                    >
                                      {rf.severity}
                                    </span>
                                    <span className="text-xs font-semibold text-white truncate">
                                      {rf.flag}
                                    </span>
                                  </div>
                                  {isOpen ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                </button>
                                {isOpen && (
                                  <div className="px-3.5 pb-3.5 text-xs text-slate-300 border-t border-slate-800/60 pt-2.5">
                                    {rf.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                PAGE 4: COMPANY & RECRUITER VERIFIER
               ========================================== */}
            {activePage === 'scam-detector' && (
              <div className="mt-8">
                <SafeLinkSandbox />
              </div>
            )}
            {activePage === 'company-verifier' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Company & Recruiter Domain Verifier
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Checks whether the recruiter&apos;s email domain matches the official
                    company website and verifies live career listings.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <form
                    onSubmit={handleVerifyCompany}
                    className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-5"
                  >
                    <div className="flex gap-2 pb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVerCompany('SafeStack AI Labs');
                          setVerWebsite('https://safestack.ai');
                          setVerEmail('careers@safestack.ai');
                          setVerRole('Software & AI Engineering Intern');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
                      >
                        Preset: Verified Startup
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVerCompany('TechNova Global Solutions');
                          setVerWebsite('https://technovaglobal.com');
                          setVerEmail('hr.technovaglobal@gmail.com');
                          setVerRole('AI Trainee');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium"
                      >
                        Preset: Spoofed Gmail Recruiter
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Company Name
                        <Hint text="The company the recruiter claims to represent." />
                      </label>
                      <input
                        type="text"
                        required
                        value={verCompany}
                        onChange={(e) => setVerCompany(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Official Website URL
                        <Hint text="The company's real website, found yourself (e.g. via Google), not a link the recruiter sent." />
                      </label>
                      <input
                        type="text"
                        required
                        value={verWebsite}
                        onChange={(e) => setVerWebsite(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Recruiter Email Address
                        <Hint text="The address the recruiter contacted you from. Its domain should match the company's official website." />
                      </label>
                      <input
                        type="email"
                        required
                        value={verEmail}
                        onChange={(e) => setVerEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Job / Internship Title (Optional)
                        <Hint text="Used to check whether this exact role is listed on the company's official careers page." />
                      </label>
                      <input
                        type="text"
                        value={verRole}
                        onChange={(e) => setVerRole(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verLoading}
                      className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm transition"
                    >
                      {verLoading ? 'Verifying Domain & Portal...' : 'Verify Company & Recruiter'}
                    </button>
                  </form>

                  <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-[#111827] border border-slate-800/90">
                    {!verResult ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-2">
                        <Building2 className="w-8 h-8 text-slate-500" />
                        <p className="text-sm font-semibold text-white">
                          No Company Verified Yet
                        </p>
                        <p className="text-xs text-slate-400 max-w-xs">
                          Submit a company website and recruiter email on the left to inspect
                          domain alignment and SSL/careers status.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-mono text-slate-400">
                              {verResult.run_id}
                            </span>
                            <h3 className="text-lg font-bold text-white">
                              {verResult.company_name}
                            </h3>
                          </div>
                          <TrustScoreGauge score={verResult.trust_score} size={96} />
                        </div>

                        {/* Verdict Summary Banner */}
                        <div
                          className={`p-4 rounded-xl border text-xs leading-relaxed ${
                            getTrustTheme(verResult.trust_score).bg
                          } ${getTrustTheme(verResult.trust_score).border} text-slate-100`}
                        >
                          {verResult.summary}
                        </div>

                        {verResult.trust_score < 80 && (
                          <AlumniFinder company={verResult.company_name} university={profile.university} />
                        )}

                        {/* Checklist Rows */}
                        <div className="space-y-2.5">
                          {[
                            {
                              label: 'Recruiter email domain matches official website',
                              ok: verResult.domain_match,
                              hint: 'Domain spoofing is when scammers use look-alike emails (e.g. hr@infosys-careers.com instead of @infosys.com). We compare the recruiter’s email domain with the company’s official website.',
                            },
                            {
                              label: 'Role listed on official careers page',
                              ok: verResult.careers_page_listing_found,
                              hint: 'Real openings are almost always listed on the company’s own careers page. If it isn’t there, ask the recruiter why.',
                            },
                            {
                              label: 'LinkedIn company presence verified',
                              ok: verResult.company_profile.linkedin_verified,
                              hint: 'A genuine company usually has an established LinkedIn page with employees and history.',
                            },
                            {
                              label: 'HTTPS / Active SSL certificate',
                              ok: verResult.company_profile.ssl_active,
                              hint: 'HTTPS means the connection is encrypted and the certificate is valid. Scam sites often lack it, but having it alone does not prove a company is safe.',
                            },
                          ].map((row, i) => (
                            <div
                              key={i}
                              className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                            >
                              <span className="text-xs text-slate-200">
                                {row.label}
                                <Hint text={row.hint} />
                              </span>
                              {row.ok ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                                  <CheckCircle2 className="w-4 h-4" /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400">
                                  <XCircle className="w-4 h-4" /> Failed
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                          <span>
                            Community Concerns: <strong>{verResult.student_reports_count}</strong>
                          </span>
                          <button
                            onClick={() => setActivePage('community')}
                            className="text-orange-400 hover:underline font-medium"
                          >
                            View Community Safety Layer →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                PAGE 5: COMMUNITY SAFETY LAYER
               ========================================== */}
            {activePage === 'community' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      Community Safety Layer
                    </h1>
                    <p className="text-sm text-slate-400">
                      Crowdsourced student experiences, scam pattern scripts, and safe
                      application guidelines
                    </p>
                  </div>
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-xs shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Report Something</span>
                  </button>
                </div>

                {/* Moderation Disclaimer Banner */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Moderation Notice:</strong> Reports are student opinions, not proof.
                    Concerns are displayed as <span className="text-amber-300">User-reported concern</span>.
                  </span>
                </div>

                {/* Sub-tabs */}
                <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800">
                  <button
                    onClick={() => setCommTab('reports')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium ${
                      commTab === 'reports'
                        ? 'bg-orange-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Student Reports ({reports.length})
                  </button>
                  <button
                    onClick={() => setCommTab('patterns')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium ${
                      commTab === 'patterns'
                        ? 'bg-orange-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Scam Pattern Library
                  </button>
                  <button
                    onClick={() => setCommTab('checklist')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium ${
                      commTab === 'checklist'
                        ? 'bg-orange-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Safe Application Checklist
                  </button>
                </div>

                {commTab === 'reports' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reports.map((rep) => {
                      const isVerified = rep.label === 'Verified Legitimate';
                      return (
                        <div
                          key={rep.id}
                          className="p-6 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-white text-base">
                                {rep.company_name}
                              </h3>
                              <p className="text-xs font-mono text-slate-400">
                                {rep.recruiter_contact}
                              </p>
                            </div>
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                                isVerified
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              {isVerified ? 'Verified by students' : 'User-reported concern'}
                            </span>
                          </div>

                          <p className="text-sm text-slate-200 leading-relaxed">
                            &ldquo;{rep.comment}&rdquo;
                          </p>

                          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-slate-300">
                              {rep.tag}
                            </span>
                            <span>
                              {rep.timestamp} • ▲ {rep.upvotes} helpful
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {commTab === 'patterns' && (
                  <div className="space-y-4">
                    {scamLibrary.patterns.map((pat, i) => {
                      const open = expandedPatternIdx === i;
                      return (
                        <div
                          key={i}
                          className="p-6 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-4"
                        >
                          <button
                            onClick={() => setExpandedPatternIdx(open ? null : i)}
                            className="w-full flex items-center justify-between text-left"
                          >
                            <div>
                              <span className="text-xs text-orange-400 font-medium">
                                Channel: {pat.channel}
                              </span>
                              <h3 className="text-base font-bold text-white mt-0.5">
                                {pat.title}
                              </h3>
                            </div>
                            {open ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          {open && (
                            <div className="space-y-4 pt-2 border-t border-slate-800">
                              <blockquote className="p-4 rounded-xl bg-slate-900 border-l-4 border-orange-500 text-xs text-slate-200 italic">
                                {pat.example_script}
                              </blockquote>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                                  Why It&apos;s Fake
                                </p>
                                <p className="text-sm text-slate-300 mt-1">
                                  {pat.why_its_fake}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {commTab === 'checklist' && (
                  <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-3">
                    {scamLibrary.safe_application_checklist.map((item, idx) => {
                      const checked = !!checkedRules[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() =>
                            setCheckedRules((prev) => ({ ...prev, [idx]: !prev[idx] }))
                          }
                          className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3.5 cursor-pointer"
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                              checked
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-slate-600'
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-sm text-slate-200">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==========================================
                PAGE 6: CAMPUS NOTICES
               ========================================== */}
            {activePage === 'campus-notices' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      GGSIPU & Campus Notice Radar
                    </h1>
                    <p className="text-sm text-slate-400">
                      Extracts clean Markdown from university notice portals via{' '}
                      <code className="font-mono text-slate-300">mcp__tinyfish__fetch_content</code>{' '}
                      (Free: 0 credits)
                    </p>
                  </div>
                  <button
                    onClick={() => handleFetchNotices()}
                    disabled={noticeLoading}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm shrink-0"
                  >
                    {noticeLoading ? 'Syncing Portal...' : 'Fetch Latest Notices'}
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800/90 grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-7">
                    <label className="block text-xs text-slate-400 mb-1">
                      Target Notice Portal URL
                    </label>
                    <input
                      type="text"
                      value={noticeUrl}
                      onChange={(e) => setNoticeUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-xs text-slate-400 mb-1">
                      Branch / Semester Filter
                    </label>
                    <input
                      type="text"
                      value={noticeBranch}
                      onChange={(e) => setNoticeBranch(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {notices.map((not) => {
                    const isOpen = expandedNoticeId === not.id;
                    const urgBadge =
                      not.urgency === 'High'
                        ? 'bg-red-500/15 text-red-300 border-red-500/30'
                        : not.urgency === 'Medium'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30';

                    return (
                      <div
                        key={not.id}
                        className="p-6 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${urgBadge}`}
                              >
                                {not.urgency} Priority
                              </span>
                              <span className="text-xs text-slate-400">{not.category}</span>
                              <span className="text-xs text-slate-500">• {not.date}</span>
                            </div>
                            <h3 className="text-base font-bold text-white mt-1.5">
                              {not.title}
                            </h3>
                          </div>
                          <button
                            onClick={() =>
                              setExpandedNoticeId(isOpen ? null : not.id)
                            }
                            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white shrink-0"
                          >
                            {isOpen ? 'Hide Markdown' : 'Markdown Preview'}
                          </button>
                        </div>

                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                          {not.summary.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>

                        {isOpen && (
                          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto">
                            {not.markdown_preview}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==========================================
                PAGE 7: COMPARE PORTALS (BATCH AUTOMATION)
               ========================================== */}
            {activePage === 'compare-portals' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      Parallel Multi-Portal Comparator
                    </h1>
                    <p className="text-sm text-slate-400">
                      Queues up to 4 hackathon or internship URLs in parallel via{' '}
                      <code className="font-mono text-slate-300">mcp__tinyfish__batch_create</code>
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setBatchUrlsText(
                        [
                          'https://unstop.com/hackathons/azinhack-2026-usar-ggsipu-1763832',
                          'https://www.sih.gov.in/sih2026ProblemStatements',
                          'https://usict.acm.org/techspace-sprint-2026',
                          'https://internshala.com/internships/data-science-delhi-ncr',
                        ].join('\n')
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                  >
                    Use Sample Links
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-4">
                  <label className="block text-xs font-medium text-slate-300">
                    Enter 2 to 4 Opportunity URLs (One per line)
                  </label>
                  <textarea
                    rows={4}
                    value={batchUrlsText}
                    onChange={(e) => setBatchUrlsText(e.target.value)}
                    className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleRunBatchCompare}
                      disabled={batchLoading}
                      className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm"
                    >
                      {batchLoading
                        ? 'Running Parallel Workers...'
                        : 'Compare Eligibility & Perks'}
                    </button>
                  </div>
                </div>

                {/* Comparison Matrix Table */}
                {batchResult && (
                  <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">
                        Side-by-Side Comparison Matrix ({batchResult.urls_processed} Portals)
                      </h3>
                      <span className="text-xs font-mono text-emerald-400">
                        batch_id: {batchResult.batch_id}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                            <th className="py-3 pr-4 sticky left-0 bg-[#111827]">
                              Event / Role
                            </th>
                            <th className="py-3 px-4">Deadline</th>
                            <th className="py-3 px-4">Eligibility</th>
                            <th className="py-3 px-4">Team Size</th>
                            <th className="py-3 px-4">Prize / Stipend</th>
                            <th className="py-3 pl-4">Sponsors & Trust</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 text-xs sm:text-sm">
                          {batchResult.comparison_matrix.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/50">
                              <td className="py-3.5 pr-4 font-semibold text-white sticky left-0 bg-[#111827]">
                                {row.event_name}
                              </td>
                              <td className="py-3.5 px-4 text-orange-300 font-medium">
                                {row.deadline}
                              </td>
                              <td className="py-3.5 px-4 text-slate-300">
                                {row.eligibility}
                              </td>
                              <td className="py-3.5 px-4 text-slate-300">{row.team_size}</td>
                              <td className="py-3.5 px-4 text-emerald-400 font-medium">
                                {row.prize_pool}
                              </td>
                              <td className="py-3.5 pl-4 text-slate-300">{row.sponsors}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==========================================
                PAGE 8: AUTO-APPLY (GUARDED SMART AUTOFILL)
               ========================================== */}
            {activePage === 'auto-apply' && (
              <div className="space-y-8">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                    Guarded Browser Agent • mcp__tinyfish__run_web_automation
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    Smart Auto-Fill with No-Blind-Retry Guardrail
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Populates multi-step registration forms using your Student Profile Vault and
                    always pauses before final submission for your confirmation.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-6">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-2">
                        Target Registration / Application Form URL
                      </label>
                      <input
                        type="text"
                        value={autoFormUrl}
                        onChange={(e) => setAutoFormUrl(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono"
                      />
                    </div>

                    {/* Field Mapping Plan */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Field Mapping Plan (From Profile Vault)
                        </span>
                        <button
                          onClick={() => setProfileDrawerOpen(true)}
                          className="text-xs text-orange-400 hover:underline"
                        >
                          Edit Profile
                        </button>
                      </div>

                      <div className="divide-y divide-slate-800 rounded-xl bg-slate-900 border border-slate-800">
                        {[
                          { label: 'Full Name', value: profile.name },
                          { label: 'University', value: profile.university },
                          { label: 'Degree & Year', value: profile.degree },
                          { label: 'Core Skills', value: profile.skills.join(', ') },
                          { label: 'GitHub URL', value: profile.github },
                          { label: 'Resume Link', value: profile.resume_url },
                        ].map((field, i) => {
                          const isFilled = Boolean(autoResult);
                          return (
                            <div
                              key={i}
                              className="px-4 py-2.5 flex items-center justify-between gap-4 text-xs"
                            >
                              <span className="text-slate-400 font-medium">
                                {field.label}
                              </span>
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-slate-200 truncate max-w-[220px]">
                                  {field.value}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    isFilled
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {isFilled ? 'Filled' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Simulate Timeout Toggle */}
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-white">
                          Simulate HTTP Timeout & Recovery (Judge Demo)
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Demonstrates blocking blind retries on timeout and recovering the live
                          run via <code className="font-mono">get_run()</code>
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={simulateTimeout}
                        onChange={(e) => setSimulateTimeout(e.target.checked)}
                        className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={handleRunAutoApply}
                      disabled={autoLoading}
                      className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-orange-500/20"
                    >
                      {autoLoading
                        ? 'Agent Populating Form...'
                        : 'Launch Guarded Auto-Fill Agent'}
                    </button>
                  </div>

                  {/* Guarded Submit Confirmation Panel (5 cols) */}
                  <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-[#111827] border border-slate-800/90 flex flex-col justify-between space-y-5">
                    {!autoResult ? (
                      <div className="my-auto text-center py-12 space-y-3">
                        <Lock className="w-8 h-8 text-orange-400 mx-auto" />
                        <h3 className="text-base font-semibold text-white">
                          Guarded Submit Flow
                        </h3>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          InternSafe never submits an application blindly. The browser agent
                          populates all fields and pauses at the final step for your review.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {autoResult.guardrail_triggered && (
                          <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-1.5">
                            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                              <AlertTriangle className="w-4 h-4" />
                              <span>No-Blind-Retry Guardrail Triggered</span>
                            </div>
                            <p className="text-xs text-amber-100 leading-relaxed">
                              An HTTP connection timeout occurred while the browser agent was
                              executing. Instead of blind-retrying (which wastes your $13
                              TinyFish credits), InternSafe polled{' '}
                              <code className="font-mono">get_run({autoResult.run_id})</code>{' '}
                              and recovered the completed form session!
                            </p>
                          </div>
                        )}

                        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                              Review Before Submit
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {autoResult.run_id}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-white">
                            All 6 profile fields are filled on the target portal and paused at
                            the confirmation step. Nothing has been submitted automatically.
                          </p>

                          {!humanConfirmedSubmit ? (
                            <div className="pt-2 flex gap-3">
                              <button
                                onClick={() => {
                                  setHumanConfirmedSubmit(true);
                                  addToast(
                                    'Application confirmed & marked as Applied!',
                                    'success'
                                  );
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs"
                              >
                                Approve & Confirm Submit
                              </button>
                              <button
                                onClick={() => setAutoResult(null)}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                              >
                                Discard
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approved by student! Logged in My Applications.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                PAGE 9: RUN HISTORY & INSPECTOR
               ========================================== */}
            {activePage === 'run-history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      TinyFish Agent Run History
                    </h1>
                    <p className="text-sm text-slate-400">
                      Inspect step logs (<code className="font-mono">get_steps</code>), raw
                      JSON output (<code className="font-mono">get_run</code>), or cancel active
                      jobs (<code className="font-mono">cancel_run</code>)
                    </p>
                  </div>
                  <button
                    onClick={refreshRunHistory}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left List of Runs (5 cols) */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Prior Runs ({runsList.length})
                    </h3>
                    {runsList.length === 0 ? (
                      <p className="text-xs text-slate-400 py-8 text-center">
                        Trigger any scan, search, or auto-apply action to populate run history.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[420px] overflow-y-auto">
                        {runsList.map((r) => (
                          <button
                            key={r.run_id}
                            onClick={() => setSelectedHistoryRun(r)}
                            className={`w-full text-left p-3.5 rounded-xl border transition ${
                              selectedHistoryRun?.run_id === r.run_id
                                ? 'bg-orange-500/10 border-orange-500/40'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-semibold text-white">
                                {r.run_id}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400">
                                {r.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1 truncate">{r.tool}</p>
                            <p className="text-[11px] text-slate-500 truncate">{r.target}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Run Detail Inspector (7 cols) */}
                  <div className="lg:col-span-7 p-6 rounded-2xl bg-[#111827] border border-slate-800/90 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex gap-2">
                        {(['steps', 'json'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setHistoryTab(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                              historyTab === t
                                ? 'bg-orange-500 text-slate-950 font-semibold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {t === 'steps' ? 'Step Stream (get_steps)' : 'Raw JSON (get_run)'}
                          </button>
                        ))}
                      </div>

                      {selectedHistoryRun?.status === 'EXECUTING' && (
                        <button
                          onClick={() => handleCancelActiveRun(selectedHistoryRun.run_id)}
                          className="px-3 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold"
                        >
                          Cancel Run
                        </button>
                      )}
                    </div>

                    {!selectedHistoryRun ? (
                      <p className="text-xs text-slate-400 py-12 text-center">
                        Select a run on the left to inspect its execution steps.
                      </p>
                    ) : historyTab === 'steps' ? (
                      <div className="space-y-2.5 font-mono text-xs">
                        {selectedHistoryRun.steps.map((st, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3"
                          >
                            <span className="text-slate-500 shrink-0">[{st.timestamp}]</span>
                            <span className="text-orange-400 uppercase shrink-0">
                              {st.type}
                            </span>
                            <span className="text-slate-200">{st.message}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-96">
                        {JSON.stringify(selectedHistoryRun, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER */}
            <footer className="pt-8 pb-4 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <span>Powered by TinyFish Web Agents — Dockerized FastAPI</span>
              <span>Built for AZINHACK ’26 • GGSIPU East Delhi Campus</span>
            </footer>
          </div>
        </main>
      </div>

      {/* ==========================================
          SHARED COLLAPSIBLE AGENT ACTIVITY DRAWER
         ========================================== */}
      <div className="fixed bottom-4 right-4 z-40">
        {!agentDrawerOpen ? (
          <button
            onClick={() => setAgentDrawerOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#111827] border border-slate-700 hover:border-orange-500 shadow-2xl text-xs font-mono text-slate-200 transition"
          >
            <Terminal className="w-4 h-4 text-orange-400" />
            <span>Agent Activity: {activeRunId}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px]">
              {activeRunStatus}
            </span>
          </button>
        ) : (
          <div className="w-[92vw] sm:w-[460px] rounded-2xl bg-[#0F1623] border border-slate-700 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold text-white">Agent Activity</span>
                <span className="font-mono text-xs text-slate-400">{activeRunId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {activeRunStatus}
                </span>
                <button
                  onClick={() => setAgentDrawerOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 max-h-64 overflow-y-auto space-y-2.5 font-mono text-[13px]">
              {activeRunSteps.slice(0, visibleStepCount).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-slate-500 shrink-0">[{step.timestamp}]</span>
                  <span
                    className={
                      step.type === 'error'
                        ? 'text-red-400'
                        : step.type === 'guardrail'
                        ? 'text-amber-300 font-semibold'
                        : 'text-slate-200'
                    }
                  >
                    {step.message}
                  </span>
                </div>
              ))}
            </div>

            <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Tool: {activeRunTool}</span>
              <span className="text-emerald-400 font-medium">
                {lastCreditsUsed === 0
                  ? 'Free: 0 credits'
                  : `Credits used: ${lastCreditsUsed}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          OPPORTUNITY DETAILS SIDE DRAWER
         ========================================== */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setSelectedOpportunity(null)}
          />
          <div className="relative w-full max-w-lg bg-[#0F1623] border-l border-slate-800 p-6 sm:p-8 overflow-y-auto z-10 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {selectedOpportunity.opportunity_type}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-2">
                    {selectedOpportunity.title}
                  </h2>
                  <p className="text-sm text-slate-400">{selectedOpportunity.company}</p>
                </div>
                <button
                  onClick={() => setSelectedOpportunity(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Stipend / Prize:</span>
                  <p className="font-semibold text-white mt-0.5">
                    {selectedOpportunity.stipend_or_prize}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Deadline:</span>
                  <p className="font-semibold text-orange-300 mt-0.5">
                    {selectedOpportunity.deadline} ({selectedOpportunity.days_left}d left)
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Eligibility:</span>
                  <p className="text-slate-200 mt-0.5">{selectedOpportunity.eligibility}</p>
                </div>
                <div>
                  <span className="text-slate-400">Trust Score:</span>
                  <p className="font-semibold text-emerald-400 mt-0.5">
                    {selectedOpportunity.trust_score}/100 ({selectedOpportunity.trust_badge})
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Portal Link
                </span>
                <p className="text-xs font-mono text-slate-300 break-all">
                  {selectedOpportunity.url}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setScamSourceType('company_url');
                    setScamUrl(selectedOpportunity.url);
                    setScamCompany(selectedOpportunity.company);
                    setScamContent(
                      `${selectedOpportunity.title} at ${selectedOpportunity.company}. ${selectedOpportunity.stipend_or_prize}. ${selectedOpportunity.eligibility}`
                    );
                    setSelectedOpportunity(null);
                    setActivePage('scam-detector');
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 text-orange-400" />
                  <span>Scan This for Scams</span>
                </button>

                <button
                  onClick={() => {
                    setVerCompany(selectedOpportunity.company);
                    setVerWebsite(selectedOpportunity.url);
                    setSelectedOpportunity(null);
                    setActivePage('company-verifier');
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Verify Company</span>
                </button>
              </div>

              <CoverLetterGenerator profile={profile} opp={selectedOpportunity} />

              <a
                href={selectedOpportunity.url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2"
              >
                <span>Open Official Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          STUDENT PROFILE EDITABLE DRAWER
         ========================================== */}
      {profileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setProfileDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#0F1623] border-l border-slate-800 p-6 sm:p-8 overflow-y-auto z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Student Profile Vault</h2>
                <p className="text-xs text-slate-400">
                  Persisted locally & used for Smart Auto-Fill and Match Scoring
                </p>
              </div>
              <button
                onClick={() => setProfileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">University</label>
                <input
                  type="text"
                  value={profile.university}
                  onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Degree & Branch</label>
                <input
                  type="text"
                  value={profile.degree}
                  onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Secondary Track</label>
                <input
                  type="text"
                  value={profile.secondary_track}
                  onChange={(e) =>
                    setProfile({ ...profile, secondary_track: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">GitHub URL</label>
                <input
                  type="text"
                  value={profile.github}
                  onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Resume URL</label>
                <input
                  type="text"
                  value={profile.resume_url}
                  onChange={(e) => setProfile({ ...profile, resume_url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                />
              </div>

              {/* Skills Chips Editor */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Skills</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {profile.skills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                    >
                      {sk}
                      <button
                        onClick={() =>
                          setProfile({
                            ...profile,
                            skills: profile.skills.filter((s) => s !== sk),
                          })
                        }
                        className="text-slate-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Add skill (e.g., Docker)..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkillInput.trim()) {
                        setProfile({
                          ...profile,
                          skills: [...profile.skills, newSkillInput.trim()],
                        });
                        setNewSkillInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-white"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setProfileDrawerOpen(false);
                addToast('Student Profile saved to localStorage', 'success');
              }}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm"
            >
              Done & Save
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          COMMUNITY REPORT MODAL
         ========================================== */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setReportModalOpen(false)}
          />
          <form
            onSubmit={handleCreateReport}
            className="relative w-full max-w-md rounded-2xl bg-[#111827] border border-slate-800 p-6 space-y-4 z-10"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Submit Anonymous Report</h3>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={newRepCompany}
                onChange={(e) => setNewRepCompany(e.target.value)}
                placeholder="e.g., Shady Internships Pvt Ltd"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Recruiter Email / Domain / Link
              </label>
              <input
                type="text"
                value={newRepContact}
                onChange={(e) => setNewRepContact(e.target.value)}
                placeholder="e.g., hr.shady@gmail.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Experience Tag</label>
              <select
                value={newRepTag}
                onChange={(e) => setNewRepTag(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
              >
                <option value="Received a fee request">Received a fee request</option>
                <option value="Interview was legitimate">Interview was legitimate</option>
                <option value="Recruiter never responded">Recruiter never responded</option>
                <option value="Verified by Students">Verified by Students</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">What happened?</label>
              <textarea
                rows={3}
                required
                value={newRepComment}
                onChange={(e) => setNewRepComment(e.target.value)}
                placeholder="Describe what the recruiter asked for..."
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm"
            >
              Publish Report
            </button>
          </form>
        </div>
      )}

      {/* TOAST STACK */}
      <div className="fixed bottom-4 left-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-2.5 rounded-xl bg-slate-900/95 border border-slate-700 text-xs font-medium text-white shadow-xl flex items-center gap-2"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                t.type === 'warn'
                  ? 'bg-amber-400'
                  : t.type === 'info'
                  ? 'bg-blue-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
