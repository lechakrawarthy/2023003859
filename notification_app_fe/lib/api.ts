import { Notification } from "./types";

const BASE = "http://4.224.186.213/evaluation-service/notifications";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJsc3JlZW5pdkBnaXRhbS5pbiIsImV4cCI6MTc4MDgxNjQ4NSwiaWF0IjoxNzgwODE1NTg1LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNmIyNGJkNDEtZTc5Yi00YWRiLTg4MzktMmUzNzQwMWY1OTFlIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibCBlIGNoYWtyYXdhcnRoeSBzcmVlbml2YXMiLCJzdWIiOiIxMDYyYmJiNy0yZDM1LTRhZTUtYTExYS1iNTI5ODhkMWU5NmQifSwiZW1haWwiOiJsc3JlZW5pdkBnaXRhbS5pbiIsIm5hbWUiOiJsIGUgY2hha3Jhd2FydGh5IHNyZWVuaXZhcyIsInJvbGxObyI6IjIwMjMwMDM4NTkiLCJhY2Nlc3NDb2RlIjoid2dLdGdaIiwiY2xpZW50SUQiOiIxMDYyYmJiNy0yZDM1LTRhZTUtYTExYS1iNTI5ODhkMWU5NmQiLCJjbGllbnRTZWNyZXQiOiJLTkJQQmVkYnhSam5yWllHIn0.wqnQmcwl1mWypAdU4o1DyanuVQqZaDuh0S6QLDHL0gc";

export async function fetchNotifications(params?: {
  page?: number;
  limit?: number;
  notification_type?: string;
}): Promise<{ notifications: Notification[] }> {
  const url = new URL(BASE);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.notification_type)
    url.searchParams.set("notification_type", params.notification_type);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}
