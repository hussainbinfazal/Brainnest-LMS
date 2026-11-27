// "use client";
// import React, { useRef, useEffect, useState } from "react";
// import videojs from "video.js";

// import "video.js/dist/video-js.css";
// import "./VideoPlayerStyles.css";
// import Player from "video.js/dist/types/player";
// import {
//   CChapter,
//   CQualityOption,
//   CSubtitle,
//   CVideoPlayerProps,
//   CWatermark,
// } from "@/types/client";
// import { clientLogger } from "@/utils/clientLogger/clientLogger";

// // Pick the MIME type from the URL; hard-coding "video/mp4" breaks HLS streams
// const getMimeType = (src: string): string => {
//   // HLS playlists need the HLS MIME type
//   if (src.includes('.m3u8')) return 'application/x-mpegURL';
//   if (src.includes('.webm')) return 'video/webm'
//   return 'video/mp4'
//   //
// }
// const WATERMARK_POSITIONS: Record<string, string> = {
//   'top-left': 'top-3 left-3',
//   'top-right': 'top-3 right-3',
//   'bottom-left': 'bottom-14 left-3',
//   'bottom-right': 'bottom-14 right-3',

// };
// const formatTime = (seconds: number) => {
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   const secs = Math.floor(seconds % 60);

//   if (hours > 0) {
//     return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
//   }
//   return `${minutes}:${secs.toString().padStart(2, "0")}`;
// };
// const VideoButton = videojs.getComponent("Button");
// type VideoButtonType = any;

// const VideoPlayer = ({
//   src,
//   poster,
//   title,
//   onProgress,
//   onPause,
//   startTime = 0,
//   onComplete,
//   onTimeUpdate,
//   playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2],
//   autoplay = false,
//   controls = true,
//   fluid = true,
//   responsive = true,
//   aspectRatio = "16:9",
//   hotkeys = true,
//   chapters = [],
//   subtitles = [],
//   quality = [],
//   analytics = true,
//   watermark = null,
//   className = "",
//   ...props
// }: CVideoPlayerProps): React.ReactNode => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const playerRef = useRef<Player | null | undefined>(null);
//   const startTimeRef = useRef(startTime);
//   const callbackRef = useRef({ onTimeUpdate, onPause, onComplete })
//   callbackRef.current = { onTimeUpdate, onPause, onComplete }
//   startTimeRef.current = startTime;
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [displayTime, setDisplayTime] = useState<number>()
//   // const [currentTime, setCurrentTime] = useState<number>(0);
//   const [duration, setDuration] = useState<number>(0);
//   // const [isPlaying, setIsPlaying] = useState<boolean>(false);
//   // const [volume, setVolume] = useState<number>(1);
//   const [playbackRate, setPlaybackRate] = useState<number>(1);
//   // const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

//   useEffect(() => {
//     if (!videoRef.current || !src) return;

//     // Ensure the element is in the DOM
//     if (!document.contains(videoRef.current)) {
//       console.warn("Video element not in DOM yet, waiting...");
//       return;
//     }
//     // Create the <video> ourselves so React never owns it (dispose() removes it from the DOM)
//     const videoEl = document.createElement('video')
//     videoEl.classList.add("video-js", "vjs-theme-brainnest", "vjs-big-play-centered");
//     // Mount it inside the container
//     videoRef.current.appendChild(videoEl)
//     // Video.js options
//     const videoJsOptions =
//     {
//       autoplay: autoplay,
//       controls: controls,
//       responsive: responsive,
//       fluid: fluid,
//       aspectRatio: aspectRatio,
//       playbackRates: playbackRates,
//       poster: poster,
//       preload: 'metadata',
//       sources: [
//         {
//           src: src,
//           type: "video/mp4",
//         },
//       ],
//       // plugins: {
//       //   hotkeys: hotkeys ? {
//       //     volumeStep: 0.1,
//       //     seekStep: 5,
//       //     enableModifiersForNumbers: false
//       //   } : false
//       // },
//       html5: {
//         vhs: {
//           overrideNative: true,
//         },
//       },

//     }

//     // Initialize Video.js player with a small delay
//     const initializePlayer = () => {
//       if (!videoRef.current) return;
//       const player = videojs(videoRef.current, videoJsOptions, () => {
//         setIsLoading(false);
//         clientLogger.info("Video.js player initialized");
//       });
//       return player;
//     };

