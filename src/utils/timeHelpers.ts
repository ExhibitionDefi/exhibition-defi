export const formatTimeRemaining = (timeRemaining: number): string => {
  if (timeRemaining <= 0) return 'Ended'
  
  const days = Math.floor(timeRemaining / (24 * 3600))
  const hours = Math.floor((timeRemaining % (24 * 3600)) / 3600)
  const minutes = Math.floor((timeRemaining % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}