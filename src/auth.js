import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./config.js";

// Перемикання між формами
document.getElementById("to-register")?.addEventListener("click", () => {
    document.getElementById("login-form-block").style.display = "none";
    document.getElementById("register-form-block").style.display = "block";
});
document.getElementById("to-login")?.addEventListener("click", () => {
    document.getElementById("register-form-block").style.display = "none";
    document.getElementById("login-form-block").style.display = "block";
});

// ЛОГІКА ВХОДУ
document.getElementById("btn-submit-login")?.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-password").value;

    try {
        const credentials = await signInWithEmailAndPassword(auth, email, pass);
        const userDoc = await getDoc(doc(db, "users", credentials.user.uid));
        
        if (userDoc.exists()) {
            window.location.href = "index.html"; // Перехід на головну панель
        }
    } catch (err) {
        alert("Помилка входу: перевірте дані");
    }
});

// ЛОГІКА РЕЄСТРАЦІЇ
document.getElementById("btn-submit-register")?.addEventListener("click", async () => {
    const nickname = document.getElementById("reg-nickname").value;
    const email = document.getElementById("reg-email").value;
    const pass = document.getElementById("reg-password").value;

    if (!nickname || !email || !pass) return alert("Заповніть всі поля!");

    try {
        const credentials = await createUserWithEmailAndPassword(auth, email, pass);
        
        // Базовий шаблон для нового користувача
        await setDoc(doc(db, "users", credentials.user.uid), {
            nickname: nickname,
            email: email,
            role: "helper", // Базова роль
            strikes: 0,
            warnings: 0,
            shiftsCount: 0,
            punishmentsCount: 0,
            playerWarningsCount: 0,
            supportRepliesCount: 0,
            bonusesPercent: 0,
            finesPercent: 0,
            vacationDays: 0,
            totalMinutes: 0,
            activeShiftStartedAt: null
        });

        alert("Успішна реєстрація!");
        window.location.href = "index.html";
    } catch (err) {
        alert("Помилка реєстрації: " + err.message);
    }
});
