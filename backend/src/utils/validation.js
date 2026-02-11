// Backend validation utilities for enhanced security

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - No common passwords
 * - No sequential or repeated characters
 */

const COMMON_PASSWORDS = [
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "monkey",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "iloveyou",
  "master",
  "sunshine",
  "ashley",
  "bailey",
  "passw0rd",
  "shadow",
  "superman",
  "qazwsx",
  "michael",
  "football",
];

export function validatePasswordStrength(password) {
  const errors = [];

  // Length check
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Special character check
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*)",
    );
  }

  // Common password check
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push(
      "This password is too common. Please choose a stronger password",
    );
  }

  // Sequential characters check
  if (
    /012|123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(
      password,
    )
  ) {
    errors.push("Password should not contain sequential characters");
  }

  // Repeated characters check
  if (/(.)\1{2,}/.test(password)) {
    errors.push("Password should not contain repeated characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  const errors = [];

  if (!email || !email.trim()) {
    errors.push("Email is required");
    return { valid: false, errors };
  }

  const trimmed = email.trim();

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    errors.push("Invalid email format");
  }

  // Length check
  if (trimmed.length > 254) {
    errors.push("Email address is too long");
  }

  const localPart = trimmed.split("@")[0];
  if (localPart && localPart.length > 64) {
    errors.push("Email local part is too long");
  }

  // Check for multiple @ symbols
  if ((trimmed.match(/@/g) || []).length !== 1) {
    errors.push("Email must contain exactly one @ symbol");
  }

  // Check for spaces
  if (/\s/.test(trimmed)) {
    errors.push("Email cannot contain spaces");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate name
 */
export function validateName(name) {
  const errors = [];

  if (!name || !name.trim()) {
    errors.push("Name is required");
    return { valid: false, errors };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  if (trimmed.length > 120) {
    errors.push("Name is too long (max 120 characters)");
  }

  // Check for invalid characters
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    errors.push(
      "Name can only contain letters, spaces, hyphens, and apostrophes",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
