// ==========================================
// STAGE SIGNAL
// Firebase connection and application logic
// ==========================================

// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    onValue,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";

// ==========================================
// FIREBASE CONFIGURATION
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyAFUsSF5SZzTKQDE1zVw2h02IipBOCK9LY",
    authDomain: "stage-signal-36c88.firebaseapp.com",
    databaseURL: "https://stage-signal-36c88-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "stage-signal-36c88",
    storageBucket: "stage-signal-36c88.firebasestorage.app",
    messagingSenderId: "78422300246",
    appId: "1:78422300246:web:862e5bb83dd3e28cdd8df7"
};

// ==========================================
// INITIALIZATION
// ==========================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const signalRef = ref(database, "stageSignal");
const connectionRef = ref(database, ".info/connected");

// ==========================================
// INTERFACE ELEMENTS
// ==========================================

const hostView = document.getElementById("hostView");
const lightView = document.getElementById("lightView");

const hostStatus = document.getElementById("hostStatus");
const hostMessage = document.getElementById("hostMessage");
const signalButton = document.getElementById("signalButton");

const lightScreen = document.getElementById("lightScreen");
const lightStatus = document.getElementById("lightStatus");
const lightActions = document.getElementById("lightActions");
const resetButton = document.getElementById("resetButton");

// ==========================================
// APPLICATION MODE
// ==========================================

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode");

if (mode === "host") {
    hostView.classList.remove("hidden");
} else if (mode === "light") {
    lightView.classList.remove("hidden");
} else {
    document.body.innerHTML = `
        <div style="
            color:white;
            background:black;
            min-height:100vh;
            display:flex;
            justify-content:center;
            align-items:center;
            text-align:center;
            font-family:Arial;
            font-size:22px;
            padding:20px;
        ">
            STAGE SIGNAL

            Укажите режим в ссылке:

            ?mode=host — ведущий

            ?mode=light — световик
        </div>
    `;
}

// ==========================================
// CONNECTION STATUS
// ==========================================

let isConnected = false;
let isAuthenticated = false;
let signalIsActive = false;

function updateConnectionStatus() {

    if (mode === "host") {

        if (isConnected && isAuthenticated) {
            hostStatus.textContent = "● ПОДКЛЮЧЕНО";
            hostStatus.className = "status online";
        } else {
            hostStatus.textContent = "● НЕТ СОЕДИНЕНИЯ";
            hostStatus.className = "status offline";
        }

        signalButton.disabled = !(isConnected && isAuthenticated);
    }

    if (mode === "light") {

        resetButton.disabled = !(isConnected && isAuthenticated);

        if (!signalIsActive) {
            lightStatus.textContent = isConnected
                ? "ОЖИДАНИЕ СИГНАЛА"
                : "НЕТ СОЕДИНЕНИЯ";
        }
    }
}

onValue(connectionRef, (snapshot) => {

    isConnected = snapshot.val() === true;

    updateConnectionStatus();

});

// ==========================================
// SIGNAL DISPLAY
// ==========================================

function updateSignal(active) {

    signalIsActive = active;
    if (mode === "light") {

        if (active) {

            lightScreen.classList.add("active");

            lightStatus.textContent = "СИГНАЛ ПОЛУЧЕН";

            lightActions.classList.remove("hidden");

        } else {

            lightScreen.classList.remove("active");

            lightStatus.textContent = "ОЖИДАНИЕ СИГНАЛА";

            lightActions.classList.add("hidden");

        }
    }

    if (mode === "host") {

        if (active) {
            hostMessage.textContent = "СИГНАЛ ОТПРАВЛЕН!";
        } else {
            hostMessage.textContent = "Нажмите кнопку для подачи сигнала";
        }
    }

    updateConnectionStatus();
}

// ==========================================
// LISTEN TO FIREBASE DATABASE
// ==========================================

function startListening() {

    onValue(signalRef, (snapshot) => {

        const data = snapshot.val();

        const active = data && data.active === true;

        updateSignal(active);

    }, (error) => {

        console.error("Database error:", error);

        if (mode === "host") {
            hostMessage.textContent = "Ошибка получения данных";
        }

    });
}

// ==========================================
// SEND SIGNAL
// ==========================================

if (mode === "host") {

    signalButton.addEventListener("click", async () => {

        if (!isConnected || !isAuthenticated) {
            return;
        }

        signalButton.disabled = true;

        hostMessage.textContent = "Отправка сигнала...";

        try {

            await set(signalRef, {
                active: true,
                updatedAt: serverTimestamp()
            });

            hostMessage.textContent = "СИГНАЛ ОТПРАВЛЕН!";

        } catch (error) {

            console.error("Signal error:", error);

            hostMessage.textContent = "Не удалось отправить сигнал";

        }

        updateConnectionStatus();

    });

}

// ==========================================
// RESET SIGNAL
// ==========================================

if (mode === "light") {

    resetButton.addEventListener("click", async () => {

        if (!isConnected || !isAuthenticated) {
            return;
        }

        resetButton.disabled = true;

        try {

            await set(signalRef, {
                active: false,
                updatedAt: serverTimestamp()
            });

        } catch (error) {

            console.error("Reset error:", error);

            lightStatus.textContent = "ОШИБКА СБРОСА";

        }

        updateConnectionStatus();

    });

}

// ==========================================
// ANONYMOUS AUTHENTICATION
// ==========================================

async function startApplication() {

    try {

        await signInAnonymously(auth);

        isAuthenticated = true;

        updateConnectionStatus();

        startListening();

        console.log("STAGE SIGNAL connected successfully");

    } catch (error) {

        console.error("Firebase authentication error:", error);

        if (mode === "host") {
            hostStatus.textContent = "ОШИБКА АВТОРИЗАЦИИ";
            hostStatus.className = "status offline";
        }

        if (mode === "light") {
            lightStatus.textContent = "ОШИБКА ПОДКЛЮЧЕНИЯ";
        }

    }

}

// ==========================================
// START
// ==========================================

startApplication();