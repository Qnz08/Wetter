import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBorWSroLkbepwBYAxw8e4e5u3ROVmdEE0",
  authDomain: "meineersteweb.firebaseapp.com",
  projectId: "meineersteweb",
  storageBucket: "meineersteweb.firebasestorage.app",
  messagingSenderId: "651083515839",
  appId: "1:651083515839:web:281f0e7db5c4828713c30a",
  measurementId: "G-3V7R4ZDTGS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserId = null;
let userEmail = null;

// ActionCodeSettings für E-Mail-Link
const actionCodeSettings = {
  url: `qnz08.github.io/Wetter/`,
  handleCodeInApp: true
};

// E-Mail-Link senden
window.sendSignInLink = async () => {
  console.log('sendSignInLink aufgerufen');
  
  const emailInput = document.getElementById('home-email-input');
  const authMessage = document.getElementById('home-auth-message');
  
  console.log('emailInput:', emailInput);
  console.log('authMessage:', authMessage);

  if (!emailInput || !authMessage) {
    console.error('Elemente nicht gefunden!');
    alert('❌ Fehler: Elemente nicht gefunden. Seite neu laden.');
    return;
  }

  const email = emailInput.value.trim();
  console.log('Email eingegeben:', email);

  if (!email) {
    authMessage.textContent = '❌ Bitte E-Mail eingeben';
    authMessage.style.color = 'red';
    return;
  }

  try {
    console.log('Sende E-Mail mit actionCodeSettings:', actionCodeSettings);
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    console.log('E-Mail erfolgreich gesendet!');
    localStorage.setItem('emailForSignIn', email);
    authMessage.textContent = '✅ Anmeldelink wurde gesendet! Prüfe Deine E-Mails.';
    authMessage.style.color = 'green';
    emailInput.value = '';
    setTimeout(() => {
      authMessage.textContent = '';
    }, 5000);
  } catch (error) {
    console.error('Fehler beim E-Mail-Versand:', error);
    console.error('Fehlercode:', error.code);
    console.error('Fehlermeldung:', error.message);
    authMessage.textContent = `❌ Fehler: ${error.message}`;
    authMessage.style.color = 'red';
  }
};

// Prüfe ob E-Mail-Link in URL vorhanden
const checkEmailLink = async () => {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = localStorage.getItem('emailForSignIn');
    
    if (!email) {
      email = window.prompt('Bitte geben Sie Ihre E-Mail-Adresse ein:');
    }

    if (email) {
      try {
        const result = await signInWithEmailLink(auth, email, window.location.href);
        currentUserId = result.user.uid;
        userEmail = email;
        localStorage.setItem('userId', currentUserId);
        localStorage.setItem('userEmail', userEmail);
        localStorage.removeItem('emailForSignIn');
        window.history.replaceState({}, document.title, window.location.pathname);
        window.loadPage('home');
      } catch (error) {
        console.error('Fehler beim Anmeldelink:', error);
      }
    }
  }
};

// Abmelden
window.disconnectEmail = () => {
  currentUserId = null;
  userEmail = null;
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  window.loadPage('home');
};

// Sidebar initialisieren
const initSidebar = () => {
  const sidebar = document.querySelector('.sidebar');
  const sidebarIcon = document.querySelector('.sidebar-icon');
  const sidebarMenu = document.querySelector('.sidebar-menu');
  let sidebarOpen = false;

  const isTouchDevice = () => {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
  };

  const toggleSidebar = () => {
    sidebarOpen = !sidebarOpen;
    if (sidebarOpen) {
      sidebar.classList.add('active');
    } else {
      sidebar.classList.remove('active');
    }
  };

  if (isTouchDevice()) {
    sidebar.addEventListener('click', (e) => {
      if (e.target.closest('.sidebar-menu')) return;
      toggleSidebar();
    });
  } else {
    sidebarIcon.addEventListener('click', toggleSidebar);
    
    sidebar.addEventListener('mouseenter', () => {
      sidebar.classList.add('active');
      sidebarOpen = true;
    });
    
    sidebar.addEventListener('mouseleave', () => {
      sidebar.classList.remove('active');
      sidebarOpen = false;
    });
  }

  sidebarMenu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      if (isTouchDevice()) {
        sidebarOpen = false;
        sidebar.classList.remove('active');
      }
    }
  });
};

