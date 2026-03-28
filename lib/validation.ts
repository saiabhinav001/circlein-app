/**
 * Password validation for ADMIN users.
 * Returns an error message string, or null if the password is valid.
 * Extracted from admin-settings-ui.tsx (Phase 3 cleanup).
 */
export function getAdminPasswordValidationError(password: string): string | null;
export function getAdminPasswordValidationError(password: string, minLength: number): string | null;
export function getAdminPasswordValidationError(password: string, minLength = 12): string | null {
  if (password.length < minLength) {
    return `Admin password must be at least ${minLength} characters.`;
  }

  if (!/[A-Z]/.test(password)) {
    return 'Admin password must include at least one uppercase letter.';
  }

  if (!/[a-z]/.test(password)) {
    return 'Admin password must include at least one lowercase letter.';
  }

  if (!/[0-9]/.test(password)) {
    return 'Admin password must include at least one number.';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Admin password must include at least one special character.';
  }

  return null;
}

/**
 * Password validation for RESIDENT users.
 * Returns an error message string, or null if the password is valid.
 * Extracted from resident-settings-ui.tsx (Phase 3 cleanup).
 */
export function getResidentPasswordValidationError(password: string): string | null;
export function getResidentPasswordValidationError(password: string, minLength: number): string | null;
export function getResidentPasswordValidationError(password: string, minLength = 8): string | null {
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters.`;
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character.';
  }

  return null;
}
