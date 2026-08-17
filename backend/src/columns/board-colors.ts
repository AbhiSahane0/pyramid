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

/**
 * The board every new workspace starts with — the design's five columns.
 *
 * `isDone` marks the one that means finished. Without it a fresh board has no
 * finished column at all, so "overdue" would include completed work and
 * "what did we finish this week" would always answer nothing.
 */
export const DEFAULT_COLUMNS: {
  name: string;
  color: BoardColor;
  isDone?: boolean;
}[] = [
  { name: 'Backlog', color: 'amber' },
  { name: 'To Do', color: 'slate' },
  { name: 'Doing', color: 'blue' },
  { name: 'Completed', color: 'emerald', isDone: true },
  { name: 'On Hold', color: 'orange' },
];

/** Gap between adjacent positions, leaving room to insert without a rewrite. */
export const POSITION_STEP = 1000;
