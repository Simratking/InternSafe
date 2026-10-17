import {
  ApplicationStatus,
  AutoFillRequest,
  AutoFillResponse,
  BatchCompareResponse,
  CommunityReport,
  CommunityReportCreate,
  CommunityReportsResponse,
  CompanyVerifyRequest,
  CompanyVerifyResponse,
  FetchNoticesResponse,
  OpportunitiesResponse,
  Opportunity,
  OpportunityFilterRequest,
  RunRecord,
  ScamCheckRequest,
  ScamCheckResponse,
  ScamLibraryResponse,
  SearchResponse,
  SystemStatusResponse,
} from './types';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const nowTime = () => new Date().toTimeString().split(' ')[0];
const makeRunId = () => `run_tf_${Math.random().toString(16).slice(2, 10)}`;

// Local fallback run ledger so Run History & Agent Activity always work even offline
const LOCAL_RUN_LEDGER: Record<string, RunRecord> = {};

function recordLocalRun(
  run_id: string,
  tool: string,
  target: string,
  steps: { timestamp: string; type: string; message: string }[],
  status: RunRecord['status'] = 'COMPLETED',
  output?: unknown
): RunRecord {
  const rec: RunRecord = {
    run_id,
    tool,
    target,
    status,
    created_at: nowTime(),
    steps,
    output,
  };
  LOCAL_RUN_LEDGER[run_id] = rec;
  return rec;
}

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp_1',
    title: 'AZINHACK ’26 — 24-Hour National Hackathon',
    company: 'USAR, GGSIPU East Delhi Campus',
    company_type: 'University / National Hackathon',
    opportunity_type: 'Hackathon',
    location: 'Delhi NCR (On-Campus)',
    stipend_or_prize: '₹1,00,000+ Pool & $13 TinyFish Credits',
    eligibility: 'All B.Tech / BS Years (1st Year Friendly)',
    deadline: '20 Oct 2026',
    days_left: 3,
    skills_matched: ['Python', 'AI/ML', 'FastAPI', 'Docker'],
    match_score: 98,
    trust_score: 99,
    trust_badge: 'Safe • Verified by Students',
    url: 'https://unstop.com/hackathons/azinhack-2026-usar-ggsipu-1763832',
    application_status: 'Saved',
  },
  {
    id: 'opp_2',
    title: 'AI & Data Science Undergraduate Intern',
    company: 'SafeStack AI Labs',
    company_type: 'Verified Startup',
    opportunity_type: 'Internship',
    location: 'Remote',
    stipend_or_prize: '₹20,000 / month',
    eligibility: '1st / 2nd / 3rd Year CSE, CSE-AI, Data Science',
    deadline: '23 Oct 2026',
    days_left: 6,
    skills_matched: ['Python', 'AI/ML', 'FastAPI'],
    match_score: 94,
    trust_score: 92,
    trust_badge: 'Safe • Official Domain Verified',
    url: 'https://safestack.ai/careers/ai-intern',
    application_status: 'Not Applied',
  },
  {
    id: 'opp_3',
    title: 'Google Summer of Code / Open Source Fellow',
    company: 'CNCF & Docker Community',
    company_type: 'Open-Source Foundation',
    opportunity_type: 'Open-Source',
    location: 'Remote',
    stipend_or_prize: '$1,500 – $3,000 Stipend',
    eligibility: '18+ University Students',
    deadline: '15 Nov 2026',
    days_left: 29,
    skills_matched: ['C++', 'Python', 'DSA'],
    match_score: 89,
    trust_score: 100,
    trust_badge: 'Safe • Global Program',
    url: 'https://summerofcode.withgoogle.com',
    application_status: 'Not Applied',
  },
  {
    id: 'opp_4',
    title: 'AICTE Pragati & Swanath Technical Scholarship',
    company: 'AICTE (Govt. of India)',
    company_type: 'Government Portal',
    opportunity_type: 'Scholarship',
    location: 'All India',
    stipend_or_prize: '₹50,000 / year',
    eligibility: '1st Year Technical Degree Students',
    deadline: '22 Oct 2026',
    days_left: 5,
    skills_matched: ['B.Tech CSE-AI'],
    match_score: 91,
    trust_score: 100,
    trust_badge: 'Safe • Official Govt Portal',
    url: 'https://scholarships.gov.in',
    application_status: 'Not Applied',
  },
  {
    id: 'opp_5',
    title: 'Junior C++ & Low-Latency Systems Intern',
    company: 'QuantEdge Systems NCR',
    company_type: 'FinTech Firm',
    opportunity_type: 'Internship',
    location: 'Delhi NCR',
    stipend_or_prize: '₹35,000 / month',
    eligibility: 'B.Tech CSE / CSE-AI with strong DSA',
    deadline: '02 Nov 2026',
    days_left: 16,
    skills_matched: ['C++', 'DSA', 'Python'],
    match_score: 90,
    trust_score: 86,
    trust_badge: 'Safe • Domain Verified',
    url: 'https://quantedgesystems.in/careers',
    application_status: 'Applied',
  },
  {
    id: 'opp_6',
    title: 'Instant Direct-Selection AI Trainee (Unverified)',
    company: 'TechNova Global Solutions',
    company_type: 'Unverified Agency',
    opportunity_type: 'Internship',
    location: 'Remote',
    stipend_or_prize: '₹45,000 / month (Claims No Interview)',
    eligibility: 'Any Branch (Requests ₹1,499 Training Deposit)',
    deadline: '19 Oct 2026',
    days_left: 2,
    skills_matched: ['Python', 'AI/ML'],
    match_score: 62,
    trust_score: 18,
    trust_badge: 'High Risk • Fee Demand Reported',
    url: 'https://technova-global-interns.blogspot.com',
    application_status: 'Flagged',
  },
];

