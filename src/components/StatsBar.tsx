import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const StatsBar = () => {
  const [waitlistCount, setWaitlistCount] = useState<string>("1000+");

  useEffect(() => {
    const fetchWaitlistCount = async () => {
      const { data, error } = await supabase
        .from("stats")
        .select("waitlist_count")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data) {
        setWaitlistCount(`${data.waitlist_count}+`);
      }
    };

    fetchWaitlistCount();

    // PERIODIC POLLING (Replaces Real-time Sync for Scalability)
    const interval = setInterval(fetchWaitlistCount, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const stats = [
    { label: "Waitlist Joined", value: waitlistCount },
    { label: "Savings Tracked", value: "1 L +" },
    { label: "Beta Feedback", value: "100+" },
    { label: "App Status", value: "Early Access" }
  ];

  return (
    <section className="py-24 relative antialiased">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center group">
              <div className="text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tighter tabular-nums transition-transform group-hover:scale-105 duration-500">
                {s.value}
              </div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider group-hover:text-foreground transition-colors">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
