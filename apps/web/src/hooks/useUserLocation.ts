"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUserLocation } from "@/lib/helpers/getUserLocation";
import { clientLogger } from "@/utils/logger/clientLogger";

interface UserLocation {
    country_name: string;
    city?: string;
    [key: string]: unknown;
}

interface UseUserLocationOptions {
    enabled?: boolean;
}

interface UseUserLocationResult {
    location: UserLocation | undefined;
    loading: boolean;
    error: string | undefined;
    refetch: () => Promise<UserLocation | undefined>;
}

export const useUserLocation = ({ enabled = true }: UseUserLocationOptions = {}): UseUserLocationResult => {
    //enable by default, for now in development 
    const [location, setLocation] = useState<UserLocation | undefined>();
    const [loading, setLoading] = useState<boolean>(enabled);
    const [error, setError] = useState<string | undefined>();

    const refetch = useCallback(async (): Promise<UserLocation | undefined> => {
        setLoading(true);
        setError(undefined);

        try {
            const userLocation = await fetchUserLocation();

            if (!userLocation) {
                throw new Error("Unable to fetch user location");
            }

            setLocation(userLocation);
            return userLocation;
        } catch (fetchError: unknown) {
            const message = fetchError instanceof Error
                ? fetchError.message
                : "Unable to fetch user location";
            clientLogger.error("Something went wrong while fetching Location with API", { message })
            setError(message);
            return undefined;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enabled) {
            void refetch();
        } else {
            setLoading(false);
        }
    }, [enabled, refetch]);

    return { location, loading, error, refetch };
};