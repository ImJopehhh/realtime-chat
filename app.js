const firebaseConfig = {  
  apiKey: "AIzaSyDyF2VyiIK1DbZE29AdzkLYCSU4HB1z9qw",  
  authDomain: "form-project-da2d8.firebaseapp.com",  
  projectId: "form-project-da2d8",  
  storageBucket: "form-project-da2d8.firebasestorage.app",  
  messagingSenderId: "864862750726",  
  appId: "1:864862750726:web:5e9ed7379e633df5e0db87"  
}

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elemen UI
const loginForm = document.getElementById('login-form');
const regForm = document.getElementById('register-form');
const authContainer = document.getElementById('auth-container');
const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const authMsg = document.getElementById('auth-message');

let currentUser = null;
let userInfo = {};

// Fungsi saat status login berubah
auth.onAuthStateChanged(async user => {
  if (user) {
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (!doc.exists) {
        await auth.signOut();
        showLogin();
        authMsg.textContent = 'Akun belum lengkap. Silakan daftar ulang.';
        return;
      }
      currentUser = user;
      userInfo = doc.data();
      showChat();
      listenMessages();
    } catch (e) {
      console.error('Gagal ambil data user:', e);
      showLogin();
      authMsg.textContent = 'Terjadi kesalahan. Coba lagi.';
    }
  } else {
    showLogin();
  }
});

// Toggle form login/register
function toggleForms() {
  const login = document.getElementById('login-form');
  const register = document.getElementById('register-form');
  const title = document.getElementById('form-title');
  if (login.style.display === 'none') {
    login.style.display = 'block';
    register.style.display = 'none';
    title.textContent = 'Login';
  } else {
    login.style.display = 'none';
    register.style.display = 'block';
    title.textContent = 'Register';
  }
}

// Proses Login
loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  try {
    await auth.signInWithEmailAndPassword(email, password);
    authMsg.textContent = '';
  } catch (err) {
    authMsg.textContent = 'Email atau password salah.';
  }
};

// Proses Register
regForm.onsubmit = async (e) => {
  e.preventDefault();
  const nama = document.getElementById('reg-nama').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  const kelas = document.getElementById('reg-kelas').value;
  const urutan = document.getElementById('reg-urutan').value;

  if (!nama || !email || !password || !kelas || !urutan) {
    authMsg.textContent = 'Semua field harus diisi.';
    return;
  }

  if (password.length < 6) {
    authMsg.textContent = 'Password minimal 6 karakter.';
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection('users').doc(cred.user.uid).set({
      nama, email, kelas, urutan
    });
    toggleForms();
    authMsg.textContent = 'Pendaftaran berhasil. Silakan login.';
  } catch (err) {
    console.error(err);
    authMsg.textContent = 'Email sudah digunakan.';
  }
};

// Tampilkan form login
function showLogin() {
  authContainer.style.display = 'block';
  chatContainer.style.display = 'none';
  loginForm.style.display = 'block';
  regForm.style.display = 'none';
  document.getElementById('form-title').textContent = 'Login';
}

// Tampilkan halaman chat
function showChat() {
  authContainer.style.display = 'none';
  chatContainer.style.display = 'block';
}

// Kirim pesan
chatForm.onsubmit = async (e) => {
  e.preventDefault();
  const pesan = chatInput.value.trim();
  if (!pesan) return;
  try {
    await db.collection('chats').add({
      uid: currentUser.uid,
      nama: userInfo.nama,
      kelas: userInfo.kelas,
      urutan: userInfo.urutan,
      pesan,
      waktu: firebase.firestore.FieldValue.serverTimestamp()
    });
    chatInput.value = '';
  } catch (err) {
    console.error('Gagal kirim pesan:', err);
  }
};

// Ambil dan tampilkan pesan real-time
function listenMessages() {
  db.collection('chats')
    .orderBy('waktu')
    .limitToLast(100)
    .onSnapshot(snapshot => {
      chatBox.innerHTML = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const el = document.createElement('div');
        el.className = 'message';
        el.innerHTML = `<strong>${data.nama} (${data.kelas}-${data.urutan})</strong>: ${data.pesan}`;
        chatBox.appendChild(el);
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    }, err => {
      console.error('Snapshot error:', err);
      chatBox.innerHTML = '<p style=\"color:red\">Gagal memuat pesan. Coba refresh halaman.</p>';
    });
}

// Logout
function logout() {
  auth.signOut();
}
