import React from 'react'
import styles from './ToggleButton.module.css'

interface ToggleButtonProps {
  icon: React.ReactNode
  onClick: () => void
  isActive?: boolean
  position?: number // 0, 1, 2, etc. for automatic positioning
  ariaLabel: string
  className?: string
  showAlways?: boolean // Some buttons might always be visible
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  icon,
  onClick,
  isActive = false,
  position = 0,
  ariaLabel,
  className = '',
  showAlways = false
}) => {
  const positionStyle = {
    right: `${2 + position * 3.5}rem` // 2rem base + 3.5rem spacing
  }

  return (
    <button
      className={`${styles.toggleButton} ${styles.uiFadeIn} ${isActive ? styles.active : ''} ${showAlways ? styles.show : ''} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      style={positionStyle}
    >
      {icon}
    </button>
  )
}

export default ToggleButton