//     // Small delay to ensure DOM is ready
//     const timer = setTimeout(() => {
//       if (videoRef.current && document.contains(videoRef.current)) {
//         const player = initializePlayer();
//         playerRef.current = player;
//         setupPlayerEvents(player!);
//       }
//     }, 100);

//     const setupPlayerEvents = (player: Player) => {
//       // Event listeners
//       player.on("loadedmetadata", () => {
//         const total = player.duration() ?? 0;
//         setDuration(total);
//         if (startTimeRef.current > 0 && startTimeRef.current < total - 5)
//           player.currentTime(startTimeRef.current)
//       });
//       // Fires about 4 times per second while playing
//       player.on("timeupdate", () => {
//         // Current position
//         const current = player.currentTime() ?? 0;
//         // Total length
//         const total = player.duration() ?? 0;
//         // Same value = React skips the re-render
//         setDisplayTime(Math.floor(current));
//         // Call the latest parent callback
//         callbackRef.current.onTimeUpdate?.(current, total)
//       });

//       player.on("progress", () => {
//         const buffered = player.buffered();
//         if (buffered.length > 0) {
//           const bufferedEnd = buffered.end(buffered.length - 1);
//           const duration = player.duration() ?? 0;
//           onProgress && onProgress((bufferedEnd / duration) * 100);
//         }
//       });

//       // player.on("play", () => {
//       //   setIsPlaying(true);
//       // });

//       player.on("pause", () => {
//         if (player.ended()) return
//         // Report position
//         callbackRef.current.onPause?.(player.currentTime() ?? 0, player.duration() ?? 0);
//         // setIsPlaying(false);
//       });

//       player.on("ended", () => {
//         callbackRef.current.onComplete?.(player.duration() ?? 0)
//       });

//       // player.on("volumechange", () => {
//       //   setVolume(player.volume() ?? 0);
//       // });
//       player.on("error", () => {
//         setError(player.error()?.message ?? 'Video failed to load')
//       });

//       player.on("ratechange", () => {
//         setPlaybackRate(player.playbackRate() ?? 1);
//       });

//       // player.on("fullscreenchange", () => {
//       //   setIsFullscreen(player.isFullscreen() ?? false);
//       // });

//       // Add custom components
//       addCustomComponents(player);

//       // Add chapters if provided
//       if (chapters.length > 0) {
//         addChapters(player, chapters);
//       }

//       // Add subtitles if provided
//       if (subtitles.length > 0) {
//         addSubtitles(player, subtitles);
//       }

//       // Add quality selector if provided
//       if (quality.length > 0) {
//         addQualitySelector(player, quality);
//       }

//       // Add watermark if provided
//       if (watermark) {
//         addWatermark(player, watermark);
//       }
//     };

//     return () => {
//       clearTimeout(timer);
//       if (playerRef.current) {
//         playerRef.current.dispose();
//         playerRef.current = null;
//       }
//     };
//   }, [src, poster, title]);

//   const addCustomComponents = (player: Player) => {
//     // Custom progress bar with chapters
//     const progressBar = player
//       .getChild("ControlBar")
//       ?.getChild("ProgressControl");

//     // Custom volume control
//     const volumeControl = player
//       .getChild("ControlBar")
//       ?.getChild("VolumePanel");

//     // Add custom buttons
//     addCustomButtons(player);
//   };

//   const addCustomButtons = (player: Player) => {
//     // Remove any existing skip buttons first
//     const controlBar = player.getChild("controlBar");
//     const existingButtons = controlBar
//       ?.children()
//       .filter(
//         (child: any) =>
//           child.name() &&
//           (child.name().includes("skip") || child.name().includes("Skip"))
//       );
//     existingButtons?.forEach((button) => controlBar?.removeChild(button));

//     const Button = videojs.getComponent("Button");

//     class SkipForwardButton extends Button {
//       constructor(player: Player, options: any) {
//         super(player, options);
//         (this as any).controlText("Skip Forward");
//       }

//       buildCSSClass() {
//         return "vjs-skip-forward-button vjs-button";
//       }

//       createEl() {
//         const button = super.createEl("button");
//         button.innerHTML = `
//           <span class="vjs-icon-placeholder">
//             <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
//               <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
//             </svg>
//           </span>
//         `;
//         return button;
//       }

