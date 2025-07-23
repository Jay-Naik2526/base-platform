import React from 'react';

// This component shows a loading animation
const SkeletonLoader = () => (
  <div className="space-y-4">
    <div className="bg-slate-700 h-8 w-3/4 rounded-md animate-pulse"></div>
    <div className="bg-slate-700 h-8 w-full rounded-md animate-pulse"></div>
    <div className="bg-slate-700 h-8 w-5/6 rounded-md animate-pulse"></div>
  </div>
);

export default SkeletonLoader;
