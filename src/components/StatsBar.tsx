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
    <section className="py-20 relative">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tighter">
                {s.value}
              </div>
              <div className="text-xs md:text-sm font-bold text-pink-500/80 uppercase tracking-widest">
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
