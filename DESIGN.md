# DialBuddy Design System

Design reference for all fonts, colors, spacing, components, and visual patterns used in the app.

---

## Typography

### Font Family
All text uses **Nunito** (Google Fonts, open-source).

| Weight | File | Usage |
|--------|------|-------|
| Regular (400) | `Nunito-Regular` | Body text, instructions, hints |
| SemiBold (600) | `Nunito-SemiBold` | Section headers, sub-labels |
| Bold (700) | `Nunito-Bold` | Screen titles, emphasized text |
| ExtraBold (800) | `Nunito-ExtraBold` | Large titles |
| Black (900) | `Nunito-Black` | Button overlay text, gradient labels |

Global default: `Nunito-Regular` applied via `Text.defaultProps` in `app/_layout.tsx`.

### Font Sizes
| Token | Size | Usage |
|-------|------|-------|
| XS | 12px | Small labels, secondary text |
| SM | 14px | Hints, helper text |
| – | 15px | Teaser / description text |
| MD | 16px | Body text, button labels |
| – | 18px | Section headers |
| LG | 20px | Large headers |
| – | 22–24px | Screen titles |
| XL | 28–32px | Step titles, extra-large numbers |
| – | 36px | Emergency number display |
| – | 44px | Dialer button digit |
| – | 48–96px | Celebration emojis |
| – | 100px | Scenario hero emoji |

### Line Heights
- Tight: `1.2` (compact buttons, labels)
- Normal: `1.5` (body text)
- Relaxed: `1.8` (longer instructions)
- Fixed: `18px` (multi-line button overlays), `24–34px` (script display)

### Letter Spacing
- Normal: standard body text
- `4px`: emergency number display
- `8px`: large emergency number hero
- `1px`: dialer letter mappings (ABC, DEF…)

---

## Color Palette

### Brand
| Name | Hex | Usage |
|------|-----|-------|
| Sky Blue | `#4FC3F7` | Primary brand, buttons, borders, focus |
| Warm Yellow | `#FFD54F` | Playful accents, highlighted digit |
| Success Green | `#81C784` | Positive reinforcement, success states |
| Soft Coral | `#FF8A80` | Error / gentle warning |

### Emergency
| Name | Hex | Usage |
|------|-----|-------|
| Emergency Red | `#F44336` | Emergency buttons |
| Emergency Default | `#E53935` | Dial button default |
| Emergency Pressed | `#C62828` | Dial button pressed |
| Dark Emergency | `#B71C1C` | Headings on dark bg |
| Dark BG Red | `#D32F2F` | Emergency number display background |

### Backgrounds
| Name | Hex | Usage |
|------|-----|-------|
| White | `#FFFFFF` | Cards, modals, clean surfaces |
| Light Gray | `#F5F5F5` | App background, secondary surfaces |
| Light Blue | `#E3F2FD` | Info cards, selected states |
| Light Red | `#FFEBEE` | Emergency card backgrounds |

### Text
| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#212121` | Main body text |
| Dark | `#37474F` | High contrast text |
| Secondary | `#757575` | Supporting text |
| Tertiary | `#666666` | Subtle text |
| Disabled | `#BDBDBD` | Inactive text |

### Borders
| Hex | Usage |
|-----|-------|
| `#E0E0E0` | Standard borders, inactive buttons |
| `#F0F0F0` | Very subtle separators |
| `#4FC3F7` | Selected / active borders |

### Scenario Phase Backgrounds
| Phase | Hex |
|-------|-----|
| Scene setup | `#1B5E20` (dark green) |
| Dial phase | `#1A1A2E` (dark navy) |
| Speech phase | `#0D47A1` (dark blue) |
| Success | `#1B5E20` (dark green) |

### Gradient Text
| Button | Top | Bottom |
|--------|-----|--------|
| My Contacts | `#f5d978` (gold) | `#a3c378` (sage green) |
| Parent Zone | `#e1cde9` (lavender) | `#9399cd` (periwinkle) |
| Practice Dialing | `#559ed3` (solid, no gradient) | – |
| Practice Emergencies | `#f68d6d` (solid, no gradient) | – |

### Parent Zone
| Hex | Usage |
|-----|-------|
| `#7E57C2` | Parent zone accent |
| `#5E35B1` | Parent gate security gate |

### Avatar Fallback Colors
`#FF6B6B` · `#4ECDC4` · `#45B7D1` · `#FFA07A` · `#98D8C8` · `#F7DC6F` · `#BB8FCE` · `#85C1E2`

### Confetti Particles
`#6A1B9A` · `#AB47BC` · `#FFD54F` · `#4FC3F7` · `#81C784` · `#FF8A65` · `#FFD700` · `#FF6B6B` · `#FFFFFF`

---

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| XXS | 4px | Minimal gaps |
| XS | 8px | Tight spacing, progress dots |
| SM | 12px | Component internal gaps |
| MD | 16px | Standard padding, grid gaps |
| – | 20px | Card padding |
| LG | 24px | Section spacing, screen horizontal padding |
| – | 28px | Button vertical padding |
| XL | 32px | Modal padding, large sections |
| – | 40px | Footer spacing |
| XXL | 48px | Large layout padding |
| XXXL | 64px | Extra-large |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| SM | 8px | Small chips, tags |
| MD | 12px | Standard buttons, cards, modals |
| – | 14px | Feedback cards |
| LG | 16px | Large cards, panels |
| – | 20px | Scenario selection cards |
| XL | 24px | Emergency/call buttons, home buttons |
| – | 60px | Mic button (circular) |
| Full | 9999px | Perfect circles |