//       handleClick() {
//         const player = this.player();
//         const currentTime = player.currentTime();
//         const newTime = Math.min(
//           (currentTime as number) + 10,
//           player.duration() ?? 0
//         );
//         player.currentTime(newTime);
//       }
//     }

//     class SkipBackwardButton extends Button {
//       constructor(player: Player, options: any) {
//         super(player, options);
//         (this as any).controlText("Skip Backward");
//       }

//       buildCSSClass() {
//         return "vjs-skip-backward-button vjs-button";
//       }

//       createEl() {
//         const button = super.createEl("button");
//         button.innerHTML = `
//           <span class="vjs-icon-placeholder">
//             <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
//               <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
//             </svg>
//           </span>
//         `;
//         return button;
//       }

//       handleClick() {
//         const player = this.player();
//         const currentTime = player.currentTime();
//         const newTime = Math.max((currentTime as number) - 10, 0);
//         player.currentTime(newTime);
//       }
//     }

//     // Register components only if not already registered
//     if (!videojs.getComponent("SkipForwardButton")) {
//       videojs.registerComponent("SkipForwardButton", SkipForwardButton);
//     }
//     if (!videojs.getComponent("SkipBackwardButton")) {
//       videojs.registerComponent("SkipBackwardButton", SkipBackwardButton);
//     }

//     // Add buttons to control bar only if they don't exist
//     if (!controlBar?.getChild("SkipBackwardButton")) {
//       controlBar?.addChild("SkipBackwardButton", {}, 1);
//     }
//     if (!controlBar?.getChild("SkipForwardButton")) {
//       controlBar?.addChild("SkipForwardButton", {}, 2);
//     }
//   };

//   const addChapters = (player: Player, chapters: CChapter[]) => {
//     // Add chapter markers to progress bar
//     chapters.forEach((chapter) => {
//       const marker = document.createElement("div");
//       marker.className = "vjs-chapter-marker";
//       const duration = player.duration() ?? 0;
//       marker.style.left = `${(chapter.time / duration) * 100}%`;
//       marker.title = chapter.title;

//       const progressBar = player.el().querySelector(".vjs-progress-holder");
//       if (progressBar) {
//         progressBar.appendChild(marker);
//       }
//     });
//   };

//   const addSubtitles = (player: Player, subtitles: CSubtitle[]) => {
//     subtitles.forEach((subtitle) => {
//       player.addRemoteTextTrack({
//         kind: "subtitles",
//         src: subtitle.src,
//         srclang: subtitle.lang,
//         label: subtitle.label,
//         default: subtitle.default || false,
//       }, false);
//     });
//   };
//   // Add the watermark if one was provided
//   if (watermark) {

//   }
//   const addQualitySelector = (player: Player, qualities: CQualityOption[]) => {
//     // Add quality selector menu
//     const qualityButton = videojs.getComponent("MenuButton");
//     const QualityButton = (videojs as any).extend(qualityButton, {
//       constructor: function () {
//         qualityButton.apply(this, arguments as any);
//         this.controlText("Quality");
//       },
//       createItems: function () {
//         const items: any[] = [];
//         qualities.forEach((quality) => {
//           items.push(
//             new QualityMenuItem(player, {
//               label: quality.label,
//               src: quality.src,
//               selected: quality.selected || false,
//             })
//           );
//         });
//         return items;
//       },
//     });

//     const qualityMenuItem = videojs.getComponent("MenuItem");
//     const QualityMenuItem = (videojs as any).extend(qualityMenuItem, {
//       handleClick: function () {
//         const currentTime = player.currentTime();
//         player.src(this.options_.src);
//         player.currentTime(currentTime);
//         player.play();
//       },
//     });

//     videojs.registerComponent("QualityButton", QualityButton);
//     videojs.registerComponent("QualityMenuItem", QualityMenuItem);

//     player?.getChild("controlBar")?.addChild("QualityButton", {}, 14);
//   };

//   const addWatermark = (player: Player, watermark: CWatermark) => {
//     const watermarkDiv = document.createElement("div");
//     // watermarkDiv.className = "vjs-watermark";
//     watermarkDiv.className = `absolute z-10 pointer-events-none select-none text-sm text-white/60 ${WATERMARK_POSITIONS[watermark.position ?? "top-right"] ?? WATERMARK_POSITIONS["top-right"]
//       }`
//     watermarkDiv.textContent = watermark.text || "";
//     if (watermark.image) {
//       watermarkDiv.style.backgroundImage = `url(${watermark.image})`;
//     }
//     watermarkDiv.style.position = watermark.position || "top-right";

