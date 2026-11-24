export type Level = 0 | 1 | 2 | 3 | 4;

export interface Week {
  /** ISO date of the week's first day. */
  firstDay: string;
  /** Weekday (0 = Sunday) of the week's first day. */
  weekday: number;
  /** One entry per day that exists in this week; the first and last week can be partial. */
  counts: number[];
  levels: Level[];
}

export interface Calendar {
  total: number;
  weeks: Week[];
}

const LEVELS: Record<string, Level> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { firstDay contributionDays { contributionCount contributionLevel weekday } }
      }
    }
  }
}`;

interface GqlDay { contributionCount: number; contributionLevel: string; weekday: number }
interface GqlResponse {
  data?: { user: { contributionsCollection: { contributionCalendar: {
    totalContributions: number;
    weeks: { firstDay: string; contributionDays: GqlDay[] }[];
  } } } | null };
  errors?: { message: string }[];
}

export async function fetchCalendar(username: string, token: string, fetchImpl: typeof fetch = fetch): Promise<Calendar> {
  const res = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'gh-night-city' },
    body: JSON.stringify({ query: QUERY, variables: { login: username } }),
  });
  const body = (await res.json().catch(() => ({}))) as GqlResponse & { message?: string };
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}${body.message ? `: ${body.message}` : ''}`);
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join('; '));
  const cal = body.data?.user?.contributionsCollection.contributionCalendar;
  if (!cal) throw new Error(`No contribution calendar returned for "${username}"`);
  return {
    total: cal.totalContributions,
    weeks: cal.weeks.map((w) => ({
      firstDay: w.firstDay,
      weekday: w.contributionDays[0]?.weekday ?? 0,
      counts: w.contributionDays.map((d) => d.contributionCount),
      levels: w.contributionDays.map((d) => LEVELS[d.contributionLevel] ?? 0),
    })),
  };
}

/** Adapter for the compact format of docs/reference/sample-calendar.json. */
export function calendarFromSample(json: { total: number; weeks: { d: string; wd: number; c: number[]; l: number[] }[] }): Calendar {
  return {
    total: json.total,
    weeks: json.weeks.map((w) => ({ firstDay: w.d, weekday: w.wd, counts: w.c, levels: w.l as Level[] })),
  };
}
