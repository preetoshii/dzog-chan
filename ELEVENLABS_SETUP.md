# ElevenLabs Voice Setup

## Getting Started

1. Sign up for ElevenLabs at https://elevenlabs.io
2. Get your API key from https://elevenlabs.io/api
3. Add to your `.env` file:
   ```
   VITE_ELEVENLABS_API_KEY=your-api-key-here
   ```

## Using Different Voices

The app comes with several pre-configured voices. To change the voice:

1. Open `src/elevenlabs-config.ts`
2. Change `SELECTED_VOICE` to one of the available voices:
   - rachel (default) - Calm, clear female voice
   - bella - Soft, gentle female voice
   - antoni - Deep, calming male voice
   - adam - Clear male voice

## Creating a Custom Voice

1. Go to https://elevenlabs.io/voice-lab
2. Clone a voice or create a new one
3. Get the voice ID from your voice library
4. Add it to `VOICE_IDS` in `elevenlabs-config.ts`:
   ```typescript
   custom: 'your-voice-id-here'
   ```
5. Set it as the selected voice:
   ```typescript
   export const SELECTED_VOICE = VOICE_IDS.custom
   ```

## Voice Settings

Adjust voice characteristics in `VOICE_SETTINGS`:
- `stability`: 0-1 (higher = more consistent)
- `similarity_boost`: 0-1 (higher = more like original voice)
- `style`: 0-1 (higher = more expressive)

## Pricing

- Free tier: 10,000 characters/month
- Starter: $5/month for 30,000 characters
- See https://elevenlabs.io/pricing for details

## Disabling Voice

To disable voice responses, simply don't set the `VITE_ELEVENLABS_API_KEY` in your environment.