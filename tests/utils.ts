import { RateLimitError } from "@pixellab-code/pixellab";

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 8,
  baseDelay: number = 10000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check for rate limit in error message as well as RateLimitError type
      const isRateLimit =
        error instanceof RateLimitError ||
        (error as Error).message?.includes("wait longer between generations");

      if (isRateLimit && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(1.5, attempt); // Slower exponential backoff
        console.log(
          `Rate limit hit, waiting ${delay}ms before retry ${
            attempt + 1
          }/${maxRetries}`
        );
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError!;
}
