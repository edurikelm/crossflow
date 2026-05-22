import { AthleteStatus, AthleteStatusOverride } from "@/types";

export function computeAthleteStatus(
  athlete: { status_override: AthleteStatusOverride | null; trial_ends_at: string | null; membership?: { end_date: string }[]; memberships?: { end_date: string }[] },
  membership?: { end_date: string } | null
): AthleteStatus {
  if (athlete.status_override) {
    if (athlete.status_override === "trial") {
      if (athlete.trial_ends_at) {
        const today = new Date().toISOString().split("T")[0];
        if (athlete.trial_ends_at.split("T")[0] < today) {
          return "expired";
        }
      }
      return "trial";
    }
    return athlete.status_override;
  }

  const latestMembership = membership ?? getLatestMembership(athlete.membership ?? athlete.memberships);

  if (!latestMembership) {
    return "expired";
  }

  const today = new Date().toISOString().split("T")[0];
  const endDate = latestMembership.end_date.split("T")[0];

  return endDate >= today ? "active" : "expired";
}

function getLatestMembership(memberships?: { end_date: string }[]): { end_date: string } | null {
  if (!memberships || memberships.length === 0) return null;
  return [...memberships].sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
}

export function getBadgeVariantForStatus(status: AthleteStatus): string {
  switch (status) {
    case "active":
      return "success";
    case "trial":
      return "warning";
    case "expired":
    case "paused":
    case "inactive":
      return "secondary";
    case "suspended":
      return "destructive";
    default:
      return "secondary";
  }
}

export function matchesStatusFilter(computedStatus: AthleteStatus, statusFilter: string): boolean {
  if (statusFilter === "all") return true;
  if (statusFilter === "active") return computedStatus === "active" || computedStatus === "trial";
  return computedStatus === statusFilter;
}

export function countActiveAndTrial(
  athletes: { computed_status?: AthleteStatus; status_override?: AthleteStatusOverride | null; trial_ends_at?: string | null; membership?: { end_date: string }[] }[]
): number {
  return athletes.filter((a) => {
    const status = a.computed_status ?? computeAthleteStatus(
      { status_override: a.status_override ?? null, trial_ends_at: a.trial_ends_at ?? null },
      a.membership?.[0]
    );
    return status === "active" || status === "trial";
  }).length;
}
