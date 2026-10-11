import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { CreateCourseBody } from "@/utils/fieldsValidation/Client/courseSchemaValidation";
import { getErrorMessage } from "@repo/shared";
import axios from "axios";
import { toast } from "sonner";
import { create } from "zustand";

export type CInstructorCourseStore = {
    isLoading: boolean,
    createCourse: (data: CreateCourseBody) => Promise<void>
};


export const useInstructorCourse = create<CInstructorCourseStore>((set, get) => ({
    isLoading: false,
    createCourse: async (data: CreateCourseBody) => {
        set({ isLoading: true });
        try {
            const response = await axios.post('/api/admin/course/create', data);
            if (!response.data.success) {
                return
            }
            toast.success('Course created successfully');
            set({ isLoading: false });
        } catch (error: unknown) {
            const message = getErrorMessage(error, "Something went wrong, while creating course");
            toast.error("Something went wrong")
            clientLogger.error("Something went wrong, while creating course", { message, error });
            throw new Error(message);
        }
    }
}));