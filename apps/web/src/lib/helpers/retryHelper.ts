export async function uploadWithRetry(fn: () => Promise<any>, retries: number = 3,): Promise<any> {
            for (let i = 0; i < retries; i++) {
                try {
                    return await fn()
                } catch (error: any) {
                    if (i === retries - 1) {
                        throw error
                    }
                }
            }
        }