import { nanoid } from 'nanoid';
import { logger, User } from '@repo/shared/server';
import { useUsernameAvailability } from '@/hooks/userUsernameAvailability';

/**
 * Generates a unique username for OAuth users with fallback strategies
 */
export async function generateUniqueUsername(
    baseName: string,
    email: string
): Promise<string> {
    let error = null
    try {
        // Strategy 1: Clean name + nanoid
        const sanitized = baseName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 12);

        const baseUsername = sanitized ||
            email.split('@')[0].replace(/[^a-z0-9]/g, '').slice(0, 12) ||
            'user';

        let username = `${baseUsername}_${nanoid(6)}`;
        const { status: usernameStatus, error: usernameError } = useUsernameAvailability(username);
        // Check if username exists (unlikely with nanoid, but safety check)
        if (error) error = usernameError
        if (usernameStatus) {
            return username;
        }

        // Strategy 2: If somehow it exists, use longer nanoid
        username = `${baseUsername}_${nanoid(10)}`;

        if (usernameStatus !== 'checking' || usernameStatus !== "taken") {
            return username;
        }

        // Strategy 3: Fallback to pure nanoid (guaranteed unique)
        return `user_${nanoid(12)}`;

    } catch (error: unknown) {
        // Ultimate fallback if everything fails
        logger.error('Error generating username:', { error });
        return `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
}