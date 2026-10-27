/**
 * CyberGuard Security & Privacy Guardrails
 * Actively prevents users from submitting passwords, OTPs, PINs, card numbers, or PII.
 */

export interface SensitivityCheckResult {
  hasSensitiveData: boolean;
  warningMessage?: string;
  sanitizedText?: string;
  detectedType?: 'otp' | 'card' | 'password' | 'ssn';
}

// Regex patterns to detect sensitive data
const OTP_REGEX = /\b(?:otp|one[- ]time[- ]password|verification[- ]code|pin|code)\s*(?:is|:|=)?\s*([0-9]{4,8})\b/i;
const STANDALONE_OTP_REGEX = /\b[0-9]{6}\b/;
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/;
const PASSWORD_LEAK_REGEX = /\b(?:password|passwd|pwd)\s*(?:is|:|=)\s*([^\s]{4,})/i;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/;

export function checkSensitiveInput(text: string): SensitivityCheckResult {
  if (!text) return { hasSensitiveData: false };

  // 1. Check for Password disclosure
  if (PASSWORD_LEAK_REGEX.test(text)) {
    return {
      hasSensitiveData: true,
      detectedType: 'password',
      warningMessage: '🚨 **Privacy & Security Alert**: It looks like you entered a password. **Never share real passwords with any chatbot, website, or person.** If this is an active password, change it immediately on the affected service!',
      sanitizedText: text.replace(PASSWORD_LEAK_REGEX, '[REDACTED_PASSWORD]')
    };
  }

  // 2. Check for OTP / verification codes
  if (OTP_REGEX.test(text) || (STANDALONE_OTP_REGEX.test(text) && text.length < 20)) {
    return {
      hasSensitiveData: true,
      detectedType: 'otp',
      warningMessage: '🚨 **Privacy Alert: Never share One-Time Passwords (OTPs)** or verification codes. Legitimate organizations, banks, and cybersecurity assistants will NEVER ask for your OTP. Sharing an OTP gives attackers instant access to hijack your accounts!',
      sanitizedText: text.replace(OTP_REGEX, '[REDACTED_OTP]')
    };
  }

  // 3. Check for Credit Card numbers
  const cardMatch = text.match(CREDIT_CARD_REGEX);
  if (cardMatch) {
    const rawDigits = cardMatch[0].replace(/\D/g, '');
    if (rawDigits.length >= 13 && rawDigits.length <= 19) {
      return {
        hasSensitiveData: true,
        detectedType: 'card',
        warningMessage: '🚨 **Financial Privacy Alert**: Credit/debit card numbers detected. **Never paste financial card numbers into chat windows.** CyberGuard does not collect financial data.',
        sanitizedText: text.replace(CREDIT_CARD_REGEX, '[REDACTED_CARD_NUMBER]')
      };
    }
  }

  // 4. Check for SSN
  if (SSN_REGEX.test(text)) {
    return {
      hasSensitiveData: true,
      detectedType: 'ssn',
      warningMessage: '🚨 **Identity Theft Warning**: Social Security Number or National ID pattern detected. Never submit government ID numbers online to unverified channels.',
      sanitizedText: text.replace(SSN_REGEX, '[REDACTED_SSN]')
    };
  }

  return { hasSensitiveData: false };
}
