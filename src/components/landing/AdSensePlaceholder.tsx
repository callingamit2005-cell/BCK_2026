const AdSensePlaceholder = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`border-2 border-dashed border-border rounded-xl bg-gradient-emerald-soft flex items-center justify-center py-10 px-6 ${className}`}
    >
      <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        Google AdSense Advertisement
      </p>
    </div>
  );
};

export default AdSensePlaceholder;
