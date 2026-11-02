"use client";

// Import React hooks and axios
import { useEffect, useState } from "react";
import axios from "axios";
import { clientLogger } from "@/utils/clientLogger/clientLogger";

// What the status route returns
type Draft = { description: string; faqs: { question: string; answer: string }[] };
type DraftState = { status: "idle" | "processing" | "ready" | "failed"; draft?: Draft };

// Poll the status route until the draft is ready or failed
export function useLessonDraft(publicId: string | undefined): DraftState {
    // Local state with the current status and draft
    const [state, setState] = useState<DraftState>({ status: "idle" });
    // Restart polling whenever the pending id changes (new video uploaded)
    useEffect(() => {
        const controller = new AbortController()//Kills the request if the component unmounts
        // Nothing to poll without an id
        if (!publicId) { setState({ status: "idle" }); return; }
        // Guards against updating state after unmount or id change
        let cancelled = false;
        // Handle of the next scheduled poll
        let timer: ReturnType<typeof setTimeout>;
        // Safety cap: 120 polls x 5 s = 10 minutes
        let tries = 0;
        // One poll
        const poll = async () => {
            try {
                // Ask the server for the current status (adjust to your successResponse shape)
                const res = await axios.get("/api/instructor/course/ai/lesson-draft", {
                    params: { publicId },
                    signal: controller.signal,
                });
                // Ignore late responses
                if (cancelled) return;
                // Save status and draft
                setState(res.data);
                // Keep polling only while the worker is still busy
                if (res.data.status === "processing" && ++tries < 120) timer = setTimeout(poll, 5000);
            } catch (pollError) {
                clientLogger.error("Failed to poll lesson draft status", { publicId, error: pollError instanceof Error ? pollError : undefined, message: pollError instanceof Error ? pollError.message : "Unknown error" });
                // Network or server error: stop and show failed
                if (!cancelled) setState({ status: "failed" });
            }
        };
        // Show progress immediately
        setState({ status: "processing" });
        // Start the first poll
        poll();
        // Cleanup when the id changes or the component unmounts
        return () => { cancelled = true; clearTimeout(timer); };
    }, [publicId]);
    // Expose the state to the component
    return state;
}