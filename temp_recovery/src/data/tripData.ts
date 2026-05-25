// src/data/tripData.ts
export const dummyDestinations: Record<string, any> = {
  jaipur: {
    places: ['Amer Fort', 'City Palace', 'Hawa Mahal', 'Jantar Mantar'],
    hotels: ['Hotel Pearl Palace', 'Umaid Bhawan', 'Zostel Jaipur'],
    food: 'Dal Baati Churma, Gatte ki Sabzi, Laal Maas',
    travelAdvice: 'Auto-rickshaws are best for short distances. Uber/Ola available.',
    budgetBreakdown: 'Accommodation: ₹2000-3000, Food: ₹800-1000, Sightseeing: ₹500-1000',
    smartAdvice: {
      hi: '₹10,000 budget per person mein Jaipur comfortably ghooma ja sakta hai 2-3 din mein. Heritage hotels ki jagah heritage stays choose karein, experience bhi milega aur paisa bhi bachega.',
      en: 'With ₹10,000 per person, you can comfortably explore Jaipur in 2-3 days. Opt for heritage stays instead of luxury hotels to save money and get a cultural experience.',
    },
  },
  udaipur: {
    places: ['City Palace', 'Lake Pichola', 'Jag Mandir', 'Sahelion-ki-Bari'],
    hotels: ['Jagat Niwas', 'Mewar Inn', 'Zostel Udaipur'],
    food: 'Dal Baati, Gatte, Laal Maas, Mawa Kachori',
    travelAdvice: 'Walk around the old city, rent a bike for lakeside drives.',
    budgetBreakdown: 'Accommodation: ₹2500-3500, Food: ₹1000, Boat ride: ₹400',
    smartAdvice: {
      hi: 'Udaipur mein lakeside hotels thode mehange hain, par aap thoda andar ki taraf rahein toh sasta aur accha mil jayega. Paise bachane ke liye local food joints try karein.',
      en: 'In Udaipur, lakeside hotels can be expensive; staying a bit inland gives you better value. Save money by eating at local joints.',
    },
  },
  goa: {
    places: ['Baga Beach', 'Calangute', 'Fort Aguada', 'Dudhsagar Falls'],
    hotels: ['The Baga Beach Hostel', 'Casa Britona', 'Zostel Goa'],
    food: 'Fish Curry, Prawn Balchão, Bebinca, Feni',
    travelAdvice: 'Rent a scooty for easy travel between beaches.',
    budgetBreakdown: 'Scooty rent: ₹400/day, Accommodation: ₹1500-2500, Food: ₹1000',
    smartAdvice: {
      hi: 'Goa mein beach huts zyada mehange hain, thoda andar hostels lein toh paisa bachega aur maza bhi aayega. Local eateries mein khana sasta aur tasty.',
      en: 'Beach huts in Goa can be pricey; hostels slightly inland offer great value. Eat at local shacks for authentic, cheap food.',
    },
  },
  kerala: {
    places: ['Alleppey Backwaters', 'Munnar', 'Kochi', 'Varkala'],
    hotels: ['Zostel Kochi', 'The Munnar Tea Country', 'Lake Palace Alleppey'],
    food: 'Appam with Stew, Fish Moilee, Puttu, Kerala Sadya',
    travelAdvice: 'Houseboat is a must, but share to save cost.',
    budgetBreakdown: 'Houseboat: ₹3000-5000 (shared), Accommodation: ₹1500-2500, Food: ₹800',
    smartAdvice: {
      hi: 'Kerala mein houseboat private lena expensive ho sakta hai, sharing basis lein toh same experience saste mein milega. Local toddy shops mein authentic food try karein.',
      en: 'Private houseboats in Kerala can be expensive; shared ones give the same experience for less. Try local toddy shops for authentic food.',
    },
  },
};

export const generalPlan = {
  places: ['Local market', 'Temple/Monument', 'Nearby hill station', 'City park'],
  hotels: ['Budget hotel', 'Hostel', 'Homestay'],
  food: 'Local cuisine, street food, regional specialties',
  travelAdvice: 'Use public transport or shared cabs to save money.',
  budgetBreakdown: 'Plan your spending: 40% stay, 30% food, 20% travel, 10% misc.',
  smartAdvice: {
    hi: 'Har destination ka apna charm hota hai. Thoda offline explore karein, local logon se baat karein, aur budget ke hisaab se plan karein. Zyada mehangai wali jagahon se bachein.',
    en: 'Every destination has its own charm. Explore a bit offline, talk to locals, and plan according to your budget. Avoid overly touristy expensive spots.',
  },
};