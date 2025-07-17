// ElevenLabs configuration
export const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY

// Voice IDs - you can find these in your ElevenLabs dashboard
export const VOICE_IDS = {
  // Default ElevenLabs voices
  rachel: '21m00Tcm4TlvDq8ikWAM',
  domi: 'AZnzlk1XvdvUeBnXmlld',
  bella: 'EXAVITQu4vr4xnSDxMaL',
  antoni: 'ErXwobaYiN019PkySvjV',
  elli: 'MF3mGyEYCl7XYWbV9V6O',
  josh: 'TxGEqnHWrfWFTfGW9XjX',
  arnold: 'VR6AewLTigWG4xSOukaG',
  adam: 'pNInz6obpgDQGcFmaJgB',
  sam: 'yoZ06aMxZJJ28mfd3POQ',
  
  // Add your custom voice ID here if you've cloned one
  custom: 'Md7giZ3VtmUw7F4bo0Yf'
}

// Choose which voice to use
export const SELECTED_VOICE = VOICE_IDS.custom // Using your custom voice

// Voice settings
export const VOICE_SETTINGS = {
  stability: 0.75,      // Higher for more consistent voice
  similarity_boost: 1.0, // Maximum to match original voice characteristics
  style: 0.0,           // Lower for more natural, less expressive
  use_speaker_boost: true
}

export async function generateSpeech(text: string): Promise<ArrayBuffer | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key not found')
    return null
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${SELECTED_VOICE}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2', // Better for preserving voice characteristics
          voice_settings: VOICE_SETTINGS
        })
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.arrayBuffer()
  } catch (error) {
    console.error('Error generating speech:', error)
    return null
  }
}

export function playAudio(audioBuffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve) => {
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(url)
      resolve()
    })
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      resolve() // Resolve even on error to continue flow
    })
    
    audio.play().catch(() => {
      URL.revokeObjectURL(url)
      resolve()
    })
  })
}