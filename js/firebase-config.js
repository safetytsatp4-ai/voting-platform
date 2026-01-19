// ======================================
// Firebase Configuration
// ======================================

// ⬇️ วาง Config ของคุณตรงนี้ ⬇️
const firebaseConfig = {
  apiKey: "AIzaSyCMSfIFej6_spb3v1P0DpHbmB71Lw9acNs",
  authDomain: "voting-platform-9add0.firebaseapp.com",
  projectId: "voting-platform-9add0",
  storageBucket: "voting-platform-9add0.firebasestorage.app",
  messagingSenderId: "1082633870670",
  appId: "1:1082633870670:web:fbddbdf9e33a287c3b921f",
  measurementId: "G-577SHQ492E",
  // ⬇️ วางลิงก์ที่คัดมาไว้ตรงนี้ครับ ⬇️
  databaseURL: "https://voting-platform-9add0-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// ⬆️ วาง Config ของคุณตรงนี้ ⬆️

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const database = firebase.database();
const auth = firebase.auth();

// Export for use in other files
window.db = database;
window.auth = auth;
window.db = firebase.database();
console.log('✅ Firebase initialized successfully');