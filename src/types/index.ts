// ============================================
// ENUMS
// ============================================

export type UserRole =
  | "super_admin"
  | "owner"
  | "manager"
  | "coach"
  | "reception";

export type MembershipStatus =
  | "active"
  | "paused"
  | "expired"
  | "cancelled";

export type MembershipPlanType =
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type ClassLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "all_levels";

export type BookingStatus =
  | "confirmed"
  | "cancelled"
  | "waitlist"
  | "no_show";

export type NotificationType =
  | "info"
  | "promotion"
  | "reminder"
  | "alert"
  | "announcement";

export type NotificationTarget =
  | "all"
  | "active_members"
  | "expired_members"
  | "specific_plans";

// ============================================
// GYM
// ============================================

export interface Gym {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

// ============================================
// USER / PROFILE
// ============================================

export interface Profile {
  id: string;
  gym_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

// ============================================
// ATHLETE
// ============================================

export interface Athlete {
  id: string;
  profile_id: string | null;
  gym_id: string;
  emergency_contact: string | null;
  emergency_phone: string | null;
  health_notes: string | null;
  current_level: ClassLevel;
  total_classes: number;
  is_active: boolean;
  created_at: string;
}

export interface AthleteWithProfile extends Athlete {
  profile: Profile;
  membership?: MembershipWithPlan[];
}

// ============================================
// COACH
// ============================================

export interface Coach {
  id: string;
  profile_id: string | null;
  gym_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  specialty: string[];
  bio: string | null;
  hourly_rate: number | null;
  contract_start: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CoachWithProfile extends Coach {
  created_by?: Pick<Profile, 'full_name'> | null;
}

// ============================================
// MEMBERSHIP
// ============================================

export interface MembershipPlan {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  classes_per_week: number | null;
  unlimited_classes: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Membership {
  id: string;
  athlete_id: string;
  plan_id: string | null;
  gym_id: string;
  status: MembershipStatus;
  start_date: string;
  end_date: string;
  classes_used: number;
  auto_renew: boolean;
  created_at: string;
}

export interface MembershipWithPlan extends Membership {
  plan: MembershipPlan;
}

// ============================================
// CLASSES
// ============================================

export interface ClassSection {
  name: string;
  minutes: number;
  description?: string;
}

export interface ClassTemplate {
  id: string;
  gym_id: string;
  profile_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  capacity: number;
  level: ClassLevel;
  focus_area: string[];
  color: string;
  sections: ClassSection[];
  is_active: boolean;
  created_at: string;
}

export interface ScheduledClass {
  id: string;
  class_template_id: string | null;
  gym_id: string;
  profile_id: string;
  coach_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  current_bookings: number;
  is_cancelled: boolean;
  notes: string | null;
  created_at: string;
}

export interface ScheduledClassWithDetails extends ScheduledClass {
  class_templates?: ClassTemplate;
  profiles?: Profile;
  spots_remaining: number;
}

// ============================================
// BOOKINGS
// ============================================

export interface Booking {
  id: string;
  athlete_id: string;
  scheduled_class_id: string;
  gym_id: string;
  status: BookingStatus;
  created_at: string;
}

export interface BookingWithAthlete extends Booking {
  athlete: AthleteWithProfile;
}

// ============================================
// TICKETS
// ============================================

export interface Ticket {
  id: string;
  athlete_id: string | null;
  gym_id: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  response_count: number;
  created_at: string;
}

export interface TicketWithDetails extends Ticket {
  athlete?: AthleteWithProfile;
  assignee?: Profile;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  gym_id: string;
  title: string;
  body: string;
  type: NotificationType;
  target_type: NotificationTarget;
  scheduled_for: string | null;
  sent_at: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================
// DASHBOARD
// ============================================

export interface DashboardMetrics {
  total_athletes: number;
  active_athletes: number;
  classes_today: number;
  pending_tickets: number;
  monthly_revenue: number;
}
