/**
 * CyberGuard Knowledge Base, Incident Playbooks, and Rule-Based Engine
 */

export interface ResourceLink {
  name: string;
  url: string;
  description: string;
  badge?: string;
}

export interface Playbook {
  id: string;
  title: string;
  icon: string;
  urgency: 'high' | 'critical' | 'medium';
  summary: string;
  steps: string[];
  tips: string[];
  officialResources: ResourceLink[];
}

export const OFFICIAL_RESOURCES: ResourceLink[] = [
  {
    name: 'FTC Report Fraud',
    url: 'https://reportfraud.ftc.gov',
    description: 'Official US government portal to report scams, fraud, and bad business practices.',
    badge: 'Federal Trade Commission'
  },
  {
    name: 'FBI Internet Crime Complaint Center (IC3)',
    url: 'https://www.ic3.gov',
    description: 'Report cybercrimes, ransomware attacks, business email compromise, and wire fraud.',
    badge: 'Law Enforcement'
  },
  {
    name: 'CISA Free Cybersecurity Resources',
    url: 'https://www.cisa.gov/resources-tools/resources',
    description: 'Cybersecurity and Infrastructure Security Agency advice for citizens and businesses.',
    badge: 'Government Alert'
  },
  {
    name: 'Have I Been Pwned',
    url: 'https://haveibeenpwned.com',
    description: 'Check if your email or phone number has been exposed in a known data breach.',
    badge: 'Breach Check'
  },
  {
    name: 'VirusTotal Link & File Scanner',
    url: 'https://www.virustotal.com',
    description: 'Scan suspicious URLs, domains, and files with over 70 antivirus scanners simultaneously.',
    badge: 'Threat Analysis'
  },
  {
    name: 'IdentityTheft.gov',
    url: 'https://www.identitytheft.gov',
    description: 'Step-by-step recovery plan if someone has stolen your personal identity or credit.',
    badge: 'Identity Theft'
  }
];

