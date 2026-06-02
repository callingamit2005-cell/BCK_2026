// Destination to gradient mapping
const gradientMap: Record<string, string> = {
  jaipur: 'from-rose-400 via-pink-500 to-rose-600',
  udaipur: 'from-blue-400 via-cyan-500 to-indigo-600',
  goa: 'from-orange-400 via-amber-500 to-red-500',
  kerala: 'from-green-400 via-teal-500 to-emerald-600',
  delhi: 'from-yellow-500 via-orange-500 to-red-600',
  mumbai: 'from-purple-500 via-pink-500 to-red-500',
  agra: 'from-amber-600 via-yellow-500 to-orange-500',
  // fallback
  default: 'from-purple-600 via-pink-500 to-indigo-600',
};

export const getDestinationGradient = (destination: string): string => {
  if (!destination) return gradientMap.default;
  const key = destination.toLowerCase().trim();
  for (const [pattern, gradient] of Object.entries(gradientMap)) {
    if (key.includes(pattern)) return gradient;
  }
  return gradientMap.default;
};
