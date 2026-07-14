/* =========================================================
   FIREBASE CONFIG — required for "VS Online" (cross-device play)
   =========================================================

   Math Tug Arena uses Firebase Realtime Database as a free relay so two
   devices can sync a match with a room code. This costs nothing on
   Firebase's free "Spark" plan for a project this size.

   SETUP (takes about 3 minutes):
   1. Go to https://console.firebase.google.com and click "Add project"
      (you can turn off Google Analytics, it isn't needed).
   2. In your new project, open "Build > Realtime Database" in the left
      sidebar and click "Create Database". Choose any region. Start in
      "test mode" (see the security rules note at the bottom of this
      file for what to switch to later).
   3. Click the gear icon (Project settings) > scroll to "Your apps" >
      click the "</>" (web) icon > register the app (any nickname).
      Firebase will show you a firebaseConfig object.
   4. Copy those values into FIREBASE_CONFIG below, replacing the
      placeholders.
   5. Save this file and reload index.html — the "VS Online" mode will
      start working.

   You do NOT need to touch app.js, index.html, or run any server.
--------------------------------------------------------- */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAuJjC7lwygHAzKbXvZTnZZaGbFU4qTDLE",
  authDomain: "eduarena-6451c.firebaseapp.com",
  databaseURL: "https://eduarena-6451c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "eduarena-6451c",
  storageBucket: "eduarena-6451c.firebasestorage.app",
  messagingSenderId: "706849234838",
  appId: "1:706849234838:web:b62852b26601dc215547b7",
};

/* ---------------------------------------------------------
   SECURITY RULES (optional but recommended before sharing widely)
   Test mode leaves the database wide open to anyone with your config,
   which is fine while you're building. Once you're happy with it,
   paste this into Realtime Database > Rules in the Firebase console —
   it still needs no login, but stops old rooms from being read/written
   forever and blocks obviously malformed writes:

   {
     "rules": {
       "rooms": {
         "$code": {
           ".read": true,
           ".write": true,
           ".validate": "newData.hasChildren(['status','cls','category'])"
         }
       }
     }
   }
--------------------------------------------------------- */
