// Every size, scale and timing in one place, so they can become action inputs later.

/** Contribution square size, spacing and corner radius. */
export const CS = 12;
export const PITCH = 14;
export const RADIUS = 2.5;
/** Left and right margin. */
export const LEFT = 10;
/** Sky height above the elevated track. */
export const SKY = 84;
/** y of the elevated track deck. */
export const DECK = SKY + 24;
/** y of the first row of squares. */
export const GTOP = DECK + 10;
/** Height of the 7-row grid. */
export const GH = 7 * PITCH - 2;
export const BOTTOM = 10;

export const TRAIN_SCALE = 1.8;
export const RIDER_SCALE = 1;

/** Loop phases in seconds. */
export const PHASES = { day: 2.5, dusk: 1.8, on: 4, night: 13, dawn: 1.8 } as const;
export const CYCLE = PHASES.day + PHASES.dusk + PHASES.on + PHASES.night + PHASES.dawn; // 23.1
/** Phase boundaries. */
export const T_DUSK = PHASES.day;
export const T_ON = T_DUSK + PHASES.dusk;
export const T_NIGHT = T_ON + PHASES.on;
export const T_DAWN = T_NIGHT + PHASES.night;

export const TRAIN_DURATION = 15;
export const TRAIN_START = T_ON + 1.2;

export const SIGN_MAX = 40;
export const DEFAULT_SIGN = 'coding 24/7';
