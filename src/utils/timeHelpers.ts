// src/utils/timeHelpers.ts
export const formatTimeRemaining = (timeRemaining: number): string => {
  if (timeRemaining <= 0) return 'Ended'

  const days = Math.floor(timeRemaining / (24 * 3600))
  const hours = Math.floor((timeRemaining % (24 * 3600)) / 3600)
  const minutes = Math.floor((timeRemaining % 3600) / 60)

  // When there are days → always show hours + minutes (this fixes the 14d 22h confusion)
  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`
  }

  // When only hours left
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`
  }

  // Less than 1 hour
  return `${minutes}m`
}