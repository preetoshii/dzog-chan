import { useState, useEffect, useRef } from 'react'
import OpenAI from 'openai'
import { DZOGCHEN_SYSTEM_PROMPT } from './dzogchen-prompt'
import './App.css'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

function App() {
  // Log the prompt on component mount and whenever it changes
  useEffect(() => {
    console.log('=== DZOGCHEN SYSTEM PROMPT ===')
    console.log(DZOGCHEN_SYSTEM_PROMPT)
    console.log('==============================')
  }, [DZOGCHEN_SYSTEM_PROMPT])
  const [isDark, setIsDark] = useState(true)
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [showResponse, setShowResponse] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript
        setIsListening(false)
        
        // Immediately process the voice input without showing text
        if (transcript.trim()) {
          await processInput(transcript)
        }
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const processInput = async (inputText: string) => {
    setIsLoading(true)
    setShowResponse(false)
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: DZOGCHEN_SYSTEM_PROMPT },
          { role: "user", content: inputText }
        ],
        temperature: 0.9,
        max_tokens: 50
      })

      const answer = completion.choices[0].message.content || ''
      setResponse(answer)
      setShowResponse(true)
      setInput('')
    } catch (error) {
      console.error('Error:', error)
      setResponse('Silence speaks louder')
      setShowResponse(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await processInput(input)
  }

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      
      const updateAudioLevel = () => {
        if (!analyserRef.current || !isListening) return
        
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)
        
        const average = dataArray.reduce((a, b) => a + b) / bufferLength
        setAudioLevel(average / 255)
        
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

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      stopAudioVisualization()
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
      startAudioVisualization()
    }
  }

  useEffect(() => {
    return () => {
      stopAudioVisualization()
    }
  }, [])

  return (
    <div className={`container ${isDark ? 'dark' : 'light'}`}>
      <button
        onClick={() => setIsDark(!isDark)}
        className="dark-mode-toggle"
        aria-label="Toggle dark mode"
      >
        {isDark ? (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="content">
        <div className="response-container">
          {showResponse && (
            <p className="response">
              {response}
            </p>
          )}
          {isLoading && (
            <div className="loader"></div>
          )}
        </div>

        {isListening ? (
          <div className="voice-visualization">
            <div className="voice-rings">
              <div 
                className="voice-ring ring-1" 
                style={{ transform: `scale(${1 + audioLevel * 0.5})` }}
              ></div>
              <div 
                className="voice-ring ring-2" 
                style={{ transform: `scale(${1 + audioLevel * 0.7})` }}
              ></div>
              <div 
                className="voice-ring ring-3" 
                style={{ transform: `scale(${1 + audioLevel * 0.9})` }}
              ></div>
              <button
                type="button"
                onClick={toggleListening}
                className="voice-button-center"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>
            <p className="listening-text">Listening...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the master..."
              className="input-field"
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`voice-button ${isListening ? 'listening' : ''}`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default App