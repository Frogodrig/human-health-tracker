import React from "react";

export default function ProductImageSkeleton() {
  return (
    <div
      className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 animate-pulse"
      style={{ width: 100, height: 133, maxWidth: 133, maxHeight: 133 }}
    >
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-skeleton" />
    </div>
  );
}

// Add the following to your global CSS (e.g., globals.css):
// @keyframes skeleton {
//   0% { background-position: -200px 0; }
//   100% { background-position: calc(200px + 100%) 0; }
// }
// .animate-skeleton {
//   background-size: 200% 100%;
//   animation: skeleton 1.5s infinite linear;
// }
