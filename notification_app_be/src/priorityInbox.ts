import { Log } from "logging-middleware";

interface Notification {
  ID: string;
  Type: "Placement" | "Result" | "Event";
  Message: string;
  Timestamp: string;
}

const TYPE_WEIGHT: Record<Notification["Type"], number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

class PriorityInbox {
  private topNotifications: Notification[] = [];
  private readonly limit = 10;

  private getScore(notification: Notification): number {
    const weightScore = TYPE_WEIGHT[notification.Type] * 1_000_000_000_000;
    const recencyScore = new Date(notification.Timestamp).getTime();
    return weightScore + recencyScore;
  }

  private compare(a: Notification, b: Notification): number {
    return this.getScore(a) - this.getScore(b);
  }

  add(notification: Notification): void {
    this.topNotifications.push(notification);
    this.topNotifications.sort((a, b) => this.compare(a, b));
    if (this.topNotifications.length > this.limit) {
      this.topNotifications.shift();
    }
  }

  getTopNotifications(): Notification[] {
    return [...this.topNotifications].sort(
      (a, b) => this.getScore(b) - this.getScore(a)
    );
  }
}

async function fetchNotifications(token: string): Promise<Notification[]> {
  await Log("backend", "info", "service", "Fetching notifications from API");

  const response = await fetch(
    "http://4.224.186.213/evaluation-service/notifications",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data = await response.json();
  return data.notifications;
}

async function main() {
  const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJsc3JlZW5pdkBnaXRhbS5pbiIsImV4cCI6MTc4MDgxOTY4OSwiaWF0IjoxNzgwODE4Nzg5LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNGYxMzljNTUtYjk1NC00ZTZhLTkxODctMzY0ZWRmNDcwMTQwIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibCBlIGNoYWtyYXdhcnRoeSBzcmVlbml2YXMiLCJzdWIiOiIxMDYyYmJiNy0yZDM1LTRhZTUtYTExYS1iNTI5ODhkMWU5NmQifSwiZW1haWwiOiJsc3JlZW5pdkBnaXRhbS5pbiIsIm5hbWUiOiJsIGUgY2hha3Jhd2FydGh5IHNyZWVuaXZhcyIsInJvbGxObyI6IjIwMjMwMDM4NTkiLCJhY2Nlc3NDb2RlIjoid2dLdGdaIiwiY2xpZW50SUQiOiIxMDYyYmJiNy0yZDM1LTRhZTUtYTExYS1iNTI5ODhkMWU5NmQiLCJjbGllbnRTZWNyZXQiOiJLTkJQQmVkYnhSam5yWllHIn0.2Pn1e8S14bvMydlCtjF5R-MzoF2ZK2wNNSuorPUpE-U"
  await Log("backend", "info", "service", "Priority inbox starting");

  const notifications = await fetchNotifications(ACCESS_TOKEN);

  const priorityInbox = new PriorityInbox();
  notifications.forEach((notification) => {
    priorityInbox.add(notification);
  });

  const top10 = priorityInbox.getTopNotifications();

  console.log("\nTOP 10 PRIORITY NOTIFICATIONS\n");
  top10.forEach((notification, index) => {
    console.log(
      `${index + 1}. [${notification.Type}] ${notification.Message} | ${notification.Timestamp}`
    );
  });

  await Log("backend", "info", "service", "Priority inbox display complete");
}

main().catch(console.error);

