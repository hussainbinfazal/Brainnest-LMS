

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers'; 

export const generateToken =(userId, userRole) => {
  try {
    // console.log("Received userId:", userId);
    const token = jwt.sign(
      { id: userId, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  
    

    // Set token cookie using Next.js cookies API
    // cookies().set({
    //   name: 'token',
    //   value: token,
    //   httpOnly: true,
    //   sameSite: 'strict',
    // //   secure: process.env.NODE_ENV === 'production',
    //   maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    //   path: '/',
    // });
  
    return token;
  } catch (error) {
    return null;
  }
  };