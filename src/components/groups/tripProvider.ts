// src/components/groups/tripProvider.ts
import { DummyTripProvider, AITripProvider, TripDataProvider } from '@/data/tripData';
// import { featureFlags } from "@/config/featureFlags"; // Isko temporarily hata rahe hain

// 🚀 FORCE USE AI PROVIDER (Ab Real Data Aayega!)
const provider: TripDataProvider = new AITripProvider();

export default provider;