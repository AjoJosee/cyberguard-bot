# 🛡️ CyberGuard AI — Cybersecurity Safety & Incident Assistant

> A fast, AI-assisted and rule-based web chatbot that helps everyday users understand cybersecurity threats, practice safe online habits, and receive immediate step-by-step triage during security emergencies.

[![Live Link](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-06b6d4?style=for-the-badge&logo=github)](https://ajojosee.github.io/cyberguard-bot/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/AjoJosee/cyberguard-bot)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-blue?logo=react)](https://react.dev/)
[![xAI Grok](https://img.shields.io/badge/Grok-xAI%20API-000000?logo=x)](https://x.ai/)

---

## 🌐 Public Live Link

- **Live Chatbot Application**: **[https://ajojosee.github.io/cyberguard-bot/](https://ajojosee.github.io/cyberguard-bot/)**
- **GitHub Repository**: **[https://github.com/AjoJosee/cyberguard-bot](https://github.com/AjoJosee/cyberguard-bot)**

*Accessible immediately on both desktop and mobile devices without requiring any login or signup.*

---

## 🔒 Privacy & Safety Notice

- **Zero Credential Collection**: CyberGuard will **never** request, store, or log passwords, One-Time Passwords (OTPs), PINs, credit card numbers, or sensitive personal data.
- **Client & Server-Side Interception**: Proactive regex filters detect and redact sensitive inputs (OTPs, card patterns, passwords) *before* they are sent to any API or backend. If a user pastes an OTP or password, the bot blocks transmission and warns the user immediately.
- **Purely Fictional Scenarios**: All case examples and tests use fictional representations.
- **Secure Secrets Management**: API keys and environment variables are excluded via `.gitignore` (`.env`, `.env.local`, `.env.*`) and never exposed in version control or public repositories.

---

## 🌟 Key Features & Capabilities

### 1. Hybrid Intelligence: Grok AI + Instant Knowledge Engine
- **xAI Grok Integration**: Connect your Grok API key (`console.x.ai`) via `.env.local` or directly through the secure in-app settings modal. Supports `grok-2-latest`, `grok-2-mini` (ultra-fast), and `grok-beta`.
- **Instant Local Knowledge Engine**: Provides instantaneous (<50ms) structured answers across all topics and emergencies even when offline or without an API key.
- **Graceful Fallbacks**: If external API limits occur, the assistant seamlessly switches to the expert local rule base without disruption.

### 2. High-Concern Emergency Triage Playbooks
Dedicated, one-click action checklists for urgent security situations:
- 🚨 **Suspected Scam**: Immediate guidance when someone pressures you for money, gift cards, OTPs, or remote screen access (TeamViewer/AnyDesk).
- 🔐 **Compromised Account**: Step-by-step lockdown: session revocation, strong 16+ character passphrases, authenticator-based 2FA, email forwarding inspection, and recovery.
- 🔗 **Suspicious Links & Files**: Safe inspection guidelines (URL hovering, VirusTotal) plus **post-click emergency response** (disconnect Wi-Fi, scan offline, delete malicious payloads).

### 3. Five Core Cybersecurity Knowledge Domains
1. **Phishing & Email Scams**: Sender spoofing, fake delivery alerts, urgent invoice lures, and smishing/vishing red flags.
2. **Password Security & 2FA**: 16+ character passphrases, password managers (Bitwarden/1Password), and 2FA authentication tiers (Passkeys > TOTP apps > SMS).
3. **Malware & Safe Downloads**: Ransomware, spyware, malicious sponsored search ads, and safe download hygiene.
4. **Public Wi-Fi & VPN Usage**: Open hotspot risks, evil twins, HTTPS limitations, and VPN encryption.
5. **Social Engineering & Privacy**: Impersonation, voice cloning (AI deepfakes), phone safe-words, and mobile app permissions.

### 4. Direct Links to Official Reporting Channels
- **FTC Fraud Reporting**: [reportfraud.ftc.gov](https://reportfraud.ftc.gov)
- **FBI IC3 (Internet Crime Complaint Center)**: [ic3.gov](https://www.ic3.gov)
- **CISA Security Resources**: [cisa.gov](https://www.cisa.gov)
- **Have I Been Pwned**: [haveibeenpwned.com](https://haveibeenpwned.com)
- **VirusTotal Scanner**: [virustotal.com](https://www.virustotal.com)
- **IdentityTheft.gov**: [identitytheft.gov](https://identitytheft.gov)

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js 18+ (tested with Node 24)
- npm or yarn
- An xAI Grok API key from [console.x.ai](https://console.x.ai)

### Step-by-Step Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AjoJosee/cyberguard-bot.git
   cd cyberguard-bot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the sample environment file:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your xAI Grok API key:
   ```env
   GROK_API_KEY=xai-your-api-key-here
   GROK_MODEL=grok-2-latest
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for GitHub Pages**:
   ```bash
   npm run build:gh-pages
   ```

---

## 🧪 Testing Scenarios & Verification

| Test Scenario | User Input | Expected Behavior |
| :--- | :--- | :--- |
| **Sensitive Data Interception** | `"My OTP is 849201"` | Intercepted immediately by security filter. Warns user never to share OTPs; text not transmitted to API. |
| **Emergency Triage (Scam)** | *"Someone is on the phone asking for my 6-digit code to cancel an Amazon charge"* | Delivers immediate STOP instructions, explains that legitimate services never ask for OTPs, and provides FTC reporting portal. |
| **Emergency Triage (Hacked Account)** | *"I think my Instagram account was hacked, what should I do?"* | Delivers step-by-step lockdown: sign out all sessions, change password, check recovery email/phone, enable 2FA. |
| **Emergency Triage (Clicked Link)** | *"I accidentally clicked a strange link in an SMS message"* | Delivers post-click protocol: disconnect Wi-Fi, inspect downloads folder, run antivirus scan, reset passwords from a clean device. |
| **Topic: Phishing** | *"How can I tell if an email from PayPal is fake?"* | Explains domain inspection, urgency red flags, fake invoice lures, and safe navigation habits. |
| **Topic: Public Wi-Fi** | *"Is it safe to log into my bank at an airport Wi-Fi?"* | Advises using cellular data or a trusted VPN, explains open network risks and HTTPS limits. |
| **General Query / Unknown** | *"Can aliens hack my microwave?"* | Gracefully answers with foundational safety rules, highlights common real-world threats, and guides user to legitimate topics. |

---

## ⚠️ Limitations & Disclaimers

1. **Educational & First-Aid Tool**: CyberGuard is designed for educational purposes and first-tier incident triage. It is not a replacement for professional digital forensics, corporate incident response teams, or official law enforcement.
2. **Non-Legal Advice**: The guidance provided does not constitute legal or contractual advice. Always contact your financial institution or local law enforcement for active fraud.
3. **No Direct Account Access**: CyberGuard cannot access external accounts, unblock credentials, or reset passwords on external platforms.