---

## Shadows & Elevation

### iOS Shadow
```
SM:  offset (0,2), opacity 0.10, radius 4
MD:  offset (0,4), opacity 0.15, radius 8
LG:  offset (0,8), opacity 0.20, radius 16
```
All use `shadowColor: '#000'`.

### Android Elevation
| Level | Value |
|-------|-------|
| SM | 2 |
| MD | 4 |
| LG | 8 |
| Custom | 3, 5, 6 |

---

## Buttons

### Home Screen Buttons (Image-based)
PNG images with absolutely positioned text overlays inside `overflow: hidden` containers.

```
Container width  = (screenWidth - 32 padding - 16 gap) / 2
Container height = width × (377 / 329)   ← EmergenciesBtn.png aspect ratio
Image scale      = 1.15× (clips transparent PNG padding)
Border radius    = 24px
```

| Button | Image | Label color | Label position |
|--------|-------|-------------|----------------|
| Practice Dialing | `PracticeBtn.png` | `#559ed3` | top: 18 |
| Practice Emergencies | `EmergenciesBtn.png` | `#f68d6d` | top: 6, lineHeight: 18 |
| My Contacts | `ContactsBtn.png` | Gradient `#f5d978→#a3c378` | top: 8 |
| Parent Zone | `ParentBtn.png` | Gradient `#e1cde9→#9399cd` | top: ~8 |

All labels: `fontFamily: 'Nunito-Black'`, `fontSize: 16`, `textAlign: 'center'`, `position: 'absolute'`.

### Dialer Button
```
Size:          80–82px (min 72px)
Border radius: 16px
Border width:  2px
```
| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | `#FFFFFF` | `#4FC3F7` | `#4FC3F7` |
| Highlighted (next digit) | `#FFD54F` | `#FFA000` | `#E65100` |
| Correct | `#C8E6C9` | `#4CAF50` | `#2E7D32` |
| Error | `#F44336` | `#F44336` | `#FFFFFF` |
| Pressed | – | – | `#FF6F00`, scale 0.97 |
| Disabled | opacity 0.3 | – | – |

### Emergency Dial Button
```
Background:    #E53935
Pressed:       #C62828
Padding:       28px vertical, 12px horizontal
Border radius: 24px
Press scale:   0.97
Elevation:     6
```

### Mic Button (Speech Recognition)
```
Size:          120×120px
Border radius: 60px (circle)
Default bg:    #1565C0
Listening bg:  #F44336
Scale active:  1.08
```

### Standard Buttons
```
Primary:   bg #4FC3F7, radius 12px, padding 16px, text bold white 18px
Skip:      bg #E0E0E0, text #999999
Disabled:  bg #CCCCCC, text #CCCCCC
Success:   bg #4CAF50, text white bold
```

---

## Minimum Touch Target
All interactive elements: **72px minimum** (toddler-safe).
Standard button height: **56px**.

---

## Layout

### Home Screen Grid
```
flexDirection: 'row'
gap: 16px
marginBottom: 16px per row
```

### Scenario Selection Grid
```
2 columns
gap: 12px
Each card: flex 1, centered emoji + title
```

### Screen Padding
```
Horizontal: 24px
Vertical:   32–40px
```

### Modal
```
Overlay:  rgba(0,0,0,0.5)
Content:  bg white, radius 16px, padding 20px, maxHeight 70%
```

---

## Animation

### Durations
| Token | Value |
|-------|-------|
| Fast | 150ms |
| Normal | 250ms |
| Slow | 350ms |
| Digit press debounce | 100ms |
| Auto-call delay | 3000ms |
| Celebration display | 2000ms |
| Error shake | 250ms (total) |
| Dial completion | 800ms |

### Press Scale
- Standard buttons: `0.95`
- Emergency/scenario: `0.97`
- Scene phase: `0.96`

### Shake (wrong digit)
```
translateX sequence: -10 → 10 → -8 → 8 → 0
Step duration: 50ms each
```

### Confetti
```
Count:          120–150 particles
Origin:         { x: screenWidth/2, y: -20 }
Explosion speed: 350px/s
Fall speed:      2800ms
Fade out:        true
```

---

## Image Assets

| File | Dimensions | Usage |
|------|-----------|-------|
| `logo.png` | – | Alternate logo |
| `logo2.png` | 350px wide | Home screen top logo |
| `bg.png` | Full screen | Main app background |
| `bg2.png` | Full screen | Onboarding background |
| `blankbg.png` | Full screen | Practice success screen |
| `HelpBuddy.png` | 180×180px | Emergency hub mascot |
| `PartyBuddy.png` | 160×160px | Celebration mascot |
| `PracticeBtn.png` | 345×394px | Practice Dialing button |
| `EmergenciesBtn.png` | 329×377px | Practice Emergencies button |
| `ContactsBtn.png` | – | My Contacts button |
| `ParentBtn.png` | – | Parent Zone button |
| `splash.png` | – | Splash screen |

All button images displayed at **1.15× scale** inside `overflow: hidden` container to clip transparent padding.

---

## Progress Indicator (Onboarding)

```
Dot size:    12×12px
Border radius: 6px (circle)
Gap:         8px
Active:      #4FC3F7
Inactive:    #E0E0E0
```

---

## Dialed Digit Display

```
Box size:      56×56px
Border radius: 12px
Gap:           12px
Border width:  2px
Default bg:    rgba(255,255,255,0.15)
Default border: rgba(255,255,255,0.3)
Correct:       bg #4CAF50, border #4CAF50
Error:         bg #F44336, border #F44336
```
