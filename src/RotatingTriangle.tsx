import React from 'react'
import './RotatingTriangle.css'
import dzogChanFace from './assets/dzog-chan-face.svg'

interface RotatingTriangleProps {
  size?: number
  onClick?: () => void
  isDark?: boolean
}

const RotatingTriangle: React.FC<RotatingTriangleProps> = ({ size = 144, onClick, isDark = true }) => {
  return (
    <div className="rotating-triangle-container" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 144 144" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="rotating-triangle"
      >
        <path 
          d="M72 16 L120 100 L24 100 Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {/* Face in center - not rotating */}
      <img 
        src={dzogChanFace}
        alt=""
        width={size * 0.35} 
        height={size * 0.35} 
        style={{ 
          position: 'absolute', 
          top: '47%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          filter: isDark ? 'invert(1)' : 'none'
        }}
      />
    </div>
  )
}

export default RotatingTriangle