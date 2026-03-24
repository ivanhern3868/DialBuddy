# DialBuddy - Phone Dialing Skills for Kids

**An educational mobile app that teaches children (ages 3-4) to recognize numbers, dial phone numbers, and understand emergency services.**

---

## Project Status: Phase 1 MVP Complete (90%) ✅

**Last Updated:** March 18, 2026

### Completed Features

- ✅ Full dialing interface with DTMF tones
- ✅ Practice Mode with adaptive difficulty (Beginner → Intermediate → Advanced)
- ✅ Contact Management (add/edit/delete up to 6 contacts)
- ✅ Progress Tracking with mastery calculation
- ✅ Parent Zone with COPPA-compliant parent gate
- ✅ Onboarding flow with language selection (EN/ES/PT-BR)
- ✅ Multi-language support (3 languages, 13 countries)
- ✅ Free Dial mode for exploration

### In Development 🚧

- Emergency Module (Phase 2)
- Profile Management (multi-child support)
- Additional learning games

See **[ROADMAP.md](ROADMAP.md)** for complete feature list and timeline

---

## Documentation

### Essential Documents
- **[ROADMAP.md](ROADMAP.md)** - Product roadmap, all features by phase
- **[DIALBUDDY_SPEC.md](DIALBUDDY_SPEC.md)** - Complete technical specification
- **[MARKET_ANALYSIS.md](MARKET_ANALYSIS.md)** - Competitive analysis, pricing strategy, marketing plan
- **[B2B_STRATEGY.md](B2B_STRATEGY.md)** - Institutional features for daycares and hospitals
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development setup and troubleshooting

### Compliance & Safety
- **[docs/COMPLIANCE.md](docs/COMPLIANCE.md)** - COPPA/GDPR compliance checklist
- **[docs/EMERGENCY_VERIFICATION.md](docs/EMERGENCY_VERIFICATION.md)** - Emergency number verification audit trail
- **[docs/TODDLER_TESTING.md](docs/TODDLER_TESTING.md)** - User testing protocol with safety gates

---

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Expo SDK | 52+ | React Native managed workflow |
| TypeScript | 5.x | Type safety |
| React Native | (via Expo) | Cross-platform native mobile |
| expo-av | Latest | Audio playback (DTMF tones) |
| expo-sqlite | Latest | Local database (progress tracking) |
| libphonenumber-js | Latest | International phone number validation |
| react-i18next | Latest | Internationalization |

**Privacy-First Design:**
- ✅ 100% offline (zero network requests)
- ✅ No third-party analytics
- ✅ No ads
- ✅ All data stays on device

---

## Project Structure

```
dialbuddy/
├── app/                     # Expo Router: file-based routing
│   ├── index.tsx           # Home screen
│   ├── practice.tsx        # Guided dialing lessons
│   ├── free-dial.tsx       # Sandbox phone
│   ├── emergency/          # Emergency module (scenarios, dispatcher sim, after-call)
│   └── parent-zone/        # Settings (behind parent gate)
│
├── components/             # Reusable UI components
│   ├── Dialer/            # Number pad, screen, buttons
│   ├── Emergency/         # Scenario cards, dispatcher UI
│   └── ParentZone/        # Parent gate, settings panels
│
├── data/                   # Static data
│   └── emergencyNumbers.ts # 22-country emergency number database
│
├── i18n/locales/          # Translations
│   ├── en.json            # English
│   ├── es.json            # Spanish
│   └── pt-BR.json         # Brazilian Portuguese
│
├── assets/sounds/dtmf/    # DTMF audio tones (0-9)
│
├── docs/                   # Critical documentation
│   ├── EMERGENCY_VERIFICATION.md  # Emergency number sources + audit trail
│   ├── TODDLER_TESTING.md         # User testing protocol
│   └── COMPLIANCE.md              # Privacy law compliance checklist
│
└── scripts/
    └── generate-dtmf-wav.py       # Audio generation script
```

---

## Quick Start

### Prerequisites

