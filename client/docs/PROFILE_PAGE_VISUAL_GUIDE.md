# Profile Page - Visual Design Guide

## Desktop View (Large Screens)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
║   ▓▓ GRADIENT HEADER (Blue → Purple → Pink)              ▓▓  ║
║   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
║                                                                           ║
║   ┌───────────┐                                                          ║
║   │           │                                                          ║
║   │   👤 🔵   │   John Doe                          ┌──────────────────┐ ║
║   │           │   📅 Joined October 2024           │  Edit Profile   │ ║
║   └───────────┘                                    └──────────────────┘ ║
║        ↑ Avatar (overlapping)                                            ║
║                                                                           ║
║   ─────────────────────────────────────────────────────────────────────  ║
║                                                                           ║
║   Passionate developer and tech enthusiast. Love building                ║
║   innovative solutions and sharing knowledge with the community.         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

                              ┌─ Statistics ─┐

╔════════════════════╗  ╔════════════════════╗  ╔════════════════════╗
║                    ║  ║                    ║  ║                    ║
║  Total Posts       ║  ║  Total Reactions   ║  ║  Total Comments    ║
║  42          📄    ║  ║  156         ❤️    ║  ║  89          💬    ║
║  ════════════════  ║  ║  ════════════════  ║  ║  ════════════════  ║
║  (Blue bar)        ║  ║  (Red bar)         ║  ║  (Green bar)       ║
╚════════════════════╝  ╚════════════════════╝  ╚════════════════════╝
   ↑                      ↑                      ↑
   Animated counting      Animated counting      Animated counting
   Hover: scale + shadow  Delay: 100ms          Delay: 200ms

─────────────────────────────────────────────────────────────────────────

                            ┌─ John Doe's Posts ─┐

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   My First Post                                    [React] [Next.js]     ║
║   ─────────────────────────────────────────────────────────────────────  ║
║   This is a wonderful post about building amazing things...              ║
║                                                                           ║
║   👤 John Doe        ❤️ 15   💬 8        ⋮ [Edit] [Delete]              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   Another Amazing Post                             [JavaScript]          ║
║   ─────────────────────────────────────────────────────────────────────  ║
║   Check out this incredible insight about modern web development...      ║
║                                                                           ║
║   👤 John Doe        ❤️ 23   💬 12       ⋮ [Edit] [Delete]              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

                         (Infinite scroll continues...)
```

## Mobile View (Small Screens)

```
╔════════════════════════════╗
║                            ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
║  ▓▓ GRADIENT HEADER  ▓▓  ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
║                            ║
║       ┌───────────┐        ║
║       │           │        ║
║       │   👤 🔵   │        ║
║       │           │        ║
║       └───────────┘        ║
║                            ║
║        John Doe            ║
║   📅 Joined Oct 2024       ║
║                            ║
║  ┌──────────────────────┐  ║
║  │   Edit Profile      │  ║
║  └──────────────────────┘  ║
║                            ║
║  ─────────────────────────  ║
║                            ║
║  Passionate developer...   ║
║                            ║
╚════════════════════════════╝

┌─────── Statistics ────────┐

╔════════════════════════════╗
║  Total Posts               ║
║  42               📄       ║
║  ═══════════════════════   ║
╚════════════════════════════╝

╔════════════════════════════╗
║  Total Reactions           ║
║  156              ❤️       ║
║  ═══════════════════════   ║
╚════════════════════════════╝

╔════════════════════════════╗
║  Total Comments            ║
║  89               💬       ║
║  ═══════════════════════   ║
╚════════════════════════════╝

────────────────────────────

┌────── John's Posts ───────┐

╔════════════════════════════╗
║ My First Post              ║
║ [React] [Next.js]          ║
║ ──────────────────────────  ║
║ This is a wonderful post   ║
║ about building amazing...  ║
║                            ║
║ ❤️ 15  💬 8  ⋮            ║
╚════════════════════════════╝

