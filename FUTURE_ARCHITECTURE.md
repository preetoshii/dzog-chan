# Future Architecture: Dzog-chan Meditation Playground

## Philosophy

**Core Principle**: A living, breathing meditation toy that surprises, confuses, and awakens.

This is not an app with features—it's a playground where presence emerges through unexpected interactions. Every technical decision should support spontaneous, modular additions that can appear and disappear based on mysterious conditions.

## Architectural Principles

### 1. **Always Complete, Always Growing**
- No roadmaps, no versions
- Each feature is self-contained
- New additions don't break existing magic
- Features can be ephemeral

### 2. **Surprise-First Development**
- Features should be easy to hide/reveal
- Time-based, probability-based, condition-based triggers
- Nothing is predictable

### 3. **Bare Metal Minimalism**
- Less abstraction, more direct code
- Prefer native APIs over heavy libraries
- Every dependency must earn its place
- Raw power over convenience

## Tech Stack

### Core
```
React Native (with Expo)
├── Cross-platform from single codebase
├── Direct access to native APIs
├── Hot reload for rapid experimentation
└── Easy deployment to phones

TypeScript
├── Just enough type safety
├── Allows wild experiments
└── Self-documenting

Moti + Reanimated 2
├── Framer Motion-like API
├── Smooth, native animations
├── Gesture handling
└── Physics-based interactions
```

### Data & State
```
Zustand (Simple state)
├── No boilerplate
├── Direct mutations
├── Persist middleware
└── Devtools when needed

AsyncStorage (Local first)
├── Conversation history
├── User preferences  
├── Feature unlock states
└── Time-based triggers

Supabase (When needed)
├── Anonymous analytics
├── Shared experiences
├── Research data
└── But keep it minimal
```

### AI & Language
```
OpenAI API
├── GPT-4 for Zog-chan's responses
├── Context-aware teachings
├── Personality consistency
├── Minimal token usage

Prompt Engineering
├── System prompts as features
├── Dynamic prompt modification
├── Context injection (time, surprises, etc)
└── Keep prompts weird
```

### Audio & Voice
```
React Native Sound
├── Simple audio playback
├── Multiple simultaneous sounds
└── Background audio

React Native Audio Recorder
├── Voice input
├── Meditation recordings
└── Phone call features

ElevenLabs API
├── Dynamic speech generation
├── Voice modulation
└── Keep it mysterious
```

## Architecture Patterns

### 1. Feature Modules
```typescript
// Each feature is a self-contained module
features/
├── surprise-moment/
│   ├── SurpriseMoment.tsx      // Component
│   ├── surpriseTrigger.ts      // Logic
│   ├── sounds/                 // Assets
│   └── index.ts               // Public API
├── phone-calls/
├── zogstagram/
└── meditation-guide/
```

### 2. Trigger System
```typescript
// Central trigger manager for all time/condition based features
interface Trigger {
  id: string
  condition: () => boolean  // When to show
  priority: number         // Conflict resolution
  feature: () => void      // What to show
  ephemeral?: boolean      // One-time only?
}

// Examples:
triggers.register({
  id: 'midnight-whisper',
  condition: () => new Date().getHours() === 0,
  feature: () => showWhisperMode(),
  ephemeral: true
})
```

### 3. Sound Manager
```typescript
// Centralized sound system for overlapping audio
class Soundscape {
  layers: Map<string, Sound>
  
  play(id: string, options: {
    volume?: number
    pitch?: number  
    loop?: boolean
    fadeIn?: number
  })
  
  morph(from: string, to: string, duration: number)
  crossfade(sounds: string[], pattern: 'random' | 'sequential')
}
```

### 4. Presence Detection
```typescript
// Know when user needs awakening
interface PresenceMonitor {
  idleTime: number
  scrollVelocity: number
  tapFrequency: number
  conversationMood: 'seeking' | 'playing' | 'serious'
  
  shouldIntervene(): boolean
  interventionType(): 'gentle' | 'shock' | 'ignore'
}
```

## Feature Implementation Guide

### Adding a New Surprise

1. **Create Feature Module**
```typescript
// features/moon-howl/index.ts
export const MoonHowl = {
  trigger: {
    condition: () => isFullMoon() && Math.random() > 0.95,
    priority: 10
  },
  
  component: () => {
    playSound('wolf-howl.mp3', { pitch: 0.8 })
    return <MotiView>🌙</MotiView>
  }
}
```

2. **Register with System**
```typescript
// App.tsx
features.register(MoonHowl)
// That's it. System handles the rest.
```

### State Shape
```typescript
// Keep it flat and direct
interface AppState {
  // Conversation
  messages: Message[]
  responseTime: number
  offTopicCount: number
  
  // Presence
  lastActiveTime: number
  surpriseHistory: string[]
  meditationStats: MeditationStats
  
  // Features
  unlockedFeatures: Set<string>
  featureStates: Map<string, any>  // Let features manage own state
  
  // Temporary
  activeModals: string[]
  currentMood: 'playful' | 'serious' | 'mysterious'
}
```

## Mobile-First Considerations

### Gesture System
```typescript
// Every element can be interactive
<Pressable
  onPress={handleTap}
  onLongPress={handleHold}
  onPressOut={handleRelease}
  delayLongPress={150}
>
  <AnimatedTriangle />
</Pressable>
```

### Background Capabilities
- Meditation timers that run when app is closed
- Surprise notifications at random times
- Phone calls that feel real


## Development Workflow

### 1. Experiment Freely
```bash
# New feature branch
git checkout -b feature/gravity-meditation

# Try wild ideas
npm run ios  # See it instantly

# If it sparks presence, keep it
# If not, delete without mercy
```
### 3. Release Randomly
- No announcements
- No changelogs  
- Users discover naturally
- Some features only 0.1% will ever see

## Anti-Patterns to Avoid

❌ **Over-engineering**
- No Redux unless you hate yourself
- No microservices 
- No design systems
- No component libraries

❌ **Predictability**
- No consistent navigation
- No loading spinners (use something weird)
- No standard UI patterns
- No tutorials

❌ **Comfort**
- No smooth onboarding
- No helpful error messages
- No undo buttons
- No settings (the app decides)

## Future Evolution

This architecture assumes:
- Features appear and disappear
- The app has moods and preferences
- Not everything needs to make sense
- Bugs might be features
- The goal is presence, not perfection

The best architecture is one that gets out of the way and lets magic happen.

## Implementation Checklist

- [ ] Port to React Native with Expo
- [ ] Implement trigger system
- [ ] Create feature module structure
- [ ] Add sound manager
- [ ] Build presence detection
- [ ] Create first 5 surprise features
- [ ] Test on unsuspecting humans
- [ ] Delete what doesn't spark presence
- [ ] Repeat forever

---

*Remember: This is a playground, not a product. Play accordingly.*