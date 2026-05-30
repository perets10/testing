import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./config.js";

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1504979591704481864/RvU_Gu_jE4LVFhWDsQnAKtaxuJGMGdgkNdne1JeGQlNNlFQQqnHH_XxrZ90wXBJZZGn8";
let currentUserId = null;
let userData = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }
    currentUserId = user.uid;
    await syncDashboard();
});

async function syncDashboard() {
    const userDoc = await getDoc(doc(db, "users", currentUserId));
    if (!userDoc.exists()) return;
    userData = userDoc.data();

    // Заповнення 10 карток даними з Firestore
    document.getElementById("stat-strikes").innerText = `${userData.strikes || 0}/3`;
    document.getElementById("stat-warnings").innerText = `${userData.warnings || 0}/2`;
    document.getElementById("stat-shifts").innerText = userData.shiftsCount || 0;
    document.getElementById("stat-punishments").innerText = userData.punishmentsCount || 0;
    document.getElementById("stat-player-warnings").innerText = userData.playerWarningsCount || 0;
    document.getElementById("stat-support").innerText = userData.supportRepliesCount || 0;
    document.getElementById("stat-bonuses").innerText = `${userData.bonusesPercent || 0}%`;
    document.getElementById("stat-fines").innerText = `${userData.finesPercent || 0}%`;
    document.getElementById("stat-vacations").innerText = `${userData.vacationDays || 0} Days`;
    
    const mins = userData.totalMinutes || 0;
    document.getElementById("stat-weekly-avg").innerText = `${Math.floor(mins / 60)} год. ${mins % 60} хв.`;

    // Стан першої плитки
    if (userData.activeShiftStartedAt) {
        const start = userData.activeShiftStartedAt.toDate();
        document.getElementById("shift-action-title").innerText = "Закінчити зміну";
        document.getElementById("shift-action-desc").innerText = `Зміна активна з ${start.toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'})}`;
        document.getElementById("btn-toggle-shift").style.borderColor = "#ef4444";
    } else {
        document.getElementById("shift-action-title").innerText = "Почати зміну";
        document.getElementById("shift-action-desc").innerText = "Зафіксувати початок робочого часу";
        document.getElementById("btn-toggle-shift").style.borderColor = "var(--border-card)";
    }
}

// Клік по кнопці зміни
document.getElementById("btn-toggle-shift").addEventListener("click", async () => {
    const userRef = doc(db, "users", currentUserId);
    const now = new Date();

    if (!userData.activeShiftStartedAt) {
        // СТАРТ СМІНИ
        await updateDoc(userRef, { activeShiftStartedAt: now });
        await sendDiscordLog("🟢 Розпочав зміну", `Заступив на пост о **${now.toLocaleTimeString('uk-UA')}**`);
        location.reload();
    } else {
        // КІНЕЦЬ СМІНИ
        const startTime = userData.activeShiftStartedAt.toDate();
        const diffMinutes = Math.round((now - startTime) / 1000 / 60);

        await addDoc(collection(db, "shifts"), {
            userId: currentUserId,
            nickname: userData.nickname,
            duration: diffMinutes,
            date: now
        });

        await updateDoc(userRef, {
            activeShiftStartedAt: null,
            shiftsCount: (userData.shiftsCount || 0) + 1,
            totalMinutes: (userData.totalMinutes || 0) + diffMinutes
        });

        await sendDiscordLog("🔴 Закінчив зміну", `Зміна завершена о **${now.toLocaleTimeString('uk-UA')}**.\nВідпрацьовано: **${Math.floor(diffMinutes/60)} год. ${diffMinutes%60} хв.**`);
        location.reload();
    }
});

// Інші кнопки плиток
document.getElementById("btn-history").addEventListener("click", () => alert("Розділ історії у розробці"));
document.getElementById("btn-vacation").addEventListener("click", () => alert("Розділ відпусток у розробці"));
document.getElementById("btn-leaderboard").addEventListener("click", () => alert("Лідерборд у розробці"));
document.getElementById("btn-settings").addEventListener("click", () => alert("Налаштування у розробці"));

// Функція вебхуку Discord
async function sendDiscordLog(title, desc) {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes("ТВIЙ_")) return;
    const embed = {
        embeds: [{
            title: title,
            description: desc,
            color: title.includes("🟢") ? 3066993 : 15158332,
            fields: [{ name: "Модератор", value: `\`${userData.nickname}\``, inline: true }],
            timestamp: new Date().toISOString()
        }]
    };
    await fetch(DISCORD_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(embed) });
}
