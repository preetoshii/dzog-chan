# Virtual Interaction System

## Overview

A system that allows any component (like Zog-chan) to interact with the UI exactly as a real user would - clicking buttons, typing in inputs, dragging elements, etc. This creates a truly interactive and playful environment where the app can interact with itself.

## Core Concept

**"Zog-chan should be able to interact with the interface just like a user would."**

### Example Scenarios
- Zog-chan moves to the dark mode button and toggles it because "it's too bright"
- Zog-chan types his own message in the input field and submits it
- Multiple entities interact with the UI simultaneously
- Zog-chan drags himself to different positions
- A chaos entity randomly clicks buttons while you're trying to use the app

## Web Implementation

### 1. VirtualUser Class

```typescript
// systems/VirtualUser.ts
export class VirtualUser {
  // Mouse interactions
  static async clickElement(selector: string) {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) return false
    
    const rect = element.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    
    // Create real mouse events
    const mousedown = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    })
    
    const mouseup = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    })
    
    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    })
    
    element.dispatchEvent(mousedown)
    await delay(50) // Human-like delay
    element.dispatchEvent(mouseup)
    element.dispatchEvent(click)
    
    return true
  }
  
  // Keyboard interactions
  static async typeInElement(selector: string, text: string) {
    const element = document.querySelector(selector) as HTMLInputElement
    await this.clickElement(selector) // Focus first
    
    for (const char of text) {
      const keydown = new KeyboardEvent('keydown', { key: char })
      const input = new InputEvent('input', { 
        data: char,
        inputType: 'insertText' 
      })
      const keyup = new KeyboardEvent('keyup', { key: char })
      
      element.dispatchEvent(keydown)
      element.value += char
      element.dispatchEvent(input)
      element.dispatchEvent(keyup)
      
      await delay(50 + Math.random() * 50) // Variable typing speed
    }
  }
  
  // More methods: dragElement, scrollTo, hover, etc.
}
```

### 2. Component Registration Pattern

```typescript
// components/ToggleButton.tsx
interface ToggleButtonProps {
  onTrigger?: (trigger: () => void) => void
  id?: string
  // ... other props
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ 
  onClick, 
  onTrigger,
  id,
  ...props 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  useEffect(() => {
    if (onTrigger && id) {
      onTrigger(() => {
        buttonRef.current?.click()
      })
    }
  }, [onTrigger, id])
  
  return <button ref={buttonRef} onClick={onClick} {...props} />
}
```

### 3. Usage Example

```typescript
// In RotatingTriangle.tsx
const messWithInterface = async () => {
  // Move to dark mode button
  await animateToPosition({ x: 100, y: 50 })
  
  // Click it
  await VirtualUser.clickElement('[aria-label="Toggle dark mode"]')
  speak("Too bright. Fixed it.")
  
  // Type in input
  await animateToPosition({ x: 200, y: 400 })
  await VirtualUser.typeInElement('input[type="text"]', "Why are you here?")
  await VirtualUser.pressKey('Enter')
  
  // Chaos mode: randomly click things
  const buttons = document.querySelectorAll('button')
  const randomButton = buttons[Math.floor(Math.random() * buttons.length)]
  await VirtualUser.clickElement(randomButton)
}
```

## React Native Implementation

Since React Native doesn't have DOM, we need a different approach:

### 1. Ref-Based System

```typescript
// systems/VirtualUserRN.ts
class VirtualUserRN {
  private interactables = new Map<string, {
    ref: React.RefObject<any>,
    actions: {
      press?: () => void,
      longPress?: () => void,
      changeText?: (text: string) => void
    }
  }>()
  
  register(id: string, ref: React.RefObject<any>, actions: any) {
    this.interactables.set(id, { ref, actions })
  }
  
  async press(id: string) {
    const target = this.interactables.get(id)
    if (target?.actions.press) {
      await this.animateToComponent(target.ref)
      target.actions.press()
      Haptics.impact(Haptics.ImpactFeedbackStyle.Light)
    }
  }
}
```

