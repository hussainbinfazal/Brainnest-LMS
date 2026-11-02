export default function Loading() {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid border-r-transparent"></div>
        <p className="mt-4 text-lg text-gray-600">Loading...</p>
      </div>
    );
  }