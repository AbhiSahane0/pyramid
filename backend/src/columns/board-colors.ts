/**
 * The palette a column may use.
 *
 * Keys, not CSS: the client owns how each one renders, so a column stays
 * legible when the theme flips. Free-form hex would let someone pick white on
 * white and there would be no way to fix it centrally.
 */
export const BOARD_COLORS = [
  'slate',
  'blue',
  'emerald',
  'amber',
  'orange',
  'red',
  'violet',
  'pink',
  'teal',
] as const;

export type BoardColor = (typeof BOARD_COLORS)[number];

/** The board every new workspace starts with — the design's five columns. */
export const DEFAULT_COLUMNS: { name: string; color: BoardColor }[] = [
  { name: 'Backlog', color: 'amber' },
  { name: 'To Do', color: 'slate' },
  { name: 'Doing', color: 'blue' },
  { name: 'Completed', color: 'emerald' },
  { name: 'On Hold', color: 'orange' },
];

/** Gap between adjacent positions, leaving room to insert without a rewrite. */
export const POSITION_STEP = 1000;
