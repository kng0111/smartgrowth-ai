import { NextResponse } from "next/server";
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  Firestore,
} from "firebase/firestore";
import { getAuth, signInWithCustomToken, signInAnonymously } from "firebase/auth";

// These global variables are provided by the environment.
// Do not modify them.
declare const __firebase_config: string;
declare const __app_id: string;
declare const __initial_auth_token: string;

let app: FirebaseApp;
let db: Firestore;
let auth: any;
let userId: string | null = null;

// Initialize Firebase services and authenticate the user
const initializeFirebase = async () => {
  if (db) return; // Already initialized

  try {
    const firebaseConfig = JSON.parse(__firebase_config);
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    // Sign in with the provided token or anonymously
    if (typeof __initial_auth_token !== 'undefined') {
      const userCredential = await signInWithCustomToken(auth, __initial_auth_token);
      userId = userCredential.user.uid;
    } else {
      const userCredential = await signInAnonymously(auth);
      userId = userCredential.user.uid;
    }

    // Set a dummy user ID if one isn't available
    if (!userId) {
      userId = "anonymous-user";
    }
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    // Continue with null db to fail gracefully
    db = null as any;
  }
};

export async function GET() {
  await initializeFirebase();
  if (!db) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }

  const docRef = doc(db, `artifacts/${__app_id}/users/${userId}/dashboard/metrics`);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return NextResponse.json(docSnap.data());
  } else {
    // Return a default, empty data set if the document doesn't exist
    return NextResponse.json({
      users: [],
      planDistribution: {},
      activeUsers: [],
      churnRisk: [],
    });
  }
}

export async function POST(req: Request) {
  await initializeFirebase();
  if (!db) {
    return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
  }

  try {
    const data = await req.json();
    const docRef = doc(db, `artifacts/${__app_id}/users/${userId}/dashboard/metrics`);
    
    // Use setDoc with merge: true to update the document, creating it if it doesn't exist.
    await setDoc(docRef, data, { merge: true });

    return NextResponse.json({ success: true, message: "Dashboard data updated successfully." });
  } catch (error) {
    console.error("❌ Failed to update dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to update dashboard data." },
      { status: 500 }
    );
  }
}
