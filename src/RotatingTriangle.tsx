import React, { useState, useEffect } from 'react'
import './RotatingTriangle.css'
import dzogChanFace from './assets/dzog-chan-face.svg'
import { POKED_SOUNDS } from './poked-sounds'
import { triggerHaptic } from './utils/haptic'

interface RotatingTriangleProps {
  size?: number
  onClick?: () => void
  isDark?: boolean
}

const RotatingTriangle: React.FC<RotatingTriangleProps> = ({ size = 144, onClick, isDark = true }) => {
  const [faceTransform, setFaceTransform] = useState({ x: 0, y: 0, rotate: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isPoked, setIsPoked] = useState(false)
  const [currentPokedAudio, setCurrentPokedAudio] = useState<HTMLAudioElement | null>(null)
  const [recentSounds, setRecentSounds] = useState<string[]>([]) // Track last 3 played sounds
  
  // Play sounds when poked
  const playPokedSounds = async () => {
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
    if (onClick) {
      onClick()
    }
    
    // Trigger haptic feedback on mobile
    triggerHaptic(10) // Short 10ms vibration
    
    // Trigger poke animation
    setIsPoked(true)
    setTimeout(() => setIsPoked(false), 200)
    
    // Play sounds
    playPokedSounds()
  }
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  return (
    <div className="triangle-float-wrapper">
      <div 
        className={`rotating-triangle-container ${isHovered ? 'hovered' : ''} ${isPoked ? 'poked' : ''}`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          transform: isHovered ? 'scale(1.1)' : 'scale(1)'
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
        src={dzogChanFace}
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