(Scrollable list continues)
```

## Color Palette

### Primary Colors
- **Blue (#3b82f6)**: Posts metric - Professional, trustworthy
- **Red (#ef4444)**: Reactions metric - Energetic, engaging
- **Green (#10b981)**: Comments metric - Growth, conversation

### Gradient
- **Hero Gradient**: `from-blue-500 via-purple-500 to-pink-500`
- Creates a vibrant, modern header

### UI Elements
- **Cards**: White (light mode) / Dark (dark mode) with shadows
- **Text Primary**: Default text color
- **Text Muted**: `text-muted-foreground` for secondary info
- **Borders**: Subtle borders from card component

## Animation Timeline

```
Time: 0ms        100ms       200ms       1000ms
      |           |           |           |
      ▼           ▼           ▼           ▼
      📄          ❤️          💬          ✓
      Posts       Reactions   Comments   Complete
      start       start       start       all
      counting    counting    counting    done

      └───────────────────────────────────┘
                1 second total duration
```

## Hover States

### Stat Cards
**Default**:
- No shadow
- Scale: 1.0
- Transition: 300ms

**Hover**:
- Large shadow (`shadow-lg`)
- Scale: 1.05
- Transition: 300ms
- Smooth, subtle effect

### Buttons
- Edit Profile button uses outline variant
- Hover: Background color change (Radix UI default)

## Responsive Breakpoints

| Screen Size | Layout                  | Avatar Size | Stats Columns |
|-------------|-------------------------|-------------|---------------|
| < 640px     | Mobile, stacked         | 128px (32)  | 1 column      |
| 640px+      | Tablet, side-by-side    | 128px (32)  | 3 columns     |
| 768px+      | Desktop, full layout    | 128px (32)  | 3 columns     |
| 1024px+     | Large desktop           | 128px (32)  | 3 columns     |

## Typography Scale

| Element            | Class           | Size    | Weight |
|--------------------|-----------------|---------|--------|
| User Name          | `text-4xl`      | 36px    | Bold   |
| Section Headers    | `text-2xl`      | 24px    | Bold   |
| Stat Values        | `text-4xl`      | 36px    | Bold   |
| Stat Labels        | `text-sm`       | 14px    | Medium |
| Body Text (Bio)    | Default         | 16px    | Normal |
| Joined Date        | `text-sm`       | 14px    | Normal |

## Spacing System

- **Card Padding**: `p-6` (24px)
- **Section Spacing**: `space-y-8` (32px)
- **Grid Gap**: `gap-6` (24px)
- **Avatar Ring**: `ring-4` (4px)
- **Separator Margin**: `my-6` (24px vertical)

## Loading States

### Initial Load
```
╔═══════════════════════════════════════╗
║                                       ║
║          🔄 Loading Spinner          ║
║                                       ║
╚═══════════════════════════════════════╝
```

### Statistics Loading
```
╔══════════╗  ╔══════════╗  ╔══════════╗
║ ▓▓▓▓     ║  ║ ▓▓▓▓     ║  ║ ▓▓▓▓     ║
║ ▓▓▓▓     ║  ║ ▓▓▓▓     ║  ║ ▓▓▓▓     ║
║    ▓▓▓▓▓ ║  ║    ▓▓▓▓▓ ║  ║    ▓▓▓▓▓ ║
╚══════════╝  ╚══════════╝  ╚══════════╝
  (Pulsing skeleton cards)
```

## Accessibility Features

- ✅ Semantic HTML structure
- ✅ Clear visual hierarchy
- ✅ Sufficient color contrast
- ✅ Keyboard navigation support
- ✅ Screen reader friendly labels
- ✅ Focus states on interactive elements
- ✅ Responsive touch targets (min 44x44px)

## Dark Mode Support

All components use Tailwind's color system:
- `bg-background` - Adapts to theme
- `text-foreground` - Adapts to theme
- `text-muted-foreground` - Adapts to theme
- `border` - Adapts to theme

Stat card colors remain consistent in both modes for brand recognition.

## Performance Considerations

- **Animations**: Run once on mount, then cached
- **Images**: Avatar with fallback initials
- **Infinite Scroll**: Intersection Observer API
- **Loading**: Progressive enhancement with skeletons
- **Memoization**: Callbacks with proper dependencies
- **Cleanup**: All intervals/timeouts cleaned up

## Design Philosophy

1. **User-First**: Statistics front and center
2. **Visual Hierarchy**: Important info first (stats → posts)
3. **Delightful**: Smooth animations create joy
4. **Professional**: Clean, modern design language
5. **Performant**: Fast loading, smooth interactions
6. **Accessible**: Usable by everyone
7. **Responsive**: Beautiful on all devices