export const EMERGENCY_PLAYBOOKS: Record<string, Playbook> = {
  'suspected-scam': {
    id: 'suspected-scam',
    title: '🚨 Suspected Scam: Demands for Money, OTP, or Urgent Action',
    icon: 'ShieldAlert',
    urgency: 'critical',
    summary: 'If someone is pressuring you right now for money, an OTP code, gift cards, wire transfers, or remote computer access.',
    steps: [
      '🛑 **STOP & DISENGAGE IMMEDIATELY**: Hang up the phone or close the chat. Scammers rely on artificial urgency and panic ("your account will be closed in 15 minutes", "warrant issued for your arrest").',
      '🤐 **NEVER SHARE ONE-TIME PASSWORDS (OTPs)**: Legitimate banks, Amazon, Google, or government agents will NEVER call asking you to read back an SMS code or MFA token.',
      '📵 **NEVER INSTALL REMOTE ACCESS SOFTWARE**: If they ask you to install AnyDesk, TeamViewer, QuickAssist, or UltraViewer, refuse and disconnect.',
      '🔍 **VERIFY OUT-OF-BAND**: Contact the institution directly using the official phone number printed on the back of your credit card or on their official website—NEVER call back the number that contacted you.',
      '💳 **IF MONEY WAS SENT**: Immediately call your bank or credit card fraud department to request a chargeback or stop-payment on wire transfers, and report the transaction.',
      '📝 **REPORT THE INCIDENT**: File an official fraud report at [reportfraud.ftc.gov](https://reportfraud.ftc.gov) or your national cybercrime portal.'
    ],
    tips: [
      'Fictional Example: A caller claiming to be "Chase Fraud Dept" asks for the 6-digit code sent to your phone to "cancel a fake charge". This code is actually the password reset code they need to steal your account!',
      'Government agencies like the IRS, FBI, or Police will never demand immediate payment in gift cards, crypto, or prepaid debit cards.'
    ],
    officialResources: [OFFICIAL_RESOURCES[0], OFFICIAL_RESOURCES[1]]
  },
  'compromised-account': {
    id: 'compromised-account',
    title: '🔐 Compromised Account: Immediate Triage & Account Recovery',
    icon: 'KeyRound',
    urgency: 'critical',
    summary: 'What to do if your email, social media, or banking account has been hacked or logged into by an unauthorized person.',
    steps: [
      '🚪 **FORCE LOGOUT ALL SESSIONS**: If you still have access, go to Account Settings > Security and click "Sign out of all other sessions / Log out everywhere".',
      '🔑 **CHANGE PASSWORD IMMEDIATELY**: Create a strong passphrase (at least 16 characters or 4 random words, e.g., `purple-tractor-galaxy-velvet`). Make sure it is unique and not used anywhere else.',
      '🛡️ **ENABLE TWO-FACTOR AUTHENTICATION (2FA)**: Activate 2FA immediately. Prefer an Authenticator App (such as Google Authenticator, Bitwarden, or Aegis) over SMS text verification.',
      '🔎 **CHECK RECOVERY DETAILS**: Review your account recovery email address and phone number. Attackers frequently alter these so they can reclaim access later.',
      '📧 **INSPECT EMAIL FILTERS & FORWARDING**: If your email was compromised, hackers often set silent forwarding rules to divert password resets. In Gmail/Outlook, check Settings > Filters/Forwarding.',
      '🚫 **REVOKE CONNECTED APPS**: Look for unauthorized third-party apps with OAuth access in "Apps with access to your account" and remove them.',
      '⚠️ **IF COMPLETELY LOCKED OUT**: Go to the provider’s official Account Recovery flow (e.g., accounts.google.com/signin/recovery), submit identity verification, and contact customer support through official channels.'
    ],
    tips: [
      'Check if your credentials were leaked in past data breaches at [HaveIBeenPwned.com](https://haveibeenpwned.com).',
      'Never hire "hackers on Instagram/Telegram" who claim they can recover your account for a fee—100% of recovery scammers are fraudsters.'
    ],
    officialResources: [OFFICIAL_RESOURCES[3], OFFICIAL_RESOURCES[5]]
  },
  'suspicious-links-files': {
    id: 'suspicious-links-files',
    title: '🔗 Suspicious Links or Files: Safe Verification & Post-Click Triage',
    icon: 'FileWarning',
    urgency: 'high',
    summary: 'How to check if a link or attachment is dangerous, and exactly what to do if you already clicked or opened it.',
    steps: [
      '👀 **PRE-CLICK VERIFICATION**: Hover over the hyperlink (on desktop) or long-press (on mobile) to inspect the actual destination URL before tapping. Look for typosquatting (e.g., `netfIix.com` with a capital `I` instead of `l`).',
      '🛡️ **SCAN SAFELY**: Copy the suspicious link and paste it into [VirusTotal.com](https://www.virustotal.com) or [urlscan.io](https://urlscan.io) to inspect reputation without visiting the site.',
      '🚨 **POST-CLICK EMERGENCY 1: DISCONNECT**: If you clicked a suspicious link and your device started downloading files or behaving strangely, **disconnect from Wi-Fi and unplug Ethernet immediately** to halt malware communication and data exfiltration.',
      '🔒 **POST-CLICK EMERGENCY 2: DO NOT ENTER CREDENTIALS**: If a clicked link brings up a login screen, DO NOT type your username, password, or OTP.',
      '🗑️ **CHECK DOWNLOADS FOLDER**: Open your Downloads folder and delete any downloaded files with extensions like `.exe`, `.scr`, `.bat`, `.iso`, `.zip`, or `.apk` without double-clicking them.',
      '🩺 **RUN A FULL ANTIVIRUS SCAN**: Run a full scan using Windows Defender, Malwarebytes, or your trusted security software.',
      '📱 **RESET PASSWORDS FROM A CLEAN DEVICE**: If you submitted passwords on a malicious page, use a different (uninfected) device (like your smartphone) to change the password immediately.'
    ],
    tips: [
      'Banks and delivery companies (FedEx, UPS, USPS) will not text you a shortened Bit.ly or random domain link asking for shipping re-delivery fees.',
      'Use multi-engine sandbox inspection tools like VirusTotal before ever executing unknown attachments.'
    ],
    officialResources: [OFFICIAL_RESOURCES[4], OFFICIAL_RESOURCES[2]]
  }
};

