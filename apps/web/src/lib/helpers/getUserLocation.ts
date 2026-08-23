import { clientLogger } from "@/utils/logger/clientLogger";
import axios from "axios";
interface data {
    country_name: string;
    city?: string;
    [key: string]: any;

}
export const fetchUserLocation = async (): Promise<data | undefined> => {
    try {
        const response = await axios.get("https://ipapi.co/json/");
        const data = response.data;
        return data;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Something went wrong on Fetch User Geo Location';
        clientLogger.info("Error fetching location:", { message, error });
        return undefined;
    }
};