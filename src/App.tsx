import { useState, useEffect, useRef, useCallback } from 'react'
import OpenAI from 'openai'
import { DZOGCHEN_SYSTEM_PROMPT } from './dzogchen-prompt'
import { getRandomGuidance } from './initial-guidance'
import { generateSpeech, playAudio, stopCurrentAudio } from './elevenlabs-config'
import RotatingTriangle from './components/RotatingTriangle'
import ToggleButton from './components/ToggleButton'
import { triggerHaptic } from './utils/haptic'
import { playClickSound, setMuted } from './utils/sounds'
import { MUSIC_TRACKS } from './music-tracks'
import './App.css'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

function App() {
  const [isDark, setIsDark] = useState(true)
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [showResponse, setShowResponse] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [inputFading, setInputFading] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [responseKey, setResponseKey] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [lastResponseTime, setLastResponseTime] = useState<number>(Date.now())
  const [showTriangleAfterDelay, setShowTriangleAfterDelay] = useState(false)
  const [fadeOutType, setFadeOutType] = useState<'quick' | 'slow'>('quick')
  const [isTriangleFadingOut, setIsTriangleFadingOut] = useState(false)
  const [showButtons, setShowButtons] = useState(false)
  const [showUI, setShowUI] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const placeholderWords = ['honestly', 'with curiosity', 'sincerely', 'freely']
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderVisible, setPlaceholderVisible] = useState(true)
  const [offTopicCount, setOffTopicCount] = useState(0)
  const [showSurprise, setShowSurprise] = useState(false)
  const [lastSurpriseTime, setLastSurpriseTime] = useState<number>(0)
  const [isMusicOn, setIsMusicOn] = useState(false)
  const [currentMusic, setCurrentMusic] = useState<HTMLAudioElement | null>(null)
  const [recentMusicTracks, setRecentMusicTracks] = useState<string[]>([])
  
  // Detect if mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  
  // Update theme color meta tag
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#000000' : '#ffffff')
    }
  }, [isDark])
  
  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.log('ServiceWorker registration failed: ', err)
        })
      })
    }
  }, [])
  
  // Trigger surprise moment
  const triggerSurpriseMoment = useCallback(() => {
    if (!hasStarted || showSurprise) return
    
    setShowSurprise(true)
    setLastSurpriseTime(Date.now()) // Record when surprise occurred
    
    // Play jumpscare sound
    if (!isMuted) {
      const jumpscareAudio = new Audio('/sounds/jumpscare.wav')
      jumpscareAudio.volume = 0.8
      jumpscareAudio.play().catch(err => console.log('Jumpscare sound error:', err))
    }
    
    // Trigger haptic if available
    triggerHaptic(50)
    
    // Hide after 1 second
    setTimeout(() => {
      setShowSurprise(false)
    }, 1000)
  }, [hasStarted, showSurprise, isMuted])
  
  // Random surprise moments every minute with 50% chance
  useEffect(() => {
    if (!hasStarted) return
    
    const interval = setInterval(() => {
      if (Math.random() < 0.5) {
        triggerSurpriseMoment()
      }
    }, 60000) // Every 60 seconds
    
    return () => clearInterval(interval)
  }, [hasStarted, triggerSurpriseMoment])
  
  // Debug: Backslash key to trigger surprise
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '\\') {
        triggerSurpriseMoment()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [triggerSurpriseMoment])
  
  // Music playback functions
  const playNextTrack = useCallback(() => {
    if (!isMusicOn || MUSIC_TRACKS.length === 0) return
    
    // Filter out recently played tracks
    const availableTracks = MUSIC_TRACKS.filter(track => !recentMusicTracks.includes(track))
    
    // If all tracks have been played recently, allow all except the last one
    const trackPool = availableTracks.length > 0 ? availableTracks : 
      MUSIC_TRACKS.filter(track => track !== recentMusicTracks[0])
    
    if (trackPool.length === 0) return
    
    // Pick a random track
    const randomIndex = Math.floor(Math.random() * trackPool.length)
    const selectedTrack = trackPool[randomIndex]
    
    // Update recent tracks (keep last 2)
    setRecentMusicTracks(prev => [selectedTrack, prev[0]].filter(Boolean).slice(0, 2))
    
    // Create and play new audio
    const audio = new Audio(`/sounds/music/${selectedTrack}`)
    audio.volume = 0
    
    // Fade in
    audio.play().then(() => {
      let fadeVolume = 0
      const fadeInterval = setInterval(() => {
        fadeVolume += 0.02
        if (fadeVolume >= 0.6) {
          audio.volume = 0.6
          clearInterval(fadeInterval)
        } else {
          audio.volume = fadeVolume
        }
      }, 20)
    }).catch(err => console.log('Music play error:', err))
    
    // Play next track when this one ends
    audio.addEventListener('ended', () => {
      playNextTrack()
    })
    
    setCurrentMusic(audio)
  }, [isMusicOn, recentMusicTracks])
  
  // Handle music toggle
  const toggleMusic = useCallback(() => {
    triggerHaptic(10)
    playClickSound()
    
    const newMusicState = !isMusicOn
    setIsMusicOn(newMusicState)
    
    if (newMusicState) {
      // Start playing music
      playNextTrack()
    } else {
      // Fade out and stop current music
      if (currentMusic) {
        let fadeVolume = currentMusic.volume
        const fadeInterval = setInterval(() => {
          fadeVolume -= 0.02
          if (fadeVolume <= 0) {
            currentMusic.pause()
            currentMusic.currentTime = 0
            setCurrentMusic(null)
            clearInterval(fadeInterval)
          } else {
            currentMusic.volume = fadeVolume
          }
        }, 20)
      }
    }
  }, [isMusicOn, currentMusic, playNextTrack])
  
  // Start music when toggled on
  useEffect(() => {
    if (isMusicOn && !currentMusic) {
      playNextTrack()
    }
  }, [isMusicOn, currentMusic, playNextTrack])
  
  // Wave effect configuration
  const WAVE_HEIGHT = 3 // pixels - controls how high characters float
  const WAVE_SPEED = 3.5 // seconds - duration of one complete wave cycle
  const WAVE_DELAY = 0.04 // seconds - delay between each character
  
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const voiceModeRef = useRef(false)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeToTriangleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Log the prompt on component mount and whenever it changes
  useEffect(() => {
    console.log('=== DZOGCHEN SYSTEM PROMPT ===')
    console.log(DZOGCHEN_SYSTEM_PROMPT)
    console.log('==============================')
  }, [DZOGCHEN_SYSTEM_PROMPT])

  // Handle starting the experience
  const handleStart = async () => {
    triggerHaptic(10)
    playClickSound()
    setIsStarting(true)
    // Wait for animation to complete
    setTimeout(() => {
      setHasStarted(true)
    }, 1500)
    
    const initialGuidance = getRandomGuidance()
    // Set response but don't show it yet
    setResponse(initialGuidance)
    setShowResponse(false)
    setResponseKey(1)
    // Add initial guidance to conversation history
    setConversationHistory([{ role: 'assistant', content: initialGuidance }])
    
    // Small delay before fading in for better effect
    setTimeout(async () => {
      setShowResponse(true)
      setLastResponseTime(Date.now())
      
      // Play audio for initial guidance if not muted
      if (!isMuted) {
        try {
          const audioBuffer = await generateSpeech(initialGuidance)
          if (audioBuffer) {
            await playAudio(audioBuffer, isMusicOn)
          }
        } catch (error) {
          console.error('Error playing initial guidance:', error)
        }
      }
      
      // Show UI elements 0.5 seconds after text starts fading in
      setTimeout(() => {
        setShowUI(true)
      }, 500)
    }, 500)
  }

  const handleTriangleClick = async () => {
    // Haptic is handled in RotatingTriangle component
    // Get a new initial guidance
    const newGuidance = getRandomGuidance()
    
    // Fade out current display
    if (showTriangleAfterDelay || response === '[PRAYER_HANDS]') {
      setIsTriangleFadingOut(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsTriangleFadingOut(false)
      setShowTriangleAfterDelay(false)
    }
    
    // Set new response
    setResponse(newGuidance)
    setShowResponse(true)
    setResponseKey(prev => prev + 1)
    setLastResponseTime(Date.now())
    
    // Add to conversation history
    setConversationHistory(prev => [...prev, { role: 'assistant', content: newGuidance }])
    
    // Play audio if not muted
    if (!isMuted) {
      try {
        const audioBuffer = await generateSpeech(newGuidance)
        if (audioBuffer) {
          await playAudio(audioBuffer, isMusicOn)
        }
      } catch (error) {
        console.error('Error playing guidance:', error)
      }
    }
  }

  const processInput = useCallback(async (inputText: string) => {
    setInputFading(true)
    setIsProcessing(true)
    
    // Calculate response time
    const responseTime = Date.now() - lastResponseTime
    let responseTimeInSeconds = Math.round(responseTime / 1000)
    
    // If responding from triangle state, ensure response time is long enough
    if (response === '[PRAYER_HANDS]' || showTriangleAfterDelay) {
      responseTimeInSeconds = Math.max(responseTimeInSeconds, 10) // Force at least 10 seconds
    }
    
    // If there's an existing response, fade it out first
    if (response && showResponse) {
      setFadeOutType('quick')
      if (response === '[PRAYER_HANDS]' || showTriangleAfterDelay) {
        // Handle triangle fade-out
        setIsTriangleFadingOut(true)
        // Wait for fade out animation (1.5s for quick fade)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsTriangleFadingOut(false)
        setShowTriangleAfterDelay(false)
      } else {
        // Handle text fade-out
        setIsFadingOut(true)
        // Wait for fade out animation (1.5s for quick fade)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIsFadingOut(false)
      }
      setShowResponse(false)
      setResponse('') // Clear response after fade completes
    }
    
    // Clear input after fade starts
    setTimeout(() => {
      setInput('')
      setInputFading(false)
    }, 300)
    
    try {
      // Check if user is responding shortly after a surprise moment
      const timeSinceSurprise = lastSurpriseTime ? Math.round((Date.now() - lastSurpriseTime) / 1000) : null
      const surpriseInfo = timeSinceSurprise !== null && timeSinceSurprise <= 30 ? '[Surprise moment]' : ''
      
      // Build messages array with history (keep last 10 messages to prevent token overflow)
      const recentHistory = conversationHistory.slice(-10)
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: DZOGCHEN_SYSTEM_PROMPT },
        ...recentHistory,
        { role: "user", content: `[Response time: ${responseTimeInSeconds}s] [Off-topic count: ${offTopicCount}] ${surpriseInfo} ${inputText}` }
      ]

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        temperature: 0.9,
        max_tokens: 50
      })

      const answer = completion.choices[0].message.content || ''
      
      // Check if the AI response indicates the user was off-topic
      let finalResponse: string
      if (answer.includes('[OFF_TOPIC]')) {
        setOffTopicCount(prev => prev + 1)
        // Remove the marker from the actual response
        const cleanAnswer = answer.replace('[OFF_TOPIC]', '').trim()
        finalResponse = cleanAnswer === '' ? '[PRAYER_HANDS]' : cleanAnswer
      } else if (answer.includes('[EARNEST]')) {
        // Reset off-topic count if user is being earnest again
        setOffTopicCount(0)
        const cleanAnswer = answer.replace('[EARNEST]', '').trim()
        finalResponse = cleanAnswer === '' ? '[PRAYER_HANDS]' : cleanAnswer
      } else {
        // Normal response
        finalResponse = answer.trim() === '' ? '[PRAYER_HANDS]' : answer
      }
      
      setResponse(finalResponse)
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: "user", content: inputText },
        { role: "assistant", content: answer } // Store original response, not emoji
      ])
      
      setShowResponse(true)
      setResponseKey(prev => prev + 1)
      setLastResponseTime(Date.now())
      setShowTriangleAfterDelay(false)
      
      // Generate and play voice response if not muted and not just prayer hands
      if (!isMuted && finalResponse !== '[PRAYER_HANDS]') {
        // Stop listening while audio is playing to prevent feedback
        if (voiceModeRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.stop()
          } catch (e) {
            // Already stopped
          }
          setIsListening(false)
          stopAudioVisualization()
        }
        
        const audioBuffer = await generateSpeech(finalResponse)
        if (audioBuffer) {
          setIsPlayingAudio(true)
          await playAudio(audioBuffer, isMusicOn) // Pass music state for reverb
          setIsPlayingAudio(false)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setResponse('Silence speaks louder')
      setShowResponse(true)
    } finally {
      setIsProcessing(false)
    }
  }, [response, conversationHistory, isMuted, isListening, isPlayingAudio, showResponse, lastResponseTime])

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      
      const updateAudioLevel = () => {
        if (!analyserRef.current) return
        
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)
        
        // Get the average volume from frequency data
        const average = dataArray.reduce((a, b) => a + b) / bufferLength
        
        // Normalize and apply some smoothing for better visual feedback
        const normalizedLevel = Math.min(average / 128, 1) // More sensitive scaling
        setAudioLevel(normalizedLevel)
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
      }
      
      updateAudioLevel()
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopAudioVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    setAudioLevel(0)
  }

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        startAudioVisualization()
      } catch (error) {
        console.log('Speech recognition already started')
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      stopAudioVisualization()
    }
  }, [])

  useEffect(() => {
    voiceModeRef.current = voiceMode
  }, [voiceMode])

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript
        
        // Immediately process the voice input without showing text
        if (transcript.trim()) {
          setIsListening(false)
          await processInput(transcript)
        }
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
        stopAudioVisualization()
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        stopAudioVisualization()
      }
    }
  }, [processInput, startListening])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    // Only blur the input on mobile to hide the keyboard
    if (isMobile) {
      const inputElement = e.currentTarget.querySelector('input')
      if (inputElement) {
        inputElement.blur()
      }
    }
    
    await processInput(input)
  }

  const handleVoiceButtonClick = () => {
    triggerHaptic(10)
    playClickSound()
    if (isMobile && voiceMode && !isListening && !isProcessing) {
      // On mobile in voice mode, treat as push-to-talk
      startListening()
    } else {
      // Toggle voice mode
      if (voiceMode) {
        // Switching back to text mode
        setVoiceMode(false)
        stopListening()
        // Clear any pending restart timers
        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current)
          restartTimerRef.current = null
        }
      } else {
        // Switching to voice mode
        setVoiceMode(true)
        startListening()
      }
    }
  }

  useEffect(() => {
    return () => {
      stopAudioVisualization()
    }
  }, [])

  // Handle Escape key to exit voice mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && voiceMode) {
        setVoiceMode(false)
        stopListening()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [voiceMode, stopListening])

  // Single source of truth for restarting voice mode
  useEffect(() => {
    // Clear any existing timer
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }

    // On mobile, don't auto-restart listening to prevent continuous activation sounds
    if (isMobile) {
      return
    }

    // Only restart if in voice mode, not currently listening, not processing, and not playing audio
    if (voiceMode && !isListening && !isProcessing && !isPlayingAudio) {
      // Wait a bit before restarting to ensure everything is settled
      const delay = showResponse ? 1000 : 500
      restartTimerRef.current = setTimeout(() => {
        if (voiceMode && !isProcessing && !isPlayingAudio) {
          startListening()
        }
      }, delay)
    }

    return () => {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current)
      }
    }
  }, [voiceMode, isListening, isProcessing, isPlayingAudio, showResponse, startListening, isMobile])

  // Timer to fade to triangle after 20 seconds
  useEffect(() => {
    if (fadeToTriangleTimerRef.current) {
      clearTimeout(fadeToTriangleTimerRef.current)
    }

    // Only start timer if we have text response showing (not triangle)
    if (showResponse && response && response !== '[PRAYER_HANDS]') {
      fadeToTriangleTimerRef.current = setTimeout(() => {
        setFadeOutType('slow')
        setIsFadingOut(true)
        // Wait for text to fade out before showing triangle
        setTimeout(() => {
          setIsFadingOut(false)
          setResponse('[PRAYER_HANDS]')
          setShowTriangleAfterDelay(true)
          setResponseKey(prev => prev + 1)
        }, 8000) // After fade out completes
      }, 45000) // 45 seconds
    }

    return () => {
      if (fadeToTriangleTimerRef.current) {
        clearTimeout(fadeToTriangleTimerRef.current)
      }
    }
  }, [showResponse, response])

  // Rotate placeholder text with fade effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setPlaceholderVisible(false)
      
      // Change text and fade in after a delay
      setTimeout(() => {
        setPlaceholderIndex(prev => (prev + 1) % placeholderWords.length)
        setPlaceholderVisible(true)
      }, 500)
    }, 8000) // Change every 8 seconds

    return () => clearInterval(interval)
  }, [])

  // Handle mouse movement for button visibility
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const threshold = window.innerHeight * 0.25 // Top 25% of screen
      setShowButtons(e.clientY < threshold)
    }

    // Add mouse move listener
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div className={`container ${isDark ? 'dark' : 'light'}`}>
      {!hasStarted && (
        <>
          <div className="response-container">
            <div className={`response fade-in ${isStarting ? 'triangle-exit' : ''}`}>
              <RotatingTriangle isDark={isDark} isMuted={isMuted} />
            </div>
          </div>
          <button 
            onClick={handleStart}
            className={`start-button ${isStarting ? 'starting' : ''}`}
            aria-label="Begin"
            disabled={isStarting}
          >
            hello zog-chan
          </button>
        </>
      )}
      {hasStarted && (
        <ToggleButton
          icon={
            isDark ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )
          }
          onClick={() => {
            triggerHaptic(10)
            playClickSound()
            setIsDark(!isDark)
          }}
          position={0}
          ariaLabel="Toggle dark mode"
          showAlways={showButtons}
          className={showUI ? '' : 'ui-hidden'}
        />
      )}

      {hasStarted && (
        <ToggleButton
          icon={
            isMuted ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )
          }
          onClick={() => {
            triggerHaptic(10)
            playClickSound()
            const newMutedState = !isMuted
            setIsMuted(newMutedState)
            setMuted(newMutedState) // Sync with sound utilities
            // Stop any currently playing audio when muting
            if (newMutedState) {
              stopCurrentAudio()
              // Also stop music if playing
              if (currentMusic) {
                currentMusic.pause()
                currentMusic.currentTime = 0
                setCurrentMusic(null)
                setIsMusicOn(false)
              }
            }
          }}
          position={1}
          ariaLabel="Toggle mute"
          showAlways={showButtons}
          className={showUI ? '' : 'ui-hidden'}
        />
      )}

      {hasStarted && (
        <ToggleButton
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          }
          onClick={toggleMusic}
          position={2}
          ariaLabel="Toggle music"
          isActive={isMusicOn}
          showAlways={showButtons}
          className={showUI ? '' : 'ui-hidden'}
        />
      )}

      {hasStarted && (
        <div className="content">
        <div className="response-container">
          {/* Show text that might be fading out */}
          {response && response !== '[PRAYER_HANDS]' && (showResponse || isFadingOut) && (
            <div 
              className={`response ${showResponse && !isFadingOut ? 'fade-in' : ''} ${isFadingOut ? `fade-out-${fadeOutType}` : ''}`} 
              key={`text-${responseKey}`}
              onClick={async () => {
                // Fade out text and show triangle
                triggerHaptic(10)
                playClickSound()
                setFadeOutType('quick')
                setIsFadingOut(true)
                await new Promise(resolve => setTimeout(resolve, 1500))
                setIsFadingOut(false)
                setShowResponse(false)
                setResponse('[PRAYER_HANDS]')
                setShowTriangleAfterDelay(true)
                setResponseKey(prev => prev + 1)
              }}
              style={{ cursor: 'pointer' }}
            >
              <p>
                {(() => {
                  let charIndex = 0
                  return response.split('. ').map((sentence, sentenceIndex, array) => (
                      <span key={sentenceIndex}>
                        {(() => {
                          // Parse sentence for quoted text
                          const parts = sentence.split(/("[^"]*")/g).filter(part => part)
                          
                          return parts.map((part, partIndex) => {
                            const isQuoted = part.startsWith('"') && part.endsWith('"')
                            const textToRender = isQuoted ? part.slice(1, -1) : part
                            
                            return textToRender.split(' ').map((word, wordIndex) => (
                              <span key={`part-${partIndex}-word-${wordIndex}`}>
                                {/* Add extra space before quoted text */}
                                {isQuoted && wordIndex === 0 && partIndex > 0 && (
                                  <span style={{ display: 'inline-block', width: '0.075em' }}></span>
                                )}
                                <span className={`word-group ${isQuoted ? 'quoted-text' : ''}`}>
                                  {word.split('').map((char) => {
                                    const currentCharIndex = charIndex++
                                    const delay = currentCharIndex * WAVE_DELAY
                                    
                                    return (
                                      <span
                                        key={currentCharIndex}
                                        className="wave-char"
                                        style={{
                                          animationDelay: `${delay}s`,
                                          animationDuration: `${WAVE_SPEED}s`,
                                          '--wave-height': `${WAVE_HEIGHT}px`,
                                          fontStyle: isQuoted ? 'italic' : 'normal',
                                          color: isQuoted ? '#A6C8FD' : 'inherit'
                                        } as React.CSSProperties}
                                      >
                                        {char}
                                      </span>
                                    )
                                  })}
                                </span>
                                {wordIndex < textToRender.split(' ').length - 1 && (
                                  <span style={{ display: 'inline' }}>&nbsp;</span>
                                )}
                                {/* Add extra space after quoted text */}
                                {isQuoted && wordIndex === textToRender.split(' ').length - 1 && partIndex < parts.length - 1 && (
                                  <span style={{ display: 'inline-block', width: '0.15em' }}></span>
                                )}
                              </span>
                            ))
                          })
                        })()}
                        {sentenceIndex < array.length - 1 && (
                          <>
                            <span
                              className="wave-char"
                              style={{
                                animationDelay: `${charIndex++ * WAVE_DELAY}s`,
                                animationDuration: `${WAVE_SPEED}s`,
                                '--wave-height': `${WAVE_HEIGHT}px`
                              } as React.CSSProperties}
                            >
                              .
                            </span>
                            <br />
                          </>
                        )}
                      </span>
                    ))
                  })()}
                </p>
            </div>
          )}
          {/* Show triangle - either standalone or fading in during transition */}
          {((response === '[PRAYER_HANDS]' && showResponse) || showTriangleAfterDelay || isTriangleFadingOut) && (
            <div className={`response ${showTriangleAfterDelay ? 'fade-in-slow' : 'fade-in'} ${isTriangleFadingOut ? 'fade-out-quick' : ''}`} key={`triangle-${responseKey}`}>
              <RotatingTriangle onClick={handleTriangleClick} isDark={isDark} isMuted={isMuted} />
            </div>
          )}
        </div>
        </div>
      )}

      {hasStarted && (
        <form onSubmit={handleSubmit} className={`input-form ${voiceMode ? 'voice-mode' : ''} ${showUI ? 'ui-fade-in' : 'ui-hidden'}`}>
        <div 
          className={`input-wrapper ${voiceMode ? 'voice-mode' : ''} ${isProcessing ? 'processing' : ''}`}
          style={voiceMode && !isProcessing ? { transform: `scale(${1 + audioLevel * 0.6})` } : {}}
        >
          {!input && !voiceMode && (
            <div className="placeholder-wrapper">
              <span className="placeholder-static">respond </span>
              <div className="placeholder-word-overlay">
                <span className={`placeholder-changing ${!placeholderVisible ? 'fade' : ''}`}>
                  {placeholderWords[placeholderIndex]}
                </span>
              </div>
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              if (!voiceMode) {
                playClickSound()
              }
            }}
            placeholder=""
            className={`input-field ${inputFading ? 'fading' : ''} ${voiceMode ? 'voice-mode' : ''} ${isProcessing ? 'processing' : ''}`}
            style={voiceMode && !isProcessing ? { 
              borderWidth: `${2 + audioLevel * 3}px`,
              borderColor: isDark 
                ? `rgba(${59 + audioLevel * 100}, ${130 + audioLevel * 125}, 255, ${0.6 + audioLevel * 0.4})`
                : `rgba(${59 + audioLevel * 50}, ${130 + audioLevel * 100}, 255, ${0.8 + audioLevel * 0.2})`,
              boxShadow: `0 0 ${audioLevel * 30}px rgba(59, 130, 255, ${audioLevel * 0.5})`
            } : {}}
            disabled={voiceMode}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
          <button
            type="button"
            onClick={handleVoiceButtonClick}
            className={`voice-button ${voiceMode ? 'voice-mode' : ''} ${isProcessing ? 'processing' : ''}`}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
        </form>
      )}
      
      {/* Surprise moment overlay */}
      {showSurprise && (
        <div className="surprise-overlay">
          <div className="surprise-triangle">
            <RotatingTriangle size={window.innerWidth > 768 ? 500 : 350} isDark={isDark} isMuted={isMuted} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App