// Notizen zu Firebase hinzufügen (wenn E-Mail verknüpft)
const addNote = async (noteText) => {
  try {
    if (userEmail && currentUserId) {
      // Cloud-Speicherung
      await addDoc(collection(db, "notes"), {
        text: noteText,
        userId: currentUserId,
        userEmail: userEmail,
        timestamp: new Date()
      });
    } else {
      // Lokale Speicherung
      const notes = JSON.parse(localStorage.getItem('localNotes') || '[]');
      notes.push({
        text: noteText,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('localNotes', JSON.stringify(notes));
    }
    loadNotes();
  } catch (error) {
    console.error('Fehler beim Hinzufügen der Notiz:', error);
  }
};

// Notizen laden (lokal oder von Firebase)
const loadNotes = async () => {
  try {
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;
    notesList.innerHTML = '';
    
    if (userEmail && currentUserId) {
      // Cloud-Notizen laden
      const q = query(collection(db, "notes"), where("userId", "==", currentUserId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const note = doc.data();
        const noteEl = document.createElement('div');
        noteEl.className = 'note-item';
        noteEl.innerHTML = `
          <p>${note.text}</p>
          <button onclick="window.deleteNote('${doc.id}')">🗑️</button>
        `;
        notesList.appendChild(noteEl);
      });
    } else {
      // Lokale Notizen laden
      const notes = JSON.parse(localStorage.getItem('localNotes') || '[]');
      notes.forEach((note) => {
        const noteEl = document.createElement('div');
        noteEl.className = 'note-item';
        noteEl.innerHTML = `
          <p>${note.text}</p>
          <button onclick="window.deleteNote('${note.id}')">🗑️</button>
        `;
        notesList.appendChild(noteEl);
      });
    }
  } catch (error) {
    console.error('Fehler beim Laden der Notizen:', error);
  }
};

// Notiz löschen
window.deleteNote = async (noteId) => {
  try {
    if (userEmail && currentUserId) {
      // Cloud-Notiz löschen
      await deleteDoc(doc(db, "notes", noteId));
    } else {
      // Lokale Notiz löschen
      const notes = JSON.parse(localStorage.getItem('localNotes') || '[]');
      const filtered = notes.filter(n => n.id !== noteId);
      localStorage.setItem('localNotes', JSON.stringify(filtered));
    }
    loadNotes();
  } catch (error) {
    console.error('Fehler beim Löschen der Notiz:', error);
  }
};

// Seiten laden
window.loadPage = (page) => {
  const content = document.getElementById('content');
  
  if (page === 'home') {
    const userInfo = userEmail ? `✅ Synchronisiert mit: ${userEmail}` : '🔓 Anonym (lokal gespeichert)';
    const emailSection = userEmail ? `
      <button onclick="window.disconnectEmail()" style="background-color: #ff6b6b;">🔓 Abmelden</button>
      <p style="margin: 10px 20px; color: #666; font-size: 0.9em;">Alle Notizen sind mit deinem Cloud-Speicher verknüpft.</p>
    ` : `
      <details style="margin: 20px;">
        <summary style="cursor: pointer; font-size: 1.1em; padding: 10px;">📧 Mit E-Mail verknüpfen (optional)</summary>
        <div style="margin-top: 15px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <p>Geben Sie Ihre E-Mail ein, um Ihre Notizen geräteübergreifend zu synchronisieren:</p>
          <input type="email" id="home-email-input" placeholder="E-Mail-Adresse eingeben..." style="width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ccc; border-radius: 5px;">
          <button onclick="window.sendSignInLink()" style="width: 100%; background-color: rgb(100, 200, 255);">🔗 Anmeldelink senden</button>
          <p id="home-auth-message" style="margin: 10px 0; text-align: center;"></p>
        </div>
      </details>
    `;
    
    content.innerHTML = `
      <h1>📝 Meine Notizen</h1>
      <p style="margin: 0 20px; color: #666;">${userInfo}</p>
      ${emailSection}
      <div class="notes-input">
        <input type="text" id="note-input" placeholder="Notiz eingeben...">
        <button onclick="window.saveNote()">➕ Hinzufügen</button>
      </div>
      <div id="notes-list"></div>
    `;
    loadNotes();
  } else if (page === 'weather') {
    content.innerHTML = '<div id="weather-container"></div>';
    getWeather('Braunschweig');
  }
};

// Notiz speichern
window.saveNote = () => {
  const input = document.getElementById('note-input');
  const noteText = input.value.trim();
  
  if (noteText !== '') {
    addNote(noteText);
    input.value = '';
  }
};

const getWeather = async (city) => {
  const cities = {
    'Braunschweig': { lat: 52.2688, lon: 10.5267 },
    'Berlin': { lat: 52.52, lon: 13.41 },
    'München': { lat: 48.1351, lon: 11.5820 }
  };
  
  const coords = cities[city] || cities['Braunschweig'];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe/Berlin`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const temp = data.current.temperature_2m;
    const windSpeed = data.current.wind_speed_10m;
    
    document.getElementById('weather-container').innerHTML = `
      <h1>🌤️ Wetter in ${city}</h1>
      <p><strong>Temperatur:</strong> ${temp}°C</p>
      <p><strong>Windgeschwindigkeit:</strong> ${windSpeed} km/h</p>
    `;
  } catch (error) {
    console.error('Fehler beim Abrufen des Wetters:', error);
  }
};

// App starten
const initApp = async () => {
  // Verstecke Auth-Screen, zeige App
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
  
  // Prüfe auf E-Mail-Link
  await checkEmailLink();
  
  // Lade gespeicherte E-Mail
  const savedUserId = localStorage.getItem('userId');
  const savedEmail = localStorage.getItem('userEmail');
  if (savedUserId && savedEmail) {
    currentUserId = savedUserId;
    userEmail = savedEmail;
  }
  
  // Initialisiere Sidebar und lade Home
  initSidebar();
  window.loadPage('home');
};


initApp();

