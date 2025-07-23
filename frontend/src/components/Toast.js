import React from 'react';

// This component will display pop-up notifications
function Toast({ message, type, onClose }) {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed bottom-5 right-5 ${bgColor} text-white py-2 px-4 rounded-lg shadow-lg flex items-center animate-fade-in-up`}>
      <p>{message}</p>
      <button onClick={onClose} className="ml-4 text-xl font-semibold">&times;</button>
    </div>
  );
}

// Add this animation to your `frontend/src/index.css` file
/*
@keyframes fade-in-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
}
*/

export default Toast;
