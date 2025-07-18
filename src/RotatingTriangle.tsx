import React, { useState, useEffect, useRef } from 'react'
import './RotatingTriangle.css'
import dzogChanFace from './assets/dzog-chan-face.svg'
import { POKED_SOUNDS } from './poked-sounds'
import { triggerHaptic } from './utils/haptic'

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
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialDragOffset, setInitialDragOffset] = useState({ x: 0, y: 0 })
  const dragTimeoutRef = useRef<number | null>(null)
  const [justDragged, setJustDragged] = useState(false)
  
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
        pokedAudio.play().catch(err => console.log(`Poked sound ${randomSound} error:`, err))
      }
    }, 50) // 50ms delay
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
      setDragPosition({
        x: initialDragOffset.x + deltaX,
        y: initialDragOffset.y + deltaY
      })
    }
  }
  
  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault()
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y
      setDragPosition({
        x: initialDragOffset.x + deltaX,
        y: initialDragOffset.y + deltaY
      })
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
  return (
    <div className="triangle-float-wrapper">
      <div 
        className={`rotating-triangle-container ${isHovered ? 'hovered' : ''} ${isPoked ? 'poked' : ''} ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          transform: `
            translate(${dragPosition.x}px, ${dragPosition.y}px) 
            scale(${isHovered && !isDragging ? 1.1 : 1})
          `,
          transition: isDragging ? 'none' : 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          cursor: isDragging ? 'grabbing' : 'pointer'
        }}
      >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 144 144" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="rotating-triangle"
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
        src={showPokedFace ? '/zog-chan-poked.svg' : dzogChanFace}
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