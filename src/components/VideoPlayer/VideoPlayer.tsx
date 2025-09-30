"use client";
import React, { useRef, useEffect, useState } from 'react';
import videojs from 'video.js';

import 'video.js/dist/video-js.css';
import './VideoPlayerStyles.css';
import type Player from 'video.js/dist/types/player';
import { Chapter, QualityOption, Subtitle, VideoPlayerProps, Watermark } from '@/types/client';
const VideoButton = videojs.getComponent('Button');
type VideoButtonType = any;

const VideoPlayer = ({
  src,
  poster,
  title,
  onProgress,
  onComplete,
  onTimeUpdate,
  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2],
  autoplay = false,
  controls = true,
  fluid = true,
  responsive = true,
  aspectRatio = '16:9',
  hotkeys = true,
  chapters = [],
  subtitles = [],
  quality = [],
  analytics = true,
  watermark = null,
  className = '',
  ...props
} : VideoPlayerProps):React.ReactNode => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null | undefined >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    // Ensure the element is in the DOM
    if (!document.contains(videoRef.current)) {
      console.warn('Video element not in DOM yet, waiting...');
      return;
    }

    // Video.js options
    const videoJsOptions = {
      autoplay: autoplay,
      controls: controls,
      responsive: responsive,
      fluid: fluid,
      aspectRatio: aspectRatio,
      playbackRates: playbackRates,
      poster: poster,
      sources: [{
        src: src,
        type: 'video/mp4'
      }],
      // plugins: {
      //   hotkeys: hotkeys ? {
      //     volumeStep: 0.1,
      //     seekStep: 5,
      //     enableModifiersForNumbers: false
      //   } : false
      // },
      html5: {
        vhs: {
          overrideNative: true
        }
      }
    };

    // Initialize Video.js player with a small delay
    const initializePlayer = () => {
      if (!videoRef.current) return;
      const player = videojs(videoRef.current, videoJsOptions, () => {
        setIsLoading(false);
        console.log('Video.js player initialized');
      });
      return player;
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {

      if (videoRef.current && document.contains(videoRef.current)) {
        const player = initializePlayer();
        playerRef.current = player;
        setupPlayerEvents(player!);
      }
    }, 100);

    const setupPlayerEvents = (player : Player) => {

      // Event listeners
      player.on('loadedmetadata', () => {
        setDuration(player.duration() ?? 0);
      });

      player.on('timeupdate', () => {
        const current = player.currentTime();
        setCurrentTime(current ?? 0);
        onTimeUpdate && onTimeUpdate(current ?? 0, player.duration() ?? 0);
      });

      player.on('progress', () => {
        const buffered = player.buffered();
        if (buffered.length > 0) {
          const bufferedEnd = buffered.end(buffered.length - 1);
          const duration = player.duration() ?? 0;
          onProgress && onProgress((bufferedEnd / duration ) * 100);
        }
      });

      player.on('play', () => {
        setIsPlaying(true);
      });

      player.on('pause', () => {
        setIsPlaying(false);
      });

      player.on('ended', () => {
        setIsPlaying(false);
        onComplete && onComplete();
      });

      player.on('volumechange', () => {
        setVolume(player.volume() ?? 0);
      });

      player.on('ratechange', () => {
        setPlaybackRate(player.playbackRate() ?? 0);
      });

      player.on('fullscreenchange', () => {
        setIsFullscreen(player.isFullscreen()  ?? false);
      });

      // Add custom components
      addCustomComponents(player);

      // Add chapters if provided
      if (chapters.length > 0) {
        addChapters(player, chapters);
      }

      // Add subtitles if provided
      if (subtitles.length > 0) {
        addSubtitles(player, subtitles);
      }

      // Add quality selector if provided
      if (quality.length > 0) {
        addQualitySelector(player, quality);
      }

      // Add watermark if provided
      if (watermark) {
        addWatermark(player, watermark);
      }
    };

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, poster, title]);

  const addCustomComponents = (player: Player) => {
    // Custom progress bar with chapters
    const progressBar = player.getChild('ControlBar')?.getChild('ProgressControl');
    
    // Custom volume control
    const volumeControl = player.getChild('ControlBar')?.getChild('VolumePanel');
    
    // Add custom buttons
    addCustomButtons(player);
  };

  const addCustomButtons = (player: Player) => {
    // Remove any existing skip buttons first
    const controlBar = player.getChild('controlBar');
    const existingButtons = controlBar?.children().filter((child: any ) => 
      child.name() && (child.name().includes('skip') || child.name().includes('Skip'))
    );
    existingButtons?.forEach(button => controlBar?.removeChild(button));
    
    const Button = videojs.getComponent('Button');
    
    class SkipForwardButton extends Button {
      constructor(player: Player,  options: any) {
        super(player, options);
        (this as any).controlText('Skip Forward');
      }

      buildCSSClass() {
        return 'vjs-skip-forward-button vjs-button';
      }

      createEl() {
        const button = super.createEl('button');
        button.innerHTML = `
          <span class="vjs-icon-placeholder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
            </svg>
          </span>
        `;
        return button;
      }

      handleClick() {
        const player = this.player();
        const currentTime = player.currentTime();
        const newTime = Math.min(currentTime as number + 10, player.duration() ?? 0);
        player.currentTime(newTime);
      }
    }

    class SkipBackwardButton extends Button {
      constructor(player:Player, options: any) {
        super(player, options);
        (this as any).controlText('Skip Backward');
      }

      buildCSSClass() {
        return 'vjs-skip-backward-button vjs-button';
      }

      createEl() {
        const button = super.createEl('button');
        button.innerHTML = `
          <span class="vjs-icon-placeholder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
            </svg>
          </span>
        `;
        return button;
      }

      handleClick() {
        const player = this.player();
        const currentTime = player.currentTime();
        const newTime = Math.max(currentTime as number - 10, 0);
        player.currentTime(newTime);
      }
    }

    // Register components only if not already registered
    if (!videojs.getComponent('SkipForwardButton')) {
      videojs.registerComponent('SkipForwardButton', SkipForwardButton);
    }
    if (!videojs.getComponent('SkipBackwardButton')) {
      videojs.registerComponent('SkipBackwardButton', SkipBackwardButton);
    }

    // Add buttons to control bar only if they don't exist
    if (!controlBar?.getChild('SkipBackwardButton')) {
      controlBar?.addChild('SkipBackwardButton', {}, 1);
    }
    if (!controlBar?.getChild('SkipForwardButton')) {
      controlBar?.addChild('SkipForwardButton', {}, 2);
    }
  };

  const addChapters = (player:Player, chapters: Chapter[]) => {
    // Add chapter markers to progress bar
    chapters.forEach(chapter => {
      const marker = document.createElement('div');
      marker.className = 'vjs-chapter-marker';
      const duration = player.duration() ?? 0;
      marker.style.left = `${(chapter.time / duration) * 100}%`;
      marker.title = chapter.title;
      
      const progressBar = player.el().querySelector('.vjs-progress-holder');
      if (progressBar) {
        progressBar.appendChild(marker);
      }
    });
  };

  const addSubtitles = (player : Player, subtitles : Subtitle[]) => {
    subtitles.forEach(subtitle => {
      player.addRemoteTextTrack({
        kind: 'subtitles',
        src: subtitle.src,
        srclang: subtitle.lang,
        label: subtitle.label,
        default: subtitle.default || false
      });
    });
  };

  const addQualitySelector = (player : Player, qualities : QualityOption[]) => {
    // Add quality selector menu
    const qualityButton = videojs.getComponent('MenuButton');
    const QualityButton = (videojs as any).extend(qualityButton, {
      constructor: function() {
        qualityButton.apply(this,arguments as any);
        this.controlText('Quality');
      },
      createItems: function() {
        const items : any[] = [];
        qualities.forEach(quality => {
          items.push(new QualityMenuItem(player, {
            label: quality.label,
            src: quality.src,
            selected: quality.selected || false
          }));
        });
        return items;
      }
    });

    const qualityMenuItem = videojs.getComponent('MenuItem');
    const QualityMenuItem = (videojs as any).extend(qualityMenuItem, {
      handleClick: function() {
        const currentTime = player.currentTime();
        player.src(this.options_.src);
        player.currentTime(currentTime);
        player.play();
      }
    });

    videojs.registerComponent('QualityButton', QualityButton);
    videojs.registerComponent('QualityMenuItem', QualityMenuItem);
    
    player?.getChild('controlBar')?.addChild('QualityButton', {}, 14);
  };

  const addWatermark = (player: Player, watermark: Watermark) => {
    const watermarkDiv = document.createElement('div');
    watermarkDiv.className = 'vjs-watermark';
    watermarkDiv.innerHTML = watermark.text || '';
    if (watermark.image) {
      watermarkDiv.style.backgroundImage = `url(${watermark.image})`;
    }
    watermarkDiv.style.position = watermark.position || 'top-right';
    
    player.el().appendChild(watermarkDiv);
  };

  const takeScreenshot = (player: Player) => {
    const video = player.el().querySelector('video') as HTMLVideoElement | null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (video && ctx) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.drawImage(video, 0, 0);
    
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
   
  }
  };

  const togglePictureInPicture = async (player : Player) => {
    const video = player.el().querySelector('video');
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video?.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Picture-in-Picture error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative w-full max-w-full bg-black rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {title && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-4 text-white">
          <h3 className="m-0 text-xl font-semibold text-shadow">{title}</h3>
        </div>
      )}
      
      <div className="relative bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white z-10">
            <div className="w-10 h-10 border-3 border-white border-opacity-30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm opacity-80">Loading video...</p>
          </div>
        )}
        
        <video
          ref={videoRef}
          className="video-js vjs-theme-brainnest w-full"
          data-setup="{}"
          {...props}
        />
      </div>
      
      {analytics && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-5 py-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-200 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center font-medium">
            <span className="text-blue-500 mr-2">•</span>
            <span>Current Time: {formatTime(currentTime)}</span>
          </div>
          <div className="flex items-center font-medium">
            <span className="text-blue-500 mr-2">•</span>
            <span>Duration: {formatTime(duration)}</span>
          </div>
          <div className="flex items-center font-medium">
            <span className="text-blue-500 mr-2">•</span>
            <span>Playback Rate: {playbackRate}x</span>
          </div>
          <div className="flex items-center font-medium">
            <span className="text-blue-500 mr-2">•</span>
            <span>Volume: {Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;