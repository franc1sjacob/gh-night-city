import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { calendarFromSample, fetchCalendar } from '../src/data/calendar.js';

const gql = JSON.parse(readFileSync(new URL('./fixtures/graphql-response.json', import.meta.url), 'utf8'));
const sample = JSON.parse(readFileSync(new URL('./fixtures/sample-calendar.json', import.meta.url), 'utf8'));

function stub(body: unknown, status = 200) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe('fetchCalendar', () => {
  it('maps GitHub levels to 0-4', async () => {
    const cal = await fetchCalendar('someone', 'tok', stub(gql).impl);
    expect(cal.total).toBe(12);
    expect(cal.weeks[0].firstDay).toBe('2025-11-23');
    expect(cal.weeks[0].levels).toEqual([0, 1, 2, 0, 0, 0, 0]);
    expect(cal.weeks[1].levels).toEqual([3, 4]);
    expect(cal.weeks[1].counts).toEqual([1, 5]);
    expect(cal.weeks[1].weekday).toBe(0);
  });

  it('sends the token and username', async () => {
    const s = stub(gql);
    await fetchCalendar('someone', 'tok123', s.impl);
    const headers = new Headers(s.calls[0].init.headers);
    expect(headers.get('authorization')).toBe('bearer tok123');
    expect(JSON.parse(String(s.calls[0].init.body)).variables).toEqual({ login: 'someone' });
  });

  it("throws GitHub's message on GraphQL errors", async () => {
    const msg = "Could not resolve to a User with the login of 'nope'.";
    await expect(fetchCalendar('nope', 'tok', stub({ errors: [{ message: msg }] }).impl)).rejects.toThrow(msg);
  });

  it('throws on HTTP 401', async () => {
    await expect(fetchCalendar('x', 'bad', stub({ message: 'Bad credentials' }, 401).impl)).rejects.toThrow('401');
  });
});

describe('calendarFromSample', () => {
  it('round-trips the reference sample', () => {
    const cal = calendarFromSample(sample);
    expect(cal.weeks).toHaveLength(53);
    expect(cal.total).toBe(1844);
    expect(cal.weeks[0].levels).toEqual(sample.weeks[0].l);
  });
});
