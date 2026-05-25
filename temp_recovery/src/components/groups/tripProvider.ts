// src/components/groups/tripProvider.ts
import { DummyTripProvider, AITripProvider, TripDataProvider } from '@/data/tripData';

// 🔧 FORCE USE DUMMY PROVIDER (until AI is ready)
const provider: TripDataProvider = new DummyTripProvider();

// If you want to use environment variable later, uncomment the following:
// const provider: TripDataProvider =
//   import.meta.env.VITE_TRIP_DATA_MODE === 'ai'
//     ? new AITripProvider()
//     : new DummyTripProvider();

export default provider;



