import React from 'react'
import './RotatingTriangle.css'

interface RotatingTriangleProps {
  size?: number
  onClick?: () => void
}

const RotatingTriangle: React.FC<RotatingTriangleProps> = ({ size = 48, onClick }) => {
  return (
    <div className="rotating-triangle-container" onClick={onClick}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="rotating-triangle"
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <path 
          d="M24 8 L40 36 L8 36 Z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export default RotatingTriangle