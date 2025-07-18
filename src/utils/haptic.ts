// Utility function for haptic feedback
export const triggerHaptic = (duration: number = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}