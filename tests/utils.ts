import { RateLimitError } from "@pixellab-code/pixellab";

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 8,
  baseDelay: number = 15000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check for rate limit errors - both RateLimitError instances and message text
      const isRateLimit =
        error instanceof RateLimitError ||
        (error instanceof Error &&
          (error.message.includes("rate limit") ||
            error.message.includes("wait longer between generations")));

      if (isRateLimit && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
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