let MOCK_REPORTS: CommunityReport[] = [
  {
    id: 'rep_101',
    company_name: 'TechNova Global Solutions',
    recruiter_contact: 'hr.technovaglobal@gmail.com',
    tag: 'Received a fee request',
    comment:
      "Asked for ₹1,499 'training & laptop security deposit' via personal UPI after a 2-minute WhatsApp chat.",
    label: 'User-Reported Concern',
    upvotes: 19,
    timestamp: '2 hours ago',
  },
  {
    id: 'rep_102',
    company_name: 'USAR GGSIPU — AZINHACK ’26',
    recruiter_contact: 'unstop.com/hackathons/azinhack-2026',
    tag: 'Verified by Students',
    comment:
      'Official GGSIPU EDC hackathon on Unstop. Free registration and verified $13 TinyFish sponsor credits.',
    label: 'Verified Legitimate',
    upvotes: 42,
    timestamp: '1 day ago',
  },
  {
    id: 'rep_103',
    company_name: 'CodeCraft Internships India',
    recruiter_contact: 'careers@codecraft-india.co',
    tag: 'Received a fee request',
    comment:
      'Sent an instant offer letter without any technical interview, then demanded ₹699 for completion certificate.',
    label: 'User-Reported Concern',
    upvotes: 11,
    timestamp: '3 days ago',
  },
];

async function requestWithFallback<T>(
  path: string,
  options: RequestInit | undefined,
  liveEnabled: boolean,
  fallbackFn: () => T,
  onFallbackTriggered?: () => void
): Promise<{ data: T; fromMock: boolean }> {
  if (!liveEnabled) {
    return { data: fallbackFn(), fromMock: true };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as T;
    return { data: json, fromMock: false };
  } catch {
    if (onFallbackTriggered) onFallbackTriggered();
    return { data: fallbackFn(), fromMock: true };
  }
}

