export const VOLUNTEER_ACTIVE_ORDER_STATUSES = [
  "paid",
  "assigned",
  "preparing",
  "in_progress",
] as const;

export const VOLUNTEER_COMPLETED_ORDER_STATUSES = [
  "fulfilled",
  "completed",
] as const;

export const VOLUNTEER_ACTIONABLE_ORDER_STATUSES = [
  ...VOLUNTEER_ACTIVE_ORDER_STATUSES,
  ...VOLUNTEER_COMPLETED_ORDER_STATUSES,
] as const;

type VolunteerOrderStatus = (typeof VOLUNTEER_ACTIONABLE_ORDER_STATUSES)[number];

export const isVolunteerActionableOrderStatus = (status: string | null | undefined) =>
  VOLUNTEER_ACTIONABLE_ORDER_STATUSES.includes(status as VolunteerOrderStatus);

export const isVolunteerActiveOrderStatus = (status: string | null | undefined) =>
  VOLUNTEER_ACTIVE_ORDER_STATUSES.includes(status as VolunteerOrderStatus);

export const isVolunteerCompletedOrderStatus = (status: string | null | undefined) =>
  VOLUNTEER_COMPLETED_ORDER_STATUSES.includes(status as VolunteerOrderStatus);
