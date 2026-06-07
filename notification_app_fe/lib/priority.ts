import { Notification } from "./types";

const TYPE_WEIGHT: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function score(n: Notification): number {
  const weight = TYPE_WEIGHT[n.Type] ?? 1;
  return weight * 1_000_000_000_000 + new Date(n.Timestamp).getTime();
}

export function getTopN(notifications: Notification[], n: number): Notification[] {
  return [...notifications].sort((a, b) => score(b) - score(a)).slice(0, n);
}
