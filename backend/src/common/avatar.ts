import { createHash } from 'crypto';

/**
 * Generated avatars, so nobody lands on a board as a grey circle.
 *
 * DiceBear renders a deterministic illustration from a seed. Picking the style
 * as well as the seed is what keeps a team visually distinct — a workspace of
 * "adventurer" faces all look like relatives, whereas one robot among the
 * peeps is instantly recognisable at 24px.
 */
export const AVATAR_STYLES = [
  'adventurer',
  'avataaars',
  'big-ears',
  'bottts',
  'fun-emoji',
  'lorelei',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'thumbs',
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];

/** Soft backgrounds from the design's palette. */
const BACKGROUNDS = 'c0aede,b6e3f4,ffd5dc,d1d4f9,ffdfbf';

export function buildAvatarUrl(style: AvatarStyle, seed: string): string {
  const params = new URLSearchParams({
    seed,
    size: '96',
    backgroundColor: BACKGROUNDS,
  });
  return `https://api.dicebear.com/9.x/${style}/png?${params.toString()}`;
}

/** Stable index derived from the seed, so the same user always gets the same style. */
function styleFor(seed: string): AvatarStyle {
  const digest = createHash('sha256').update(seed).digest();
  return AVATAR_STYLES[digest[0] % AVATAR_STYLES.length];
}

/**
 * The avatar a new account starts with. Derived rather than random so a user
 * who signs out and back in is not handed a different face.
 */
export function defaultAvatarUrl(seed: string): string {
  return buildAvatarUrl(styleFor(seed), seed);
}

/**
 * One option per style for the profile picker, starting with the one already
 * assigned so the current choice reads as selected rather than missing.
 */
export function avatarOptions(seed: string): string[] {
  const current = styleFor(seed);
  return [current, ...AVATAR_STYLES.filter((style) => style !== current)].map(
    (style) => buildAvatarUrl(style, seed),
  );
}
