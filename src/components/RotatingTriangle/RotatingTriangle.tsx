import React, { useState, useEffect, useRef } from 'react'
import styles from './RotatingTriangle.module.css'
import dzogChanFace from '../../assets/dzog-chan-face.svg'
import { POKED_SOUNDS } from '../../config/sounds/poked-sounds'
import { DRAGGED_SOUNDS } from '../../config/sounds/dragged-sounds'
import { PICKED_SOUNDS } from '../../config/sounds/picked-sounds'
import { triggerHaptic } from '../../utils/haptic'

interface RotatingTriangleProps {
  size?: number
  onClick?: () => void
  isDark?: boolean
  isMuted?: boolean
}

const RotatingTriangle: React.FC<RotatingTriangleProps> = ({ size = 144, onClick, isDark = true, isMuted = false }) => {
  const [faceTransform, setFaceTransform] = useState({ x: 0, y: 0, rotate: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isPoked, setIsPoked] = useState(false)
  const [showPokedFace, setShowPokedFace] = useState(false)
  const [currentPokedAudio, setCurrentPokedAudio] = useState<HTMLAudioElement | null>(null)
  const [recentSounds, setRecentSounds] = useState<string[]>([]) // Track last 3 played sounds
  const [currentDraggedAudio, setCurrentDraggedAudio] = useState<HTMLAudioElement | null>(null)
  const [recentDragSounds, setRecentDragSounds] = useState<string[]>([]) // Track last 3 played drag sounds
  const [recentPickedSounds, setRecentPickedSounds] = useState<string[]>([]) // Track last 3 played picked sounds
  const dragSoundIntervalRef = useRef<number | null>(null)
  
  // Speaking animation state
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakFrame, setSpeakFrame] = useState(0) // 0 = default face, 1 = speak face
  const speakAnimationRef = useRef<number | null>(null)
  const [wantToStopSpeaking, setWantToStopSpeaking] = useState(false)
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialDragOffset, setInitialDragOffset] = useState({ x: 0, y: 0 })
  const dragTimeoutRef = useRef<number | null>(null)
  const [justDragged, setJustDragged] = useState(false)
  
  // Velocity tracking for whoosh sound
  const lastPositionRef = useRef({ x: 0, y: 0 })
  const lastVelocityRef = useRef({ x: 0, y: 0 })
  const lastWhooshTimeRef = useRef(0)
  const lastDirectionWhooshTimeRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // Play sounds when poked
  const playPokedSounds = async () => {
    if (isMuted) return // Don't play any sounds if muted
    
    // Play the hithurt sound
    const hithurtAudio = new Audio('/sounds/hitHurt.wav')
    hithurtAudio.volume = 0.7 // Slightly lower volume to avoid clipping
    hithurtAudio.play().catch(err => console.log('Hithurt sound error:', err))
    
    // Stop current poked sound if playing
    if (currentPokedAudio) {
      currentPokedAudio.pause()
      currentPokedAudio.currentTime = 0
    }
    
    // Small delay to ensure both sounds can start properly
    setTimeout(() => {
      // Play a random poked sound from the list, avoiding recent ones
      if (POKED_SOUNDS.length > 0) {
        // Filter out sounds that were played in the last 3 times
        const availableSounds = POKED_SOUNDS.filter(sound => !recentSounds.includes(sound))
        
        // If all sounds have been played recently (small sound library), allow all sounds again
        const soundPool = availableSounds.length > 0 ? availableSounds : POKED_SOUNDS
        
        // Pick a random sound from the available pool
        const randomIndex = Math.floor(Math.random() * soundPool.length)
        const randomSound = soundPool[randomIndex]
        
        // Update recent sounds list (keep only last 3)
        setRecentSounds(prev => {
          const newRecent = [randomSound, ...prev].slice(0, 3)
          return newRecent
        })
        
        // Play the sound
        const pokedAudio = new Audio(`/sounds/poked/${randomSound}`)
        pokedAudio.volume = 0.8
        setCurrentPokedAudio(pokedAudio)
        
        // Set speaking state when audio starts
        setIsSpeaking(true)
        setWantToStopSpeaking(false)
        
        // Clear speaking state when audio ends
        pokedAudio.addEventListener('ended', () => {
          setWantToStopSpeaking(true)
        })
        
        pokedAudio.play().catch(err => console.log(`Poked sound ${randomSound} error:`, err))
      }
    }, 50) // 50ms delay
  }
  
  // Play whoosh sound with pitch based on velocity
  const playWhooshSound = async (velocity: number) => {
    if (isMuted) return
    
    try {
      // Initialize AudioContext if not already created
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const audioContext = audioContextRef.current
      
      // Fetch and decode the audio file
      const response = await fetch('/sounds/whip.wav')
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Create audio source
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      
      // Calculate pitch/speed based on velocity
      // Very slow movements = very slow playback (0.3 to 1.8 range)
      const normalizedVelocity = Math.min(100, velocity) / 100 // 0 to 1
      
      // Use exponential curve for more dramatic slow-down at low velocities
      const pitch = 0.3 + (Math.pow(normalizedVelocity, 0.7) * 1.5)
      source.playbackRate.value = pitch
      
      // Calculate volume based on velocity
      // Much quieter for slow movements, louder for fast
      // Use exponential curve for dramatic volume reduction at low speeds
      const volume = Math.min(1.0, Math.max(0.05, Math.pow(normalizedVelocity, 2) * 1.5))
      
      // Create gain node for volume control
      const gainNode = audioContext.createGain()
      gainNode.gain.value = volume
      
      // Connect nodes
      source.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Play the sound
      source.start(0)
    } catch (err) {
      console.log('Whip sound error:', err)
    }
  }
  
  // Play random picked sound
  const playPickedSound = () => {
    if (isMuted || PICKED_SOUNDS.length === 0) return
    
    // Filter out sounds that were played in the last 3 times
    const availableSounds = PICKED_SOUNDS.filter(sound => !recentPickedSounds.includes(sound))
    
    // If all sounds have been played recently, allow all sounds again
    const soundPool = availableSounds.length > 0 ? availableSounds : PICKED_SOUNDS
    
    // Pick a random sound from the available pool
    const randomIndex = Math.floor(Math.random() * soundPool.length)
    const randomSound = soundPool[randomIndex]
    
    // Update recent sounds list (keep only last 3)
    setRecentPickedSounds(prev => {
      const newRecent = [randomSound, ...prev].slice(0, 3)
      return newRecent
    })
    
    // Play the sound
    const pickedAudio = new Audio(`/sounds/picked/${randomSound}`)
    pickedAudio.volume = 0.7
    pickedAudio.play().catch(err => console.log(`Picked sound ${randomSound} error:`, err))
  }
  
  // Play random drag sound
  const playDragSound = () => {
    if (isMuted || DRAGGED_SOUNDS.length === 0) return
    
    // Stop current drag sound if playing
    if (currentDraggedAudio) {
      currentDraggedAudio.pause()
      currentDraggedAudio.currentTime = 0
    }
    
    // Filter out sounds that were played in the last 3 times
    const availableSounds = DRAGGED_SOUNDS.filter(sound => !recentDragSounds.includes(sound))
    
    // If all sounds have been played recently, allow all sounds again
    const soundPool = availableSounds.length > 0 ? availableSounds : DRAGGED_SOUNDS
    
    // Pick a random sound from the available pool
    const randomIndex = Math.floor(Math.random() * soundPool.length)
    const randomSound = soundPool[randomIndex]
    
    // Update recent sounds list (keep only last 3)
    setRecentDragSounds(prev => {
      const newRecent = [randomSound, ...prev].slice(0, 3)
      return newRecent
    })
    
    // Play the sound
    const dragAudio = new Audio(`/sounds/dragged/${randomSound}`)
    dragAudio.volume = 0.6
    setCurrentDraggedAudio(dragAudio)
    
    // Set speaking state when audio starts
    setIsSpeaking(true)
    setWantToStopSpeaking(false)
    
    // Clear speaking state when audio ends
    dragAudio.addEventListener('ended', () => {
      setWantToStopSpeaking(true)
    })
    
    dragAudio.play().catch(err => console.log(`Drag sound ${randomSound} error:`, err))
  }
  
  const handleClick = () => {
    // Only trigger click if we didn't just drag
    if (!isDragging && !justDragged) {
      if (onClick) {
        onClick()
      }
      
      // Trigger haptic feedback on mobile
      triggerHaptic(10) // Short 10ms vibration
      
      // Trigger poke animation
      setIsPoked(true)
      setTimeout(() => setIsPoked(false), 200)
      
      // Show poked face expression
      setShowPokedFace(true)
      setTimeout(() => setShowPokedFace(false), 500) // Show for 500ms
      
      // Play sounds
      playPokedSounds()
    }
  }
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialDragOffset({ 
      x: dragPosition.x,
      y: dragPosition.y 
    })
    
    // Start drag after a short delay to differentiate from click
    dragTimeoutRef.current = window.setTimeout(() => {
      setIsDragging(true)
      triggerHaptic(20) // Slightly longer haptic for drag start
      
      // Initialize velocity tracking
      lastPositionRef.current = { x: initialDragOffset.x, y: initialDragOffset.y }
      lastVelocityRef.current = { x: 0, y: 0 }
      
      // Play pickup sound and picked sound
      if (!isMuted) {
        const pickupAudio = new Audio('/sounds/pickup.wav')
        pickupAudio.volume = 0.23
        pickupAudio.play().catch(err => console.log('Pickup sound error:', err))
        
        // Play random picked sound
        playPickedSound()
      }
      
      // Start playing drag sounds after a delay
      dragSoundIntervalRef.current = window.setTimeout(() => {
        playDragSound() // Play first sound after 3 seconds
        // Then continue playing at random intervals
        dragSoundIntervalRef.current = window.setInterval(() => {
          playDragSound()
        }, Math.random() * 3000 + 5000) // Random between 5-8 seconds
      }, 3000) // Wait 3 seconds before first sound
    }, 150)
    
    // Add temporary listeners for mouse up to cancel drag start
    const cancelDragStart = () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
      window.removeEventListener('mouseup', cancelDragStart)
    }
    window.addEventListener('mouseup', cancelDragStart)
  }
  
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    
    setDragStart({ x: touch.clientX, y: touch.clientY })
    setInitialDragOffset({ 
      x: dragPosition.x,
      y: dragPosition.y 
    })
    
    // Start drag after a short delay to differentiate from tap
    dragTimeoutRef.current = window.setTimeout(() => {
      setIsDragging(true)
      triggerHaptic(20) // Slightly longer haptic for drag start
      
      // Initialize velocity tracking
      lastPositionRef.current = { x: initialDragOffset.x, y: initialDragOffset.y }
      lastVelocityRef.current = { x: 0, y: 0 }
      
      // Play pickup sound and picked sound
      if (!isMuted) {
        const pickupAudio = new Audio('/sounds/pickup.wav')
        pickupAudio.volume = 0.23
        pickupAudio.play().catch(err => console.log('Pickup sound error:', err))
        
        // Play random picked sound
        playPickedSound()
      }
      
      // Start playing drag sounds after a delay
      dragSoundIntervalRef.current = window.setTimeout(() => {
        playDragSound() // Play first sound after 3 seconds
        // Then continue playing at random intervals
        dragSoundIntervalRef.current = window.setInterval(() => {
          playDragSound()
        }, Math.random() * 3000 + 5000) // Random between 5-8 seconds
      }, 3000) // Wait 3 seconds before first sound
    }, 150)
    
    // Add temporary listeners for touch end to cancel drag start
    const cancelDragStart = () => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current)
      }
      window.removeEventListener('touchend', cancelDragStart)
    }
    window.addEventListener('touchend', cancelDragStart)
  }
  
  const handleDragMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      const newX = initialDragOffset.x + deltaX
      const newY = initialDragOffset.y + deltaY
      
      // Calculate velocity
      const velocityX = newX - lastPositionRef.current.x
      const velocityY = newY - lastPositionRef.current.y
      const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY)
      
      // Calculate direction change
      const dotProduct = velocityX * lastVelocityRef.current.x + velocityY * lastVelocityRef.current.y
      const lastMagnitude = Math.sqrt(lastVelocityRef.current.x * lastVelocityRef.current.x + lastVelocityRef.current.y * lastVelocityRef.current.y)
      const currentMagnitude = velocity
      
      let directionChange = 0
      if (lastMagnitude > 0.1 && currentMagnitude > 0.1) {
        const cosAngle = dotProduct / (lastMagnitude * currentMagnitude)
        directionChange = Math.abs(Math.acos(Math.max(-1, Math.min(1, cosAngle))))
      }
      
      const now = Date.now()
      const timeSinceLastWhoosh = now - lastWhooshTimeRef.current
      const timeSinceLastDirectionWhoosh = now - lastDirectionWhooshTimeRef.current
      
      // Play whoosh sound for high velocity
      if (!isMuted && velocity > 25 && timeSinceLastWhoosh > 200) {
        playWhooshSound(velocity)
        lastWhooshTimeRef.current = now
        
        // Also play picked sound at high velocities (>50)
        if (velocity > 50) {
          playPickedSound()
        }
      }
      
      // Play whoosh sound for direction change (separate cooldown)
      if (!isMuted && directionChange > Math.PI / 2 && velocity > 10 && timeSinceLastDirectionWhoosh > 150) {
        playWhooshSound(velocity)
        lastDirectionWhooshTimeRef.current = now
        
        // Also play picked sound for fast direction changes
        if (velocity > 40) {
          playPickedSound()
        }
      }
      
      // Update position
      setDragPosition({ x: newX, y: newY })
      
      // Update tracking refs
      lastPositionRef.current = { x: newX, y: newY }
      lastVelocityRef.current = { x: velocityX, y: velocityY }
    }
  }
  
  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault()
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y
      const newX = initialDragOffset.x + deltaX
      const newY = initialDragOffset.y + deltaY
      
      // Calculate velocity
      const velocityX = newX - lastPositionRef.current.x
      const velocityY = newY - lastPositionRef.current.y
      const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY)
      
      // Calculate direction change
      const dotProduct = velocityX * lastVelocityRef.current.x + velocityY * lastVelocityRef.current.y
      const lastMagnitude = Math.sqrt(lastVelocityRef.current.x * lastVelocityRef.current.x + lastVelocityRef.current.y * lastVelocityRef.current.y)
      const currentMagnitude = velocity
      
      let directionChange = 0
      if (lastMagnitude > 0.1 && currentMagnitude > 0.1) {
        const cosAngle = dotProduct / (lastMagnitude * currentMagnitude)
        directionChange = Math.abs(Math.acos(Math.max(-1, Math.min(1, cosAngle))))
      }
      
      const now = Date.now()
      const timeSinceLastWhoosh = now - lastWhooshTimeRef.current
      const timeSinceLastDirectionWhoosh = now - lastDirectionWhooshTimeRef.current
      
      // Play whoosh sound for high velocity
      if (!isMuted && velocity > 25 && timeSinceLastWhoosh > 200) {
        playWhooshSound(velocity)
        lastWhooshTimeRef.current = now
        
        // Also play picked sound at high velocities (>50)
        if (velocity > 50) {
          playPickedSound()
        }
      }
      
      // Play whoosh sound for direction change (separate cooldown)
      if (!isMuted && directionChange > Math.PI / 2 && velocity > 10 && timeSinceLastDirectionWhoosh > 150) {
        playWhooshSound(velocity)
        lastDirectionWhooshTimeRef.current = now
        
        // Also play picked sound for fast direction changes
        if (velocity > 40) {
          playPickedSound()
        }
      }
      
      // Update position
      setDragPosition({ x: newX, y: newY })
      
      // Update tracking refs
      lastPositionRef.current = { x: newX, y: newY }
      lastVelocityRef.current = { x: velocityX, y: velocityY }
    }
  }
  
  const handleMouseUp = () => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
    
    if (isDragging) {
      setIsDragging(false)
      setJustDragged(true)
      // Reset justDragged flag after a short delay
      setTimeout(() => setJustDragged(false), 100)
      // Use setTimeout instead of requestAnimationFrame to ensure 
      // the transition property is applied before position changes
      setTimeout(() => {
        setDragPosition({ x: 0, y: 0 })
      }, 0)
      triggerHaptic(10) // Small haptic on release
      
      // Play drop sound
      if (!isMuted) {
        const dropAudio = new Audio('/sounds/drop.wav')
        dropAudio.volume = 0.23
        dropAudio.play().catch(err => console.log('Drop sound error:', err))
      }
      
      // Stop drag sound timer/interval
      if (dragSoundIntervalRef.current) {
        clearTimeout(dragSoundIntervalRef.current) // Works for both timeout and interval
        clearInterval(dragSoundIntervalRef.current)
        dragSoundIntervalRef.current = null
      }
      // Stop current drag sound
      if (currentDraggedAudio) {
        currentDraggedAudio.pause()
        currentDraggedAudio.currentTime = 0
        setIsSpeaking(false)
        setWantToStopSpeaking(false)
      }
    }
  }
  
  const handleTouchEnd = () => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
    
    if (isDragging) {
      setIsDragging(false)
      setJustDragged(true)
      // Reset justDragged flag after a short delay
      setTimeout(() => setJustDragged(false), 100)
      // Use setTimeout instead of requestAnimationFrame to ensure 
      // the transition property is applied before position changes
      setTimeout(() => {
        setDragPosition({ x: 0, y: 0 })
      }, 0)
      triggerHaptic(10) // Small haptic on release
      
      // Play drop sound
      if (!isMuted) {
        const dropAudio = new Audio('/sounds/drop.wav')
        dropAudio.volume = 0.23
        dropAudio.play().catch(err => console.log('Drop sound error:', err))
      }
      
      // Stop drag sound timer/interval
      if (dragSoundIntervalRef.current) {
        clearTimeout(dragSoundIntervalRef.current) // Works for both timeout and interval
        clearInterval(dragSoundIntervalRef.current)
        dragSoundIntervalRef.current = null
      }
      // Stop current drag sound
      if (currentDraggedAudio) {
        currentDraggedAudio.pause()
        currentDraggedAudio.currentTime = 0
        setIsSpeaking(false)
        setWantToStopSpeaking(false)
      }
    } else {
      // It was a tap, not a drag
      handleClick()
    }
  }
  
  useEffect(() => {
    const handleFaceMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      
      // Calculate offset from center (-1 to 1)
      const offsetX = (e.clientX - centerX) / centerX
      const offsetY = (e.clientY - centerY) / centerY
      
      // Apply subtle transformations
      setFaceTransform({
        x: offsetX * 4, // Max 4px movement
        y: offsetY * 4, // Max 4px movement
        rotate: offsetX * 8 // Max 8 degree rotation
      })
    }
    
    window.addEventListener('mousemove', handleFaceMouseMove)
    return () => window.removeEventListener('mousemove', handleFaceMouseMove)
  }, [])
  
  // Global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        window.removeEventListener('mousemove', handleDragMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, dragStart, initialDragOffset])
  
  // Speaking animation loop
  useEffect(() => {
    if ((isSpeaking || wantToStopSpeaking) && !showPokedFace) {
      // Start or continue animation loop
      if (!speakAnimationRef.current) {
        speakAnimationRef.current = window.setInterval(() => {
          setSpeakFrame(prev => {
            const nextFrame = prev === 0 ? 1 : 0
            
            // If we want to stop and we're back at frame 0, actually stop
            if (wantToStopSpeaking && nextFrame === 0) {
              setIsSpeaking(false)
              setWantToStopSpeaking(false)
            }
            
            return nextFrame
          })
        }, 200) // Toggle every 200ms
      }
    } else {
      // Stop animation and reset to default
      if (speakAnimationRef.current) {
        clearInterval(speakAnimationRef.current)
        speakAnimationRef.current = null
      }
      setSpeakFrame(0)
      setWantToStopSpeaking(false)
    }
    
    return () => {
      if (speakAnimationRef.current) {
        clearInterval(speakAnimationRef.current)
        speakAnimationRef.current = null
      }
    }
  }, [isSpeaking, showPokedFace, wantToStopSpeaking])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragSoundIntervalRef.current) {
        clearTimeout(dragSoundIntervalRef.current)
        clearInterval(dragSoundIntervalRef.current)
      }
      if (currentDraggedAudio) {
        currentDraggedAudio.pause()
      }
      if (currentPokedAudio) {
        currentPokedAudio.pause()
      }
      if (speakAnimationRef.current) {
        clearInterval(speakAnimationRef.current)
      }
    }
  }, [])
  return (
    <div className={styles.triangleFloatWrapper}>
      <div 
        className={`${styles.rotatingTriangleContainer} ${isHovered ? styles.hovered : ''} ${isPoked ? styles.poked : ''} ${isDragging ? styles.dragging : ''}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          transform: `
            translate(${dragPosition.x}px, ${dragPosition.y}px) 
            scale(${isDragging ? 2 : isHovered ? 1.1 : 1})
          `,
          transition: isDragging ? 'transform 0.2s ease-out' : 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          cursor: isDragging ? 'grabbing' : 'pointer'
        }}
      >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 144 144" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={styles.rotatingTriangle}
      >
        <path 
          d="M72 8 L128 108 L16 108 Z" 
          stroke="currentColor" 
          strokeWidth="1.9" 
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {/* Face in center - not rotating */}
      <img 
        src={showPokedFace ? '/zog-chan-poked.svg' : (isSpeaking && speakFrame === 1 ? '/zog-chan-speak.svg' : dzogChanFace)}
        alt=""
        width={size * 0.3} 
        height={size * 0.3} 
        style={{ 
          position: 'absolute', 
          top: '47%', 
          left: '50%', 
          transform: `translate(calc(-50% + ${faceTransform.x}px), calc(-50% + ${faceTransform.y}px)) rotate(${faceTransform.rotate}deg)`,
          pointerEvents: 'none',
          filter: isDark ? 'none' : 'invert(1)',
          transition: 'transform 0.3s ease-out'
        }}
      />
      </div>
    </div>
  )
}

export default RotatingTriangle