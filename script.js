/* ========= KONFIGURACJA ========= */
const G_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbzDoaaL9n09D9vS1lUmc1EJsYFhFhOgO3PyusYjLyW4aXhkAfGm4Au-nJdJnARka216/exec";

/* ========= ZMIENNE GLOBALNE GRY ========= */
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 3;
let questionCount = 0;
const maxLevel = 10;
let currentLevel = 1;

let userName = "";
const wordContainerEl   = document.getElementById("word-container");
const lettersContainerEl= document.getElementById("letters-container");
const messageEl         = document.getElementById("message");
const hintBtn           = document.getElementById("hint-btn");
const levelDisplayEl    = document.getElementById("level-display");

const setNameInput  = document.getElementById("username-input");
const setNameBtn    = document.getElementById("set-username-btn");
const usernameDisplayEl = document.getElementById("username-display");
const usernameContainerEl = document.getElementById("username-container");

/* ========= WYSYŁANIE DANYCH DO GOOGLE SHEETS ========= */
function sendUserData() {
  const data = new URLSearchParams();
  data.append("username", userName);
  data.append("level", currentLevel);

  fetch(G_SHEETS_URL, { method: "POST", body: data })
    .then(() => console.log("✅ Dane wysłane do Sheets"))
    .catch(err => console.error("❌ Błąd wysyłki:", err));
}

/* ========= LOGIKA GRY ========= */
async function loadWords() {
  const res  = await fetch("words.json");
  const json = await res.json();
  return json.levels;
}

async function initGame() {
  console.log("[DEBUG] initGame start");
  const levels = await loadWords();
  console.log("[DEBUG] levels:", levels?.length);

  const levelData = levels[currentLevel - 1] ?? levels[0];
  word = levelData.words[
    Math.floor(Math.random() * levelData.words.length)
  ].toLowerCase();

  displayedWord = Array.from(word).map(ch => /[a-ząćęłńóśźż]/i.test(ch) ? "_" : ch);
  wrongGuesses = 0;
  updateLevelDisplay();
  renderWord();
  createLetterButtons();
}

/* –– pomocnicze (renderowanie itd.) –– */
function updateLevelDisplay() {
  levelDisplayEl.textContent = `Poziom: ${currentLevel} (${questionCount + 1}/100)`;
  sendUserData();             // wysyłka po zmianie poziomu
}
function renderWord() { wordContainerEl.textContent = displayedWord.join(" "); }
/* createLetterButtons(), handleGuess(), itp.– tutaj wklej swoją dotychczasową logikę gry */

/* ========= OBSŁUGA NAZWY ========= */
setNameBtn.addEventListener("click", () => {
  const val = setNameInput.value.trim();
  if (!val) return;
  userName = val;
  localStorage.setItem("username", userName);

  usernameDisplayEl.textContent = `Witaj, ${userName}!`;
  usernameContainerEl.style.display = "none";
  sendUserData();   // wysyłka pierwsza
  initGame();       // start gry
});

/* ========= START PO ZAŁADOWANIU ========= */
window.addEventListener("load", () => {
  const saved = localStorage.getItem("username");
  if (saved) {
    userName = saved;
    usernameDisplayEl.textContent = `Witaj, ${userName}!`;
    usernameContainerEl.style.display = "none";
    initGame();
  }
});
