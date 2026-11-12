"use client";

// Import React hooks and axios
import { useEffect, useState } from "react";
import axios from "axios";
import { clientLogger } from "@/utils/clientLogger/clientLogger";

// What the status route returns
type Draft = {
  description: string;
  faqs: { question: string; answer: string }[];
};
type DraftState = {
  status: "idle" | "processing" | "ready" | "failed";
  draft?: Draft;
};

// Poll the status route until the draft is ready or failed
export function useLessonDraft(
  publicId: string | undefined,
  lessonId?: string
): DraftState {
  // Local state with the current status and draft
  const [state, setState] = useState<DraftState>({ status: "idle" });
  // Restart polling whenever the pending id changes (new video uploaded)
  useEffect(() => {
    const controller = new AbortController(); //Kills the request if the component unmounts
    // Nothing to poll without an id
    if (!publicId) {
      setState({ status: "idle" });
      return;
    }
    // Guards against updating state after unmount or id change
    let cancelled = false;
    // Handle of the next scheduled poll
    let timer: ReturnType<typeof setTimeout>;
    // Safety cap: 120 polls x 5 s = 10 minutes
    let tries = 0;
    // One poll
    const poll = async () => {
      console.log(
        "this is the public Id in the useLessonDraft Hook ",
        publicId,
        "This is the lesson Id on the worker side",
        lessonId
      );
      try {
        // Ask the server for the current status (adjust to your successResponse shape)
        const res = await axios.get(
          "/api/admin/course/instructor/ai/lesson-draft",
          {
            params: { publicId, lessonId },
            signal: controller.signal,
          }
        );
        console.log("This is the data on useLessonDraft Hook", res);
        // Ignore late responses
        if (cancelled) return;
        // Save status and draft
        setState(res.data);
        // The worker may not have created its transcript record when the first poll arrives.
        if (
          (res.data.status === "idle" || res.data.status === "processing") &&
          ++tries < 120
        ) {
          timer = setTimeout(poll, 5000);
        }
        clientLogger.info("Polled lesson draft status", {
          publicId,
          status: res.data.status,
        });
      } catch (pollError) {
        clientLogger.error("Failed to poll lesson draft status", {
          publicId,
          error: pollError instanceof Error ? pollError : undefined,
          message:
            pollError instanceof Error ? pollError.message : "Unknown error",
        });
        // Network or server error: stop and show failed
        if (!cancelled) setState({ status: "failed" });
      }
    };
    // Show progress immediately
    setState({ status: "processing" });
    // Start the first poll
    poll();
    // Cleanup when the id changes or the component unmounts
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [publicId, lessonId]);
  // Expose the state to the component
  return state;
}
