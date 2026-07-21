const locks: Record<string, Promise<void>> = {};

export async function withCoinLock<T>(coin: string, fn: () => Promise<T>): Promise<T> {
    const previous = locks[coin] ?? Promise.resolve();
    let release: () => void;
    const current = new Promise<void>((res) => (release = res));
    locks[coin] = previous.then(() => current);

    await previous; // wait for whatever was already happening for this coin to finish
    try {
        return await fn();
    } finally {
        release!();
    }
}