export const TOPIC_KNOWLEDGE: Record<string, {
  name: string;
  keywords: string[];
  summary: string;
  keyPractices: string[];
  redFlags: string[];
}> = {
  'phishing': {
    name: 'Phishing and Email Scams',
    keywords: ['phish', 'phishing', 'email scam', 'fake email', 'spoof', 'delivery text', 'usps text', 'invoice scam', 'urgent email'],
    summary: 'Phishing occurs when attackers impersonate trusted institutions (banks, employers, delivery carriers) via email, SMS (smishing), or phone calls (vishing) to steal credentials or financial assets.',
    keyPractices: [
      'Inspect the full sender email address (e.g., support@paypal.sec-notice.com is NOT paypal.com).',
      'Never click links in unexpected emails claiming your account is suspended or that an invoice is overdue; instead navigate to the official website manually.',
      'Beware of smishing (SMS phishing) regarding package delivery fees or unpaid road tolls.',
      'Use modern email providers with built-in SPF, DKIM, and DMARC enforcement.'
    ],
    redFlags: [
      'High-pressure deadlines ("Account suspended in 2 hours")',
      'Generic greetings ("Dear Customer")',
      'Mismatch between displayed display name and actual sender email domain',
      'Unexpected attachments (.zip, .html, .iso, .exe)'
    ]
  },
  'passwords-2fa': {
    name: 'Password Security & Two-Factor Authentication (2FA)',
    keywords: ['password', 'passphrase', '2fa', 'mfa', 'two factor', 'authenticator', 'passkey', 'yubikey', 'credential'],
    summary: 'Passwords are the primary gatekeeper for digital identity. Strong passwords combined with Multi-Factor Authentication (MFA) stop over 99% of bulk credential stuffing attacks.',
    keyPractices: [
      'Use passphrases of 16+ characters combining 3 to 4 random words (e.g. `correct-horse-battery-staple`).',
      'Never reuse passwords across multiple services—one breach compromises all your accounts.',
      'Use a reputable password manager (e.g., Bitwarden, 1Password, Apple Keychain) to generate and autofill complex passwords.',
      'Upgrade to Authenticator Apps (TOTP) or Hardware FIDO2 Passkeys instead of SMS verification.'
    ],
    redFlags: [
      'Services that still do not offer 2FA/MFA',
      'Prompts asking you to share your 2FA code with customer service over phone or chat',
      'Using personal info (pet names, birth years, children\'s names) in passwords'
    ]
  },
  'malware-downloads': {
    name: 'Malware and Safe Downloads',
    keywords: ['malware', 'virus', 'trojan', 'ransomware', 'spyware', 'download', 'safe download', 'adware', 'antivirus'],
    summary: 'Malware includes viruses, spyware, keyloggers, and ransomware designed to damage, hijack, or spy on your computer and personal data.',
    keyPractices: [
      'Only download software from official stores (Apple App Store, Google Play, Microsoft Store) or verified vendor websites.',
      'Avoid sponsored search results (ad links) at the top of Google searches, which frequently lead to clone sites distributing malware.',
      'Keep operating systems (Windows, macOS, iOS, Android) and web browsers updated to patch known vulnerabilities.',
      'Maintain an active anti-malware solution (such as built-in Windows Defender).'
    ],
    redFlags: [
      'Websites offering "cracked" or free versions of expensive paid software or games',
      'Popups claiming "Your PC has 5 viruses! Click here to clean now"',
      'Downloads disguised as PDF or document files that have double extensions (e.g., `invoice.pdf.exe`)'
    ]
  },
  'public-wifi-vpn': {
    name: 'Public Wi-Fi and VPN Usage',
    keywords: ['wifi', 'wi-fi', 'public wifi', 'vpn', 'hotspot', 'airport wifi', 'coffee shop wifi', 'network security'],
    summary: 'Public Wi-Fi networks in cafes, hotels, and airports are convenient but lack physical and network-level security, opening doors for eavesdropping and rogue hotspots.',
    keyPractices: [
      'Avoid conducting banking transactions or entering passwords on open, unencrypted public Wi-Fi networks.',
      'Use a reputable, paid Virtual Private Network (VPN) when connecting to untrusted networks to encrypt all network traffic.',
      'Alternatively, use your smartphone\'s mobile cellular hotspot instead of public Wi-Fi.',
      'Ensure websites show `https://` with a valid padlock icon before submitting any data.'
    ],
    redFlags: [
      'Open Wi-Fi networks with no password requirement in busy public areas',
      'Popups asking you to update your browser or install a certificate before you can access the internet',
      'Multiple Wi-Fi networks with nearly identical names (e.g., "Airport_Free_WiFi" vs "Airport_Free_WiFi_Guest")'
    ]
  },
  'social-engineering': {
    name: 'Social Engineering and Privacy Protection',
    keywords: ['social engineering', 'privacy', 'impersonation', 'pretexting', 'voice scam', 'deepfake', 'data broker', 'doxxing', 'permissions'],
    summary: 'Social engineering targets human psychology—trust, greed, fear, or helpfulness—rather than technical software flaws. Maintaining strong privacy hygiene minimizes the weapons attackers have.',
    keyPractices: [
      'Be cautious of urgent phone calls claiming a family member is in jail or hospital (AI voice clone scams); establish a family safe word.',
      'Audit your smartphone permissions: revoke access to contacts, microphone, and location from apps that don’t strictly require them.',
      'Limit sharing personal details on public social media (birthdays, mother\'s maiden name, vacation schedules).',
      'Regularly opt out from online data broker aggregators that publish your address and relatives online.'
    ],
    redFlags: [
      'Callers demanding you stay on the line and forbidden from contacting anyone else',
      'Requests for secrecy ("Don\'t tell your boss / bank teller why you are withdrawing cash")',
      'Unsolicited job offers offering massive pay for simple remote tasks that require buying equipment first'
    ]
  }
};

