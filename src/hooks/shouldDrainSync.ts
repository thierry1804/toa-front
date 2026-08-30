export function shouldDrainSync(options: {
  isFirstRun: boolean
  wasOnline: boolean
  isOnline: boolean
}): boolean {
  if (!options.isOnline) return false
  if (options.isFirstRun) return true
  return !options.wasOnline
}
