import React from "react";
import { StatusState } from "./StatusState";

const FullScreenLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <StatusState 
      type="loading" 
      variant="fullscreen"
      title="Initializing BachatKaro"
      message="Securing your financial data terminal..."
    />
  </div>
);

export default FullScreenLoader;
