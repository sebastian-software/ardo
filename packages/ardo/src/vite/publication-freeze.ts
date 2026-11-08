/**
 * Source of `_ardoFreeze`, which generated publication modules run once when they load. Site
 * modules get the same objects as Ardo's views, so a mutation such as sorting `publication.posts`
 * in `meta` would change other pages and break hydration; frozen data makes it throw instead.
 */
export const FREEZE_SOURCE =
  'function _ardoFreeze(value) { if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) _ardoFreeze(child); } return value; }'
