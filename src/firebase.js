import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCiBKiNar55j10GNhqLXPijQ8DiU8_mUdY",
  authDomain: "guardianroute-28b8f.firebaseapp.com",
  databaseURL: "https://guardianroute-28b8f-default-rtdb.firebaseio.com",
  projectId: "guardianroute-28b8f",
  storageBucket: "guardianroute-28b8f.firebasestorage.app",
  messagingSenderId: "326995817386",
  appId: "1:326995817386:web:ba370970d4ad54e61cb1d3",
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
export default app;
