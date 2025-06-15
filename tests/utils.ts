import { RateLimitError } from "@pixellab-code/pixellab";

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (error instanceof RateLimitError && attempt < maxRetries) {
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
