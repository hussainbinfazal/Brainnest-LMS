"use client"


import { cn } from "@/lib/utils";
import { CProfileImageUploadProps } from "@/types/client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useUpload } from "@/utils/hooks/Video/useUpload";


const CIRCLE_SIZE = 128;
const OUTPUT_SIZE = 200;
const JPEG_QUALITY = 0.6;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const MAX_FILE_SIZE_MB = 5;

type Transform = {
  position: { x: number, y: number };
  scale: number;
  rotation: number
}
const ProfileImageUpload = ({ control, setValue, trigger, className }: CProfileImageUploadProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotating, setRotating] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const startPosRef = useRef<{ x: number; y: number }>(null);
  const { uploadFile } = useUpload() ///TO manage the upload of Image

  //Decoded image is cached here once per upload instead of being re-created with new Image() on every wheel tick/drag end.
  const decodedImgRef = useRef<HTMLImageElement | null>(null);
  // Latest cropped output, kept as a Blob (not base64) so Save can hand it
  // straight to FormData/uploadFile without a decode round-trip.
  const croppedBlobRef = useRef<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];
    ///Reset the input so selecting the SAME file twice in a row still fires onChange.
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) { //Check if the file is an imag
      setError("Please select an image file");
      return
    };
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) { //Check if the file is under 5MB
      setError(`Image must be under ${MAX_FILE_SIZE_MB}`)
    };
    const reader: FileReader = new FileReader();
    reader.onerror = () => setError("Could not read that file. Try another one.") //Catch any errors
    reader.onloadend = () => { //Once the file is loaded
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        decodedImgRef.current = img; //Cache the decoded image
        setImage(result);
        const reset: Transform = { position: { x: 0, y: 0 }, scale: 1, rotation: 0 }
        setPosition(reset.position);
        setScale(reset.scale);
        setRotation(reset.rotation);
        renderPreview(result, reset); //Render the preview
      }
      img.onerror = () => setError("That image could not be loaded. ");
      img.src = result
    }
    reader.readAsDataURL(file); //Start reading the file
  };



  const renderPreview = useCallback((imgSrc: string, transform: Transform) => { //Render the preview
    const img = decodedImgRef.current; // Get the cached image first
    if (!img) return;
    const canvas = document.createElement("canvas"); // Create a canvas, which will hold the transformed image
    canvas.width = OUTPUT_SIZE; // Set the width of the canvas
    canvas.height = OUTPUT_SIZE; // Set the height of the canvas
    const ctx = canvas.getContext("2d"); // Get the context of the canvas, which will hold the transformed image in the screen.
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height) ///Clear the canvas,h=0,w=0
    ctx.beginPath(); // Start a new path, which will hold the transformed image
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2); // Draw a circular clipping path on the canvas around the center of the canvas as a circle
    ctx.closePath(); // Close the path
    ctx.clip(); //
    ctx.fillStyle = "#f0f0f0"; // Set the fill color to white
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with white

    const { position, scale, rotation } = transform; ///Destructure the transform object, which contains the position, scale, and rotation of the image
    const imgWidth = img.width; // Get the width of the image
    const imgHeight = img.height // Get the height of the image

    const tempCanvas = document.createElement("canvas") ///Create a temporary canvas to apply transformations to the original image
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    const maxDimension = Math.max(imgWidth, imgHeight) * 2; ///Make temp canvas large enough to handle rotations
    tempCanvas.width = maxDimension;
    tempCanvas.height = maxDimension;
    tempCtx.translate(maxDimension / 2, maxDimension / 2); ///Center, scale, and rotate in the temp canvas
    tempCtx.rotate((rotation * Math.PI) / 180); /// Rotate the temp canvas by the rotation amount
    tempCtx.scale(scale, scale);
    tempCtx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight); ///Draw the original image in the temp canvas
    ctx.drawImage(
      tempCanvas, // Source Image Variables to Draw the transformed image on the canvas
      maxDimension / 2 - position.x - CIRCLE_SIZE / 2, // Source image variable to set the horizontal position of the source image
      maxDimension / 2 - position.y - CIRCLE_SIZE / 2, // Set the y(vertical) position of the source image
      CIRCLE_SIZE, // width of the source slice
      CIRCLE_SIZE, // height of the  source slice
      0, /// destination x coordinate
      0, /// destination y coordinate
      OUTPUT_SIZE, // destination width to scale the image to the desired size
      OUTPUT_SIZE /// destination height to scale the image to the desired size
    )

    const base64Image = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    setPreviewUrl(base64Image);
    canvas.toBlob((blob) => {
      croppedBlobRef.current = blob;
    },
      "image/jpeg", JPEG_QUALITY);
    //Upload selected Image to Cloudinary and then store then popluate the value with the url in the database


  }, [])
  const currentTransform = (): Transform => ({ position, scale, rotation });
  const handleSaveCroppedImage = async () => {
    if (!croppedBlobRef.current) return
    setIsUploading(true);
    setError(null);
    try {
      const file = new File([croppedBlobRef.current], "profile.jpg", { type: "image/jpeg" }); ///Create file from the cropped blob
      const url = await uploadFile(file); //Upload file to cloudinary
      if (setValue) {
        setValue("profileImage", url); //Populate the value with the url
        if (typeof trigger === "function") trigger("profileImage") //Trigger the validation
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
    } finally {
      setIsUploading(false)
    }
  }

  const handleMouseUp = (): void => {  /// Handle the mouse up event
    setIsDragging(false); // Set isDragging to false
    if (image) renderPreview(image, currentTransform()); //Render Image
  };


  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!image) return; /// Return if there is no image
    setIsDragging(true); // Set isDragging to true
    startPosRef.current = { // Set startPosRef to the current mouse position
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    // Prevent default to avoid unwanted behaviors
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDragging || !startPosRef.current) return; // Return if isDragging is false or startPosRef is null
    const newX = e.clientX - startPosRef.current.x; // Set newX to the current mouse position
    const newY = e.clientY - startPosRef.current.y; // Set newY to the current mouse position
    setPosition({
      x: newX,
      y: newY,
    });

    // Prevent default to avoid unwanted behaviors
    e.preventDefault();
  };

  // Add touch event handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!image) return;

    setIsDragging(true);
    const touch = e.touches[0];
    startPosRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };

    // Prevent default to avoid page scrolling
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !startPosRef.current) return;

    const touch = e.touches[0];
    const newX = touch.clientX - startPosRef.current.x;
    const newY = touch.clientY - startPosRef.current.y;

    setPosition({
      x: newX,
      y: newY,
    });

    // Prevent default to avoid page scrolling
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (image) renderPreview(image, currentTransform());
    // Prevent default behavior
    e.preventDefault();
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!image) return;

    // Prevent default scrolling behavior
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY * -0.01;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    setScale(newScale);
    renderPreview(image, { position, scale: newScale, rotation });
  };


  const handleRotate = (angle: number): void => {
    const newRotation = rotation + angle;
    setRotation(newRotation);
    if (image) renderPreview(image, { position, scale, rotation: newRotation }); //use updated rotation
  };

  const updatePreview = () => {
    if (!image || !imageRef.current) return;

    // Get container and selection circle dimensions
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const circleSize = 128; // This matches the w-32 class (32 * 4px = 128px)

    // Calculate the center point of the container
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    const canvas = document.createElement("canvas");
    const outputSize = 200; // Size of the output image
    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a circular clipping path
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw background
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, outputSize, outputSize);

    const img = new Image();
    img.src = image;

    const drawCroppedImage = () => {
      // Calculate the transformation for the visible area in the circle
      const imgWidth = img.width;
      const imgHeight = img.height;

      // Create a temporary canvas to apply transformations to the original image
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");

      // Make temp canvas large enough to handle rotations
      const maxDimension = Math.max(imgWidth, imgHeight) * 2;
      tempCanvas.width = maxDimension;
      tempCanvas.height = maxDimension;

      if (!tempCtx) return;
      // Center, scale, and rotate in the temp canvas
      tempCtx.translate(maxDimension / 2, maxDimension / 2);
      tempCtx.rotate((rotation * Math.PI) / 180);
      tempCtx.scale(scale, scale);
      tempCtx.drawImage(
        img,
        -imgWidth / 2,
        -imgHeight / 2,
        imgWidth,
        imgHeight
      );

      // Calculate where the circle is relative to the transformed image
      // The position state represents how much the image has moved from center
      const scaledCircleSize = circleSize;

      // Draw the properly positioned and transformed image to the final canvas
      ctx.drawImage(
        tempCanvas,
        maxDimension / 2 - position.x - scaledCircleSize / 2,
        maxDimension / 2 - position.y - scaledCircleSize / 2,
        scaledCircleSize,
        scaledCircleSize,
        0,
        0,
        outputSize,
        outputSize
      );

      // Set the preview URL
      const base64Image = canvas.toDataURL("image/jpeg", 0.6);
      setPreviewUrl(base64Image);
      if (setValue) {
        setValue("profileImage", base64Image);
        if (typeof trigger === "function") trigger("profileImage"); // Re-validate the field
      }
    };

    if (img.complete) {
      drawCroppedImage();
    } else {
      img.onload = drawCroppedImage;
    }
  };

  useEffect(() => {
    if (image) {
      updatePreview();
    }
  }, [image]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseLeave = (): void => {
      if (isDragging) {
        setIsDragging(false);
        if (image) renderPreview(image, currentTransform())
      }
    };

    // Prevent default touch behavior to stop page scrolling
    const preventDefaultTouch = (e: TouchEvent) => {
      e.preventDefault();
    };
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };

    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("touchmove", preventDefaultTouch, {
      passive: false,
    });
    // Prevent scrolling when mouse is over the container
    container.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("touchmove", preventDefaultTouch);
      container.removeEventListener("wheel", preventScroll);
    };
  }, [isDragging]);

  return (
    <div className={cn("flex flex-col gap-4 items-center justify-start", className)}>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={inputRef}
        className="hidden"
      />
      <button
        type="button"
        className="px-4 py-2 text-sm bg-blue-500 shadow-[0px_1px_4px_0px_rgba(255,255,255,0.1)_inset,0px_-1px_2px_0px_rgba(255,255,255,0.1)_inset] text-white rounded-md hover:bg-blue-600 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        Upload Profile Picture
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {image && (
        <div className="w-full max-w-md mt-4">
          <h3 className="text-lg font-medium mb-2">Edit Your Image:</h3>
          <div className="flex gap-2 mb-4">
            <button
              className="px-3 py-0 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm"
              onClick={() => {
                const newScale = Math.min(MAX_SCALE, scale + 0.1);
                setScale(newScale)
                renderPreview(image, { position, scale: newScale, rotation });
              }
              }
            >
              Zoom In
            </button>
            <button
              className="px-23 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm"
              onClick={() => {
                const newScale = Math.min(MAX_SCALE, scale - 0.1);
                setScale(newScale)
                renderPreview(image, { position, scale: newScale, rotation });
              }}
            >
              Zoom Out
            </button>
            <button
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm"
              onClick={() => handleRotate(-90)}
            >
              Rotate Left
            </button>
            <button
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm"
              onClick={() => handleRotate(90)}
            >
              Rotate Right
            </button>
          </div>

          <div
            ref={containerRef}
            className="relative overflow-hidden w-full h-64 bg-gray-100 rounded-md cursor-move border-2 border-gray-300"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: "center",
              }}
            >
              <img
                ref={imageRef}
                src={image}
                alt="Upload"
                className="max-w-full max-h-full"
              />
            </div>

            {/* Circular overlay to show crop area */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 rounded-full border-2 border-white shadow-inner bg-transparent opacity-80"></div>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium mb-2">Preview:</h3>
          <img
            src={previewUrl}
            alt="Cropped Preview"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 mx-auto"
          />
          <button
            type="button"
            onClick={handleSaveCroppedImage}
            disabled={isUploading}
            className="mt-3 px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