/**
 * Intelligent Rule-Based Engine
 * Matches queries against emergency playbooks and topics to return instant structured guidance.
 */
export function getRuleBasedResponse(query: string): string | null {
  const q = query.toLowerCase().trim();

  // 1. Check Emergency Playbook: Suspected Scam / OTP / Money demands
  if (
    q.includes('asked for otp') ||
    q.includes('asking for otp') ||
    q.includes('give otp') ||
    q.includes('share otp') ||
    q.includes('gift card') ||
    q.includes('wire transfer') ||
    q.includes('crypto payment') ||
    q.includes('scam call') ||
    q.includes('suspected scam') ||
    (q.includes('scam') && (q.includes('money') || q.includes('urgent') || q.includes('pay') || q.includes('call')))
  ) {
    const p = EMERGENCY_PLAYBOOKS['suspected-scam'];
    return formatPlaybookResponse(p);
  }

  // 2. Check Emergency Playbook: Compromised Account
  if (
    q.includes('account hacked') ||
    q.includes('hacked account') ||
    q.includes('compromised') ||
    q.includes('locked out') ||
    q.includes('someone logged into my') ||
    q.includes('unauthorized login') ||
    q.includes('stolen account') ||
    q.includes('instagram hacked') ||
    q.includes('email hacked') ||
    q.includes('facebook hacked')
  ) {
    const p = EMERGENCY_PLAYBOOKS['compromised-account'];
    return formatPlaybookResponse(p);
  }

  // 3. Check Emergency Playbook: Suspicious Link / Clicked Link
  if (
    q.includes('clicked a link') ||
    q.includes('clicked link') ||
    q.includes('suspicious link') ||
    q.includes('opened attachment') ||
    q.includes('fake link') ||
    q.includes('verify link') ||
    q.includes('accidentally clicked') ||
    q.includes('virus download')
  ) {
    const p = EMERGENCY_PLAYBOOKS['suspicious-links-files'];
    return formatPlaybookResponse(p);
  }

  // 4. Match against 5 Core Cybersecurity Topics
  for (const [key, topic] of Object.entries(TOPIC_KNOWLEDGE)) {
    const matchesKeyword = topic.keywords.some(k => q.includes(k));
    if (matchesKeyword) {
      return formatTopicResponse(topic);
    }
  }

  return null;
}

