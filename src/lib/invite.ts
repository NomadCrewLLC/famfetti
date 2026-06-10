/**
 * Invite links. An invite link is just the family's existing invite code
 * (families.invite_code) wrapped in a sign-up URL, so the person we invite
 * never has to retype it:
 *
 *   https://famfetti.app/sign-up?invite=X7K2P9
 *
 * Nothing here talks to Supabase — joining is still `joinFamily()` in
 * ./families. This module only builds the URL and remembers a code across the
 * email-confirmation gap (see savePendingInviteCode below).
 */

/** Query param the sign-up page reads the code from. */
export const INVITE_PARAM = 'invite';

/** Query param that puts sign-up in "I'm starting a new family" mode. */
export const NEW_FAMILY_PARAM = 'new';

const PENDING_CODE_KEY = 'famfetti:pendingInviteCode';

/**
 * Build the shareable sign-up link for an invite code. Uses the current
 * origin, so it works in local dev and production without any config.
 * Client-side only — there's no window on the server.
 */
export function buildInviteLink(code: string): string {
  return `${window.location.origin}/sign-up?${INVITE_PARAM}=${encodeURIComponent(code)}`;
}

/**
 * Codes are compared uppercase everywhere (the join_family RPC does
 * `upper(trim(...))`), so normalize before sending one anywhere.
 */
export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * When the Supabase project has email confirmation turned on, signUp() returns
 * no session — we can't join a family yet, because join_family needs an
 * authenticated user. So we park the code here and redeem it on /welcome once
 * the user has confirmed and signed in.
 *
 * All three helpers no-op if there's no window (server render) or if
 * localStorage throws, which it does in Safari private mode.
 */
export function savePendingInviteCode(code: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PENDING_CODE_KEY, normalizeInviteCode(code));
  } catch {
    // Storage unavailable — the user can still join manually from /welcome.
  }
}

export function readPendingInviteCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(PENDING_CODE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingInviteCode(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PENDING_CODE_KEY);
  } catch {
    // Nothing to do — a stale code just means one extra failed join attempt.
  }
}
