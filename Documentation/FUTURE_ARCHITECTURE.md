Here’s a draft section for your Design Document – Tech Stack under a subsection focused on React Web + Capacitor. It’s written for clarity, rigor, and justification, assuming you’re pitching this architecture as deliberate and forward-compatible.

⸻

🧱 Tech Stack – Frontend Architecture: React Web + Capacitor Hybrid

Overview

The app will be architected as a React Web application, built with Vite and modern JavaScript/TypeScript standards, and then wrapped with Capacitor to deploy seamlessly to iOS and Android app stores. This approach allows us to maintain a single codebase that is:
	•	LLM-friendly (for co-development with tools like Claude Code)
	•	Highly modular and composable
	•	Web-first by design, while retaining access to native capabilities when needed

The stack is optimized for minimalist, expressive interfaces with smooth animation and agent-like interactions—blurring the line between app and game without sacrificing development velocity or maintainability.

⸻

Why React Web?

React Web provides the cleanest, most expressive environment for building component-based interfaces with declarative state flows and animation logic. It allows us to:
	•	Build the assistant character, input system, and interactive UI as modular, reusable components
	•	Use animation libraries like Framer Motion to orchestrate transitions, draggables, and gesture-based effects with smooth frame pacing
	•	Leverage the full browser rendering stack, including CSS transitions, layout primitives, and Web Audio API
	•	Collaborate efficiently using Git and Claude-powered development, thanks to highly readable and diffable source files

This enables rapid prototyping, fast iteration, and high fidelity in crafting a playful, animation-rich UI that retains clarity and modularity.

⸻

Why Capacitor?

Capacitor is used to wrap the React Web app into installable native apps on iOS and Android, enabling access to native features while preserving the core logic and rendering in the web layer.

This hybrid model allows us to:
	•	Ship to the App Store and Play Store with a single codebase
	•	Access native APIs like:
	•	Haptics
	•	Device sensors (gyroscope, orientation, camera)
	•	Audio routing and playback
	•	Custom overlays and foreground activities (Android)
	•	Implement simulated experiences (e.g. fictional “call UI”) that feel native but are still driven from web logic
	•	Maintain maximum compatibility with web deployments, allowing the same app to be accessed in-browser without changes

Capacitor acts as a lightweight native shell, not an abstraction layer. It respects the boundaries of the platform, offers clean plugin APIs, and gives us the option to write custom native plugins in Swift/Kotlin only where necessary.

⸻

Performance Considerations

Capacitor uses the same rendering engines as Chrome (Android WebView) and Safari (iOS WKWebView). As a result, performance is effectively equivalent to what we observe when testing in Chrome Mobile or Safari Mobile:
	•	60fps animation is achievable using transform- and opacity-based animations
	•	Framer Motion-based transitions perform smoothly on modern devices
	•	No reliance on WebGL or canvas rendering ensures lower GPU load and broader compatibility

Android’s WebView can vary slightly between devices; we will test across tiers (Pixel, Samsung, low-end Android) to ensure fluidity.

⸻

Developer Experience

This stack provides the best available blend of:
	•	Creativity (through flexible web-based UI logic)
	•	Maintainability (with clean modular source)
	•	Collaboration (fully Git-based, no binary scenes or opaque layouts)
	•	AI-assisted development (Claude/LLMs can work with React far more effectively than Flutter or React Native)

The entire team—including AI tools—can operate on the same codebase, contributing features, polishing animations, and integrating backend APIs (OpenAI, ElevenLabs) without context switching or fighting native-specific syntax.

⸻

Summary

React Web + Capacitor is not just a compromise between platforms—it is the best-fit architecture for a system that:
	•	Lives on the edge of app and game
	•	Requires smooth, expressive UI logic
	•	Integrates deeply with voice/audio APIs
	•	May eventually grow into deeper native functionality (e.g. app blocking, foreground overlays)
	•	Must be co-developed rapidly, in a clean, inspectable, highly hackable environment

This stack gives us maximum freedom at minimum cost—technically, creatively, and collaboratively.