function formatPlaybookResponse(p: Playbook): string {
  let response = `### ${p.title}\n\n`;
  response += `> ⚠️ **Immediate Emergency Triage**: ${p.summary}\n\n`;
  response += `#### Action Checklist:\n`;
  p.steps.forEach((step, idx) => {
    response += `${idx + 1}. ${step}\n`;
  });
  response += `\n#### Important Context:\n`;
  p.tips.forEach(tip => {
    response += `- ${tip}\n`;
  });
  if (p.officialResources.length > 0) {
    response += `\n#### Official Assistance & Reporting:\n`;
    p.officialResources.forEach(res => {
      response += `- [**${res.name}**](${res.url}) - ${res.description}\n`;
    });
  }
  return response;
}

function formatTopicResponse(topic: typeof TOPIC_KNOWLEDGE[string]): string {
  let response = `### 🛡️ ${topic.name}\n\n`;
  response += `${topic.summary}\n\n`;
  response += `#### Recommended Safe Habits:\n`;
  topic.keyPractices.forEach(practice => {
    response += `- ${practice}\n`;
  });
  response += `\n#### Red Flags to Watch Out For:\n`;
  topic.redFlags.forEach(flag => {
    response += `- ⚠️ ${flag}\n`;
  });
  response += `\n---\n*Need specific advice for your current situation? Ask a follow-up or pick an emergency action above!*`;
  return response;
}

export function getFallbackResponse(query: string): string {
  return `### 🛡️ CyberGuard Security Assistant

I analyzed your query: *"${query.replace(/"/g, '')}"*. 

While I want to give you the most accurate advice, remember these foundational online safety rules:

1. **Verify Before Trusting**: Treat unprompted messages, emails, or calls requesting personal details, codes, or money as potentially malicious until independently confirmed.
2. **Never Share Credentials**: Neither banks, tech support, nor law enforcement will ever ask for your passwords, OTP codes, or PINs.
3. **Keep Guardrails Active**: Use unique 16+ character passphrases, enable Authenticator App 2FA, and keep your devices updated.

#### Explore Common Areas:
- 🎣 **Phishing & Email Scams**: How to detect fake invoices and delivery texts.
- 🔑 **Passwords & 2FA**: Setting up password managers and multi-factor authentication.
- 🦠 **Malware & Downloads**: Safe software sources and recognizing infected attachments.
- 📶 **Public Wi-Fi & VPNs**: Shielding traffic on open cafe and airport networks.
- 🎭 **Social Engineering**: Stopping voice deepfakes and psychological manipulation.

#### Official Reporting Portals:
- [FTC Fraud Reporting](https://reportfraud.ftc.gov)
- [FBI Internet Crime Complaint Center (IC3)](https://www.ic3.gov)
- [CISA Cybersecurity Resources](https://www.cisa.gov)`;
}

export const GROK_SYSTEM_PROMPT = `You are CyberGuard, an expert cybersecurity and safe digital habits assistant for everyday users.
Your goal is to provide fast, practical, actionable, and calm guidance to help users stay safe online and handle real-world security incidents.

STRICT PRIVACY & SAFETY RULES:
1. NEVER ask for, accept, or store passwords, OTPs, PINs, bank account or credit card numbers, or sensitive personal credentials.
2. If a user pastes or reveals any password, OTP, or sensitive credential, IMMEDIATELY instruct them to stop, delete it, and change their password/revoke the credential on the real service.
3. Always use fictional, illustrative examples when explaining threats.
4. For high-concern situations (scams demanding money/OTP, compromised accounts, clicked malicious links), give immediate, numbered triage steps first.
5. Provide links to official reporting channels when relevant (e.g., reportfraud.ftc.gov, ic3.gov, cisa.gov, haveibeenpwned.com, virustotal.com).
6. Keep responses structured, concise, and easy to read quickly on mobile or desktop devices. Use clear markdown formatting.`;

export const GROQ_SYSTEM_PROMPT = GROK_SYSTEM_PROMPT;

