// Common weak passwords to reject
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

/**
 * Validate email format with additional security checks
 * @param {string} email - Email to validate
 * @returns {object} { valid: boolean, message: string }
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { valid: false, message: "Email is required" };
  }

  const trimmed = email.trim();

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: "Please enter a valid email address" };
  }

  // Check for common typos in popular domains
  const commonDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
  ];
  const domain = trimmed.split("@")[1]?.toLowerCase();

  // Check for suspicious patterns
  if (trimmed.length > 254) {
    return { valid: false, message: "Email address is too long" };
  }

  const localPart = trimmed.split("@")[0];
  if (localPart.length > 64) {
    return { valid: false, message: "Email local part is too long" };
  }

  // Check for multiple @ symbols
  if ((trimmed.match(/@/g) || []).length !== 1) {
    return { valid: false, message: "Email must contain exactly one @ symbol" };
  }

  // Check for spaces
  if (/\s/.test(trimmed)) {
    return { valid: false, message: "Email cannot contain spaces" };
  }

  return { valid: true, message: "" };
}

/**
 * Check password strength and return detailed feedback
 * @param {string} password - Password to check
 * @returns {object} { score: number (0-4), feedback: array, strength: string }
 */
export function checkPasswordStrength(password) {
  if (!password) {
    return { score: 0, feedback: [], strength: "none", color: "secondary" };
  }

  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) score++;
  else feedback.push("At least 8 characters");

  if (password.length >= 12) score++;

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("Include uppercase letters (A-Z)");
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("Include lowercase letters (a-z)");
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push("Include numbers (0-9)");
  }

  // Special character check
  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push("Include special characters (!@#$%^&*)");
  }

  // Calculate final score
  const finalScore = Math.min(4, Math.floor(score / 1.5));

  const strengthMap = {
    0: { strength: "Very Weak", color: "danger" },
    1: { strength: "Weak", color: "danger" },
    2: { strength: "Fair", color: "warning" },
    3: { strength: "Good", color: "info" },
    4: { strength: "Strong", color: "success" },
  };

  return {
    score: finalScore,
    feedback,
    ...strengthMap[finalScore],
  };
}

/**
 * Validate password with comprehensive checks
 * @param {string} password - Password to validate
 * @param {object} options - Validation options
 * @returns {object} { valid: boolean, message: string, strength: object }
 */
export function validatePassword(password, options = {}) {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    checkCommonPasswords = true,
  } = options;

  if (!password) {
    return {
      valid: false,
      message: "Password is required",
      strength: checkPasswordStrength(password),
    };
  }

  // Length check
  if (password.length < minLength) {
    return {
      valid: false,
      message: `Password must be at least ${minLength} characters`,
      strength: checkPasswordStrength(password),
    };
  }

  // Check for common weak passwords
  if (
    checkCommonPasswords &&
    COMMON_PASSWORDS.includes(password.toLowerCase())
  ) {
    return {
      valid: false,
      message: "This password is too common. Please choose a stronger password",
      strength: checkPasswordStrength(password),
    };
  }

  // Uppercase check
  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
      strength: checkPasswordStrength(password),
    };
  }

  // Lowercase check
  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
      strength: checkPasswordStrength(password),
    };
  }

  // Number check
  if (requireNumbers && !/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
      strength: checkPasswordStrength(password),
    };
  }

  // Special character check
  if (requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      message:
        "Password must contain at least one special character (!@#$%^&*)",
      strength: checkPasswordStrength(password),
    };
  }

  // Check for sequential characters
  if (
    /012|123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(
      password,
    )
  ) {
    return {
      valid: false,
      message: "Password should not contain sequential characters",
      strength: checkPasswordStrength(password),
    };
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    return {
      valid: false,
      message: "Password should not contain repeated characters",
      strength: checkPasswordStrength(password),
    };
  }

  const strength = checkPasswordStrength(password);

  // Require at least "Fair" strength
  if (strength.score < 2) {
    return {
      valid: false,
      message: "Password is too weak. Please follow the requirements below",
      strength,
    };
  }

  return {
    valid: true,
    message: "",
    strength,
  };
}

/**
 * Validate name field
 * @param {string} name - Name to validate
 * @returns {object} { valid: boolean, message: string }
 */
export function validateName(name) {
  if (!name || !name.trim()) {
    return { valid: false, message: "Name is required" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, message: "Name must be at least 2 characters" };
  }

  if (trimmed.length > 120) {
    return { valid: false, message: "Name is too long (max 120 characters)" };
  }

  // Check for invalid characters
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return {
      valid: false,
      message:
        "Name can only contain letters, spaces, hyphens, and apostrophes",
    };
  }

  return { valid: true, message: "" };
}
