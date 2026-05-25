// src/data/DestinationsData.ts
// India's Top 50 Trending Destinations (2026 Data)
// Purpose: Dynamic UI Theme & Information for Trip Advisor

export interface Destination {
  id: string;
  name: string;
  state: string;
  theme: 'SNOW' | 'PINK' | 'GREEN' | 'GOLD' | 'OCEAN' | 'SPIRITUAL' | 'DESERT';
  gradient: string; // Tailwind Classes for Glow & Background
  tags: string[];
  description: string;
}

export const TOP_50_INDIA_DESTINATIONS: Destination[] = [
  // --- NORTH INDIA (SNOW & HERITAGE) ---
  { id: "1", name: "Manali", state: "HP", theme: "SNOW", gradient: "from-blue-100 to-blue-400 border-blue-200 shadow-[0_0_20px_rgba(191,219,254,0.5)]", tags: ["Adventure", "Snow"], description: "Gateway to Solang Valley and Rohtang Pass." },
  { id: "2", name: "Jaipur", state: "RJ", theme: "PINK", gradient: "from-pink-400 to-orange-300 border-pink-300 shadow-[0_0_20px_rgba(244,114,182,0.5)]", tags: ["Heritage", "Forts"], description: "The Royal Pink City of India." },
  { id: "3", name: "Ayodhya", state: "UP", theme: "SPIRITUAL", gradient: "from-orange-400 to-yellow-500 border-orange-300 shadow-[0_0_20px_rgba(251,146,60,0.6)]", tags: ["Spiritual", "Ram Mandir"], description: "The birthplace of Lord Rama." },
  { id: "4", name: "Leh Ladakh", state: "JK", theme: "SNOW", gradient: "from-cyan-100 to-slate-300 border-cyan-200 shadow-[0_0_20px_rgba(207,250,254,0.5)]", tags: ["Biking", "Lakes"], description: "Land of High Passes and mystical landscapes." },
  { id: "5", name: "Varanasi", state: "UP", theme: "SPIRITUAL", gradient: "from-yellow-400 to-orange-600 border-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.5)]", tags: ["Ghats", "Culture"], description: "World's oldest living city." },
  { id: "6", name: "Rishikesh", state: "UK", theme: "GREEN", gradient: "from-green-300 to-emerald-500 border-green-200 shadow-[0_0_20px_rgba(110,231,183,0.5)]", tags: ["Yoga", "Rafting"], description: "The Yoga Capital of the World." },
  { id: "7", name: "Gulmarg", state: "JK", theme: "SNOW", gradient: "from-slate-100 to-blue-200 border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]", tags: ["Skiing", "Gondola"], description: "India's premier ski resort." },
  { id: "8", name: "Udaipur", state: "RJ", theme: "PINK", gradient: "from-pink-200 to-purple-300 border-pink-200 shadow-[0_0_20px_rgba(249,168,212,0.4)]", tags: ["Lakes", "Palaces"], description: "The City of Lakes and Romance." },
  { id: "9", name: "Auli", state: "UK", theme: "SNOW", gradient: "from-blue-50 to-indigo-200 border-blue-100 shadow-[0_0_20px_rgba(224,231,255,0.4)]", tags: ["Snow", "Views"], description: "Stunning ski slopes and Himalayan views." },
  { id: "10", name: "Shimla", state: "HP", theme: "SNOW", gradient: "from-blue-200 to-slate-400 border-blue-300 shadow-[0_0_20px_rgba(147,197,253,0.4)]", tags: ["British Era", "Hills"], description: "The Queen of Hills." },

  // --- SOUTH INDIA (GREEN & OCEAN) ---
  { id: "11", name: "Munnar", state: "KL", theme: "GREEN", gradient: "from-green-400 to-emerald-700 border-green-500 shadow-[0_0_20px_rgba(52,211,153,0.5)]", tags: ["Tea Gardens", "Nature"], description: "Rolling hills and endless tea estates." },
  { id: "12", name: "Goa", state: "GA", theme: "OCEAN", gradient: "from-blue-400 to-cyan-400 border-blue-300 shadow-[0_0_20px_rgba(34,211,238,0.5)]", tags: ["Beaches", "Nightlife"], description: "India's favorite beach destination." },
  { id: "13", name: "Coorg", state: "KA", theme: "GREEN", gradient: "from-emerald-400 to-green-600 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]", tags: ["Coffee", "Mist"], description: "The Scotland of India." },
  { id: "14", name: "Ooty", state: "TN", theme: "GREEN", gradient: "from-green-200 to-teal-500 border-green-300 shadow-[0_0_20px_rgba(110,231,183,0.4)]", tags: ["Nilgiris", "Gardens"], description: "Blue Mountains and scenic beauty." },
  { id: "15", name: "Alleppey", state: "KL", theme: "OCEAN", gradient: "from-cyan-300 to-blue-500 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]", tags: ["Backwaters", "Houseboat"], description: "The Venice of the East." },
  { id: "16", name: "Wayanad", state: "KL", theme: "GREEN", gradient: "from-lime-400 to-green-700 border-lime-500 shadow-[0_0_20px_rgba(163,230,53,0.4)]", tags: ["Wildlife", "Caves"], description: "Spices and lush green forests." },
  { id: "17", name: "Hampi", state: "KA", theme: "GOLD", gradient: "from-orange-200 to-yellow-600 border-orange-300 shadow-[0_0_20px_rgba(253,186,116,0.5)]", tags: ["Ruins", "History"], description: "UNESCO World Heritage site." },
  { id: "18", name: "Pondicherry", state: "PY", theme: "OCEAN", gradient: "from-blue-100 to-yellow-100 border-blue-200 shadow-[0_0_20px_rgba(191,219,254,0.4)]", tags: ["French", "Beaches"], description: "A French colony in India." },
  { id: "19", name: "Varkala", state: "KL", theme: "OCEAN", gradient: "from-orange-300 to-blue-400 border-orange-200 shadow-[0_0_20px_rgba(253,186,116,0.4)]", tags: ["Cliff", "Beach"], description: "Beautiful cliffs overlooking the Arabian Sea." },
  { id: "20", name: "Kodaikanal", state: "TN", theme: "GREEN", gradient: "from-green-500 to-blue-600 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]", tags: ["Lake", "Forest"], description: "The Gift of the Forest." },

  // --- WEST & CENTRAL INDIA (DESERT & CULTURE) ---
  { id: "21", name: "Rann of Kutch", state: "GJ", theme: "DESERT", gradient: "from-slate-50 to-blue-50 border-white shadow-[0_0_20px_rgba(255,255,255,0.7)]", tags: ["White Desert", "Culture"], description: "Breathtaking white salt desert." },
  { id: "22", name: "Jaisalmer", state: "RJ", theme: "GOLD", gradient: "from-yellow-400 to-orange-400 border-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.5)]", tags: ["Sand Dunes", "Safari"], description: "The Golden City." },
  { id: "23", name: "Lonavala", state: "MH", theme: "GREEN", gradient: "from-green-300 to-emerald-400 border-green-200 shadow-[0_0_20px_rgba(167,243,208,0.5)]", tags: ["Weekend", "Monsoon"], description: "Sahyadri's monsoon paradise." },
  { id: "24", name: "Mahabaleshwar", state: "MH", theme: "GREEN", gradient: "from-emerald-400 to-red-400 border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.4)]", tags: ["Strawberries", "Hills"], description: "Plateau city of strawberries." },
  { id: "25", name: "Statue of Unity", state: "GJ", theme: "GOLD", gradient: "from-cyan-400 to-orange-400 border-white shadow-[0_0_20px_rgba(251,146,60,0.4)]", tags: ["Monuments", "Views"], description: "World's tallest statue." },
  { id: "26", name: "Khajuraho", state: "MP", theme: "GOLD", gradient: "from-orange-300 to-amber-600 border-orange-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]", tags: ["Temples", "Sculptures"], description: "Intricate temple carvings." },
  { id: "27", name: "Panchmarhi", state: "MP", theme: "GREEN", gradient: "from-green-400 to-teal-600 border-green-300 shadow-[0_0_20px_rgba(74,222,128,0.4)]", tags: ["Caves", "Waterfalls"], description: "The Queen of Satpura." },
  { id: "28", name: "Daman & Diu", state: "DD", theme: "OCEAN", gradient: "from-blue-200 to-cyan-300 border-blue-100 shadow-[0_0_20px_rgba(186,230,253,0.4)]", tags: ["Forts", "Beaches"], description: "Coastal charm and history." },
  { id: "29", name: "Mount Abu", state: "RJ", theme: "GREEN", gradient: "from-green-200 to-blue-200 border-green-100 shadow-[0_0_20px_rgba(187,247,208,0.4)]", tags: ["Hill Station", "Temples"], description: "Only hill station in Rajasthan." },
  { id: "30", name: "Gwalior", state: "MP", theme: "GOLD", gradient: "from-amber-200 to-orange-400 border-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.4)]", tags: ["Fort", "History"], description: "Pearl amongst fortresses in India." },

  // --- EAST & NORTH EAST (ADVENTURE & NATURE) ---
  { id: "31", name: "Sikkim", state: "SK", theme: "SNOW", gradient: "from-sky-100 to-blue-300 border-sky-200 shadow-[0_0_20px_rgba(125,211,252,0.5)]", tags: ["Monasteries", "Trekking"], description: "Spiritual and high altitude peace." },
  { id: "32", name: "Darjeeling", state: "WB", theme: "GREEN", gradient: "from-emerald-300 to-green-500 border-emerald-200 shadow-[0_0_20px_rgba(110,231,183,0.4)]", tags: ["Tea", "Toy Train"], description: "World-famous tea gardens." },
  { id: "33", name: "Shillong", state: "ML", theme: "GREEN", gradient: "from-teal-300 to-green-500 border-teal-200 shadow-[0_0_20px_rgba(94,234,212,0.4)]", tags: ["Music", "Rain"], description: "The Scotland of the East." },
  { id: "34", name: "Cherrapunji", state: "ML", theme: "GREEN", gradient: "from-blue-400 to-green-600 border-blue-300 shadow-[0_0_20px_rgba(34,211,238,0.4)]", tags: ["Rain", "Bridges"], description: "Living root bridges and rain." },
  { id: "35", name: "Kaziranga", state: "AS", theme: "GREEN", gradient: "from-green-600 to-yellow-600 border-green-500 shadow-[0_0_20px_rgba(22,163,74,0.4)]", tags: ["Rhinos", "Safari"], description: "Home of the one-horned rhino." },
  { id: "36", name: "Tawang", state: "AR", theme: "SNOW", gradient: "from-blue-50 to-slate-200 border-white shadow-[0_0_20px_rgba(226,232,240,0.4)]", tags: ["Buddhism", "Snow"], description: "Largest monastery in India." },
  { id: "37", name: "Puri", state: "OR", theme: "SPIRITUAL", gradient: "from-orange-300 to-blue-300 border-orange-200 shadow-[0_0_20px_rgba(253,186,116,0.5)]", tags: ["Temple", "Beach"], description: "Jagannath Dham and sea waves." },
  { id: "38", name: "Majuli", state: "AS", theme: "GREEN", gradient: "from-green-100 to-cyan-200 border-green-200 shadow-[0_0_20px_rgba(207,250,254,0.4)]", tags: ["River Island", "Art"], description: "Largest river island in the world." },
  { id: "39", name: "Ziro Valley", state: "AR", theme: "GREEN", gradient: "from-green-200 to-emerald-400 border-green-300 shadow-[0_0_20px_rgba(187,247,208,0.4)]", tags: ["Music Festival", "Paddy Fields"], description: "UNESCO World Heritage site for its beauty." },
  { id: "40", name: "Konark", state: "OR", theme: "GOLD", gradient: "from-yellow-200 to-orange-500 border-yellow-300 shadow-[0_0_20px_rgba(254,240,138,0.4)]", tags: ["Sun Temple", "History"], description: "The Black Pagoda." },

  // --- ISLANDS & OFFBEAT ---
  { id: "41", name: "Andaman", state: "AN", theme: "OCEAN", gradient: "from-blue-500 to-teal-400 border-blue-400 shadow-[0_0_20px_rgba(14,165,233,0.5)]", tags: ["Scuba", "Islands"], description: "Crystal clear waters and coral reefs." },
  { id: "42", name: "Lakshadweep", state: "LD", theme: "OCEAN", gradient: "from-cyan-200 to-blue-400 border-cyan-300 shadow-[0_0_20px_rgba(165,243,252,0.5)]", tags: ["Coral", "Peace"], description: "Exotic and secluded islands." },
  { id: "43", name: "Lakshmeshwar", state: "KA", theme: "SPIRITUAL", gradient: "from-yellow-100 to-orange-200 border-yellow-200 shadow-[0_0_20px_rgba(254,249,195,0.4)]", tags: ["Temples", "Art"], description: "Historical temple town." },
  { id: "44", name: "Chikmagalur", state: "KA", theme: "GREEN", gradient: "from-green-600 to-emerald-800 border-green-700 shadow-[0_0_20px_rgba(5,150,105,0.4)]", tags: ["Coffee", "Trekking"], description: "The coffee capital of Karnataka." },
  { id: "45", name: "Dharamshala", state: "HP", theme: "GREEN", gradient: "from-blue-100 to-green-200 border-blue-200 shadow-[0_0_20px_rgba(219,234,254,0.4)]", tags: ["Dalai Lama", "Tibetan"], description: "Residence of the Dalai Lama." },
  { id: "46", name: "Agra", state: "UP", theme: "GOLD", gradient: "from-slate-200 to-yellow-100 border-white shadow-[0_0_20px_rgba(248,250,252,0.5)]", tags: ["Taj Mahal", "History"], description: "Home to the Seven Wonders." },
  { id: "47", name: "Srinagar", state: "JK", theme: "OCEAN", gradient: "from-blue-100 to-cyan-200 border-blue-200 shadow-[0_0_20px_rgba(224,242,254,0.4)]", tags: ["Dal Lake", "Shikara"], description: "Summer capital of J&K." },
  { id: "48", name: "Kanyakumari", state: "TN", theme: "OCEAN", gradient: "from-blue-300 to-orange-200 border-white shadow-[0_0_20px_rgba(147,197,253,0.4)]", tags: ["Sunset", "Ocean"], description: "The southernmost tip of India." },
  { id: "49", name: "Madurai", state: "TN", theme: "GOLD", gradient: "from-orange-400 to-red-400 border-orange-300 shadow-[0_0_20px_rgba(251,146,60,0.4)]", tags: ["Temples", "Food"], description: "The Athens of the East." },
  { id: "50", name: "Khajjiar", state: "HP", theme: "GREEN", gradient: "from-green-200 to-blue-100 border-green-300 shadow-[0_0_20px_rgba(187,247,208,0.4)]", tags: ["Mini Switzerland", "Meadows"], description: "A picturesque saucer-shaped meadow." }
];