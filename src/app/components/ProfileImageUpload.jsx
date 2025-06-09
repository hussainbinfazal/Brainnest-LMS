
import React, { useState, useRef, useEffect } from "react";

const ProfileImageUpload = ({ setValue, trigger }) => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [rotating, setRotating] = useState(false);
  const [rotation, setRotation] = useState(0);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const startPosRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        // Reset editing parameters
        setPosition({ x: 0, y: 0 });
        setScale(1);
        setRotation(0);
        updatePreview();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseUp = () => {
  setIsDragging(false);
  updatePreview();
};
  const handleMouseDown = (e) => {
    if (!image) return;

    setIsDragging(true);
    startPosRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };

    // Prevent default to avoid unwanted behaviors
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !startPosRef.current) return;

    const newX = e.clientX - startPosRef.current.x;
    const newY = e.clientY - startPosRef.current.y;

    setPosition({
      x: newX,
      y: newY,
    });

    // Prevent default to avoid unwanted behaviors
    e.preventDefault();
  };

  // Add touch event handlers
  const handleTouchStart = (e) => {
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

  const handleTouchMove = (e) => {
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

  const handleTouchEnd = (e) => {
    setIsDragging(false);
    updatePreview();

    // Prevent default behavior
    e.preventDefault();
  };

  const handleWheel = (e) => {
    if (!image) return;

    // Prevent default scrolling behavior
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY * -0.01;
    const newScale = Math.max(0.1, Math.min(3, scale + delta));
    setScale(newScale);
    updatePreview();
  };

  const handleRotate = (angle) => {
    setRotation((prevRotation) => {
      const newRotation = prevRotation + angle;
      updatePreview();
      return newRotation;
    });
  };

  const updatePreview = () => {
    if (!image || !imageRef.current) return;

    // Get container and selection circle dimensions
    const container = containerRef.current;
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

    const handleMouseLeave = () => {
      if (isDragging) {
        setIsDragging(false);
        updatePreview();
      }
    };

    // Prevent default touch behavior to stop page scrolling
    const preventDefaultTouch = (e) => {
      e.preventDefault();
    };

    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("touchmove", preventDefaultTouch, {
      passive: false,
    });

    // Prevent scrolling when mouse is over the container
    const preventScroll = (e) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("touchmove", preventDefaultTouch);
      container.removeEventListener("wheel", preventScroll);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col gap-4 items-center justify-start">
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

      {image && (
        <div className="w-full max-w-md mt-4">
          <h3 className="text-lg font-medium mb-2">Edit Your Image:</h3>
          <div className="flex gap-2 mb-4">
            <button
              className="px-3 py-0 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm"
              onClick={() => setScale(scale + 0.1)}
            >
              Zoom In
            </button>
            <button
              className="px-23 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-sm"
              onClick={() => setScale(Math.max(0.1, scale - 0.1))}
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
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload;
