const firebaseConfig = {  
  apiKey: "AIzaSyDyF2VyiIK1DbZE29AdzkLYCSU4HB1z9qw",  
  authDomain: "form-project-da2d8.firebaseapp.com",  
  projectId: "form-project-da2d8",  
  storageBucket: "form-project-da2d8.firebasestorage.app",  
  messagingSenderId: "864862750726",  
  appId: "1:864862750726:web:5e9ed7379e633df5e0db87"  
}

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const loginForm = document.getElementById('login-form');
const regForm = document.getElementById('register-form');
const chatContainer = document.getElementById('chat-container');
const authContainer = document.getElementById('auth-container');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const authMsg = document.getElementById('auth-message');

let currentUser = null;
let userInfo = {};

auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    const doc = await db.collection('users').doc(user.uid).get();
    userInfo = doc.data();
    showChat();
    listenMessages();
  } else {
    showLogin();
  }
});

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

loginForm.onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    authMsg.textContent = 'Email atau password salah.';
  }
};

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
    authMsg.textContent = 'Email sudah terdaftar.';
  }
};

function showLogin() {
  authContainer.style.display = 'block';
  chatContainer.style.display = 'none';
}

function showChat() {
  authContainer.style.display = 'none';
  chatContainer.style.display = 'block';
}

document.getElementById('chat-form').onsubmit = async (e) => {
  e.preventDefault();
  const pesan = chatInput.value.trim();
  if (pesan) {
    await db.collection('chats').add({
      uid: currentUser.uid,
      nama: userInfo.nama,
      kelas: userInfo.kelas,
      urutan: userInfo.urutan,
      pesan,
      waktu: firebase.firestore.FieldValue.serverTimestamp()
    });
    chatInput.value = '';
  }
};

function listenMessages() {
  db.collection('chats')
    .orderBy('waktu')
    .limitToLast(100)
    .onSnapshot(snapshot => {
      chatBox.innerHTML = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const el = document.createElement('div');
        el.classList.add('message');
        el.innerHTML = `<strong>${data.nama} (${data.kelas}-${data.urutan})</strong>: ${data.pesan}`;
        chatBox.appendChild(el);
        chatBox.scrollTop = chatBox.scrollHeight;
      });
    }, err => {
      chatBox.innerHTML = '<p style="color:red;">Gagal memuat chat. Klik tombol refresh jika perlu.</p>';
    });
}

function logout() {
  auth.signOut();
}
