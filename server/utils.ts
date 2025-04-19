/**
 * Calculate exponential delay for retries
 * @param retryCount Current retry attempt number
 * @returns Delay in milliseconds
 */
export function exponentialDelay(retryCount: number): number {
  // Base delay of 1 second
  const baseDelay = 1000;
  // Add some randomness to prevent thundering herd
  const jitter = Math.random() * 1000;
  // Exponential backoff with jitter
  return Math.min(baseDelay * Math.pow(2, retryCount) + jitter, 10000);
}