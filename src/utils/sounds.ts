// Utility functions for UI sounds

export const playSelectSound = () => {
  const audio = new Audio('/sounds/select.wav')
  audio.volume = 0.6
  audio.play().catch(err => console.log('Select sound error:', err))
}

export const playClickSound = () => {
  const audio = new Audio('/sounds/click.wav')
  audio.volume = 0.5
  audio.play().catch(err => console.log('Click sound error:', err))
}