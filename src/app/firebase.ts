import { Donor } from './App';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'; // Import necessary Firestore functions
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

// Initialize Firebase safely to prevent duplicate initializations
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Function to add a new donor
export const addDonor = async (
  donorData: Omit<Donor, 'id' | 'date'> & { date: string },
) => {
  try {
    const docRef = await addDoc(collection(db, 'donors'), {
      ...donorData,
      date: Timestamp.fromDate(new Date(donorData.date)), // Store date as a Firestore Timestamp
      createdAt: Timestamp.now(), // Add a timestamp for ordering
    });
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw e;
  }
};

// Function to subscribe to real-time donor updates
export const subscribeToDonors = (callback: (donors: Donor[]) => void) => {
  const q = query(collection(db, 'donors'), orderBy('createdAt', 'desc')); // Order by creation time
  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const donors: Donor[] = [];
      querySnapshot.forEach((doc) => {
        donors.push({
          id: doc.id,
          date: doc.data().date.toDate().toISOString().slice(0, 10), // Convert Timestamp back to string
          name: doc.data().name,
          nickname: doc.data().nickname,
          amount: doc.data().amount,
          oneLineMsg: doc.data()?.oneLineMsg,
          ...doc.data(), // Include any additional fields if necessary
        });
      });
      callback(donors);
    },
    (error) => {
      console.error('Error listening to donors: ', error);
    },
  );

  return unsubscribe; // Return the unsubscribe function to clean up the listener
};

export { app, auth, db };
