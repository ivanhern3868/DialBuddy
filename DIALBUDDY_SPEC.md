# DialBuddy — Technical Specification
## A React Native (Expo) App That Teaches Kids (Ages 3–4) to Dial Phone Numbers

---

## 1. Project Overview

**DialBuddy** is a native mobile app built with Expo (React Native) that teaches young children (ages 3–4) how to recognize numbers and dial important phone numbers — especially parent/guardian numbers and their country's emergency services number(s).

The app simulates a phone dialer in a safe sandbox environment (no real calls are made). It uses colorful visuals, audio prompts, and game-like rewards to teach number recognition and sequential dialing through repetition. It works internationally, adapting to any country's phone number format and emergency numbers.

### Target Users
- **Primary:** Children ages 3–4
- **Secondary:** Parents/guardians (setup & configuration)

### Why Expo
Expo provides a managed React Native environment with a single TypeScript codebase that compiles to native iOS and Android apps. Key advantages for this project: native performance and touch responsiveness (critical for kids), direct App Store / Play Store distribution, access to native APIs (haptics, audio, camera, speech) via the Expo SDK, over-the-air updates via EAS Update, and no need to manage Xcode/Gradle build configs manually.

### Tech Stack
- **Framework:** Expo SDK 52+ (React Native) with TypeScript
- **Navigation:** Expo Router v4 (file-based routing)
- **Styling:** NativeWind v4 (Tailwind CSS for React Native)
- **Audio:** expo-av (playback + recording) + expo-speech (text-to-speech)
- **Animations:** react-native-reanimated v3 + lottie-react-native
- **Haptics:** expo-haptics
- **State Management:** Zustand (lightweight, works identically in RN)
- **Phone Number Handling:** libphonenumber-js (pure JS, works in RN)
- **Internationalization:** expo-localization + i18next + react-i18next
- **Storage:** expo-sqlite (local relational DB) with AsyncStorage fallback for simple key-value
- **Image Handling:** expo-image-picker (contact photos) + expo-image
- **Camera:** expo-camera (Parent Zone contact photos)
- **Testing:** Jest + React Native Testing Library
- **Build & Distribution:** EAS Build + EAS Submit (App Store + Play Store)
- **OTA Updates:** EAS Update (push fixes without app store review)

---

## 2. App Architecture

Expo Router uses **file-based routing** — each file in the `app/` directory becomes a route. Components, hooks, and utilities live outside `app/` in their own directories.

```
dialbuddy/
├── app.json                        # Expo app configuration
├── eas.json                        # EAS Build/Submit/Update config
├── tailwind.config.js              # NativeWind (Tailwind for RN) config
├── global.css                      # NativeWind global stylesheet
├── babel.config.js                 # Babel config (NativeWind + Reanimated plugins)
├── metro.config.js                 # Metro bundler config
│
├── app/                            # Expo Router: file-based routing
│   ├── _layout.tsx                 # Root layout: providers (Zustand, i18n, theme, fonts)
│   ├── index.tsx                   # Home screen: Practice, Free Dial, My People
│   ├── practice.tsx                # Guided dialing sessions
│   ├── free-dial.tsx               # Open sandbox dialer
│   ├── contacts.tsx                # Contact pick screen (My People)
│   ├── simon-says.tsx              # Memory game: repeat digit sequences
│   ├── whos-calling.tsx            # Recall game: dial from contact face only
│   ├── theme-picker.tsx            # Pick a phone skin/theme
│   ├── address-lesson.tsx          # Teach child their home address
│   │
│   ├── emergency/                  # Emergency module (nested routes)
│   │   ├── _layout.tsx             # Emergency stack navigator layout
│   │   ├── index.tsx               # Emergency hub: scenario selection
│   │   ├── scenarios.tsx           # YES/NO scenario recognition cards
│   │   ├── dial.tsx                # Practice dialing the emergency number
│   │   ├── call-sim.tsx            # Full simulated dispatcher conversation
│   │   ├── after-call.tsx          # Post-call "what to do" interactive lessons
│   │   ├── silent-call.tsx         # "Can't talk? Stay on the line" lesson
│   │   └── quiz.tsx                # Spaced-repetition emergency quiz
│   │
│   └── parent-zone/                # Parent settings (behind parent gate)
│       ├── _layout.tsx             # Parent zone layout with gate guard
│       ├── index.tsx               # Parent dashboard / settings hub
│       ├── contacts.tsx            # Add/edit contacts with phone number validation
│       ├── profiles.tsx            # Multi-child profile manager
│       ├── country.tsx             # Country/region locale picker
│       ├── emergency-settings.tsx  # Emergency module parent settings
│       ├── record-dispatcher.tsx   # Record parent voice for dispatcher sim
│       └── progress.tsx            # View child's progress & mastered numbers
│
├── components/
│   ├── Layout/
│   │   └── AppShell.tsx            # SafeAreaView wrapper, status bar config
│   │
│   ├── Dialer/
│   │   ├── DialerPad.tsx           # The 0-9 number pad grid
│   │   ├── DialerButton.tsx        # Single number button (Pressable, large touch target)
│   │   ├── DialerScreen.tsx        # Display showing dialed digits
│   │   └── CallButton.tsx          # Green "call" button
│   │
│   ├── Contacts/
│   │   ├── ContactCard.tsx         # Big icon + name (e.g., photo of Mom)
│   │   └── ContactList.tsx         # FlatList of saved contacts
│   │
│   ├── Practice/
│   │   ├── NumberTracer.tsx         # Trace/tap highlighted numbers in order
│   │   ├── ProgressBar.tsx          # Visual progress through a practice round
│   │   └── HintOverlay.tsx          # Pulsing hint on next correct digit (Reanimated)
│   │
│   ├── Rewards/
│   │   ├── StarBurst.tsx            # Star animation on correct dial (Reanimated)
│   │   ├── CelebrationModal.tsx     # Full-screen celebration (Lottie + confetti)
│   │   └── StickerBook.tsx          # Collectible stickers earned through play
│   │
│   ├── Emergency/
│   │   ├── ScenarioCard.tsx         # YES/NO scenario illustration card (swipeable via Gesture Handler)
│   │   ├── DispatcherSim.tsx        # Simulated dispatcher conversation UI
│   │   ├── DispatcherPrompt.tsx     # Single dispatcher question with tap/voice response
│   │   ├── ConversationBubble.tsx   # Chat-style bubble for dispatcher dialog
│   │   ├── AfterCallChecklist.tsx   # Post-call "what to do next" interactive steps
│   │   ├── SilentCallOverlay.tsx    # "Can't talk? Stay on the line" teaching screen
│   │   └── EmergencyQuiz.tsx        # Spaced-repetition mini-quiz component
│   │
│   └── ParentZone/
│       ├── ParentGate.tsx           # Dual-circle long-press gate (Gesture Handler)
│       ├── ContactEditor.tsx        # Add/edit contacts with libphonenumber-js validation
│       ├── CountrySelector.tsx      # Country picker (searchable FlatList)
│       ├── ProfileManager.tsx       # Multi-child profile switcher
│       ├── SettingsPanel.tsx        # Difficulty, sound, hints toggle
│       └── ProgressDashboard.tsx    # View child's progress (charts via react-native-svg)
│
├── hooks/
│   ├── useAudio.ts                  # expo-av: play sound effects
│   ├── useSpeech.ts                 # expo-speech: text-to-speech for number names
│   ├── useHaptics.ts                # expo-haptics: vibration feedback
│   ├── useProgress.ts               # Track & persist learning progress
│   ├── useParentGate.ts             # Gate logic for parent-only sections
│   ├── useLocale.ts                 # expo-localization + country context
│   ├── useSpeechRecognition.ts      # expo-speech (recognition) or native module
│   ├── useProfile.ts                # Multi-child profile management
│   └── useDTMF.ts                   # Generate DTMF tones via expo-av Audio.Sound
│
├── stores/
│   ├── contactStore.ts              # Zustand store for contacts
│   ├── progressStore.ts             # Zustand store for learning progress
│   ├── settingsStore.ts             # Zustand store for app settings
│   ├── profileStore.ts              # Zustand store for child profiles
│   └── emergencyStore.ts            # Zustand store for emergency module progress
│
├── utils/
│   ├── audio/
│   │   ├── dtmfTones.ts             # DTMF tone generation (frequency pairs → expo-av)
│   │   └── soundEffects.ts          # Preload & play sound effect assets
│   ├── phone/
│   │   ├── formatter.ts             # libphonenumber-js wrapper: format, validate, group digits
│   │   ├── emergencyNumbers.ts      # Locale → emergency number(s) lookup table
│   │   └── countryData.ts           # Country list with codes, flags, phone metadata
│   ├── storage/
│   │   ├── database.ts              # expo-sqlite setup: schema, migrations, queries
│   │   └── asyncStore.ts            # AsyncStorage helpers for simple key-value data
│   └── validators.ts                # Phone number validation
│
├── assets/
│   ├── sounds/
│   │   ├── effects/                 # success.mp3, whoops.mp3, celebration.mp3
│   │   └── emergency/               # Locale-specific emergency audio clips
│   ├── images/
│   │   ├── avatars/                 # Default contact avatars (PNG)
│   │   ├── stickers/                # Collectible reward stickers (PNG/SVG)
│   │   ├── scenarios/               # Emergency scenario illustrations
│   │   └── themes/                  # Theme-specific background patterns
│   ├── animations/
│   │   └── lottie/                  # Lottie JSON files for celebrations
│   ├── fonts/
│   │   └── Nunito/                  # Nunito font files (.ttf)
│   └── icon.png                     # App icon (1024×1024)
│   └── splash.png                   # Splash screen image
│   └── adaptive-icon.png            # Android adaptive icon
│
├── constants/
│   ├── theme.ts                     # Color palette, spacing, typography tokens
│   └── layout.ts                    # Touch target sizes, padding values
│
├── types/
│   └── index.ts                     # Shared TypeScript interfaces
│
├── i18n/
│   ├── index.ts                     # i18next configuration + expo-localization detection
│   └── locales/
│       ├── en.json                  # English strings
│       ├── es.json                  # Spanish strings
│       ├── fr.json                  # French strings
│       ├── de.json                  # German strings
│       ├── pt.json                  # Portuguese strings
│       ├── zh.json                  # Chinese (Simplified) strings
│       ├── ja.json                  # Japanese strings
│       ├── ar.json                  # Arabic strings
│       ├── hi.json                  # Hindi strings
│       └── ...                      # Easily extensible
│
└── data/
    ├── lessons.ts                   # Lesson plan data structure
    ├── emergencyNumbers.ts          # Full country → emergency number mapping
    ├── emergencyScenarios.ts        # Branching scenario trees with dialog scripts
    ├── dispatcherScripts.ts         # Locale-aware dispatcher conversation flows
    ├── afterCallSteps.ts            # Post-call action checklists per scenario type
    ├── themes.ts                    # Theme/skin definitions
    └── scenarioCards.ts             # Emergency lesson YES/NO scenarios
```

---

## 3. Feature Specifications

### 3.1 Home Screen

**Purpose:** Simple, icon-driven navigation a 3-year-old can use.

**Layout:**
- Full-screen native app (no browser chrome, status bar managed via expo-status-bar)
- Profile picker at the top if multiple profiles exist (child selects their avatar)
- 3 large, colorful primary buttons arranged vertically or in a grid:
  1. 🎯 **Practice** — Guided dialing lessons
  2. 📱 **Free Dial** — Open sandbox phone
  3. 👨‍👩‍👧 **My People** — Contact cards to practice calling