- Node.js 18+ (LTS v20 recommended)
- npm 9+
- Expo CLI (`npx expo`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
cd dialbuddy
npm install
```

### Development

```bash
# Start Expo development server
npx expo start

# Run on iOS simulator (Mac only)
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run on physical device via Expo Go app
# (Scan QR code from terminal)
```

### Testing with Toddlers

Before each phase, review [docs/TODDLER_TESTING.md](docs/TODDLER_TESTING.md) for structured testing protocol.

**CRITICAL:** If ANY child shows fear during emergency module testing, STOP immediately and redesign.

---

## Emergency Number Database

Covers 22 countries in the Americas:

**North America:** US, Canada, Mexico
**Central America:** Guatemala, Belize, Honduras, El Salvador, Nicaragua, Costa Rica, Panama
**Caribbean:** Cuba, Dominican Republic, Puerto Rico
**South America:** Colombia, Venezuela, Ecuador, Peru, Brazil, Bolivia, Paraguay, Chile, Argentina, Uruguay

**Verification:** All numbers verified against official government sources. See [docs/EMERGENCY_VERIFICATION.md](docs/EMERGENCY_VERIFICATION.md) for source URLs and verification dates.

**Audit requirement:** Any change to emergency numbers requires documentation update + code review.

---

## Internationalization

**Supported Languages:**
- English (en) - Primary development language
- Spanish (es) - Latin American neutral dialect
- Portuguese (pt-BR) - Brazilian Portuguese

**Phone Number Formats:**
Automatically adapts to local formatting via `libphonenumber-js`:
- US: (202) 555-1234
- Brazil: (11) 98765-4321
- Mexico: 55 1234 5678

**Emergency Numbers:**
App detects country and teaches correct emergency number(s):
- US/Canada/Mexico: 911
- Brazil: 190 (police), 192 (ambulance), 193 (fire)
- Colombia: 123
- Guatemala: 110/120/123 (scenario-based)

---

## Compliance & Privacy

**COPPA (US) Compliant:**
- ✅ Zero personal data collection
- ✅ No network requests
- ✅ No analytics
- ✅ No ads
- ✅ Parent gate for settings

**GDPR (EU) Compliant:**
- ✅ No data processing outside device
- ✅ Right to erasure (profile deletion)
- ✅ Data minimization (only essential data stored locally)

**App Store Kids Category Requirements:**
- ✅ Privacy policy published
- ✅ No third-party SDKs
- ✅ No external links
- ✅ Age-appropriate content
- ✅ Parent gate implemented

See [docs/COMPLIANCE.md](docs/COMPLIANCE.md) for complete checklist.

---

## Audio Assets

**DTMF Tones (Dial Tones):**
- 10 WAV files: 0.wav through 9.wav
- Generated via Python script: `scripts/generate-dtmf-wav.py`
- ITU-T Q.23 standard frequencies
- Duration: 200ms per tone
- File size: ~90 KB each (~900 KB total)

**To regenerate:**
```bash
cd dialbuddy
pip install numpy scipy
python scripts/generate-dtmf-wav.py
```

**Production optimization:** Convert to MP3 once ffmpeg is installed (reduces bundle size from ~900KB to ~45KB).

---

## Development Principles (from Ivan's Coding Standards)

### NO BLACK BOX CODE

**Every function must explain:**
- **WHY** it exists (business purpose)
- **WHAT** business rule it implements
- **ANY** edge cases or API quirks

**Example:**
```typescript
/**
 * Validate phone number for contact entry
 *
 * Business Purpose:
 * Ensures parents can't save invalid numbers that would confuse children
 * during practice. Prevents frustration when child successfully dials but
 * number is malformed.
 *
 * Technical Implementation:
 * Uses libphonenumber-js to validate against country-specific rules.
 * Formats number for display and extracts digit grouping for practice mode.
 *
 * Edge Cases:
 * - Emergency numbers (190, 911, etc.) are flagged as special
 * - Toll-free numbers are rejected (kids can't call 1-800 numbers)
 * - Extensions are stripped (kids don't understand "press 1 for...")
 */
export function validateContactNumber(
  rawNumber: string,
  countryCode: string
): ValidationResult {
  // Implementation with inline comments explaining business logic
}
```

### Auditability First

- Code must be readable by non-technical stakeholders (parents, regulators)
- Error messages are user-friendly, not technical
- Business events are logged (e.g., "Emergency Star badge earned")
- Audit trails documented (see EMERGENCY_VERIFICATION.md)

### Windows-Specific Notes

- Use `Path.join()` or Path objects, NOT string concatenation for file paths
- Test on network drives if relevant
- Document registry changes if required (none currently)

---

## Contributing

### Pre-Commit Checklist

Before committing any code:

- [ ] All functions have comments explaining business purpose
- [ ] Complex logic is broken into clear steps
- [ ] Variable names are descriptive
- [ ] No "magic numbers" without constants
- [ ] Error messages are user-friendly
- [ ] Emergency number changes are documented in EMERGENCY_VERIFICATION.md

### Modification to Emergency Numbers

**CRITICAL REQUIREMENT:**

Any PR modifying `data/emergencyNumbers.ts` MUST:
1. Update `docs/EMERGENCY_VERIFICATION.md` with source URL and verification date
2. Get code review from at least one other developer
3. Test with real phone in that country (if possible)

Incorrect emergency numbers could cost lives. This is non-negotiable.

---

## Roadmap

### Phase 1: Foundation & MVP (Weeks 1-3) - IN PROGRESS
- [ ] Install all dependencies
- [ ] Configure NativeWind + Reanimated
- [ ] Database setup (expo-sqlite schema)
- [ ] Basic Dialer component
- [ ] DTMF playback integration
- [ ] Free Dial mode
- [ ] Parent Zone with parent gate
- [ ] Contact editor with phone validation

### Phase 2: Learning System (Weeks 4-5)
- [ ] Practice Mode (beginner/intermediate/advanced)
- [ ] Progress tracking
- [ ] Celebration animations
- [ ] Sticker rewards
- [ ] Session timer

### Phase 3A: Emergency Module Core (Weeks 6-7) ⚠️ SAFETY CRITICAL
- [ ] Scenario recognition (YES/NO cards)
- [ ] Emergency number detection
- [ ] Practice dialing emergency numbers
- [ ] Basic dispatcher simulation
- [ ] **GATE: Toddler emotional safety test**

### Phase 3B: Emergency Module Advanced (Weeks 8-9)
- [ ] Silent call lesson
- [ ] After-call actions
- [ ] Parent-recorded dispatcher voice
- [ ] Spaced repetition system
- [ ] Emergency Star badge

### Phase 4: Bonus Features (Weeks 10-11)
- [ ] Simon Says mode
- [ ] Who's Calling? mode
- [ ] Address lesson
- [ ] Themed skins

### Phase 5: Polish & Launch (Weeks 12-14)
- [ ] Voice recognition
- [ ] Multi-profile support
- [ ] Full localization (Spanish, Portuguese)
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] App store submission

---

## License

[To be determined - consult with legal before open-sourcing]

---

## Contact

**Developer:** Ivan (DialBuddy Development Team)
**Project Start:** 2024-01-15

For privacy/compliance questions, see [docs/COMPLIANCE.md](docs/COMPLIANCE.md).

For emergency number verification, see [docs/EMERGENCY_VERIFICATION.md](docs/EMERGENCY_VERIFICATION.md).

---

## Acknowledgments

- Emergency number data verified against official government sources (see EMERGENCY_VERIFICATION.md)
- DTMF frequency specifications: ITU-T Recommendation Q.23
- Phone number validation: Google's libphonenumber library
- Inspired by the need to teach life-saving skills to the youngest learners

**Most importantly:** This app exists to help keep children safe. Every design decision prioritizes child safety, emotional well-being, and learning effectiveness over technical cleverness.
