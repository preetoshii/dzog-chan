import React, { useState, useEffect } from 'react'
import './RotatingTriangle.css'
import dzogChanFace from './assets/dzog-chan-face.svg'

interface RotatingTriangleProps {
  size?: number
  onClick?: () => void
  isDark?: boolean
}

const RotatingTriangle: React.FC<RotatingTriangleProps> = ({ size = 144, onClick, isDark = true }) => {
  const [faceTransform, setFaceTransform] = useState({ x: 0, y: 0, rotate: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isPoked, setIsPoked] = useState(false)
  
  // Play sounds when poked
  const playPokedSounds = () => {
    // Play the hithurt sound
    const hithurtAudio = new Audio('/sounds/hithurt.wav')
    hithurtAudio.play().catch(err => console.log('Hithurt sound not found:', err))
    
    // Also play a random poked sound
    const soundCount = 5 // Update this when you add more sounds
    const randomNum = Math.floor(Math.random() * soundCount) + 1
    const pokedAudio = new Audio(`/sounds/poked/poked-${randomNum}.wav`)
    pokedAudio.play().catch(err => console.log('Poked sound not found yet:', err))
  }
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
    
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
    <div 
      className={`rotating-triangle-container ${isHovered ? 'hovered' : ''} ${isPoked ? 'poked' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
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
  )
}

export default RotatingTriangle