/* AI Pathshala Apps: Firebase web config for the optional teacher accounts + Live Class Quiz.
 *
 * null  → every page runs in "Demo mode" (window.EDUCloudMock): it works on one device only, nothing goes online.
 * {...} → shared/cloud.js uses Firebase (only on http/https pages, and not when the URL has ?mock=1).
 *
 * This config is PUBLIC by design: it only names the Firebase project. It is not a password.
 * What anyone can read or write is decided by firebase/firestore.rules, not by hiding this object.
 * How to create the project and get these values: firebase/SETUP.md.
 *
 * Paste the object from Firebase console → Project settings → Your apps → Web app → "SDK setup and
 * configuration" → Config, like this (example values, not a real project):
 *
 * window.EDU_FIREBASE = {
 *   apiKey: 'AIzaSy...............................',
 *   authDomain: 'apni-pathshala.firebaseapp.com',
 *   projectId: 'apni-pathshala',
 *   storageBucket: 'apni-pathshala.firebasestorage.app',
 *   messagingSenderId: '123456789012',
 *   appId: '1:123456789012:web:0123456789abcdef012345'
 * };
 *
 * Leave out measurementId (Google Analytics stays OFF; cloud.js ignores it anyway).
 * For local tests with the Firebase emulators (http://localhost only) add  emulator: true.
 */
window.EDU_FIREBASE = null;

/* Grievance / privacy contact shown in legal/privacy.html and the apps (DPDP Act 2023). */
window.EDU_CONTACT_EMAIL = 'indiazenaitech@gmail.com';
