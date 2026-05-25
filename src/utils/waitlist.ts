export const getWaitlistCount = () => {
  const count = localStorage.getItem("waitlist_count");
  return count ? parseInt(count, 10) : 1000;
};

export const incrementWaitlistCount = () => {
  const current = getWaitlistCount();
  localStorage.setItem("waitlist_count", String(current + 1));
};
