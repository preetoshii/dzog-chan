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
  custom: 'D5TZi5xGzBoJjBT4GONI'
}

// Choose which voice to use
export const SELECTED_VOICE = VOICE_IDS.custom // Using your custom voice

// Voice settings
export const VOICE_SETTINGS = {
  stability: 0.85,      // Higher for more consistent voice
  similarity_boost: 1.0, // Maximum to match original voice characteristics
  style: 0.5,           // Increased to preserve more expressive characteristics
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
          model_id: 'eleven_turbo_v2_5', // Optimized for quality with v3-created voices
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

// Keep track of current audio instance to stop it when muted
let currentAudio: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null

export function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  if (currentSource) {
    try {
      currentSource.stop()
    } catch (e) {
      // Already stopped
    }
    currentSource = null
  }
}

async function createCathedralReverb(context: AudioContext): Promise<ConvolverNode> {
  const convolver = context.createConvolver()
  
  // Create impulse response for cathedral reverb
  const length = context.sampleRate * 4 // 4 second reverb
  const impulse = context.createBuffer(2, length, context.sampleRate)
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel)
    
    for (let i = 0; i < length; i++) {
      // Cathedral reverb characteristics:
      // - Long decay time
      // - Multiple early reflections
      // - Rich, spacious sound
      
      // Early reflections (0-100ms)
      if (i < context.sampleRate * 0.1) {
        const reflection = Math.random() * Math.pow(1 - i / (context.sampleRate * 0.1), 2)
        channelData[i] = (Math.random() - 0.5) * reflection * 0.5
      }
      
      // Late reverb with exponential decay
      const decay = Math.pow(1 - i / length, 1.5) // Slower decay for cathedral
      channelData[i] += (Math.random() - 0.5) * decay * 0.3
      
      // Add some resonances for cathedral character
      if (i % Math.floor(context.sampleRate / 440) === 0) { // A4 resonance
        channelData[i] += Math.sin(i * 0.1) * decay * 0.1
      }
    }
  }
  
  convolver.buffer = impulse
  return convolver
}

export function playAudio(audioBuffer: ArrayBuffer, withReverb: boolean = false): Promise<void> {
  return new Promise(async (resolve) => {
    // Stop any currently playing audio
    stopCurrentAudio()
    
    if (withReverb) {
      // Use Web Audio API for reverb
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      try {
        // Decode audio data
        const decodedBuffer = await audioContext.decodeAudioData(audioBuffer.slice(0))
        
        // Create nodes
        const source = audioContext.createBufferSource()
        source.buffer = decodedBuffer
        currentSource = source
        
        // Create gain nodes for dry/wet mix
        const dryGain = audioContext.createGain()
        const wetGain = audioContext.createGain()
        const outputGain = audioContext.createGain()
        
        // Set mix levels
        dryGain.gain.value = 0.7  // 70% dry signal
        wetGain.gain.value = 0.3  // 30% wet (reverb) signal
        outputGain.gain.value = 1.0
        
        // Create reverb
        const reverb = await createCathedralReverb(audioContext)
        
        // Connect nodes
        source.connect(dryGain)
        source.connect(reverb)
        reverb.connect(wetGain)
        dryGain.connect(outputGain)
        wetGain.connect(outputGain)
        outputGain.connect(audioContext.destination)
        
        // Handle completion
        source.addEventListener('ended', () => {
          currentSource = null
          resolve()
        })
        
        // Start playback
        source.start(0)
      } catch (error) {
        console.error('Error playing audio with reverb:', error)
        // Fall back to regular playback
        playAudioWithoutReverb()
      }
    } else {
      playAudioWithoutReverb()
    }
    
    function playAudioWithoutReverb() {
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudio = audio
      
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(url)
        currentAudio = null
        resolve()
      })
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url)
        currentAudio = null
        resolve()
      })
      
      audio.play().catch(() => {
        URL.revokeObjectURL(url)
        currentAudio = null
        resolve()
      })
    }
  })
}