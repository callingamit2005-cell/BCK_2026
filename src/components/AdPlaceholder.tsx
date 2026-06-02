const AdPlaceholder = ({ className = "" }: { className?: string }) => (
  <div className={`my-8 w-full border-2 border-dashed border-border rounded-2xl p-6 flex items-center justify-center bg-background ${className}`}>
    <div className="text-center">
      <span className="text-xs font-bold tracking-wider text-text-muted uppercase block mb-2">Sponsorship</span>
      <p className="text-sm text-foreground font-black">Reserved Premium Space</p>
    </div>
  </div>
);

export default AdPlaceholder;
