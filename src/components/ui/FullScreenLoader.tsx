import React from "react";

const FullScreenLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
    <div className="w-12 h-12 rounded-full border-4 border-purple-100 border-t-[#7C3AED] animate-spin"></div>
    <p className="text-sm font-medium text-text-muted animate-pulse">Loading BachatKaro...</p>
  </div>
);

export default FullScreenLoader;
