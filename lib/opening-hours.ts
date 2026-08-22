import type { OpeningHour } from "@/types/database";

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function nowInSaoPaulo(): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekdayPart = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hourPart = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minutePart = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  return { weekday: weekdayMap[weekdayPart] ?? 0, minutes: hourPart * 60 + minutePart };
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export type OpenStatus = {
  isOpen: boolean;
  nextOpening: string | null;
};

export function getOpenStatus(hours: Pick<OpeningHour, "weekday" | "opens_at" | "closes_at">[]): OpenStatus {
  if (hours.length === 0) return { isOpen: true, nextOpening: null };

  const { weekday, minutes } = nowInSaoPaulo();

  const isOpenNow = hours.some((h) => {
    if (h.weekday !== weekday) return false;
    const opens = toMinutes(h.opens_at);
    const closes = toMinutes(h.closes_at);
    return minutes >= opens && minutes < closes;
  });

  if (isOpenNow) return { isOpen: true, nextOpening: null };

  for (let offset = 0; offset < 7; offset++) {
    const day = (weekday + offset) % 7;
    const dayHours = hours
      .filter((h) => h.weekday === day)
      .sort((a, b) => toMinutes(a.opens_at) - toMinutes(b.opens_at));

    for (const h of dayHours) {
      if (offset === 0 && toMinutes(h.opens_at) <= minutes) continue;
      const label = offset === 0 ? "hoje" : offset === 1 ? "amanhã" : WEEKDAY_LABELS[day];
      return { isOpen: false, nextOpening: `${label} às ${h.opens_at}` };
    }
  }

  return { isOpen: false, nextOpening: null };
}

export function groupHoursByWeekday(
  hours: Pick<OpeningHour, "weekday" | "opens_at" | "closes_at">[],
): { weekday: number; label: string; periods: { opens_at: string; closes_at: string }[] }[] {
  return WEEKDAY_LABELS.map((label, weekday) => ({
    weekday,
    label,
    periods: hours
      .filter((h) => h.weekday === weekday)
      .sort((a, b) => toMinutes(a.opens_at) - toMinutes(b.opens_at))
      .map((h) => ({ opens_at: h.opens_at, closes_at: h.closes_at })),
  }));
}

export { WEEKDAY_LABELS };
