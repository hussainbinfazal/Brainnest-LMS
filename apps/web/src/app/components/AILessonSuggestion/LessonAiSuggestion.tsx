"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CreateCourseBody } from "@/utils/fieldsValidation/Client/courseSchemaValidation";
import { useLessonDraft } from "@/hooks/useLessonDraft";
import { requestLessonDraft } from "@/utils/transcribeVideo/transcribeVideo";
import { getErrorMessage, PENDING_LECTURES_SUBFOLDER, TOPIC_FOLDER } from "@repo/shared";
import { clientLogger } from "@/utils/clientLogger/clientLogger";
import { LoaderCircle } from "lucide-react";

const LECTURE_PENDING_PATH = `${TOPIC_FOLDER["lecture-video"]}/${PENDING_LECTURES_SUBFOLDER}/`;

// Props: which lesson in which section
export function LessonAiSuggestion({ sectionIndex, lessonIndex }: { sectionIndex: number; lessonIndex: number }) {
    // Access the parent form (this component lives inside <FormProvider>)
    const { setValue, getValues, watch } = useFormContext<CreateCourseBody>();
    // Path of the description field this component fills
    const descPath = `sections.${sectionIndex}.lessons.${lessonIndex}.description` as const;
    // Watch the pending id that the upload handler stores
    const publicId = watch(`sections.${sectionIndex}.lessons.${lessonIndex}.videoPublicId`);
    // Only brand-new uploads are pending; existing lessons hold final ids and must not trigger
    const isPending = !!publicId && publicId.includes(LECTURE_PENDING_PATH);
    const [requestedPublicId, setRequestedPublicId] = useState<string>();
    const isActive = isPending || requestedPublicId === publicId;
    const v = getValues();
    const sectionTitle: string | undefined = v.sections[sectionIndex]?.title;
    const lessonTitle: string | undefined = v.sections[sectionIndex]?.lessons[lessonIndex]?.name;
    const courseTitle: string | undefined = v.title;
    const sectionDescription: string | undefined = v.sections[sectionIndex]?.description;
    const courseDescription: string | undefined = v.description;
    // Start the draft once per new upload
    useEffect(() => {
        // Skip when there is no new upload
        if (!isPending) return;
        // Read the course context at this moment (it may still be empty)


        // Fire and forget; the hook below handles progress
        requestLessonDraft([{
            publicId,
            lessonTitle: lessonTitle,
            sectionTitle: sectionTitle,
            sectionDescription: sectionDescription,
            courseDescription: courseDescription,
            courseTitle: courseTitle,
            category: v.category?.name,
            level: v.level,
            language: v.language,
        }])
            // Tell the instructor if queuing failed
            .catch((error) => {
                toast.error("Could not start AI draft");
                clientLogger.error(getErrorMessage(error, "Failed to request lesson draft"), { publicId, courseTitle: courseTitle, sectionTitle: sectionTitle, lessonTitle: lessonTitle, category: v.category?.name, level: v.level, language: v.language, });
            });
        setRequestedPublicId(publicId);
        // getValues is stable, so only the upload id matters
    }, [isPending, publicId]);

    // Poll for the result
    const { status, draft } = useLessonDraft(isActive ? publicId : undefined);
    // Current text in the description field
    const current = watch(descPath);
    const requestDraft = async () => {
        if (!publicId) return;
        const v = getValues();
        try {
            await requestLessonDraft([{
                courseTitle: courseTitle,
                sectionTitle: sectionTitle,
                sectionDescription: sectionDescription,
                courseDescription: courseDescription,
                lessonTitle: lessonTitle,
                publicId,
                // title: v.title,
                category: v.category?.name,
                level: v.level,
                language: v.language,
            }]);
            setRequestedPublicId(publicId);
        } catch {
            toast.error("Could not start AI draft");
            clientLogger.error("Failed to request lesson draft", { publicId, title: v.title, category: v.category?.name, level: v.level, language: v.language });
        }
    };

    // Auto-fill only when the field is still empty
    useEffect(() => {
        // Wait for a finished draft
        if (status !== "ready" || !draft) return;
        // Never overwrite what the instructor already typed
        if (getValues(descPath)) return;
        // Fill the field and mark the form as edited so it validates and saves
        setValue(descPath, draft.description, { shouldDirty: true, shouldValidate: true });
        // Run when the draft arrives
    }, [status, draft]);

    if (!publicId) return null;
    if (status === "idle") {
        return (
            <Button type="button" variant="outline" className="text-sm" onClick={requestDraft}>
                Generate AI suggestion
            </Button>
        );
    }
    // Progress message
    if (status === "processing") {
        return (
            <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Generating AI description...
            </p>
        );
    }
    // Error message, the form still works manually
    if (status === "failed") {
        return (
            <div className="flex items-center gap-2">
                <p className="text-sm text-destructive">AI draft failed. Write the description yourself.</p>
                <Button type="button" variant="outline" className="text-sm" onClick={requestDraft}>
                    Try again
                </Button>
            </div>
        );
    }
    // The draft is already in the field, so there is nothing more to offer
    if (!draft || current === draft.description) return <p className="text-sm text-muted-foreground">AI-generated. Please review it.</p>;
    // The instructor typed something else, so offer the suggestion instead of overwriting
    return (
        <Button
            // Not a submit button, or it would submit the whole course form
            type="button"
            variant="outline"
            // Replace only when the instructor asks
            onClick={() => setValue(descPath, draft.description, { shouldDirty: true, shouldValidate: true })}
            className="text-sm bg-amber-200 px-2 py-3"
        >
            Replace with AI suggestion
        </Button>
    );
}