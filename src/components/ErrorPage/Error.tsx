// components/ErrorPage.jsx
import React from 'react';

const ErrorPage = ({ error }: any) => {
  const message =
    typeof error === 'string'
      ? error
      : error?.message || 'An unexpected error occurred.';

  return (
    <div className="w-full h-full flex items-center justify-center px-4 py-10 text-center mt-20">
      <div className="max-w-xl">
        <p className="text-7xl md:text-8xl font-bold tracking-wider text-gray-300">500</p>
        <p className="text-4xl md:text-5xl font-bold tracking-wider text-gray-300 mt-2">Server Error</p>
        <p className="text-lg md:text-xl text-gray-500 my-6">
            Oops! Something broke. The dev team is already working on the fix.
        </p>
        <p className="text-sm md:text-base text-red-500 break-words">
          {message}
        </p>
      </div>
    </div>
  );
};

export default ErrorPage;
