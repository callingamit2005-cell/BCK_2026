import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { Capacitor } from "@capacitor/core"; // 🚀 Added for platform detection

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const isNative = Capacitor.isNativePlatform();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group pointer-events-none" // 🛡️ FIXED: Add pointer-events-none to container
      position={isNative ? "bottom-center" : "bottom-right"} // 🚀 FIXED: Mobile Bottom-Center
      style={{
        paddingBottom: isNative ? 'calc(100px + var(--safe-area-bottom))' : '1rem', // 🛡️ BottomNav Clearance
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast pointer-events-auto group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:w-[min(90vw,360px)] group-[.toaster]:min-h-[60px]", // 🛡️ FIXED: Add pointer-events-auto to toast item
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[11px]",
          title: "group-[.toast]:text-[13px] group-[.toast]:font-bold",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