### 2. Interactable Components

```typescript
// components/InteractableButton.tsx
export const InteractableButton = forwardRef(({ 
  onPress, 
  id, 
  children 
}, ref) => {
  useImperativeHandle(ref, () => ({
    simulatePress: () => {
      // Trigger animations and press
      onPress()
    }
  }))
  
  return (
    <TouchableOpacity ref={ref} onPress={onPress}>
      {children}
    </TouchableOpacity>
  )
})
```

## Cross-Platform Solution

### Abstract Interface

```typescript
// interfaces/IVirtualUser.ts
interface IVirtualUser {
  moveTo(targetId: string): Promise<void>
  interact(targetId: string): Promise<void>
  type(targetId: string, text: string): Promise<void>
  drag(targetId: string, toX: number, toY: number): Promise<void>
}

// Platform-specific implementations
const createVirtualUser = (): IVirtualUser => {
  return Platform.OS === 'web' 
    ? new VirtualUserWeb() 
    : new VirtualUserNative()
}
```

### Command Pattern Alternative

```typescript
// More portable approach using commands
interface InteractionCommand {
  execute(): void | Promise<void>
  undo?(): void
}

class InteractionRegistry {
  private commands = new Map<string, InteractionCommand>()
  
  register(id: string, command: InteractionCommand) {
    this.commands.set(id, command)
  }
  
  async execute(id: string) {
    const command = this.commands.get(id)
    if (command) {
      await command.execute()
      return true
    }
    return false
  }
}
```

## Benefits

1. **True Realism**: Interactions are indistinguishable from real users
2. **No Special Cases**: Components don't need entity-specific code
3. **Testability**: E2E tests can use the same system
4. **Emergent Behavior**: Unexpected interactions create delightful moments
5. **Extensibility**: New components automatically work with the system
6. **Multi-Entity**: Multiple virtual users can interact simultaneously

## Limitations

1. **Performance**: Simulating real events is slower than direct state changes
2. **Browser Security**: Some synthetic events have restrictions
3. **Platform Differences**: Web vs Native requires different implementations
4. **Race Conditions**: Multiple entities might conflict
5. **State Synchronization**: Need careful timing between interactions

## Advanced Possibilities

### Self-Aware UI Exploration
```typescript
const exploreInterface = async () => {
  const buttons = document.querySelectorAll('button')
  
  for (const button of buttons) {
    await moveToElement(button)
    speak(`What does "${button.ariaLabel}" do?`)
    
    if (Math.random() > 0.7) {
      await VirtualUser.clickElement(button)
      speak("Interesting...")
    }
  }
}
```

### Multiple Entities
```typescript
// Zog-chan and a Chaos Gremlin interacting simultaneously
const zogchan = new VirtualUser('zogchan')
const gremlin = new VirtualUser('gremlin')

// They can interfere with each other
await Promise.all([
  zogchan.typeInElement('input', 'Hello...'),
  gremlin.clickElement('[aria-label="Toggle mute"]')
])
```

### Reactive Behaviors
```typescript
// Zog-chan reacts to user actions
onUserClick('dark-mode-toggle', async () => {
  await delay(1000)
  speak("I preferred it the other way")
  await VirtualUser.clickElement('[aria-label="Toggle dark mode"]')
})
```

## Implementation Priority

1. **Phase 1**: Basic click and type interactions for web
2. **Phase 2**: Component registration system
3. **Phase 3**: Animation and movement system
4. **Phase 4**: React Native compatibility layer
5. **Phase 5**: Multi-entity support
6. **Phase 6**: Advanced behaviors and AI-driven interactions

## Developer Experience Goals

- Simple API: `await zogchan.click('mute-button')`
- No special component setup required
- Works with existing and future components
- Easy to debug and test
- Fun to experiment with

This system transforms the app from a static interface into a living playground where anything can interact with anything else, creating emergent and surprising moments that embody the spirit of the Meditation Playground concept.