//     player.el().appendChild(watermarkDiv);
//   };

//   const takeScreenshot = (player: Player) => {
//     const video = player.el().querySelector("video") as HTMLVideoElement | null;
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     if (video && ctx) {
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       ctx?.drawImage(video, 0, 0);

//       canvas.toBlob((blob) => {
//         const url = URL.createObjectURL(blob as Blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `screenshot-${Date.now()}.png`;
//         a.click();
//         URL.revokeObjectURL(url);
//       });
//     }
//   };

//   const togglePictureInPicture = async (player: Player) => {
//     const video = player.el().querySelector("video");
//     try {
//       if (document.pictureInPictureElement) {
//         await document.exitPictureInPicture();
//       } else {
//         await video?.requestPictureInPicture();
//       }
//     } catch (error) {
//       console.error("Picture-in-Picture error:", error);
//     }
//   };



//   return (
//     <div
//       className={`relative w-full max-w-full bg-black rounded-xl overflow-hidden shadow-2xl ${className}`}
//     >
//       {title && (
//         <div className="bg-linear-to-r from-blue-500 to-purple-600 px-5 py-4 text-white">
//           <h3 className="m-0 text-xl font-semibold text-shadow">{title}</h3>
//         </div>
//       )}

//       <div className="relative bg-black">
//         {isLoading && (
//           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white z-10">
//             <div className="w-10 h-10 border-3 border-white border-opacity-30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
//             <p className="text-sm opacity-80">Loading video...</p>
//           </div>
//         )}

//         <video
//           ref={videoRef}
//           className="video-js vjs-theme-brainnest w-full"
//           data-setup="{}"
//           {...props}
//         />
//       </div>

//       {analytics && (
//         <div className="bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-5 py-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-200 border-t border-gray-200 dark:border-gray-600">
//           <div className="flex items-center font-medium">
//             <span className="text-blue-500 mr-2">•</span>
//             <span>Current Time: {formatTime(currentTime)}</span>
//           </div>
//           <div className="flex items-center font-medium">
//             <span className="text-blue-500 mr-2">•</span>
//             <span>Duration: {formatTime(duration)}</span>
//           </div>
//           <div className="flex items-center font-medium">
//             <span className="text-blue-500 mr-2">•</span>
//             <span>Playback Rate: {playbackRate}x</span>
//           </div>
//           <div className="flex items-center font-medium">
//             <span className="text-blue-500 mr-2">•</span>
//             <span>Volume: {Math.round(volume * 100)}%</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default VideoPlayer;


// Client component: video.js touches the DOM, so it cannot run on the server
"use client";

// React hooks used by this component
import React, { useEffect, useRef, useState } from "react";
// video.js core library
import videojs from "video.js";
// Default video.js styles
import "video.js/dist/video-js.css";
// Your custom theme (vjs-theme-brainnest)
import "./VideoPlayerStyles.css";
// Player type, for TypeScript only
import type Player from "video.js/dist/types/player";
// Your existing shared types
import { CSubtitle, CWatermark } from "@/types/client";

// Props are defined here so the callbacks have exact signatures (replaces CVideoPlayerProps)
type VideoPlayerProps = {
  // Video URL (mp4, webm or m3u8)
  src: string;
  // Optional poster image
  poster?: string;
  // Optional title shown in the header bar
  title?: string;
  // Where to resume playback, in seconds
  startTime?: number;
  // Fires on every timeupdate (about 4x per second)
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  // Fires when the user pauses
  onPause?: (currentTime: number, duration: number) => void;
  // Fires when the video ends
  onComplete?: (duration: number) => void;
  // Speed options in the settings menu
  playbackRates?: number[];
  // Optional subtitle tracks
  subtitles?: CSubtitle[];
  // Optional watermark overlay
  watermark?: CWatermark | null;
  // Show the stats bar under the video
  analytics?: boolean;
  // Extra classes for the wrapper
  className?: string;
};

// Pick the MIME type from the URL; hard-coding "video/mp4" breaks HLS streams
const getMimeType = (src: string): string => {
  // HLS playlists need the HLS MIME type
  if (src.includes(".m3u8")) return "application/x-mpegURL";
  // WebM files
  if (src.includes(".webm")) return "video/webm";
  // Default to mp4
  return "video/mp4";
};

// Literal class strings so Tailwind can see them at build time
const WATERMARK_POSITIONS: Record<string, string> = {
  // Top-left corner
  "top-left": "top-3 left-3",
  // Top-right corner
  "top-right": "top-3 right-3",
  // Bottom corners sit above the control bar
  "bottom-left": "bottom-14 left-3",
  // Bottom-right corner
  "bottom-right": "bottom-14 right-3",
};

// Format seconds as m:ss or h:mm:ss
const formatTime = (seconds: number): string => {
  // Whole hours
  const hours = Math.floor(seconds / 3600);
  // Remaining whole minutes
  const minutes = Math.floor((seconds % 3600) / 60);
  // Remaining whole seconds
  const secs = Math.floor(seconds % 60);
  // Show hours only when needed
  if (hours > 0) {
    // h:mm:ss
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  // m:ss
  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

// The player component
const VideoPlayer = ({
  src,
  poster,
  title,
  startTime = 0,
  onTimeUpdate,
  onPause,
  onComplete,
  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2],
  subtitles = [],
  watermark = null,
  analytics = true,
  className = "",
}: VideoPlayerProps): React.JSX.Element => {
  // React owns this empty div; video.js owns everything inside it
  const containerRef = useRef<HTMLDivElement>(null);
  // Holds the video.js instance between renders
  const playerRef = useRef<Player | null>(null);
  // Always points to the LATEST callbacks, so player listeners never go stale
  const callbacksRef = useRef({ onTimeUpdate, onPause, onComplete });
  // Always points to the latest resume position
  const startTimeRef = useRef(startTime);
  // Refresh the refs on every render (cheap, no re-render triggered)
  callbacksRef.current = { onTimeUpdate, onPause, onComplete };
  // Keep the resume position fresh too
  startTimeRef.current = startTime;

  // True until video.js is ready
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Error text if the video fails to load
  const [error, setError] = useState<string | null>(null);
  // Whole seconds only, so React re-renders once per second, not 4x per second
  const [displayTime, setDisplayTime] = useState<number>(0);
  // Total duration in seconds
  const [duration, setDuration] = useState<number>(0);
  // Current playback speed
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Create the player ONCE on mount, dispose on unmount
  useEffect(() => {
    // The container must exist
    const container = containerRef.current;
    // Bail out if it does not
    if (!container) return;

    // Create the <video> ourselves so React never owns it (dispose() removes it from the DOM)
    const videoEl = document.createElement("video");
    // video.js base class plus your theme
    videoEl.classList.add("video-js", "vjs-theme-brainnest", "vjs-big-play-centered");
    // Mount it inside the container
    container.appendChild(videoEl);

    // Initialise video.js
    const player = videojs(
      // The element we just created
      videoEl,
      // Options
      {
        // Show native controls
        controls: true,
        // Scale with the parent width
        fluid: true,
        // Adapt controls to width
        responsive: true,
        // Keep 16:9
        aspectRatio: "16:9",
        // Speed menu
        playbackRates,
        // Poster image
        poster,
        // Load only metadata until the user presses play
        preload: "metadata",
        // Built-in skip buttons (needs video.js 8.4+), replaces ~90 lines of custom Button classes
        controlBar: { skipButtons: { forward: 10, backward: 10 } },
        // Use video.js HLS engine instead of native
        html5: { vhs: { overrideNative: true } },
      },
      // Ready callback
      () => setIsLoading(false)
    );
    // Save the instance
    playerRef.current = player;

    // Metadata is known: set duration and resume
    player.on("loadedmetadata", () => {
      // Total length
      const total = player.duration() ?? 0;
      // Store it for the stats bar
      setDuration(total);
      // Resume only if there is a saved position and it is not the last 5 seconds
      if (startTimeRef.current > 0 && startTimeRef.current < total - 5) {
        // Jump to the saved position
        player.currentTime(startTimeRef.current);
      }
    });

    // Fires about 4 times per second while playing
    player.on("timeupdate", () => {
      // Current position
      const current = player.currentTime() ?? 0;
      // Total length
      const total = player.duration() ?? 0;
      // Same value = React skips the re-render
      setDisplayTime(Math.floor(current));
      // Call the latest parent callback
      callbacksRef.current.onTimeUpdate?.(current, total);
    });

    // User paused: parent can save the position
    player.on("pause", () => {
      // Ignore the pause that fires right before "ended"
      if (player.ended()) return;
      // Report position
      callbacksRef.current.onPause?.(player.currentTime() ?? 0, player.duration() ?? 0);
    });

    // Video finished
    player.on("ended", () => {
      // Report completion with the real duration
      callbacksRef.current.onComplete?.(player.duration() ?? 0);
    });

    // Speed changed
    player.on("ratechange", () => {
      // Update the stats bar
      setPlaybackRate(player.playbackRate() ?? 1);
    });

    // Network or decode errors
    player.on("error", () => {
      // Show a readable message
      setError(player.error()?.message ?? "Video failed to load");
    });

    // Add subtitle tracks
    subtitles.forEach((subtitle) => {
      // Remote track so video.js lists it in the CC menu
      player.addRemoteTextTrack(
        {
          // Subtitle track type
          kind: "subtitles",
          // Track file URL
          src: subtitle.src,
          // Language code
          srclang: subtitle.lang,
          // Menu label
          label: subtitle.label,
          // Default track
          default: subtitle.default || false,
        },
        // Let player.dispose() clean up
        false
      );
    });

    // Add the watermark if one was provided
    if (watermark) {
      // Build the overlay element
      const watermarkEl = document.createElement("div");
      // Position with literal Tailwind classes; pointer-events-none so clicks reach the video
      watermarkEl.className = `absolute z-10 pointer-events-none select-none text-sm text-white/60 ${WATERMARK_POSITIONS[watermark.position ?? "top-right"] ?? WATERMARK_POSITIONS["top-right"]
        }`;
      // textContent (not innerHTML) so text can never inject HTML
      watermarkEl.textContent = watermark.text || "";
      // Optional image watermark
      if (watermark.image) watermarkEl.style.backgroundImage = `url(${watermark.image})`;
      // Append inside the player element so it survives fullscreen
      player.el().appendChild(watermarkEl);
    }

    // Cleanup on unmount (also runs between the two mounts in React Strict Mode)
    return () => {
      // Dispose only if it is still alive
      if (playerRef.current && !playerRef.current.isDisposed()) {
        // Remove listeners and DOM
        playerRef.current.dispose();
      }
      // Forget the instance
      playerRef.current = null;
    };
    // Mount-only on purpose: src and poster have their own effects below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the source when the lesson changes, without rebuilding the player
  useEffect(() => {
    // Grab the live player
    const player = playerRef.current;
    // Nothing to do without a player or a source
    if (!player || !src) return;
    // Clear any old error
    setError(null);
    // Load the new video with the correct MIME type
    player.src({ src, type: getMimeType(src) });
  }, [src]);

  // Keep the poster in sync
  useEffect(() => {
    // Update only when the player exists
    playerRef.current?.poster(poster ?? "");
  }, [poster]);

  // Render
  return (
    // Outer card
    <div className={`relative w-full max-w-full overflow-hidden rounded-xl bg-black shadow-2xl ${className}`}>
      {/* Optional header bar */}
      {title && (
        <div className="bg-linear-to-r from-blue-500 to-purple-600 px-5 py-4 text-white">
          <h3 className="m-0 text-xl font-semibold">{title}</h3>
        </div>
      )}

      {/* Video area */}
      <div className="relative bg-black">
        {/* Loading overlay (bg-black/80 replaces bg-opacity-80, which Tailwind v4 removed) */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 text-white">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-3 border-white/30 border-t-blue-500" />
            <p className="text-sm opacity-80">Loading video...</p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 p-6 text-center text-red-400">
            {error}
          </div>
        )}

        {/* video.js mounts its <video> inside this div */}
        <div ref={containerRef} data-vjs-player />
      </div>

      {/* Stats bar */}
      {analytics && (
        <div className="flex flex-wrap gap-4 border-t border-gray-600 bg-gray-700 px-5 py-3 text-sm text-gray-200">
          <span>Current Time: {formatTime(displayTime)}</span>
          <span>Duration: {formatTime(duration)}</span>
          <span>Playback Rate: {playbackRate}x</span>
        </div>
      )}
    </div>
  );
};

// Default export, same as before
export default VideoPlayer;
