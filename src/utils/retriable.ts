export function retriable<Args extends any[], Return extends any>(
  fn: (...args: Args) => Promise<Return>,
  retries: number,
  delayStrategy: DelayStrategy = DelayStrategies.exponential
){
    return async function (...args: Args): Promise<Return> {
        let attempt = 0;
        while (attempt <= retries) {
            try {
                return await fn(...args);
            } catch (error) {
                if (attempt === retries) {
                    throw error;
                }
                attempt++;
                await new Promise(res => setTimeout(res, delayStrategy(attempt)));
            }
        }
        // This line should never be reached
        throw new Error("⚠️ Heimdell: Failed to complete retriable function after retries.");
    }
}

export type DelayStrategy = (attempt: number) => number;
export const DelayStrategies = {
    linear: ((attempt: number) => 1000 * attempt) as DelayStrategy,
    exponential: ((attempt: number) => 1000 * Math.pow(2, attempt)) as DelayStrategy,
    constant: ((attempt: number) => 1000) as DelayStrategy,
}