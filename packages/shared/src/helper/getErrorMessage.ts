import axios from "axios"


export function getErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        return err?.response?.data?.message ?? err.message ?? fallback
    }
    return err instanceof Error ? err.message : fallback
}