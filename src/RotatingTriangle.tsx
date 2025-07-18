import React from 'react'
import './RotatingTriangle.css'

const RotatingTriangle: React.FC = () => {
  return (
    <div className="rotating-triangle-container">
      <svg 
        width="48" 
        height="48" 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="rotating-triangle"
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