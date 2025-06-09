'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useUser, useClerk } from '@clerk/nextjs';
import { useAuthStore } from '@/lib/store/useAuthStore';

const useAuthRedirect = ({
  redirectIfAuthenticated = false,
  redirectIfUnauthenticated = false,
  redirectIfNotInstructor = false,
  interval = 3000,
} = {}) => {
  console.log('HOOK MOUNTED - useAuthRedirect initialized')
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [authChecked, setAuthChecked] = useState(false);
  const authUser = useAuthStore((state) => state.authUser);
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading)
  const hasInitialized = useAuthStore((state) => state.hasInitialized);
  const isInstructor = authUser?.role === 'instructor';

  console.log("useAuthRedirect hook initialized with options:", {
    redirectIfAuthenticated,
    redirectIfUnauthenticated,
    redirectIfNotInstructor,
    interval,
    isLoaded,
    isSignedIn,
    isAuthLoading,
    authUser: authUser ? 'EXISTS' : 'NULL',
    authUserRole: authUser?.role || 'NO_ROLE',
    isInstructor,
    


  });
  useEffect(() => {
    if (!isLoaded ) { // removed isAuthLoading from the store in debugging 
      console.log("Waiting for auth to load", { isLoaded, isAuthLoading });
      return;
    }

    const checkAuth = () => {
      const token = Cookies.get('token');
      const isAuthenticated = !!token  || !!authUser;

      console.log("Auth Check: ", {
        token,
        isSignedIn,
        authUser,
        isInstructor,
        isAuthenticated,
        hasInitialized,
      });
      if (!hasInitialized && redirectIfUnauthenticated && !isAuthenticated) {
        console.log("Redirecting unauthenticated user to login");
        router.replace('/login');
        return false; // Return false to indicate redirect happened
      }
      if (!hasInitialized && redirectIfNotInstructor && isAuthenticated && !isInstructor) {
        // Wait for authUser to be loaded before checking instructor role


        // Now we can safely check if user is instructor

        console.log("User is not an instructor, redirecting back");
        router.replace('/');
        return;

      }
      if (hasInitialized && redirectIfAuthenticated && authUser) {
        console.log("This is the isAuthenticated state ::",isAuthenticated)
        console.log("Redirecting authenticated user to homepage::");
        router.replace('/');
        return;
      }



      setAuthChecked(true);
    };

    checkAuth();

    const intervalId = setInterval(checkAuth, interval);
    return () => clearInterval(intervalId);
  }, [
    isLoaded,
    isSignedIn,
    authUser,
    isInstructor,
    redirectIfAuthenticated,
    redirectIfUnauthenticated,
    redirectIfNotInstructor,
    interval,
    router,
  ]);

  return authChecked;
};

export default useAuthRedirect;
