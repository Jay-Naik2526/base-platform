import React from 'react';

// This component shows a friendly message when there's no data
const EmptyState = ({ message }) => (
  <div className="text-center py-10 px-4 bg-slate-800 rounded-lg">
    <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
    </svg>
    <h3 className="mt-2 text-sm font-medium text-white">No Data Yet</h3>
    <p className="mt-1 text-sm text-gray-400">{message}</p>
  </div>
);

export default EmptyState;