- 3 smaller secondary buttons below:
  4. 🎵 **Simon Says** — Memory game (unlocked after first successful dial)
  5. 🤔 **Who's Calling?** — Recall challenge (unlocked per-contact at 80% mastery)
  6. 🚨 **Emergency** — Emergency number lesson (always available)
- Small, subtle gear icon in top-right corner → Parent Zone (behind parent gate)
- Small palette icon in top-left corner → Theme picker (no gate required)
- Friendly mascot character (e.g., a cartoon phone named "Buddy") with a wave animation

**Behavior:**
- Each button has a subtle bounce animation on hover/press
- Voice prompt plays on screen load: "Hi! What do you want to do?"
- Tapping each button plays its label aloud before navigating

---

### 3.2 Practice Mode (Core Learning Experience)

**Purpose:** Guided, progressive lessons that teach number recognition and sequential dialing.

**Lesson Structure:**

```typescript
interface Lesson {
  id: string;
  title: string;                    // e.g., "Learn to Dial Mommy"
  targetNumber: string;             // e.g., "5551234567"
  contactName: string;              // e.g., "Mommy"
  contactAvatar: string;            // path to avatar image
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: LessonStep[];
}

interface LessonStep {
  type: 'single_digit' | 'sequence' | 'full_number' | 'recall';
  highlightedDigits: number[];      // indices of digits to highlight
  hintsEnabled: boolean;
  maxAttempts: number;
}
```

**Difficulty Progression (3 levels):**

| Level | What the Child Does | Hints |
|-------|-------------------|-------|
| **Beginner** | Tap the ONE highlighted/pulsing number on the keypad | Next digit pulses with glow + voice says "Press [number]!" |
| **Intermediate** | Dial 3-digit groups (e.g., 555, then 123, then 4567) | Digits shown on screen, keypad does NOT highlight — child matches visually |
| **Advanced** | Dial the full number from the contact's face alone (no visible digits) | After 5 sec pause, offer "Need a hint?" button |

**Screen Layout:**
- **Top 30%:** Contact avatar + name + dialed digits display
- **Bottom 70%:** Large number pad (4 rows × 3 columns)
- Progress bar across the top showing completion

**Feedback System:**
- ✅ **Correct digit:** 
  - DTMF tone plays
  - Digit appears on screen display
  - Button flashes green
  - Voice says the digit name
  - Small star burst animation on the button
- ❌ **Wrong digit:**
  - Gentle "boop" sound (NOT harsh buzzer — avoid scaring kids)
  - Button briefly shakes
  - Voice says "Oops! Try again!" (encouraging tone)
  - Hint appears after 2 wrong attempts
