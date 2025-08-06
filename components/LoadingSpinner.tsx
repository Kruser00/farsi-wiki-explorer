import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="w-16 h-16 border-8 border-purple-400 border-solid rounded-full animate-spin border-t-transparent"></div>
    <p className="text-lg text-gray-200">...در حال دریافت اطلاعات</p>
  </div>
);

export default LoadingSpinner;