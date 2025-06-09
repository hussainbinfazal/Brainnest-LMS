"use client";
import React from "react";
import { AiFillStar, AiOutlineStar, AiTwotoneStar } from "react-icons/ai";
import { Badge } from "@/components/ui/badge"; // make sure path is correct

const getStarArray = (rating, maxStars = 5) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0);

  const stars = [];

  for (let i = 0; i < fullStars; i++) stars.push("full");
  if (hasHalfStar) stars.push("half");
  for (let i = 0; i < emptyStars; i++) stars.push("empty");

  return stars;
};

const StarRating = ({ rating, maxStars = 5 }) => {
  const stars = getStarArray(rating, maxStars);

  return (
    <Badge className="flex gap-1 items-center px-1 lg:px-2 py-1 text-sm !bg-transparent">
      {stars.map((type, index) => {
        if (type === "full")
          return <AiFillStar key={index} className="text-yellow-400 !text-sm" />;
        if (type === "half")
          return <AiTwotoneStar key={index} className="text-yellow-400 !text-sm" />;
        return <AiOutlineStar key={index} className="text-yellow-400 !text-sm" />;
      })}
      <span className="text-sm ml-1 text-white">({rating})</span>
    </Badge>
  );
};

export default StarRating;


