export type PageId =
  | 'dashboard'
  | 'opportunities'
  | 'scam-detector'
  | 'company-verifier'
  | 'community'
  | 'campus-notices'
  | 'compare-portals'
  | 'auto-apply'
  | 'run-history';

export type OpportunityType =
  | 'All'
  | 'Internship'
  | 'Hackathon'
  | 'Scholarship'
  | 'Open-Source'
  | 'Full-Time';

export type LocationType = 'All' | 'Remote' | 'Delhi NCR' | 'Hybrid';

export type ApplicationStatus =
  | 'Not Applied'
  | 'Saved'
  | 'Applied'
  | 'Interviewing'
  | 'Offer'
  | 'Flagged';

export interface StudentProfile {
  name: string;
  university: string;
  degree: string;
  secondary_track: string;
  skills: string[];
  github: string;
  resume_url: string;
  email?: string;
}

export interface SystemStatusResponse {
  service: string;
  container: string;
  tinyfish_connected: boolean;
  live_mode: boolean;
  free_tier_tools: string[];
  credits_remaining: string;
  modules_enabled?: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  company_type: string;
  opportunity_type: Exclude<OpportunityType, 'All'>;
  location: string;
  stipend_or_prize: string;
  eligibility: string;
  deadline: string;
  days_left: number;
  skills_matched: string[];
  match_score: number;
  trust_score: number;
  trust_badge: string;
  url: string;
  application_status: ApplicationStatus;
}

export interface OpportunityFilterRequest {
  query?: string;
  opportunity_type?: OpportunityType;
  location_type?: LocationType;
  skills: string[];
  only_verified: boolean;
}

export interface OpportunitiesResponse {
  run_id: string;
  credits_used: number;
  opportunities: Opportunity[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  url: string;
  platform: string;
  snippet: string;
}

export interface SearchResponse {
  run_id: string;
  credits_used: number;
  results: SearchResultItem[];
}

export type ScamSourceType =
  | 'whatsapp_message'
  | 'offer_letter'
  | 'job_post'
  | 'company_url';

export interface ScamCheckRequest {
  source_type: ScamSourceType;
  content: string;
  url?: string;
  company_name?: string;
  recruiter_email?: string;
}

export interface RedFlag {
  flag: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  explanation: string;
}

export interface ScamCheckResponse {
  run_id: string;
  trust_score: number;
  trust_label: string;
  red_flags: RedFlag[];
  recommended_action: string;
  community_matches: number;
  credits_used: number;
}

export interface CompanyVerifyRequest {
  company_name: string;
  official_website: string;
  recruiter_email: string;
  job_title?: string;
}

export interface CompanyVerifyResponse {
  run_id: string;
  company_name: string;
  official_website: string;
  recruiter_email: string;
  domain_match: boolean;
  careers_page_listing_found: boolean;
  trust_score: number;
  trust_label: string;
  company_profile: {
    industry: string;
    location: string;
    linkedin_verified: boolean;
    ssl_active: boolean;
  };
  student_reports_count: number;
  summary: string;
}

export interface CommunityReport {
  id: string;
  company_name: string;
  recruiter_contact: string;
  tag: string;
  comment: string;
  label: 'User-Reported Concern' | 'Verified Legitimate';
  upvotes: number;
  timestamp: string;
  author?: string;
  author_badge?: string;
  author_points?: number;
}

export interface CommunityReportsResponse {
  moderation_notice: string;
  reports: CommunityReport[];
}

export interface CommunityReportCreate {
  company_name: string;
  recruiter_contact: string;
  tag: string;
  comment: string;
  author_name?: string;
  author_badge?: string;
}

export interface CommunityUpvoteResponse {
  status: string;
  report_id: string;
  upvotes: number;
  points_awarded: number;
  message: string;
}

export interface BadgeTier {
  id: string;
  name: string;
  min_points: number;
  badge_icon: string;
  description: string;
}

export interface BadgesResponse {
  badge_tiers: BadgeTier[];
  earning_rules: { action: string; points: number; icon: string }[];
}

export interface ScamPattern {
  title: string;
  channel: string;
  example_script: string;
  why_its_fake: string;
}

export interface ScamLibraryResponse {
  patterns: ScamPattern[];
  safe_application_checklist: string[];
}

export interface CampusNotice {
  id: string;
  title: string;
  date: string;
  urgency: 'High' | 'Medium' | 'Info';
  category: string;
  summary: string[];
  markdown_preview: string;
}

export interface FetchNoticesResponse {
  run_id: string;
  status: string;
  credits_used: number;
  notices: CampusNotice[];
}

export interface ComparisonMatrixRow {
  event_name: string;
  deadline: string;
  eligibility: string;
  team_size: string;
  prize_pool: string;
  sponsors: string;
}

export interface BatchCompareResponse {
  batch_id: string;
  status: string;
  urls_processed: number;
  comparison_matrix: ComparisonMatrixRow[];
}

export interface AgentStep {
  timestamp: string;
  type: string;
  message: string;
}

export interface AutoFillRequest {
  form_url: string;
  student_profile: StudentProfile;
  simulate_timeout: boolean;
}

export interface AutoFillResponse {
  run_id: string;
  status: 'COMPLETED' | 'RECOVERED_VIA_GET_RUN' | 'POLLING_EXISTING_RUN';
  guardrail_triggered: boolean;
  message?: string;
  steps: AgentStep[];
}

export interface RunRecord {
  run_id: string;
  tool: string;
  target: string;
  status: 'EXECUTING' | 'COMPLETED' | 'CANCELLED' | 'POLLING get_run' | 'RECOVERED';
  created_at: string;
  steps: AgentStep[];
  output?: unknown;
}

export interface ReminderItem {
  id: string;
  opportunity_id: string;
  title: string;
  company: string;
  deadline: string;
  days_left: number;
  created_at: string;
}


export interface NoticeAlert {
  id: string;
  notice_id: string;
  title: string;
  date: string;
  urgency: string;
  created_at: string;
  run_id: string;
  telegram_sent: boolean;
}

export interface AlertsResponse {
  alerts: NoticeAlert[];
  interval_seconds?: number;
  telegram_enabled?: boolean;
}

export interface CheckAlertsResponse {
  run_id: string;
  checked: number;
  new_alerts: NoticeAlert[];
}
