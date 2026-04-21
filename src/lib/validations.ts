import { z } from "zod";

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// ATHLETE SCHEMAS
// ============================================

export const athleteSchema = z.object({
  full_name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  health_notes: z.string().optional(),
  current_level: z.enum([
    "beginner",
    "intermediate",
    "advanced",
    "all_levels",
  ]).optional(),
});

export const athleteFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "expired", "new"]).optional(),
  plan_id: z.string().uuid().optional(),
});

export type AthleteInput = z.infer<typeof athleteSchema>;

// ============================================
// CLASS SCHEMAS
// ============================================

export const classSectionSchema = z.object({
  name: z.string().min(1),
  minutes: z.number().int().positive(),
  description: z.string().optional(),
});

export const classTemplateSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  duration_minutes: z
    .number()
    .int()
    .positive()
    .min(15)
    .max(180),
  capacity: z.number().int().positive().max(100),
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]),
  focus_area: z.array(z.string()).min(1, "Al menos un enfoque"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido"),
  sections: z.array(classSectionSchema).optional(),
});

export const scheduledClassSchema = z.object({
  class_template_id: z.string().uuid("Template requerido"),
  coach_id: z.string().uuid("Coach requerido"),
  date: z.string().min(1, "Fecha requerida"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  capacity: z.number().int().positive().max(100).optional(),
  notes: z.string().optional(),
});

export type ClassTemplateInput = z.infer<typeof classTemplateSchema>;
export type ScheduledClassInput = z.infer<typeof scheduledClassSchema>;

// ============================================
// COACH SCHEMAS
// ============================================

export const coachSchema = z.object({
  full_name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  specialty: z.array(z.string()).optional(),
  bio: z.string().optional(),
  hourly_rate: z.number().positive().optional().nullable(),
  contract_start: z.string().optional(),
});

export type CoachInput = z.infer<typeof coachSchema>;

// ============================================
// MEMBERSHIP SCHEMAS
// ============================================

export const membershipPlanSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  description: z.string().optional(),
  price: z.number().min(0),
  duration_days: z.number().int().positive().default(30),
  classes_per_week: z.number().int().positive().optional(),
  unlimited_classes: z.boolean().default(false),
});

export type MembershipPlanInput = z.infer<typeof membershipPlanSchema>;

// ============================================
// TICKET SCHEMAS
// ============================================

export const ticketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(10),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export const ticketResponseSchema = z.object({
  message: z.string().min(1),
});

export type TicketInput = z.infer<typeof ticketSchema>;

// ============================================
// NOTIFICATION SCHEMAS
// ============================================

export const notificationSchema = z.object({
  title: z.string().min(2).max(100),
  body: z.string().min(5).max(500),
  type: z.enum(["info", "promotion", "reminder", "alert", "announcement"]),
  target_type: z.enum(["all", "active_members", "expired_members"]),
  scheduled_for: z.string().optional(),
});

export type NotificationInput = z.infer<typeof notificationSchema>;

// ============================================
// SETTINGS SCHEMAS
// ============================================

export const gymSettingsSchema = z.object({
  name: z.string().min(2),
  logo_url: z.string().url().optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export type GymSettingsInput = z.infer<typeof gymSettingsSchema>;