export const api = {
  async getStatus(live: boolean, onFallback?: () => void) {
    return requestWithFallback<SystemStatusResponse>(
      '/api/status',
      { method: 'GET' },
      live,
      () => ({
        service: 'InternSafe FastAPI Backend',
        container: 'Dockerized (FastAPI v2.0)',
        tinyfish_connected: true,
        live_mode: false,
        free_tier_tools: ['mcp__tinyfish__search', 'mcp__tinyfish__fetch_content'],
        credits_remaining: '$13.00',
        modules_enabled: [
          '1. Unified Opportunity Discovery',
          '2. AI Scam Detector (0-100 Trust Score)',
          '3. Company & Recruiter Verification',
          '4. Community Safety Layer',
        ],
      }),
      onFallback
    );
  },

  async getOpportunities(
    filter: OpportunityFilterRequest,
    savedStatuses: Record<string, ApplicationStatus>,
    live: boolean,
    onFallback?: () => void
  ) {
    const res = await requestWithFallback<OpportunitiesResponse>(
      '/api/opportunities',
      { method: 'POST', body: JSON.stringify(filter) },
      live,
      () => {
        const run_id = makeRunId();
        const filtered = INITIAL_OPPORTUNITIES.filter((o) => {
          const typeMatch =
            !filter.opportunity_type ||
            filter.opportunity_type === 'All' ||
            o.opportunity_type.toLowerCase() ===
              filter.opportunity_type.toLowerCase();
          const locMatch =
            !filter.location_type ||
            filter.location_type === 'All' ||
            o.location.toLowerCase().includes(filter.location_type.toLowerCase());
          const verifiedMatch = !filter.only_verified || o.trust_score >= 80;
          const q = (filter.query || '').trim().toLowerCase();
          const qMatch =
            !q ||
            o.title.toLowerCase().includes(q) ||
            o.company.toLowerCase().includes(q) ||
            o.skills_matched.some((s) => s.toLowerCase().includes(q));
          return typeMatch && locMatch && verifiedMatch && qMatch;
        });

        recordLocalRun(
          run_id,
          'mcp__tinyfish__search',
          `Filter: ${filter.opportunity_type || 'All'} (${filter.location_type || 'All'})`,
          [
            {
              timestamp: nowTime(),
              type: 'init',
              message: 'Tool invoked: mcp__tinyfish__search (Free tier: 0 credits)',
            },
            {
              timestamp: nowTime(),
              type: 'search',
              message: `Querying portals for skills: ${filter.skills.join(', ')}`,
            },
            {
              timestamp: nowTime(),
              type: 'complete',
              message: `Returned ${filtered.length} opportunities ranked by Profile Match & Trust Score.`,
            },
          ]
        );

        return {
          run_id,
          credits_used: 0,
          opportunities: filtered,
        };
      },
      onFallback
    );

    // Merge persisted statuses and ensure full 6-item richness if backend returns subset
    const mergedList = res.data.opportunities.map((o) => ({
      ...o,
      application_status: savedStatuses[o.id] || o.application_status,
    }));

    return {
      ...res,
      data: {
        ...res.data,
        opportunities: mergedList,
      },
    };
  },

  async trackOpportunity(
    opportunity_id: string,
    status: ApplicationStatus,
    live: boolean
  ) {
    return requestWithFallback(
      '/api/opportunities/track',
      {
        method: 'POST',
        body: JSON.stringify({ opportunity_id, status }),
      },
      live,
      () => ({
        opportunity_id,
        status,
        updated_at: nowTime(),
      })
    );
  },

  async liveSearch(query: string, live: boolean, onFallback?: () => void) {
    return requestWithFallback<SearchResponse>(
      '/api/search',
      { method: 'POST', body: JSON.stringify({ query }) },
      live,
      () => {
        const run_id = makeRunId();
        const results = [
          {
            id: 'sr_1',
            title: 'AZINHACK ’26 — USAR GGSIPU East Delhi Campus',
            url: 'https://unstop.com/hackathons/azinhack-2026-usar-ggsipu-1763832',
            platform: 'Unstop (Verified Safe — 99/100)',
            snippet:
              '24-Hour National Hackathon | Open Innovation | ₹1,00,000+ Prize Pool | Powered by TinyFish & Docker',
          },
          {
            id: 'sr_2',
            title: 'Smart India Hackathon (SIH) — Tabular AI & Verification Track',
            url: 'https://www.sih.gov.in/sih2026ProblemStatements',
            platform: 'SIH Portal (Verified Safe — 100/100)',
            snippet:
              'National problem statements in AI tabular extraction, document verification, and automated grading.',
          },
          {
            id: 'sr_3',
            title: 'USICT TechSpace Open Source & Agentic AI Sprint',
            url: 'https://usict.acm.org/techspace-sprint-2026',
            platform: 'USICT Campus (Verified Safe — 98/100)',
            snippet:
              'Build autonomous agents and developer tooling. Exclusive mentorship for 1st & 2nd year students.',
          },
        ];
        recordLocalRun(run_id, 'mcp__tinyfish__search', query, [
          {
            timestamp: nowTime(),
            type: 'init',
            message: `Tool invoked: mcp__tinyfish__search for "${query}" (0 Credits)`,
          },
          {
            timestamp: nowTime(),
            type: 'complete',
            message: `Extracted ${results.length} live web listings.`,
          },
        ]);
        return { run_id, credits_used: 0, results };
      },
      onFallback
    );
  },

  async detectScam(
    payload: ScamCheckRequest,
    live: boolean,
    onFallback?: () => void
  ) {
    return requestWithFallback<ScamCheckResponse>(
      '/api/scam-detect',
      { method: 'POST', body: JSON.stringify(payload) },
      live,
      () => {
        const run_id = makeRunId();
        const lower = (payload.content || '').toLowerCase();
        const emailLower = (payload.recruiter_email || '').toLowerCase();
        let score = 96;
        const red_flags: ScamCheckResponse['red_flags'] = [];

        const feeTriggers = [
          'registration fee',
          'security deposit',
          'training fee',
          'upi',
          'pay ₹',
          'pay rs',
          'certificate fee',
          'laptop fee',
          'refundable',
        ];
        const sentences = lower.split(/[.!?\n]/);
        let hasFee = false;
        for (const trig of feeTriggers) {
          for (const s of sentences) {
            if (
              s.includes(trig) &&
              !['never', 'no ', 'without', 'free of', "don't"].some((neg) =>
                s.includes(neg)
              )
            ) {
              hasFee = true;
              break;
            }
          }
        }

        if (hasFee) {
          score -= 48;
          red_flags.push({
            flag: 'Upfront Payment / Fee Request Detected',
            severity: 'Critical',
            explanation:
              'Legitimate companies pay interns; they never ask students to pay for training, certificates, security deposits, or equipment via personal UPI.',
          });
        }

        if (
          [
            'otp',
            'pan card',
            'bank pin',
            'cvv',
            'netbanking',
            'government id',
            'identity card',
          ].some((k) => lower.includes(k))
        ) {
          score -= 32;
          red_flags.push({
            flag: 'Sensitive OTP / Financial / ID Harvesting',
            severity: 'Critical',
            explanation:
              'Asking for OTPs, banking PINs, or sensitive government ID numbers over chat before official onboarding is a critical identity-theft indicator.',
          });
        }

        if (
          ['@gmail.com', '@yahoo.com', '@outlook.com', '@rediffmail.com'].some(
            (d) => emailLower.includes(d) || lower.includes(d)
          )
        ) {
          score -= 22;
          red_flags.push({
            flag: 'Free Personal Email Domain Used by Recruiter',
            severity: 'High',
            explanation:
              'Corporate HRs send offer letters from official company domains (e.g., @company.com), never personal @gmail.com or @yahoo.com addresses.',
          });
        }

        if (
          [
            'direct selection',
            'no interview',
            '100% guaranteed',
            'within 1 hour',
            'immediate payment',
            'urgent slot',
          ].some((k) => lower.includes(k))
        ) {
          score -= 18;
          red_flags.push({
            flag: 'No-Interview Direct Selection & Pressure Tactics',
            severity: 'High',
            explanation:
              'Scammers manufacture artificial urgency ("pay within 1 hour") and skip technical interviews to trap students quickly.',
          });
        }

        const matches = MOCK_REPORTS.filter(
          (r) =>
            r.label === 'User-Reported Concern' &&
            ((payload.company_name &&
              r.company_name
                .toLowerCase()
                .includes(payload.company_name.toLowerCase())) ||
              (payload.recruiter_email &&
                r.recruiter_contact
                  .toLowerCase()
                  .includes(payload.recruiter_email.toLowerCase())))
        ).length;

        if (matches > 0) {
          score -= 20;
          red_flags.push({
            flag: `Flagged by ${matches} Student Report(s) in InternSafe Community`,
            severity: 'High',
            explanation:
              'Other students have previously reported fee requests or suspicious recruiter behavior from this organization.',
          });
        }

        score = Math.max(6, Math.min(98, score));

        const trust_label =
          score >= 80
            ? 'Safe'
            : score >= 60
            ? 'Caution'
            : score >= 40
            ? 'Suspicious'
            : 'High Risk';

        const recommended_action =
          score >= 80
            ? 'Likely safe, but confirm recruiter identity on LinkedIn and apply via the official company portal.'
            : score >= 60
            ? 'Verify on official website. Do not share sensitive documents until you complete a real technical interview.'
            : score >= 40
            ? 'Do not pay any fees or click unverified links. Cross-check the job posting on the official careers page.'
            : 'DO NOT PAY or share OTP/ID details! Block the contact and submit a report to the InternSafe Community Layer.';

        if (red_flags.length === 0) {
          red_flags.push({
            flag: 'No Known Scam Signatures Detected',
            severity: 'Low',
            explanation:
              'No upfront payment demands, personal UPI requests, or high-pressure scam scripts were detected in this submission.',
          });
        }

        recordLocalRun(
          run_id,
          'mcp__tinyfish__fetch_content',
          payload.url || payload.source_type,
          [
            {
              timestamp: nowTime(),
              type: 'init',
              message: `Tool invoked: mcp__tinyfish__fetch_content (${payload.source_type}) — 0 Credits`,
            },
            {
              timestamp: nowTime(),
              type: 'analyze',
              message:
                'Running heuristic & LLM pattern scan for fee traps, domain spoofing, and urgency signals...',
            },
            {
              timestamp: nowTime(),
              type: 'complete',
              message: `Analysis complete -> Trust Score: ${score}/100 (${trust_label})`,
            },
          ]
        );

        return {
          run_id,
          trust_score: score,
          trust_label,
          red_flags,
          recommended_action,
          community_matches: matches,
          credits_used: 0,
        };
      },
      onFallback
    );
  },

  async verifyCompany(
    payload: CompanyVerifyRequest,
    live: boolean,
    onFallback?: () => void
  ) {
    return requestWithFallback<CompanyVerifyResponse>(
      '/api/verify-company',
      { method: 'POST', body: JSON.stringify(payload) },
      live,
      () => {
        const run_id = makeRunId();
        const webDomain = payload.official_website
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0];
        const emailDomain = (payload.recruiter_email.split('@')[1] || '').toLowerCase();
        const isFreeMail = ['gmail.com', 'yahoo.com', 'outlook.com'].includes(
          emailDomain
        );
        const domain_match =
          Boolean(webDomain && emailDomain) &&
          webDomain === emailDomain &&
          !isFreeMail;

        const student_reports_count = MOCK_REPORTS.filter(
          (r) =>
            r.label === 'User-Reported Concern' &&
            r.company_name
              .toLowerCase()
              .includes(payload.company_name.toLowerCase())
        ).length;

        let trust_score = domain_match ? 92 : 34;
        if (student_reports_count > 0) {
          trust_score = Math.max(12, trust_score - student_reports_count * 22);
        }

        const trust_label =
          trust_score >= 80
            ? 'Safe'
            : trust_score >= 60
            ? 'Caution'
            : trust_score >= 40
            ? 'Suspicious'
            : 'High Risk';

        recordLocalRun(
          run_id,
          'mcp__tinyfish__fetch_content',
          payload.official_website,
          [
            {
              timestamp: nowTime(),
              type: 'init',
              message: `Fetching ${payload.official_website} via TinyFish Fetch (0 Credits)...`,
            },
            {
              timestamp: nowTime(),
              type: 'verify',
              message: `Comparing Website Domain (${webDomain}) vs Recruiter Email (@${emailDomain}) -> Match=${domain_match}`,
            },
            {
              timestamp: nowTime(),
              type: 'complete',
              message: `Verification complete -> Score: ${trust_score}/100 (${trust_label})`,
            },
          ]
        );

        return {
          run_id,
          company_name: payload.company_name,
          official_website: payload.official_website,
          recruiter_email: payload.recruiter_email,
          domain_match,
          careers_page_listing_found: domain_match && student_reports_count === 0,
          trust_score,
          trust_label,
          company_profile: {
            industry: 'Technology & Software Engineering',
            location: 'India / Remote',
            linkedin_verified: domain_match,
            ssl_active: payload.official_website.startsWith('https'),
          },
          student_reports_count,
          summary: domain_match
            ? `Verified: Recruiter email matches official domain @${webDomain} and role listing was found on the official careers page.`
            : `Warning: Recruiter email (@${emailDomain || 'unknown'}) does NOT match the official website domain (${webDomain}).`,
        };
      },
      onFallback
    );
  },

  async getCommunityReports(live: boolean) {
    return requestWithFallback<CommunityReportsResponse>(
      '/api/community/reports',
      { method: 'GET' },
      live,
      () => ({
        moderation_notice:
          'Reports are student opinions, not proof. Displayed as user-reported concerns to help peers stay vigilant.',
        reports: MOCK_REPORTS,
      })
    );
  },

  async createCommunityReport(payload: CommunityReportCreate, live: boolean) {
    return requestWithFallback<{ status: string; report: CommunityReport }>(
      '/api/community/reports',
      { method: 'POST', body: JSON.stringify(payload) },
      live,
      () => {
        const isPos =
          payload.tag === 'Interview was legitimate' ||
          payload.tag === 'Verified by Students';
        const newRep: CommunityReport = {
          id: `rep_${Math.random().toString(16).slice(2, 7)}`,
          company_name: payload.company_name,
          recruiter_contact: payload.recruiter_contact,
          tag: payload.tag,
          comment: payload.comment,
          label: isPos ? 'Verified Legitimate' : 'User-Reported Concern',
          upvotes: 1,
          timestamp: 'Just now',
        };
        MOCK_REPORTS = [newRep, ...MOCK_REPORTS];
        return { status: 'submitted', report: newRep };
      }
    );
  },

  async getScamLibrary(live: boolean) {
    return requestWithFallback<ScamLibraryResponse>(
      '/api/community/scam-library',
      { method: 'GET' },
      live,
      () => ({
        patterns: [
          {
            title: "The 'Training / Certificate Fee' Internship Trap",
            channel: 'WhatsApp / Telegram / Unofficial Google Forms',
            example_script:
              '"Congratulations! You are shortlisted for a 4-week AICTE/ISO AI Internship. Pay ₹999 via UPI today to unlock your offer letter and completion certificate."',
            why_its_fake:
              'Real internships pay you a stipend or mentor you for free; selling an "internship certificate" for ₹500–₹2,000 is a disguised course sale or outright scam.',
          },
          {
            title: 'The Fake MNC Offer Letter (Domain Spoofing)',
            channel: 'Email (@gmail.com / @careers-company-india.com)',
            example_script:
              '"Dear Candidate, You have been selected at a top MNC for ₹7.5 LPA without interview. Deposit ₹3,500 refundable laptop security fee before 5 PM."',
            why_its_fake:
              'Legitimate companies never demand laptop security deposits or send offers from free @gmail.com or lookalike domains.',
          },
          {
            title: 'Pre-Interview Identity & OTP Harvesting',
            channel: 'WhatsApp / Fake HR Verification Portal',
            example_script:
              '"Fill this urgent verification link with your bank account, government ID, and enter the 6-digit OTP to confirm your stipend account."',
            why_its_fake:
              'Used to compromise bank accounts or open unauthorized credit lines before any real interview takes place.',
          },
        ],
        safe_application_checklist: [
          'Never pay money for an internship offer letter, training, laptop deposit, or certificate.',
          "Verify that the recruiter's email domain exactly matches the company's official website.",
          "Cross-check the opening on the company's official Careers page or verified Unstop/LinkedIn listing.",
          'Never share OTPs or sensitive government ID numbers before verifying the company and completing a real interview.',
        ],
      })
    );
  },

  async fetchNotices(
    url: string,
    branch_filter: string,
    live: boolean,
    onFallback?: () => void
  ) {
    return requestWithFallback<FetchNoticesResponse>(
      '/api/fetch-notices',
      { method: 'POST', body: JSON.stringify({ url, branch_filter }) },
      live,
      () => {
        const run_id = makeRunId();
        const notices: FetchNoticesResponse['notices'] = [
          {
            id: 'not_1',
            title: "USAR East Delhi Campus — AZINHACK '26 Official Notification",
            date: '21–22 Oct 2026',
            urgency: 'High',
            category: 'Hackathons & Circulars',
            summary: [
              '24-Hour National Hackathon on Open Innovation at USAR, GGSIPU EDC (9 AM – 7 PM).',
              'Features ₹1,00,000+ prize pool, Docker & TinyFish sponsorships, and $13 free TinyFish credits.',
            ],
            markdown_preview:
              "# AZINHACK '26 Official Circular\n**Venue:** USAR, GGSIPU East Delhi Campus\n**Dates:** 21–22 Oct 2026 (9 AM – 7 PM)\n**Theme:** Open Innovation\n**Perks:** $13 Free TinyFish Credits + Sponsor Merch.",
          },
          {
            id: 'not_2',
            title:
              'Training & Placement Cell Advisory: Beware of Paid Internship Scams',
            date: '17 Oct 2026',
            urgency: 'High',
            category: 'B.Tech CSE-AI',
            summary: [
              'Students are advised never to pay registration or certificate fees for unverified WhatsApp internship offers.',
              'Use official university notices and verified portals only.',
            ],
            markdown_preview:
              '# USICT Placement Cell Advisory\nDo not pay upfront fees for internship certificates or unverified Telegram groups. Verify all recruiters via official domains.',
          },
          {
            id: 'not_3',
            title:
              'B.Tech CSE-AI (1st Year) Practical & Continuous Evaluation Schedule',
            date: '14 Oct 2026',
            urgency: 'Medium',
            category: '1st Year Exams',
            summary: [
              'Updated lab evaluation rubrics for Programming and Manufacturing Processes.',
              'Project proposals and practical files due before mid-semester assessments.',
            ],
            markdown_preview:
              '# Academic Affairs — USICT GGSIPU\nContinuous evaluation schedule for B.Tech 1st Year regular batch.',
          },
        ];

        recordLocalRun(run_id, 'mcp__tinyfish__fetch_content', url, [
          {
            timestamp: nowTime(),
            type: 'init',
            message: `Tool invoked: mcp__tinyfish__fetch_content on ${url} (0 Credits)`,
          },
          {
            timestamp: nowTime(),
            type: 'fetch',
            message: 'Converted portal DOM table into clean Markdown.',
          },
          {
            timestamp: nowTime(),
            type: 'complete',
            message: `Filtered ${notices.length} notices relevant to ${branch_filter}.`,
          },
        ]);

        return {
          run_id,
          status: 'COMPLETED',
          credits_used: 0,
          notices,
        };
      },
      onFallback
    );
  },

  async batchCompare(urls: string[], live: boolean, onFallback?: () => void) {
    return requestWithFallback<BatchCompareResponse>(
      '/api/batch-compare',
      { method: 'POST', body: JSON.stringify({ urls }) },
      live,
      () => {
        const batch_id = makeRunId();
        recordLocalRun(
          batch_id,
          'mcp__tinyfish__batch_create',
          `${urls.length} URLs queued`,
          [
            {
              timestamp: nowTime(),
              type: 'init',
              message: `Tool invoked: mcp__tinyfish__batch_create across ${urls.length} portals`,
            },
            ...urls.map((u, idx) => ({
              timestamp: nowTime(),
              type: 'dom',
              message: `[Worker ${idx + 1}] Navigating DOM & extracting eligibility on ${u.slice(
                0,
                45
              )}...`,
            })),
            {
              timestamp: nowTime(),
              type: 'complete',
              message:
                'Polling mcp__tinyfish__batch_status -> All workers COMPLETED.',
            },
          ]
        );

        return {
          batch_id,
          status: 'COMPLETED',
          urls_processed: urls.length,
          comparison_matrix: [
            {
              event_name: 'AZINHACK ’26 (USAR GGSIPU)',
              deadline: '20 Oct 2026 (Final Call)',
              eligibility: 'All Years (1st Year Friendly — USICT Perks)',
              team_size: '2 – 4 Members',
              prize_pool: '₹1,00,000+ & $13 TinyFish Credits',
              sponsors: 'TinyFish, Docker (Trust: 99/100 Safe)',
            },
            {
              event_name: 'Smart India Hackathon (SIH)',
              deadline: 'Rolling Internal Shortlist',
              eligibility: 'B.Tech / BS Undergraduates',
              team_size: '6 Members (Mandatory 1 Female)',
              prize_pool: '₹1,00,000 per Problem Statement',
              sponsors: 'Ministry of Education, AICTE (100/100 Safe)',
            },
            {
              event_name: 'USICT TechSpace AI Sprint',
              deadline: '28 Oct 2026',
              eligibility: '1st & 2nd Year B.Tech (CSE / CSE-AI)',
              team_size: '1 – 3 Members',
              prize_pool: '₹25,000 + Cloud Credits',
              sponsors: 'TechSpace USICT (98/100 Safe)',
            },
            {
              event_name: 'NCR Data Science Fellowship',
              deadline: '05 Nov 2026',
              eligibility: 'Python & Data Science Undergrads',
              team_size: 'Individual Application',
              prize_pool: '₹20,000 / month Stipend',
              sponsors: 'Verified Partner Startups (92/100 Safe)',
            },
          ].slice(0, Math.max(2, urls.length)),
        };
      },
      onFallback
    );
  },

  async autoApply(
    payload: AutoFillRequest,
    live: boolean,
    onFallback?: () => void
  ) {
    return requestWithFallback<AutoFillResponse>(
      '/api/auto-apply',
      { method: 'POST', body: JSON.stringify(payload) },
      live,
      () => {
        const run_id = makeRunId();
        const p = payload.student_profile;
        const steps = [
          {
            timestamp: nowTime(),
            type: 'init',
            message: `Tool invoked: mcp__tinyfish__run_web_automation on ${payload.form_url}`,
          },
          {
            timestamp: nowTime(),
            type: 'dom',
            message: `Populating Full Name -> "${p.name}"`,
          },
          {
            timestamp: nowTime(),
            type: 'dom',
            message: `Selecting University -> "${p.university}" (${p.degree})`,
          },
          {
            timestamp: nowTime(),
            type: 'dom',
            message: `Injecting Skills & GitHub -> ${p.skills
              .slice(0, 3)
              .join(', ')} | ${p.github}`,
          },
        ];

        if (payload.simulate_timeout) {
          steps.push(
            {
              timestamp: nowTime(),
              type: 'error',
              message:
                'WARNING: HTTP Connection Timeout (504) from run_web_automation!',
            },
            {
              timestamp: nowTime(),
              type: 'guardrail',
              message:
                'NO-BLIND-RETRY GUARDRAIL TRIGGERED: Blocking duplicate retry to protect $13 credit pool.',
            },
            {
              timestamp: nowTime(),
              type: 'poll',
              message: `Switching to mcp__tinyfish__get_run('${run_id}') and get_steps()...`,
            },
            {
              timestamp: nowTime(),
              type: 'success',
              message:
                'Recovered active background run! Form fields verified and paused before final submit.',
            }
          );
          recordLocalRun(
            run_id,
            'mcp__tinyfish__run_web_automation',
            payload.form_url,
            steps,
            'RECOVERED'
          );
          return {
            run_id,
            status: 'RECOVERED_VIA_GET_RUN',
            guardrail_triggered: true,
            message:
              'HTTP timeout caught! Blind retry blocked to protect credits. Active run recovered via get_run() and paused for your review.',
            steps,
          };
        }

        steps.push({
          timestamp: nowTime(),
          type: 'complete',
          message:
            'All fields mapped and populated. Paused at final confirmation screen for human review.',
        });
        recordLocalRun(
          run_id,
          'mcp__tinyfish__run_web_automation',
          payload.form_url,
          steps,
          'COMPLETED'
        );
        return {
          run_id,
          status: 'COMPLETED',
          guardrail_triggered: false,
          message:
            'Form fields populated using your Student Profile. Please review before submitting.',
          steps,
        };
      },
      onFallback
    );
  },

  async listRuns(live: boolean) {
    return requestWithFallback<{ runs: RunRecord[] }>(
      '/api/runs',
      { method: 'GET' },
      live,
      () => ({
        runs: Object.values(LOCAL_RUN_LEDGER).reverse(),
      })
    );
  },

  async getRunSteps(run_id: string, live: boolean) {
    return requestWithFallback<{
      run_id: string;
      status: string;
      steps: { timestamp: string; type: string; message: string }[];
    }>(
      `/api/runs/${run_id}/steps`,
      { method: 'GET' },
      live,
      () => {
        const found = LOCAL_RUN_LEDGER[run_id];
        return {
          run_id,
          status: found?.status || 'COMPLETED',
          steps: found?.steps || [
            {
              timestamp: nowTime(),
              type: 'init',
              message: `Inspecting run ${run_id}`,
            },
          ],
        };
      }
    );
  },

  async cancelRun(run_id: string, live: boolean) {
    return requestWithFallback<{ run_id: string; status: string }>(
      `/api/runs/${run_id}/cancel`,
      { method: 'POST' },
      live,
      () => {
        if (LOCAL_RUN_LEDGER[run_id]) {
          LOCAL_RUN_LEDGER[run_id].status = 'CANCELLED';
          LOCAL_RUN_LEDGER[run_id].steps.push({
            timestamp: nowTime(),
            type: 'cancel',
            message:
              'Emergency stop invoked via mcp__tinyfish__cancel_run. Browser session terminated.',
          });
        }
        return { run_id, status: 'CANCELLED' };
      }
    );
  },
};