- 🎉 **Completed full number:**
  - Phone "rings" animation (screen shows ringing phone with contact's face)
  - Contact "answers" with a pre-recorded or TTS message: "Hi sweetie! Great job!"
  - Celebration: confetti/stars + cheerful music
  - Sticker reward earned

---

### 3.3 Free Dial Mode (Sandbox)

**Purpose:** An open, no-pressure play space. The child can tap any numbers freely, hear the sounds, and pretend to make calls.

**Features:**
- Full dialer UI (identical to practice, but no guided prompts)
- Every key press plays its DTMF tone + speaks the digit name
- Green "Call" button at the bottom:
  - If digits match a saved contact → shows that contact's avatar "answering"
  - If digits match ANY of the locale's emergency numbers → triggers the **Emergency Lesson redirect** (see 3.5)
  - Otherwise → plays a funny "wrong number" animation (cartoon character picks up confused)
- Red "Hang Up" / Clear button resets the display
- No scoring, no right/wrong — pure exploration

---

### 3.4 My People (Contacts)

**Purpose:** Let the child pick a contact and practice dialing them specifically.

**Layout:**
- Grid of large contact cards (max 6 contacts)
- Each card shows: avatar photo/icon + name in large friendly font
- Tapping a card → voice says "Let's call [name]!" → enters Practice Mode for that contact's number

**Contact Card Component:**
```typescript
interface Contact {
  id: string;
  name: string;
  phoneNumber: string;              // National digits only, e.g., "2025551234" (US) or "07911123456" (UK)
  formattedNumber: string;          // Locale-formatted: "(202) 555-1234" or "07911 123456"
  digitGrouping: number[];          // [3,3,4] for US, [5,6] for UK — drives intermediate practice chunks
  avatar: string;                   // URL or base64 of photo, or default avatar ID
  relationship: string;             // "Mom", "Dad", "Grandma", etc.
  isEmergency: boolean;             // true for locale's emergency number(s)
  masteryLevel: number;             // 0-100, tracks child's progress (per active profile)
}
```

---

### 3.5 Emergency Module (Comprehensive, Locale-Aware)

**Purpose:** Teach children to recognize their country's emergency number(s), understand WHEN to call, know HOW to talk to a dispatcher, learn what to do AFTER calling, and retain this knowledge through spaced repetition. This is the most critical feature in the app.

**This module is divided into 6 sub-modules (3.5.1–3.5.6), each building on the last.**

---

#### 3.5.1 When to Call (Scenario Recognition)

**Purpose:** Teach the child to distinguish real emergencies from non-emergencies BEFORE teaching them to dial. Understanding "when" must come before "how."

**Lesson Flow:**
1. **Intro animation:** Buddy (mascot) explains in simple, locale-aware terms:
   - "[Emergency number] is a VERY special number"
   - "It sends helpers — like police, firefighters, and doctors — to come help you"
   - "But we only use it when something really big and really scary is happening"
   - "Let's learn when to call and when NOT to call!"

2. **Scenario Cards (YES/NO swipeable):** Large illustrations with simple text read aloud by Buddy. The child swipes right (✅ green) or left (❌ red), or taps YES/NO buttons.

**Core scenario set (always included, translated per locale):**

| Scenario | Answer | Category |
|----------|--------|----------|
| "A grown-up fell down and won't wake up" | ✅ YES | Medical |
| "There's a fire and smoke in the house" | ✅ YES | Fire |
| "Someone you don't know is trying to get into your house" | ✅ YES | Danger |
| "A grown-up is having trouble breathing" | ✅ YES | Medical |
| "You see a car crash and someone is hurt" | ✅ YES | Medical |
| "You're lost and can't find any grown-ups" | ✅ YES | Lost child |
| "You want pizza for dinner" | ❌ NO | Food |
| "Your sibling took your toy" | ❌ NO | Sibling |
| "Your pet is being silly" | ❌ NO | Pet |
| "You're bored and want to talk to someone" | ❌ NO | Boredom |
| "You scraped your knee" | ❌ NO | Minor injury |
| "The TV isn't working" | ❌ NO | Appliance |

**Feedback on wrong answers:**
- Wrong YES (called for non-emergency): Buddy gently says "That's not an emergency. [Emergency number] is only for when someone is really hurt or in danger. Let's try another one!"
- Wrong NO (didn't call for real emergency): Buddy says with concern "Actually, this IS a time to call [number]! Someone needs help. Let's remember this one."
- Each wrong answer is flagged and re-tested later in the session

**Grading:** Track per-scenario mastery. A scenario is "mastered" after 3 consecutive correct answers across different sessions.

```typescript
interface EmergencyScenario {
  id: string;
  category: 'medical' | 'fire' | 'danger' | 'lost_child' | 'non_emergency';
  textKey: string;              // i18n translation key
  illustrationAsset: string;    // SVG/image path
  correctAnswer: boolean;       // true = YES call, false = NO don't call
  explanation: string;          // i18n key for why this IS or ISN'T an emergency
  relatedScenarioFlow?: string; // Links to a branching scenario in 3.5.3 (e.g., 'fire', 'medical')
}
```

---

#### 3.5.2 How to Dial (Practice Calling)

**Purpose:** Practice dialing the emergency number itself. Straightforward application of the existing Practice Mode, adapted for short emergency numbers.

**Flow:**
1. Buddy says "Now let's practice calling [number]! Remember, we're just pretending."
2. Standard guided dialing UI (same as Practice Mode Section 3.2)
3. Difficulty is simplified since emergency numbers are short (typically 3 digits):
   - **Beginner:** Each digit pulses on the keypad one at a time
   - **Advanced:** Number shown on screen only briefly (3 sec), then disappears — child dials from short-term memory
   - **Recall:** Contact card for "Emergency" shown with the 🚨 icon — child dials entirely from memory
4. After successful dial → transition to the Dispatcher Simulation (3.5.3) instead of the normal celebration

**Multi-number countries:** For locales with multiple emergency numbers (e.g., Japan: 110 police, 119 fire/ambulance), this step is reached FROM a scenario card. The scenario determines WHICH number to dial:
- "Someone is hurt" scenario → dials 119 (ambulance)
- "Someone scary is at the door" scenario → dials 110 (police)
- "Fire" scenario → dials 119 (fire)

The child learns which number goes with which situation, not just one number for everything.

---

#### 3.5.3 Dispatcher Conversation Simulation

**Purpose:** Simulate a realistic (but age-appropriate) conversation with an emergency dispatcher so the child practices what to SAY after dialing. This is the centerpiece of the emergency module.

**UI Design:** A chat-bubble interface (like a simple messaging app):
- **Left side:** Dispatcher avatar (friendly face with headset) + speech bubbles (text + audio)
- **Right side:** Child's response options (large tappable picture buttons or voice input)
- Phone "connected" animation at the top with a gentle pulsing green indicator
- A prominent "Do NOT hang up!" reminder pinned at the bottom of the screen throughout

**Conversation Flow (scripted, branching by scenario type):**

The dispatcher asks questions one at a time. The child responds by tapping illustrated answer buttons. Each correct response triggers encouraging audio ("Good job telling me that!").

**Universal questions (asked in every scenario):**

| Step | Dispatcher Says | Child Response Method | Purpose |
|------|----------------|----------------------|---------|
| 1 | "[Localized greeting]. What's your name?" | Voice input (if enabled) OR tap pre-filled name button | Practice saying their name |
| 2 | "How old are you?" | Tap a number (3 or 4) | Practice stating age |
| 3 | "Where are you?" | Tap "My home" icon OR voice/text of address (ties to Address Lesson 3.10) | Practice stating location |

**Scenario-branched questions:**

**Medical scenario ("Someone is hurt"):**

| Step | Dispatcher Says | Child Response Options (Tap) |
|------|----------------|-----|
| 4 | "Who is hurt?" | 🧑 Mommy / 🧔 Daddy / 👴 Grandma/Grandpa / 🧑 Someone else |
| 5 | "What happened to them?" | 😵 Fell down / 🤒 Very sick / 💤 Won't wake up / ❓ I don't know |
| 6 | "Are they breathing?" | ✅ Yes / ❌ No / ❓ I don't know |
| 7 | "OK, helpers are on the way! Stay on the phone." | → Transition to After Call (3.5.5) |

**Fire scenario:**

| Step | Dispatcher Says | Child Response Options (Tap) |
|------|----------------|-----|
| 4 | "Is there a fire?" | 🔥 Yes / 💨 I see smoke / ❓ I don't know |
| 5 | "Are you outside the house?" | 🏠 Yes, I'm outside / 🚪 No, I'm inside |
| 5a (if inside) | "Can you get outside safely? Go now!" | → Special "Get Out First" screen (see 3.5.5) |
| 6 | "Are you alone or is someone with you?" | 👤 Alone / 👥 Someone is with me |
| 7 | "Helpers are coming! Stay far away from the fire." | → Transition to After Call (3.5.5) |

**Danger scenario ("Someone scary"):**

| Step | Dispatcher Says | Child Response Options (Tap) |
|------|----------------|-----|
| 4 | "Are you safe right now?" | ✅ Yes / ❌ No / ❓ I don't know |
| 5 | "Can you hide somewhere safe?" | 🚪 Yes / ❌ No |
| 6 | "It's OK to be very quiet. I'm sending help right now." | → Transition to Silent Call lesson (3.5.4) |

**"I don't know" is always a valid answer.** The dispatcher always responds with "That's OK! You're doing great. Helpers are coming." Never make the child feel wrong for not knowing.

**Voice Input Option:** If Speech Recognition is enabled (see 3.9), the child can speak their answers instead of tapping. The dispatcher "listens" and responds. For Step 1 (name), voice is preferred because it practices the actual skill of saying your name to a stranger on the phone.

```typescript
interface DispatcherScript {
  scenarioType: 'medical' | 'fire' | 'danger' | 'lost_child' | 'general';
  steps: DispatcherStep[];
}

interface DispatcherStep {
  id: string;
  dispatcherTextKey: string;          // i18n key for dispatcher's line
  dispatcherAudio?: string;           // Optional: parent-recorded audio override
  responseType: 'tap_options' | 'voice' | 'tap_or_voice' | 'auto_advance';
  options?: DispatcherOption[];       // For tap_options / tap_or_voice
  nextStepId: string | Record<string, string>; // Linear or branching
  encouragementKey?: string;          // i18n key for "Good job!" response after answering
}

interface DispatcherOption {
  id: string;
  labelKey: string;                   // i18n key
  icon: string;                       // Emoji or SVG asset
  leadsTo: string;                    // Next step ID (for branching)
}
```

**Parent-Recorded Dispatcher Voice:**

In the Parent Zone, parents can optionally record themselves reading the dispatcher's lines. Recordings are saved as audio files in the app's `FileSystem.documentDirectory` and referenced by file URI in the database. The app plays the parent's recording instead of TTS when available.

**Setup flow (Parent Zone → Emergency Settings → Record Dispatcher Voice):**
1. Show each dispatcher line as text
2. Parent taps record, reads the line, taps stop
3. Play back for review, re-record if needed
4. Mark as "custom recorded" — app prefers this over TTS

```typescript
interface ParentRecording {
  stepId: string;                     // Matches DispatcherStep.id
  fileUri: string;                    // FileSystem.documentDirectory path to .m4a file
  durationMs: number;
  recordedAt: string;                 // ISO date
}
```

**Why this matters:** A parent's voice is the most calming sound for a scared child. Hearing Mom's or Dad's voice during practice makes the drill feel safe and makes the script more likely to stick in a real emergency.

---

#### 3.5.4 Silent Call Lesson ("I Can't Talk")

**Purpose:** Teach that in some emergencies (someone scary in the house, hiding), the child can call and stay on the line WITHOUT talking, and help may still come.

**Lesson Flow:**
1. Buddy explains with a serious but gentle tone:
   - "Sometimes you might need to call [number] but you can't talk because you need to be very quiet"
   - "That's OK! Just call, and DON'T hang up"
   - "The helpers can sometimes figure out where you are just from your call"
   - "Even if you can't say anything, staying on the phone is helping"
2. **Practice simulation:**
   - Child dials the emergency number
   - Dispatcher "answers" and says "Hello? Is someone there? If you can't talk, that's OK. Stay on the line."
   - Screen shows a "Shhh... 🤫" animation with a timer counting up
   - After 10 seconds of silence, dispatcher says "We're sending help. Stay on the phone."
   - Buddy celebrates: "You did it! You stayed on the phone and help is coming!"
3. **Key teaching:** Large, animated text + voice: "NEVER hang up. Even if you can't talk."

**Important UX note:** This lesson should NOT be scary. Buddy frames it as a "secret agent mission" — "Sometimes helpers need you to be very quiet and very brave, like a secret agent!"

---

#### 3.5.5 After the Call ("What to Do Next")

**Purpose:** Teach what to do AFTER calling, because the emergency doesn't end when the phone call does. Different scenarios have different post-call actions.

**Post-Call Action Screens (interactive checklists):**

Each action is shown one at a time as a large illustrated card. The child taps "Got it!" to advance. Buddy narrates each one.

**After a Medical Emergency call:**

| Step | Buddy Says | Illustration |
|------|-----------|-------------|
| 1 | "Stay on the phone! Don't hang up." | Phone with green "connected" indicator |
| 2 | "Stay near the person who's hurt so you can tell the helper what's happening." | Child sitting near adult on floor |
| 3 | "If you can, unlock the front door so the helpers can get in." | Child turning door lock |
| 4 | "The helpers will be wearing uniforms. They're here to help — don't be scared!" | Friendly paramedic waving |
| 5 | "You did an AMAZING job. You helped save someone!" | Stars + celebration |

**After a Fire call:**

| Step | Buddy Says | Illustration |
|------|-----------|-------------|
| 1 | "GET OUTSIDE FIRST! Getting out is more important than anything." | Child running out front door |
| 2 | "If there's smoke, crawl on the ground where the air is cleaner." | Child crawling low |
| 3 | "Once you're outside, go to your meeting spot and STAY there." | Child at mailbox / tree (parent-configurable landmark) |
| 4 | "DON'T go back inside. Not for toys, not for pets. The firefighters will help." | House with X over door |
| 5 | "Tell the firefighters if anyone is still inside." | Child talking to firefighter |
| 6 | "You were so brave! Firefighters are SO good at helping." | Firetruck + celebration |

**After a Danger/Intruder call:**

| Step | Buddy Says | Illustration |
|------|-----------|-------------|
| 1 | "Stay hidden and very quiet." | Child in closet/under bed |
| 2 | "Keep the phone with you — don't hang up." | Phone close to chest |
| 3 | "When the police come, they'll say 'Police!' so you know it's safe." | Police officer at door |
| 4 | "Only come out when a police officer or your parent says it's OK." | Parent hugging child |
| 5 | "You were SO brave. Hiding and calling was exactly the right thing to do." | Stars + celebration |

**After a "I'm Lost" call:**

| Step | Buddy Says | Illustration |
|------|-----------|-------------|
| 1 | "Stay right where you are! Don't walk around more." | Child standing still with footprints planted |
| 2 | "Look around for a grown-up in a uniform — a police officer, a security guard, or a store worker." | Friendly uniformed adults |
| 3 | "Tell them your name and that you're lost." | Child talking to adult |
| 4 | "If you can't find anyone, stay on the phone. Help is coming to YOU." | Phone + map pin icon |
| 5 | "You were so smart to ask for help! That takes courage." | Celebration |

```typescript
interface AfterCallStep {
  id: string;
  scenarioType: 'medical' | 'fire' | 'danger' | 'lost_child';
  order: number;
  buddyTextKey: string;         // i18n key for Buddy's narration
  illustrationAsset: string;    // SVG/image path
  isActionable: boolean;        // true if child should physically do something (unlock door, etc.)
  criticalSafety: boolean;      // true = this step is about physical safety (shown larger, repeated)
}
```

---

#### 3.5.6 Spaced Repetition & Ongoing Practice

**Purpose:** A child who learned about emergencies 3 weeks ago has already forgotten much of it. This sub-module ensures regular, low-friction reinforcement so the knowledge sticks.

**How it works:**

**1. Emergency Mini-Quiz (triggered automatically):**
- After every 3rd regular practice session (dialing Mom, Dad, etc.), Buddy pops up:
  - "Hey! Quick question before we go — do you remember what to do if there's a fire?"
  - Shows ONE scenario card (YES/NO) from the pool in 3.5.1
  - Takes <15 seconds to complete
  - No penalty for skipping ("That's OK, we'll practice later!")
- Frequency configurable by parent in Settings (default: every 3 sessions)

**2. Weekly Emergency Drill:**
- Once per week (configurable), the app suggests a full practice call:
  - "It's been a while since we practiced calling [emergency number]. Want to do a quick practice?"
  - If accepted → runs a random scenario through the full flow: dial → dispatcher sim → after-call steps
  - If declined → no penalty, asks again next session
  - Parents receive a subtle note in the Progress Dashboard showing last drill date

**3. Spaced Repetition Algorithm (simplified for children):**

```typescript
interface EmergencyProgress {
  scenarioMastery: {
    [scenarioId: string]: {
      correctCount: number;       // Lifetime correct answers
      incorrectCount: number;     // Lifetime wrong answers
      consecutiveCorrect: number; // Resets on wrong answer
      lastPracticed: string;      // ISO date
      nextDue: string;            // ISO date — when to re-test
      interval: number;           // Days until next review (grows: 1 → 3 → 7 → 14 → 30)
    };
  };
  dispatcherSimCompletions: number; // Times full sim completed
  afterCallCompletions: {
    [scenarioType: string]: number; // Times each post-call flow completed
  };
  silentCallCompleted: boolean;
  lastFullDrill: string;           // ISO date
  nextDrillDue: string;            // ISO date
  overallEmergencyMastery: number; // 0-100, aggregated score
}
```

**Interval schedule:** After a correct answer, the next review is scheduled at increasing intervals: 1 day → 3 days → 7 days → 14 days → 30 days. A wrong answer resets that scenario's interval to 1 day. This is a simplified Leitner system appropriate for the age group.

**4. "Emergency Star" Badge:**
A child earns the special "Emergency Star" badge (displayed on their profile) when ALL of the following are met:
- All 12 core scenarios mastered (3 consecutive correct each)
- Full dispatcher sim completed for at least 2 scenario types
- At least 1 after-call flow completed
- At least 1 silent call lesson completed
- Emergency number recall: can dial from memory (no hints) 3 times in a row

This badge is the app's highest achievement and is visually distinct (gold, animated, shown on the home screen).

---

#### Emergency Module — Safeguards & Parent Controls

**In-app safety:**
- If the child dials ANY of the locale's emergency numbers from Free Dial mode, it does NOT make a real call. Instead it redirects to the Emergency Module hub with the message "Great job remembering [number]! Let's practice when to use it."
- The dispatcher simulation is ALWAYS clearly labeled as practice ("This is pretend — we're just practicing!")
- Buddy periodically reminds: "Remember, in a REAL emergency, call [number] on a REAL phone!"

**Parent Zone emergency settings:**

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Emergency module | Toggle | ON | Enable/disable the entire emergency module |
| Emergency drill frequency | Selector | Weekly | Weekly / Every 2 weeks / Monthly / Off |
| Mini-quiz frequency | Selector | Every 3 sessions | Every 2 / 3 / 5 sessions / Off |
| Scenario types enabled | Multi-toggle | All ON | Medical / Fire / Danger / Lost child — parent can disable specific scenarios |
| Dispatcher voice | Selector | TTS | TTS (automatic) / Parent-recorded |
| Record dispatcher voice | Action button | — | Opens the recording flow for parent to record dispatcher lines |
| Fire meeting spot | Text input | Empty | "Where should your child go after leaving the house?" (e.g., "the big tree", "the mailbox") |
| Show after-call actions | Toggle | ON | Include the "what to do after" interactive steps |
| Emergency progress | Read-only | — | Shows mastery per scenario, last drill date, Emergency Star status |

---

### 3.6 Parent Zone

**Purpose:** Let parents configure the app. Locked behind a parent gate.

**Parent Gate Design:**
- NOT a text password (kids can't read, but also siblings/older kids could guess)
- Use a **gesture gate**: Display instruction like "Press and hold both orange circles for 3 seconds"
  - Two circles placed far apart on screen (requires adult-sized hand span or two-hand coordination)
  - Alternatively: "Solve: 14 + 23 = ?" (simple math a 3-year-old can't do)

**Settings Available:**

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Country/Region | Selector | Auto-detected | Sets locale, emergency numbers, phone format |
| Language | Selector | Auto-detected | UI language (English, Spanish, French, etc.) |
| Contacts | List | Empty + emergency | Add up to 6 contacts with name, photo, number |
| Child Profiles | List | 1 default | Add/manage up to 5 child profiles |
| Home Address | Text | Empty | Street number + name for Address Lesson |
| Difficulty | Selector | Beginner | Beginner / Intermediate / Advanced |
| Auto-difficulty | Toggle | ON | Automatically progress difficulty based on mastery |
| Sound effects | Toggle | ON | Enable/disable sound effects |
| Voice prompts | Toggle | ON | Enable/disable spoken number names |
| Vibration | Toggle | ON | Enable/disable haptic feedback |
| Voice Recognition | Toggle | OFF | Enable/disable "Say the Number" mode (Beta) |
| Hint delay | Slider | 3 sec | Seconds before hint appears on wrong answer |
| Session length | Selector | 5 min | Max practice session before "Take a break!" prompt |
| Emergency module | Toggle | ON | Enable/disable the emergency lesson |
| Address module | Toggle | OFF | Enable/disable the address lesson (requires address entry) |

**Contact Editor:**
- Name (text input)
- Relationship (dropdown: Mom, Dad, Grandma, Grandpa, Aunt, Uncle, Babysitter, Other)
- Phone number (numeric input with formatting)
- Photo (upload from device camera/gallery, or pick a default cartoon avatar)

**Progress Dashboard:**
- Per-contact mastery percentage
- Number of successful dials
- Most-practiced number
- Streak counter (consecutive days)
- Visual chart showing progress over time (simple bar chart)

---

### 3.7 Simon Says Mode (Memory Game)

**Purpose:** Build digit-sequence memory through a fun call-and-response game. The app plays a sequence of digits; the child repeats it back.

**Gameplay:**
1. Buddy says "Listen carefully!" and plays a sequence of DTMF tones + voice (e.g., "3… 7… 1")
2. The corresponding buttons flash in order so the child sees AND hears the sequence
3. Child taps the digits back in the same order
4. Correct → add one more digit to the sequence, celebrate with a small animation
5. Wrong → gentle "boop", replay the sequence, allow retry (max 2 retries per round)
6. Game ends when child fails 2 retries OR completes a 7-digit sequence (phone-number-length!)

**Progression:**
| Round | Sequence Length | Speed |
|-------|----------------|-------|
| 1     | 2 digits       | Slow (1s between digits) |
| 2     | 3 digits       | Slow |
| 3     | 4 digits       | Medium (0.7s) |
| 4     | 5 digits       | Medium |
| 5     | 6 digits       | Normal (0.5s) |
| 6     | 7 digits       | Normal |

**Smart Sequences:** Optionally use digit subsequences from the child's saved contacts so they're practicing real numbers without realizing it. E.g., if Mom's number is 555-123-4567, round 3 might play "1-2-3-4."

**Rewards:** Sticker earned for completing round 4+. Special "Memory Star" sticker for completing all 6 rounds.

---

### 3.8 Who's Calling? Mode (Recall Challenge)

**Purpose:** Test recall by showing only a contact's face — the child must dial their number entirely from memory.

**Flow:**
1. A contact card appears (large avatar + name) — but NO number is shown
2. The child must dial the full number from memory
3. After each digit:
   - Correct → green flash + DTMF tone, digit appears on screen
   - Wrong → gentle shake, digit does NOT appear, counter increments
4. "Need a hint?" button appears after 5 seconds of inactivity or 3 wrong taps
   - Hint level 1: Next correct digit is spoken aloud
   - Hint level 2: Next correct digit pulses on keypad
   - Hint level 3: Next 3 digits shown on the display
5. Completion → celebration, graded by hints used:
   - 0 hints: "Perfect recall! ⭐⭐⭐" → Gold sticker
   - 1-2 hints: "Great memory! ⭐⭐" → Silver sticker
   - 3+ hints: "Good try! ⭐" → Bronze sticker

**Unlock Requirement:** This mode only unlocks for a contact once the child reaches 80%+ mastery in Practice Mode for that contact. This prevents frustration.

---

### 3.9 Voice Recognition Mode (Say the Number)

**Purpose:** Teach children to say digits out loud — critical for talking to a 911 dispatcher or telling someone a phone number.

**Implementation:** Uses native speech recognition. On iOS, this is available via the Speech framework; on Android, via the SpeechRecognizer API. Use a community Expo module like `expo-speech-recognition` (or a bare React Native module like `@react-native-voice/voice`) to access these native APIs from JS.

**Flow:**
1. A digit appears large on screen (e.g., a big colorful "7")
2. Buddy says "Can you say this number?"
3. Child speaks the digit out loud
4. App listens via native speech recognition and matches the result
5. Correct → green flash, Buddy says "That's right! Seven!" + star animation
6. Incorrect or no match → "Try again! This is seven!" (Buddy says the correct digit)
7. Progress through all 10 digits (0-9), then try short sequences

**Modes:**
- **Single Digit:** Show one digit at a time (beginner)
- **Sequence:** Show 3 digits, child says them in order (intermediate)
- **Full Number:** Show a contact's number, child reads it aloud (advanced)

**Important Caveats:**
- Speech Recognition requires microphone permission (already declared in `app.json` for parent recording)
- **Always provide a fallback:** If Speech Recognition is unavailable or permission denied, show a "Tap the number instead" button
- Set the recognition locale to match the app's locale (e.g., `'en-US'`, `'es-MX'`)
- Young children's speech is imprecise — set confidence threshold LOW and accept fuzzy matches
- This feature should be clearly marked as "Beta" in the UI

```typescript
// Native speech recognition setup (using @react-native-voice/voice or similar)
import Voice from '@react-native-voice/voice';

interface VoiceRecognitionConfig {
  locale: string;             // e.g., 'en-US', set from app locale
  confidenceThreshold: 0.3;   // Low threshold for young children
}

// Start listening
Voice.start(locale);
Voice.onSpeechResults = (e) => {
  const results = e.value || [];  // Array of possible transcriptions
  // Check if any result matches the target digit
};
```

---

### 3.10 Address Lesson Module (Learn My Address)

**Purpose:** Teach the child their home address — another critical safety skill, especially paired with 911 training.

**Parent Setup (in Parent Zone):**
- Parent enters the home address as a simple string (e.g., "42 Oak Street")
- Parent can optionally record a voice clip of themselves saying the address
- Parent chooses what to teach: just street number, street name, or full address

**Lesson Flow:**
1. **Listen & Learn:** Buddy says "Your home is at [address]!" with a cute house illustration. Repeats 3 times with the address highlighted.
2. **Fill the Blanks:** The address is shown with blanks for the numbers. Child taps digits to fill them in (reuses the dialer pad!). E.g., "__ __ Oak Street" → child dials 4, 2.
3. **Say It Back:** (If voice recognition available) Child repeats the address out loud.
4. **Full Recall:** Buddy asks "Where do you live?" — child fills in the full street number from memory.

**Scope:** Keep this focused on the street number + street name only. Full addresses (city, state, zip) are too complex for ages 3-4. The goal is that a child could tell a dispatcher or adult "I live at 42 Oak Street."

---

### 3.11 Themed Skins

**Purpose:** Keep the app fresh and exciting. Let children pick a "phone skin" that changes the visual style.

**Available Themes:**

| Theme | Background | Button Style | Mascot Variant |
|-------|-----------|-------------|----------------|
| **Default** (Buddy) | Light sky blue | White rounded squares | Phone character |
| **Space** | Dark navy with stars | Circular "planet" buttons | Astronaut Buddy |
| **Ocean** | Aqua gradient with bubbles | Bubble-shaped buttons | Diver Buddy |
| **Jungle** | Green with leaf patterns | Leaf-shaped buttons | Explorer Buddy |
| **Dino** | Warm orange/brown | Egg-shaped buttons | Dino Buddy |
| **Princess/Castle** | Pink/lavender with sparkles | Gem-shaped buttons | Crown Buddy |

**Implementation:**
- Each theme is a set of color/style values provided via a React Context + a set of SVG assets
- Themes stored in a `themes.ts` data file
- Active theme stored in settings (persisted in database per profile)
- Theme picker is accessible from Home Screen (small palette icon) — NOT behind the parent gate (let kids personalize freely)

```typescript
interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    buttonFace: string;
    buttonBorder: string;
    textPrimary: string;
  };
  buttonShape: 'rounded-square' | 'circle' | 'bubble' | 'leaf' | 'egg' | 'gem';
  backgroundPattern: string;    // CSS pattern or SVG reference
  mascotVariant: string;        // SVG asset ID
  unlockCondition?: string;     // Optional: earn themes through progress
}
```

**Unlock System (optional):** Some themes can be rewards for reaching milestones (e.g., "Ocean" unlocks after 10 successful dials). Default + 2 others are always free.

---

### 3.12 Multi-Profile Support

**Purpose:** Families with multiple children (e.g., a 3-year-old and a 4-year-old) can track progress separately.

**Profile Switching:**
- On app launch, if multiple profiles exist, a profile picker appears (large avatar buttons, one per child)
- Profile picker is OUTSIDE the parent gate (kids should pick their own profile)
- Each profile has: name, avatar (photo or cartoon), age, and independent progress/settings
- Creating/deleting profiles requires the parent gate

**Data Isolation:**
- Each profile gets its own progress data, sticker collection, and difficulty level
- Contacts and locale settings are SHARED across profiles (parent configures once)
- Theme preference is PER-PROFILE

```typescript
interface ChildProfile {
  id: string;
  name: string;
  avatar: string;               // Photo or default avatar ID
  age: number;
  createdAt: string;            // ISO date
  progress: ProfileProgress;    // Same structure as before, scoped to this child
  stickers: string[];
  activeTheme: string;          // Theme ID
  difficultyOverride?: 'beginner' | 'intermediate' | 'advanced'; // Per-child override
}

interface AppData {
  profiles: ChildProfile[];
  activeProfileId: string;
  contacts: Contact[];          // Shared across profiles
  settings: AppSettings;        // Shared (except per-profile overrides)
  locale: LocaleConfig;         // Shared
}
```

**Max Profiles:** 5 (practical limit for a family; keeps the picker simple).

---

## 4. Internationalization (i18n) & Phone Number Formats

This section defines how DialBuddy adapts to work correctly in any country. The goal: a parent in Germany, India, or Brazil should have the same smooth setup experience as a parent in the US.

### 4.1 Locale Configuration

**First Launch Flow:**
1. App detects device locale via `expo-localization`'s `getLocales()` (returns `{ languageCode: 'pt', regionCode: 'BR' }`, etc.)
2. Maps language to a default country (e.g., `'pt-BR'` → Brazil, `'en-GB'` → United Kingdom)
3. Presents a confirmation screen in the Parent Zone: "It looks like you're in [Country]. Is that right?"
4. Parent confirms or selects a different country from a searchable dropdown
5. Locale is saved and drives all downstream behavior

```typescript
interface LocaleConfig {
  countryCode: string;          // ISO 3166-1 alpha-2: 'US', 'GB', 'DE', 'IN', 'BR', etc.
  languageCode: string;         // BCP 47: 'en-US', 'pt-BR', 'de-DE', etc.
  emergencyNumbers: string[];   // ['911'] for US, ['112', '999'] for UK, etc.
  phoneNumberFormat: {
    countryCallingCode: string; // '+1', '+44', '+49', etc.
    exampleNumber: string;      // '2025551234' (for format hints in parent UI)
    digitGrouping: number[];    // [3,3,4] for US, [4,3,3] for Germany, etc.
    minLength: number;          // Min valid digits (e.g., 7 for local DE numbers)
    maxLength: number;          // Max valid digits (e.g., 11 for UK mobile)
  };
  speechLang: string;           // expo-speech language code: 'en-US', 'de-DE', etc.
  rtl: boolean;                 // true for Arabic, Hebrew, etc.
}
```

### 4.2 Emergency Number Database

Pre-built lookup table covering 50+ countries. Sourced from the ITU and verified against local government data.

```typescript
const EMERGENCY_NUMBERS: Record<string, EmergencyConfig> = {
  // North America
  'US': { numbers: ['911'], label: '911', dispatcherGreeting: '911, what is your emergency?' },
  'CA': { numbers: ['911'], label: '911', dispatcherGreeting: '911, what is your emergency?' },
  'MX': { numbers: ['911'], label: '911', dispatcherGreeting: '911, ¿cuál es su emergencia?' },

  // Europe
  'GB': { numbers: ['999', '112'], label: '999', dispatcherGreeting: 'Emergency, which service?' },
  'DE': { numbers: ['112', '110'], label: '112', dispatcherGreeting: 'Notruf, was ist passiert?' },
  'FR': { numbers: ['112', '15', '17', '18'], label: '112', dispatcherGreeting: 'Urgences, que se passe-t-il ?' },
  'ES': { numbers: ['112'], label: '112', dispatcherGreeting: '112, ¿cuál es su emergencia?' },
  'IT': { numbers: ['112', '113'], label: '112', dispatcherGreeting: '112, qual è la sua emergenza?' },
  'NL': { numbers: ['112'], label: '112', dispatcherGreeting: '112, wat is uw nood?' },
  'SE': { numbers: ['112'], label: '112', dispatcherGreeting: '112, vad har hänt?' },
  'PL': { numbers: ['112', '997', '998', '999'], label: '112', dispatcherGreeting: '112, co się stało?' },
  'PT': { numbers: ['112'], label: '112', dispatcherGreeting: '112, qual é a sua emergência?' },
  'NO': { numbers: ['112', '113'], label: '112', dispatcherGreeting: '112, hva har skjedd?' },
  'DK': { numbers: ['112'], label: '112', dispatcherGreeting: '112, hvad er der sket?' },
  'FI': { numbers: ['112'], label: '112', dispatcherGreeting: '112, mitä on tapahtunut?' },
  'AT': { numbers: ['112', '133', '144'], label: '112', dispatcherGreeting: '112, was ist passiert?' },
  'CH': { numbers: ['112', '117', '118', '144'], label: '112', dispatcherGreeting: '112, was ist passiert?' },
  'BE': { numbers: ['112', '101'], label: '112', dispatcherGreeting: '112, wat is uw nood?' },
  'IE': { numbers: ['112', '999'], label: '112 or 999', dispatcherGreeting: 'Emergency, which service?' },
  'GR': { numbers: ['112', '100', '166'], label: '112', dispatcherGreeting: '112, ποια είναι η έκτακτη ανάγκη σας;' },

  // Asia-Pacific
  'AU': { numbers: ['000', '112'], label: '000', dispatcherGreeting: 'Emergency, police fire or ambulance?' },
  'NZ': { numbers: ['111'], label: '111', dispatcherGreeting: '111, what service do you require?' },
  'JP': { numbers: ['110', '119'], label: '110 / 119', dispatcherGreeting: '事件ですか、事故ですか？' },
  'KR': { numbers: ['112', '119'], label: '112 / 119', dispatcherGreeting: '112, 무엇을 도와드릴까요?' },
  'IN': { numbers: ['112', '100', '101'], label: '112', dispatcherGreeting: '112, what is your emergency?' },
  'CN': { numbers: ['110', '120', '119'], label: '110 / 120', dispatcherGreeting: '110，请问发生了什么事？' },
  'SG': { numbers: ['999', '995'], label: '999', dispatcherGreeting: '999, what is your emergency?' },
  'MY': { numbers: ['999', '112'], label: '999', dispatcherGreeting: '999, what is your emergency?' },
  'PH': { numbers: ['911'], label: '911', dispatcherGreeting: '911, ano po ang emergency niyo?' },
  'TH': { numbers: ['191', '1669'], label: '191', dispatcherGreeting: '191 สายด่วน เกิดอะไรขึ้น?' },
  'ID': { numbers: ['112', '110'], label: '112', dispatcherGreeting: '112, apa darurat Anda?' },
  'VN': { numbers: ['113', '114', '115'], label: '113', dispatcherGreeting: '113, bạn cần hỗ trợ gì?' },

  // Middle East & Africa
  'AE': { numbers: ['999', '998', '997'], label: '999', dispatcherGreeting: '999, what is your emergency?' },
  'SA': { numbers: ['911', '997', '998'], label: '911', dispatcherGreeting: '911, ما هي حالة الطوارئ؟' },
  'ZA': { numbers: ['10111', '112'], label: '10111', dispatcherGreeting: '10111, what is your emergency?' },
  'NG': { numbers: ['112', '199'], label: '112', dispatcherGreeting: '112, what is your emergency?' },
  'EG': { numbers: ['122', '123', '180'], label: '122', dispatcherGreeting: '122، ما هي حالة الطوارئ؟' },
  'KE': { numbers: ['999', '112'], label: '999', dispatcherGreeting: '999, what is your emergency?' },
  'IL': { numbers: ['100', '101', '102'], label: '100', dispatcherGreeting: '100, מה קרה?' },

  // South America
  'BR': { numbers: ['190', '192', '193'], label: '190', dispatcherGreeting: '190, qual é a emergência?' },
  'AR': { numbers: ['911'], label: '911', dispatcherGreeting: '911, ¿cuál es su emergencia?' },
  'CO': { numbers: ['123'], label: '123', dispatcherGreeting: '123, ¿cuál es su emergencia?' },
  'CL': { numbers: ['131', '132', '133'], label: '131', dispatcherGreeting: '131, ¿cuál es su emergencia?' },
  'PE': { numbers: ['105', '116'], label: '105', dispatcherGreeting: '105, ¿cuál es su emergencia?' },
};

interface EmergencyConfig {
  numbers: string[];            // All valid emergency numbers for this country
  label: string;                // What to show/teach the child (primary number)
  dispatcherGreeting: string;   // Localized dispatcher greeting for simulation
  numberServiceMap?: Record<string, string>; // For multi-number countries: '110' → 'police', '119' → 'fire_ambulance'
  silentCallSupported: boolean; // Whether silent/open-line calls dispatch help in this country
  dispatcherScripts: string[];  // IDs of DispatcherScript entries available for this locale
}
```

### 4.3 Phone Number Formatting with libphonenumber-js

**Why libphonenumber-js:** Phone number formats vary wildly across countries. Rather than maintaining our own rules, we delegate to Google's proven library (lightweight JS port: ~90KB, tree-shakeable to ~40KB).

**Usage in the app:**

```typescript
import { parsePhoneNumber, isValidPhoneNumber, AsYouType } from 'libphonenumber-js';

// --- Parent Zone: Validate a number during contact setup ---
function validateContactNumber(raw: string, countryCode: string): ValidationResult {
  try {
    const valid = isValidPhoneNumber(raw, countryCode as any);
    if (!valid) return { ok: false, error: 'This doesn\'t look like a valid phone number' };

    const parsed = parsePhoneNumber(raw, countryCode as any);
    return {
      ok: true,
      nationalNumber: parsed.nationalNumber,      // '2025551234' (digits only)
      formatted: parsed.formatNational(),          // '(202) 555-1234' for US
      digitGrouping: extractGrouping(parsed),      // [3, 3, 4]
    };
  } catch {
    return { ok: false, error: 'Please check this number' };
  }
}

// --- Child-facing dialer: Format digits as child types them ---
function formatAsChildTypes(digits: string, countryCode: string): string {
  const formatter = new AsYouType(countryCode as any);
  return formatter.input(digits);   // Progressively formats: '202' → '(202) ', '2025551' → '(202) 555-1'
}

// --- Extract digit grouping for practice mode chunking ---
function extractGrouping(parsed: PhoneNumber): number[] {
  const formatted = parsed.formatNational();
  // Parse the formatted string to determine grouping pattern
  // '(202) 555-1234' → [3, 3, 4]
  // '07911 123456'   → [5, 6] (UK mobile)
  // '030 1234567'    → [3, 7] (German landline)
  const groups = formatted.match(/\d+/g) || [];
  return groups.map(g => g.length);
}
```

**How digit grouping affects the child's experience:**

| Country | Number | Formatted | Digit Groups | Intermediate Practice Chunks |
|---------|--------|-----------|-------------|------|
| US | 2025551234 | (202) 555-1234 | [3, 3, 4] | "202" → "555" → "1234" |
| UK | 07911123456 | 07911 123456 | [5, 6] | "07911" → "123456" |
| Germany | 03012345678 | 030 12345678 | [3, 8] | "030" → "1234" → "5678" |
| France | 0612345678 | 06 12 34 56 78 | [2,2,2,2,2] | "06" → "12" → "34" → "56" → "78" |
| India | 9876543210 | 98765 43210 | [5, 5] | "98765" → "43210" |
| Brazil | 11987654321 | (11) 98765-4321 | [2, 5, 4] | "11" → "98765" → "4321" |
| Japan | 09012345678 | 090-1234-5678 | [3, 4, 4] | "090" → "1234" → "5678" |

The Intermediate difficulty level uses these groups as natural chunks. The child dials one group at a time, with a pause and "Great!" between groups.

### 4.4 Dialer Display Formatting

On the child-facing dialer screen, digits are shown with locale-appropriate spacing as the child types. This teaches the visual pattern of their country's phone numbers.

```typescript
// In DialerScreen.tsx
const { locale } = useLocale();
const formattedDisplay = formatAsChildTypes(dialedDigits, locale.countryCode);
// Renders: "(202) 555-12__" as child types (US)
// Renders: "06 12 34 __"    as child types (France)
```

Placeholder underscores or dots show remaining digits so the child knows how many are left. Use the format of the contact's number (from libphonenumber-js) to determine the total expected length.

### 4.5 UI String Localization

All user-facing text is externalized using `react-i18next`:

```typescript
// i18n/locales/en.json
{
  "home": {
    "greeting": "Hi! What do you want to do?",
    "practice": "Practice",
    "freeDial": "Free Dial",
    "myPeople": "My People"
  },
  "practice": {
    "pressNumber": "Press {{number}}!",
    "greatJob": "Great job!",
    "tryAgain": "Oops! Try again!",
    "needHint": "Need a hint?",
    "completed": "You did it! {{name}} is so proud of you!"
  },
  "emergency": {
    "title": "Emergency Number",
    "intro": "{{number}} is a special number for when someone is really hurt or there's a big danger.",
    "whenToCall": "When should you call {{number}}?",
    "dispatcherGreeting": "{{greeting}}"
  },
  "simonSays": {
    "listen": "Listen carefully!",
    "yourTurn": "Your turn!",
    "correct": "That's right!",
    "tryAgain": "Let's hear it again!"
  }
}
```

**Voice prompts:** The `speechSynthesis.lang` attribute is set from `locale.speechLang` so digit names are spoken in the correct language automatically (e.g., "siete" instead of "seven" for Spanish).

### 4.6 RTL (Right-to-Left) Support

For Arabic, Hebrew, and other RTL languages:
- Use React Native's `I18nManager.forceRTL(true)` when `locale.rtl === true` (requires app restart)
- The number pad layout does NOT flip (numbers are always in standard phone layout) — use `style={{ direction: 'ltr' }}` on the pad container
- Text, navigation, and card layouts DO flip automatically via RN's built-in RTL support
- Use NativeWind's `rtl:` variant for RTL-specific style overrides where needed

### 4.7 Emergency Module Localization

The comprehensive emergency module (Section 3.5) adapts extensively based on locale:

**Number & routing:**
- **Primary number taught:** Uses `locale.emergencyNumbers[0]` as the default (e.g., "112" in Germany, "000" in Australia)
- **Multi-number countries:** Uses `EmergencyConfig.numberServiceMap` to route scenario types to the correct number. The dispatcher sim (3.5.3) dials the appropriate number based on scenario:
  - Japan: Medical scenario → 119, Danger scenario → 110
  - France: Medical → 15 (SAMU), Fire → 18, General → 112
  - Switzerland: Police → 117, Fire → 118, Ambulance → 144, General → 112
- **Lesson title** adapts: "Learn to Call 911" → "Learn to Call 112" → "Learn to Call 000"

**Dispatcher simulation:**
- **Greeting:** Localized from `EmergencyConfig.dispatcherGreeting` (e.g., "Notruf, was ist passiert?" for Germany)
- **All dispatcher lines** are translated via `dispatcherScripts.ts` using i18n keys
- **Parent-recorded audio** overrides TTS in any language — the recording flow shows translated text for the parent to read
- **Silent call support:** `EmergencyConfig.silentCallSupported` determines whether the silent call lesson (3.5.4) is shown. In countries where silent calls don't reliably dispatch help, this lesson is replaced with "Call and try to whisper" guidance

**Scenario cards:**
- All 12 core scenarios are translated per locale
- Illustrations are culturally neutral (no country-specific uniforms, vehicles, or architecture in the base set)
- Optional locale-specific scenario additions (e.g., earthquake scenarios for Japan, bushfire for Australia) can be added to `emergencyScenarios.ts`

**After-call actions:**
- Fire meeting spot label is parent-configurable in any language
- Emergency responder descriptions adapt: "firefighter" vs "pompier" vs "Feuerwehrmann" etc.
- All after-call narration uses i18n keys with locale-appropriate phrasing

**Spaced repetition:**
- Quiz scenarios are drawn from the localized pool
- Mini-quiz prompts use the locale's emergency number in the question text
- Emergency Star badge criteria are identical across locales

---

## 5. UI/UX Design Guidelines

### Color Palette
```
Primary:        #4FC3F7  (Sky Blue — friendly, calm)
Secondary:      #FFD54F  (Warm Yellow — cheerful)
Success:        #81C784  (Soft Green)
Error:          #FF8A80  (Soft Red/Coral — not harsh)
Background:     #F5F5F5  (Light warm gray)
Text:           #37474F  (Dark blue-gray)
Number buttons: #FFFFFF with colored borders, large rounded corners
```

### Typography
- **Primary font:** Nunito (rounded, friendly, highly legible)
- **Number pad digits:** 48px+ font size, bold
- **Contact names:** 28px+, bold
- **All text:** High contrast ratio (WCAG AAA for large text)

### Touch Targets
- **CRITICAL:** All interactive elements must be minimum **64×64px** (larger than standard 44px for small fingers)
- Number pad buttons: **80×80px minimum**, with 8px gap between
- Generous padding/margins — no cramped layouts
- No swipe-only gestures for core features (tapping is more reliable for this age)

### Animations
- Keep to 300-500ms duration (snappy, not sluggish)
- Use `react-native-reanimated` for all animations (60fps native thread)
- Respect `AccessibilityInfo.isReduceMotionEnabled()` — disable animations when true
- Key animations:
  - Button press: `withSpring()` scale down to 0.92, bounce back
  - Correct answer: green pulse + floating star (Lottie via `lottie-react-native`)
  - Wrong answer: gentle horizontal shake (`withSequence()` + `withTiming()`, 3 cycles, 5px)
  - Celebration: confetti burst (`react-native-confetti-cannon`) + Lottie character dancing
  - Screen transitions: Expo Router stack transitions (native slide/fade)
  - Scenario card swipe: `react-native-gesture-handler` Swipeable + Reanimated interpolation

### Audio Design
- **DTMF tones:** Pre-generated MP3 files loaded via `expo-av` `Audio.Sound.createAsync()`. Preload all 10 digit tones on app launch for zero-latency playback. DTMF frequency pairs for reference (used to generate the assets):
  - 1: 697+1209 Hz, 2: 697+1336 Hz, 3: 697+1477 Hz
  - 4: 770+1209 Hz, 5: 770+1336 Hz, 6: 770+1477 Hz
  - 7: 852+1209 Hz, 8: 852+1336 Hz, 9: 852+1477 Hz
  - 0: 941+1336 Hz
- **Voice prompts:** Use `expo-speech` (`Speech.speak()`) for number names — supports any language via the device's TTS engine. Set `language` parameter from locale (e.g., `'de-DE'` for German).
  - Fallback: Pre-recorded MP3 clips for English bundled as assets
- **Sound effects:** Short MP3 files bundled in `assets/sounds/effects/`. Preload via `Audio.Sound.createAsync()` in the `useAudio` hook.
- **Parent-recorded dispatcher voice:** Recorded via `Audio.Recording` (expo-av), saved to app's `FileSystem.documentDirectory`, referenced by file URI in the database.
- **Volume:** Respect device volume; use `Audio.setAudioModeAsync({ playsInSilentModeIOS: true })` so audio works even in silent mode (critical for a kids app where parents may forget)

---

## 6. Expo App Configuration

### app.json
```json
{
  "expo": {
    "name": "DialBuddy - Learn to Call",
    "slug": "dialbuddy",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "dialbuddy",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#4FC3F7"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.dialbuddy.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "DialBuddy uses the camera to take contact photos in the parent settings area.",
        "NSMicrophoneUsageDescription": "DialBuddy uses the microphone to record custom voice prompts and for voice recognition practice.",
        "NSPhotoLibraryUsageDescription": "DialBuddy accesses photos so you can set contact pictures."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4FC3F7"
      },
      "package": "com.dialbuddy.app",
      "versionCode": 1,
      "permissions": ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-router",
      "expo-localization",
      "expo-image-picker",
      "expo-camera",
      "expo-av",
      "expo-speech",
      "expo-haptics",
      "expo-sqlite",
      [
        "expo-build-properties",
        {
          "ios": { "deploymentTarget": "15.0" },
          "android": { "minSdkVersion": 24, "compileSdkVersion": 34 }
        }
      ]
    ]
  }
}
```

### eas.json (Build & Distribution)
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "APPLE_ID",
        "ascAppId": "ASC_APP_ID",
        "appleTeamId": "TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-services.json",
        "track": "production"
      }
    }
  }
}
```

### Offline Strategy
React Native apps are **natively offline by default** — all JS, images, fonts, and sounds are bundled into the binary at build time. Unlike a PWA, there is no network fetch for app shell assets. Specific offline considerations:
- All sound assets, Lottie animations, and images are bundled via Metro bundler (`require()` imports)
- Database (expo-sqlite) is local on-device storage — always available
- `expo-speech` TTS uses the device's built-in speech engine — works offline
- No API calls are ever made (zero server dependency)
- OTA updates via EAS Update are applied opportunistically when connectivity is available, but the app functions fully without them

---

## 7. Data Persistence

All data stored locally on device. Primary storage is **expo-sqlite** for structured/relational data, with **AsyncStorage** as a lightweight key-value fallback for simple preferences.

### Database Schema (expo-sqlite)

```sql
-- expo-sqlite schema (initialized on first launch via migrations)

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,                    -- File URI or default avatar ID
  age INTEGER,
  created_at TEXT NOT NULL,       -- ISO date
  active_theme TEXT DEFAULT 'default',
  difficulty_override TEXT        -- 'beginner' | 'intermediate' | 'advanced' | NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,     -- National digits only
  formatted_number TEXT,          -- Locale-formatted display string
  digit_grouping TEXT,            -- JSON array: '[3,3,4]'
  avatar TEXT,                    -- File URI or default avatar ID
  relationship TEXT,              -- 'Mom', 'Dad', etc.
  is_emergency INTEGER DEFAULT 0, -- boolean
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS progress (
  profile_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  successful_dials INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_practiced TEXT,            -- ISO date
  mastery_level REAL DEFAULT 0,   -- 0-100
  difficulty_level TEXT DEFAULT 'beginner',
  hints_used INTEGER DEFAULT 0,
  simon_says_best INTEGER DEFAULT 0,
  PRIMARY KEY (profile_id, contact_id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

CREATE TABLE IF NOT EXISTS emergency_progress (
  profile_id TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0,
  last_practiced TEXT,
  next_due TEXT,                  -- Spaced repetition next review date
  interval_days INTEGER DEFAULT 1,
  PRIMARY KEY (profile_id, scenario_id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS emergency_stats (
  profile_id TEXT PRIMARY KEY,
  dispatcher_sim_completions TEXT DEFAULT '{}',  -- JSON: { scenarioType: count }
  after_call_completions TEXT DEFAULT '{}',       -- JSON: { scenarioType: count }
  silent_call_completed INTEGER DEFAULT 0,
  last_full_drill TEXT,
  next_drill_due TEXT,
  sessions_since_last_quiz INTEGER DEFAULT 0,
  emergency_number_recall_streak INTEGER DEFAULT 0,
  emergency_star_earned INTEGER DEFAULT 0,
  overall_mastery REAL DEFAULT 0,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS stickers (
  profile_id TEXT NOT NULL,
  sticker_id TEXT NOT NULL,
  earned_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, sticker_id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS parent_recordings (
  step_id TEXT PRIMARY KEY,       -- DispatcherStep.id
  file_uri TEXT NOT NULL,         -- FileSystem.documentDirectory path
  duration_ms INTEGER,
  recorded_at TEXT
);
```

### AsyncStorage (simple key-value)
Used for lightweight, non-relational settings:
```typescript
// Keys stored in AsyncStorage
'@dialbuddy/locale'              // JSON: LocaleConfig object
'@dialbuddy/settings'            // JSON: AppSettings object
'@dialbuddy/active_profile_id'   // string: current child's profile ID
'@dialbuddy/first_launch'        // ISO date string
'@dialbuddy/home_address'        // string: for Address Lesson
'@dialbuddy/fire_meeting_spot'   // string: for fire after-call actions
```

### Database Helper (utils/storage/database.ts)
```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('dialbuddy.db');

// Run migrations on app launch
export async function initDatabase(): Promise<void> {
  await db.execAsync(SCHEMA_SQL);
}

// Example query helpers
export async function getProfiles(): Promise<ChildProfile[]> {
  return db.getAllAsync<ChildProfile>('SELECT * FROM profiles ORDER BY created_at');
}

export async function upsertProgress(profileId: string, contactId: string, data: Partial<Progress>): Promise<void> {
  // INSERT OR REPLACE with partial updates
}
```

**NO server, NO accounts, NO cloud sync.** All data is local-only for maximum privacy (this is a children's app — minimize data collection). Parent recordings are stored as audio files in `FileSystem.documentDirectory` (persisted across app updates).

---

## 8. Accessibility

- **Screen reader support:** All interactive elements use `accessibilityLabel`, `accessibilityHint`, and `accessibilityRole` props. Test with VoiceOver (iOS) and TalkBack (Android).
- **High contrast:** All text meets WCAG AAA for large text (4.5:1 ratio minimum)
- **Reduced motion:** Check `AccessibilityInfo.isReduceMotionEnabled()` on mount and via event listener — disable Reanimated animations and Lottie when true, use instant transitions
- **Audio descriptions:** All visual-only feedback also has an audio component (via expo-speech or sound effects)
- **No color-only indicators:** Success/error states use icons + color + sound (triple redundancy)
- **Touch accommodation:** Large targets (64×64px minimum), no precision gestures required for core features
- **Dynamic text size:** Support iOS Dynamic Type and Android font scaling via `allowFontScaling` — test at 200% text size
- **Semantic grouping:** Use `accessibilityElementsHidden` and `importantForAccessibility` to manage focus order in complex screens (e.g., dispatcher sim)

---

## 9. Privacy & Safety (COPPA Compliance Considerations)

- **No data collection** — zero analytics, zero tracking, zero server calls, zero telemetry
- **No ads** — none, ever
- **No in-app purchases**
- **No external links** — the app is a closed sandbox, no `Linking.openURL()` to web
- **No network requests** — the app makes zero HTTP calls in normal operation
- **Camera/mic access** only in Parent Zone (behind parent gate) for contact photos and voice recording. Requires explicit OS permission dialogs with clear usage descriptions in `app.json` `infoPlist`/`permissions`.
- **No real phone calls** — the app is a simulation only. Does NOT use `Linking.openURL('tel:...')` anywhere.
- **No social features** — no sharing, no accounts, no multiplayer
- **No third-party analytics SDKs** — no Firebase Analytics, no Amplitude, no Mixpanel
- **Parent gate** required for all configuration
- **Local storage only** — SQLite database and audio files in the app's sandboxed directory; data never leaves the device
- **App Store Kids Category:** The app should be submitted under the "Kids" category on both App Store and Play Store, which enforces additional privacy restrictions automatically
- **App Tracking Transparency (iOS):** Not needed because we do zero tracking, but include an `NSUserTrackingUsageDescription` entry in infoPlist set to "DialBuddy does not track you." for compliance
- **Google Families Policy (Android):** Ensure the app complies with Designed for Families requirements — no behavioral advertising, no personal info collection from children

---

## 10. Session Management

- **Session timer:** Configurable by parent (default 5 minutes)
- When timer expires:
  - Gentle overlay: Buddy mascot says "Great job today! Time to take a break!"
  - "One more round" button (extends by 2 minutes, max 1 extension)
  - "All done!" button returns to home screen
- **No infinite scroll / infinite play** — responsible design for young children

---

## 11. Testing Plan

### Unit Tests
- `DialerPad` renders all 10 digits + call button
- Correct/incorrect digit detection logic
- Progress calculation (mastery percentage)
- Phone number validation via libphonenumber-js for 10+ countries
- Digit grouping extraction for various country formats
- Emergency number lookup for all supported countries
- Emergency number → service type routing for multi-number countries
- Scenario mastery calculation (consecutive correct tracking)
- Spaced repetition interval calculation (1 → 3 → 7 → 14 → 30 day progression)
- Spaced repetition reset on wrong answer
- Emergency Star badge criteria validation
- Mini-quiz trigger logic (fires after N sessions)
- Dispatcher script branching logic (correct next step per response)
- Parent gate gesture detection
- Session timer countdown
- Simon Says sequence generation and validation
- Profile switching and data isolation
- i18n string loading and interpolation

### Integration Tests
- Full practice flow: pick contact → dial all digits → celebration
- Free dial → type locale emergency number → redirected to emergency module
- Free dial → type secondary emergency number (e.g., 112 in UK) → also redirected
- Parent gate → add contact (with locale validation) → appears in contact list
- Difficulty auto-progression after mastery threshold
- Country change → emergency numbers update → dialer formatting changes
- Emergency scenario recognition: swipe YES/NO → correct mastery tracking → interval update
- Emergency full flow: scenario card → dial number → dispatcher sim → after-call steps → sticker earned
- Dispatcher sim medical path: all 7 steps complete with tap responses
- Dispatcher sim fire path: "inside" branch triggers "Get Out First" screen
- Dispatcher sim danger path: routes to silent call lesson
- Silent call lesson: dial → stay silent 10s → completion recorded
- Multi-number routing: Japan medical scenario → dials 119 (not 110)
- Parent-recorded audio: record → store in FileSystem.documentDirectory → plays during dispatcher sim instead of TTS
- Spaced repetition: complete scenario → verify nextDue date set correctly → simulate time skip → quiz triggers
- Weekly drill: simulate 7-day gap → drill suggestion appears → complete drill → nextDrillDue updated
- Emergency Star badge: meet all criteria → badge appears on profile → persists across sessions
- Emergency settings: disable specific scenario type → that scenario no longer appears in quizzes or drills
- Simon Says: play sequence → child repeats → correct detection → sequence extends
- Who's Calling? unlock logic (80% mastery gate)
- Profile switch → progress is isolated per child (including emergency progress)
- Voice Recognition mode: speak digit → correct match at low confidence threshold
- Theme switching persists per profile

### Manual Testing
- Test on real devices with actual 3-4 year olds (usability)
- Test touch targets with small fingers
- Test audio on various devices/volumes
- Test app launch time on physical iOS + Android devices (target: under 2 seconds cold start)
- Test offline mode (airplane mode — should work fully since all assets are bundled)
- Test with phone numbers from at least: US, UK, Germany, France, Japan, India, Brazil, Australia
- Test RTL layout with Arabic locale
- Test expo-speech TTS pronunciation in 5+ languages
- Test Speech Recognition with children's voices (where supported)
- **Emergency-specific manual tests:**
  - Test scenario cards with 3-4 year olds — are illustrations clear? Do they understand YES/NO?
  - Test dispatcher sim flow — can a child navigate the tap-response conversation without help?
  - Test "Don't hang up" messaging — does the child understand to stay on the line?
  - Test silent call lesson — is the "secret agent" framing engaging and not scary?
  - Test after-call steps — does the child understand "unlock the door" and "go to meeting spot"?
  - Test parent recording flow — is it easy for a parent to record all dispatcher lines?
  - Test spaced repetition timing — do quizzes appear at the right frequency?
  - Test multi-number countries (Japan, France, Switzerland) — correct number for each scenario?
  - Emotional safety test: does ANY part of the emergency module frighten or upset the child? (If yes, adjust tone/framing)

---

## 12. Implementation Phases

### Phase 1 — MVP (Build This First)
1. Project setup: `npx create-expo-app@latest dialbuddy` with TypeScript template
2. Configure Expo Router (file-based routing in `app/` directory)
3. Install and configure NativeWind v4 (Tailwind for RN): `tailwind.config.js`, `babel.config.js`, `global.css`
4. Install core deps:
   ```bash
   npx expo install expo-av expo-speech expo-haptics expo-sqlite expo-localization expo-image-picker expo-camera expo-font expo-splash-screen react-native-reanimated react-native-gesture-handler react-native-svg lottie-react-native @react-native-async-storage/async-storage
   npm install zustand libphonenumber-js react-i18next i18next react-native-confetti-cannon
   ```
5. Font loading: bundle Nunito via `expo-font`, keep splash screen visible until fonts loaded
6. Database setup: expo-sqlite schema creation, migration runner, query helpers
7. Locale setup flow: `expo-localization` for device language detection + country selector
8. Home Screen with Expo Router navigation
9. Dialer pad component with DTMF sounds (expo-av) + voice (expo-speech, language-aware)
10. Free Dial mode (sandbox) with locale-formatted display
11. Parent Zone with parent gate (Gesture Handler dual long-press) + contact editor (libphonenumber-js validation)
12. Practice Mode (beginner difficulty only) for saved contacts
13. Basic celebration animation (Reanimated spring + confetti) on successful dial
14. English + Spanish translations (i18n foundation)
15. EAS Build setup: development client for iOS Simulator + Android Emulator

### Phase 2 — Full Learning Experience
1. Intermediate + Advanced difficulty levels with locale-aware digit grouping
2. Auto-difficulty progression
3. Progress tracking + mastery calculation (expo-sqlite queries)
4. Sticker reward system
5. Session timer
6. Progress dashboard in Parent Zone (charts via react-native-svg)
7. Multi-profile support (create/switch/delete child profiles)

### Phase 3a — Emergency Module Core
1. Scenario Recognition (3.5.1): 12 core YES/NO scenario cards, swipeable via Gesture Handler, per-scenario mastery tracking
2. Emergency number detection in Free Dial mode (check ALL locale numbers, redirect to module)
3. Practice Dialing (3.5.2): Guided dialing adapted for short emergency numbers, multi-number country routing
4. Basic dispatcher simulation (3.5.3): Universal questions (name, age, location), tap-option responses
5. Scenario-branched dispatcher flows: Medical, Fire, Danger, Lost Child conversation scripts
6. Localized dispatcher greetings and all dialog via i18n keys
7. "Don't hang up" persistent reminder in dispatcher UI

### Phase 3b — Emergency Module Advanced
1. Silent Call lesson (3.5.4): "Secret agent mission" framing, silent practice simulation
2. After-Call Actions (3.5.5): Interactive post-call checklists for Medical, Fire, Danger, Lost Child
3. Parent-recorded dispatcher voice: Recording via `Audio.Recording` (expo-av), saved to `FileSystem.documentDirectory`
4. Spaced Repetition system (3.5.6): Mini-quiz triggers, weekly drill suggestions, Leitner interval scheduling
5. Emergency Star badge: Criteria tracking, animated badge display on profile (Lottie)
6. Emergency-specific parent settings: Drill frequency, scenario toggles, fire meeting spot, progress view
7. Emergency progress dashboard in Parent Zone

### Phase 4 — Bonus Game Modes
1. Simon Says mode (memory game with digit sequences)
2. Who's Calling? mode (recall challenge, unlocked by mastery)
3. Address Lesson module (learn home street number) — with integration into dispatcher sim Step 3
4. Themed skins system (6 themes, React Native style overrides via theme context, unlock system)

### Phase 5 — Voice & Polish
1. Voice Recognition mode (say the number) with native speech recognition or expo community module + fallback
2. Voice input option in dispatcher sim (child speaks name, address, answers)
3. Lottie animations for all celebrations and mascot
4. Mascot character ("Buddy") with theme variants
5. Additional language translations (French, German, Portuguese, Chinese, Japanese, Arabic, Hindi)
6. Locale-specific emergency scenario additions (earthquake for Japan, bushfire for Australia, etc.)
7. Full RTL support for Arabic/Hebrew (React Native `I18nManager.forceRTL()`)
8. Thorough accessibility audit (VoiceOver + TalkBack testing)
9. Performance optimization (Flashlight, React DevTools profiler)
10. App store submission: EAS Submit to Apple App Store + Google Play Store
11. OTA update pipeline: EAS Update for critical fixes without store review

---

## 13. Key Implementation Notes for Claude Code

### Project Setup

1. **Create the project:**
   ```bash
   npx create-expo-app@latest dialbuddy --template tabs
   cd dialbuddy
   ```
   Then restructure to use the file-based routing layout in `app/` as shown in Section 2. Remove the default tab template files and replace with DialBuddy's screens.

2. **Install all dependencies at once:**
   ```bash
   # Expo SDK packages (use npx expo install for version compatibility)
   npx expo install expo-av expo-speech expo-haptics expo-sqlite expo-localization expo-image-picker expo-camera expo-font expo-splash-screen expo-file-system expo-asset react-native-reanimated react-native-gesture-handler react-native-svg react-native-safe-area-context lottie-react-native @react-native-async-storage/async-storage

   # npm packages (pure JS, no native modules)
   npm install zustand libphonenumber-js react-i18next i18next nativewind react-native-confetti-cannon

   # Dev dependencies
   npm install -D tailwindcss@3.3.2 @types/react-native jest @testing-library/react-native
   ```

3. **Configure NativeWind (Tailwind for React Native):**
   - `tailwind.config.js`: set `content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}']`
   - `babel.config.js`: add `'nativewind/babel'` to plugins (AFTER `'react-native-reanimated/plugin'`)
   - `global.css`: `@tailwind base; @tailwind utilities;`
   - In `app/_layout.tsx`: `import '../global.css';`

4. **Configure Reanimated:** Add `'react-native-reanimated/plugin'` as the LAST plugin in `babel.config.js`. This is critical — wrong order breaks builds.

### Audio & Sound

5. **DTMF tones:** Unlike the web (where we could generate tones via Web Audio API oscillators), React Native's expo-av works best with pre-rendered audio files. **Generate 10 short MP3 files** (one per digit, ~200ms each) using the DTMF frequency pairs and bundle them as assets. Preload all 10 on app mount:
   ```typescript
   import { Audio } from 'expo-av';

   const dtmfSounds: Record<string, Audio.Sound> = {};

   export async function preloadDTMF() {
     const tones = {
       '0': require('../assets/sounds/dtmf/0.mp3'),
       '1': require('../assets/sounds/dtmf/1.mp3'),
       // ... etc
     };
     for (const [digit, source] of Object.entries(tones)) {
       const { sound } = await Audio.Sound.createAsync(source);
       dtmfSounds[digit] = sound;
     }
   }

   export async function playDTMF(digit: string) {
     const sound = dtmfSounds[digit];
     if (sound) {
       await sound.setPositionAsync(0);
       await sound.playAsync();
     }
   }
   ```
   DTMF frequency pairs (for generating the MP3s — use Audacity, ffmpeg, or a Python script):
   - 1: 697+1209 Hz, 2: 697+1336 Hz, 3: 697+1477 Hz
   - 4: 770+1209 Hz, 5: 770+1336 Hz, 6: 770+1477 Hz
   - 7: 852+1209 Hz, 8: 852+1336 Hz, 9: 852+1477 Hz
   - 0: 941+1336 Hz

6. **Text-to-speech via expo-speech:**
   ```typescript
   import * as Speech from 'expo-speech';

   export function speakDigit(digit: string, lang: string) {
     const names: Record<string, string> = { '0': 'zero', '1': 'one', ... };
     Speech.speak(names[digit] || digit, { language: lang, rate: 0.9 });
   }
   ```
   Set `language` from the locale's `speechLang` value. Works offline using the device's built-in TTS engine.

7. **Audio mode:** Set this early in app initialization:
   ```typescript
   await Audio.setAudioModeAsync({
     playsInSilentModeIOS: true,    // Critical: plays even in silent mode
     staysActiveInBackground: false, // Don't need background audio
     shouldDuckAndroid: true,
   });
   ```

8. **Parent-recorded dispatcher audio:** Use `Audio.Recording` to record, then save the file:
   ```typescript
   import * as FileSystem from 'expo-file-system';

   const recording = new Audio.Recording();
   await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
   await recording.startAsync();
   // ... user records ...
   await recording.stopAndUnloadAsync();
   const uri = recording.getURI();
   // Copy to persistent storage
   const dest = `${FileSystem.documentDirectory}recordings/${stepId}.m4a`;
   await FileSystem.copyAsync({ from: uri, to: dest });
   // Store `dest` path in database
   ```

### Navigation & Layout

9. **Expo Router file-based routing:** Each file in `app/` is a route. The root `app/_layout.tsx` wraps everything in providers:
   ```typescript
   // app/_layout.tsx
   import '../global.css';
   import { Stack } from 'expo-router';
   import { useFonts } from 'expo-font';
   import * as SplashScreen from 'expo-splash-screen';

   SplashScreen.preventAutoHideAsync();

   export default function RootLayout() {
     const [fontsLoaded] = useFonts({
       'Nunito-Regular': require('../assets/fonts/Nunito/Nunito-Regular.ttf'),
       'Nunito-Bold': require('../assets/fonts/Nunito/Nunito-Bold.ttf'),
     });

     useEffect(() => {
       if (fontsLoaded) SplashScreen.hideAsync();
     }, [fontsLoaded]);

     if (!fontsLoaded) return null;

     return (
       <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
         <Stack.Screen name="index" />
         <Stack.Screen name="practice" />
         <Stack.Screen name="free-dial" />
         <Stack.Screen name="emergency" />
         <Stack.Screen name="parent-zone" />
       </Stack>
     );
   }
   ```

10. **Parent Gate as route guard:** In `app/parent-zone/_layout.tsx`, render the `ParentGate` component. Only show child routes after the gate is passed:
    ```typescript
    // app/parent-zone/_layout.tsx
    export default function ParentZoneLayout() {
      const [unlocked, setUnlocked] = useState(false);
      if (!unlocked) return <ParentGate onUnlock={() => setUnlocked(true)} />;
      return <Stack screenOptions={{ headerShown: true, title: 'Parent Zone' }} />;
    }
    ```

### Gestures & Touch

11. **Parent gate gesture:** Use `react-native-gesture-handler`'s `LongPressGestureHandler` on two `Pressable` circles. Track both with refs. Require simultaneous long-press for 3 seconds:
    ```typescript
    import { Gesture, GestureDetector } from 'react-native-gesture-handler';

    const leftPress = Gesture.LongPress().minDuration(3000).onEnd(() => { leftDone.current = true; check(); });
    const rightPress = Gesture.LongPress().minDuration(3000).onEnd(() => { rightDone.current = true; check(); });
    ```

12. **Haptic feedback:** Use `expo-haptics` for button presses:
    ```typescript
    import * as Haptics from 'expo-haptics';
    // On dialer button press:
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // On correct dial completion:
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    ```

### Storage

13. **expo-sqlite** is the primary data store. Use `openDatabaseSync()` for synchronous reads (faster UI) and async writes. Run schema migrations on app launch inside `app/_layout.tsx` before rendering children. Use prepared statements for all queries to prevent SQL injection.

14. **AsyncStorage** for simple settings only — don't store relational data here. It's a plain key-value store that serializes to JSON.

15. **File storage for recordings:** Parent-recorded dispatcher audio is saved to `FileSystem.documentDirectory` (persisted across app updates, not backed up to iCloud by default). Clean up orphaned recordings when a parent deletes/re-records a step.

### Styling & Theming

16. **NativeWind** allows Tailwind class names directly on React Native components: `<View className="flex-1 bg-sky-100 p-4">`. This keeps the DX close to web Tailwind while compiling to native `StyleSheet` objects.

17. **Themed skins:** Implement via a React Context that provides the active theme's colors. Components read from context rather than hardcoded values:
    ```typescript
    const { colors } = useTheme();
    <View style={{ backgroundColor: colors.background }}>
    ```
    NativeWind can also be used with CSS variables via `vars()` in newer versions, but a context-based approach is more reliable in React Native.

18. **RTL support:** React Native has built-in RTL via `I18nManager.forceRTL(true)` + app restart. Set this during locale setup. The number pad should use `style={{ direction: 'ltr' }}` to prevent flipping.

### Internationalization

19. **expo-localization** detects device locale on launch:
    ```typescript
    import { getLocales } from 'expo-localization';
    const deviceLocale = getLocales()[0]; // { languageCode: 'en', regionCode: 'US', ... }
    ```
    Use this to set the default country and language, then let the parent override in settings.

20. **libphonenumber-js** works identically in React Native as it does on the web — it's pure JavaScript. Import from `libphonenumber-js/min` for the smaller metadata bundle.

### Testing & Building

21. **Development workflow:**
    - `npx expo start` → Expo Go for quick iteration (limited native module support)
    - `npx expo run:ios` / `npx expo run:android` → development build with full native module access
    - Use `eas build --profile development --platform ios` for development client builds that include all native modules

22. **Testing:** Jest + React Native Testing Library. Mock expo modules:
    ```typescript
    jest.mock('expo-av', () => ({ Audio: { Sound: { createAsync: jest.fn() } } }));
    jest.mock('expo-speech', () => ({ speak: jest.fn() }));
    jest.mock('expo-haptics', () => ({ impactAsync: jest.fn() }));
    ```

23. **Building for stores:**
    ```bash
    eas build --platform all --profile production
    eas submit --platform ios
    eas submit --platform android
    ```
    Configure `eas.json` with App Store Connect and Google Play credentials before first submission.

24. **OTA updates:** After initial store approval, push non-native-code changes instantly:
    ```bash
    eas update --branch production --message "Fix: emergency scenario card text"
    ```
    This bypasses app store review for JS/asset-only changes. Do NOT use for native module changes.

---

## 14. Success Metrics

After launch, success looks like:
- A child can independently dial a parent's number (any country format) after 1 week of daily practice
- A child can dial their country's emergency number from memory with zero hints after 2 weeks
- A child can identify at least 10/12 emergency scenarios correctly (YES/NO) after completing the module
- A child can navigate a simulated dispatcher conversation (name, location, what happened) without adult help
- A child can describe at least 2 post-call actions ("don't hang up", "go to the meeting spot") when prompted
- Zero confusion in the UI — a child navigates without adult help after first session
- Parent setup (including country selection and emergency config) takes under 3 minutes
- Parent dispatcher voice recording takes under 5 minutes for the full script set
- App works correctly for 50+ countries with proper number formatting and emergency numbers
- Multi-number countries route to the correct emergency number per scenario type
- Spaced repetition keeps emergency mastery above 80% over a 3-month period
- App launches in under 2 seconds on mid-range devices (cold start)
- 60fps animations throughout — no jank on dialer button presses or celebrations
- Full offline functionality on both iOS and Android
- expo-speech TTS pronunciation correct in 10+ languages
- Multi-child families can switch profiles in under 5 seconds
- Successful submission to both Apple App Store (Kids category) and Google Play Store (Designed for Families)
- **Most critically:** No part of the emergency module frightens or upsets the child — tone is always empowering, never scary

---

## 15. Prerequisites & Development Environment

Before starting implementation, ensure the following are installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | v18+ (LTS v20 recommended) | JavaScript runtime |
| **npm** | v9+ (comes with Node) | Package manager |
| **Expo CLI** | Latest (via `npx expo`) | Expo project tooling |
| **EAS CLI** | Latest (`npm install -g eas-cli`) | Build, submit, and OTA updates |
| **Watchman** | Latest (macOS: `brew install watchman`) | File watcher for Metro bundler |
| **Xcode** | 15+ (macOS only) | iOS simulator + native builds |
| **Android Studio** | Latest + SDK 34 | Android emulator + native builds |
| **CocoaPods** | Latest (`sudo gem install cocoapods`) | iOS native dependency manager |
| **Git** | Latest | Version control |

**Optional but recommended:**
- **VS Code** with extensions: ES7+ React/Native Snippets, Tailwind CSS IntelliSense, Expo Tools
- **Expo Go** app on a physical iOS/Android device for quick testing (limited native module support)
- A physical device for testing touch targets, haptics, audio, and TTS with real children

**First-time EAS setup:**
```bash
eas login                    # Log in to Expo account
eas build:configure          # Generate eas.json
eas credentials              # Set up signing certificates (iOS) and keystore (Android)
```

---

*End of specification. Ready for implementation with Claude Code.*
