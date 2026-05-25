const AdPlaceholder = ({ className = "" }: { className?: string }) => (
  <div className={`my-8 w-full border-2 border-dashed border-purple-500/30 rounded-xl p-8 flex items-center justify-center bg-purple-500/5 ${className}`}>
    <div className="text-center">
      <span className="text-xs font-bold tracking-widest text-purple-400 uppercase block mb-2">Advertisement</span>
      <p className="text-sm text-slate-500 font-medium">Google AdSense Space</p>
    </div>
  </div>
);

export default AdPlaceholder;