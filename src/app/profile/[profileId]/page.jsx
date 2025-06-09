"use client"


import { useParams } from 'next/navigation'
import React from 'react'
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

const page = () => {

 
  const {profileId} = useParams();
  // console.log(profileId);

  return (
    <div classNme='w-full min-h-screen bg-gray-50 py-12 pt-0'>
      <h2>This is the id that was passed in the params {profileId}</h2>
    </div>
  )
}

export default page
