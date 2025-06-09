"use client"

import { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { toast } from 'sonner'; // or use `alert` if you prefer

const CourseRating = ({ courseId, userRating = 0 }) => {
  const [rating, setRating] = useState(userRating);
  const [hover, setHover] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return toast.error("Please select a rating");
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Rating failed');

      toast.success("Thanks for your review!");
    } catch (error) {
      console.error("Rating error:", error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 mt-3">
      <div className="flex">
        {[...Array(5)].map((_, index) => {
          const currentRating = index + 1;
          return (
            <label key={index}>
              <input
                type="radio"
                name="rating"
                value={currentRating}
                onClick={() => setRating(currentRating)}
                className="hidden"
              />
              <FaStar
                size={24}
                className={`cursor-pointer transition-colors ${
                  currentRating <= (hover || rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
                onMouseEnter={() => setHover(currentRating)}
                onMouseLeave={() => setHover(null)}
              />
            </label>
          );
        })}
      </div>
      <button
        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
};

export default CourseRating;