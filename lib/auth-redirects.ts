/** Where users set a new password after clicking the reset email link. */
export const PASSWORD_UPDATE_PATH = '/login/update-password'

/**
 * redirectTo for resetPasswordForEmail — exchanges the code on /auth/callback,
 * then sends the user to the password update page (not the dashboard).
 */
export function getPasswordResetRedirectTo(origin: string): string {
  return `${origin}/auth/callback?next=${encodeURIComponent(PASSWORD_UPDATE_PATH)}`
}
