// ===== Gry Wisielec z Google Sheets =====

// ---- Konfiguracja Google Sheets ----
const G_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzDoaaL9n09D9vS1lUmc1EJsYFhFhOgO3PyusYjLyW4aXhkAfGm4Au-nJdJnARka216/exec";

// ---- Zmienne globalne gry ----
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 3;
let questionCount = 0;
let currentLevel = 1;
let userName = "";

// ---- Elementy DOM ----
const usernameInputEl    = document.getElementById("username-input");
const setUsernameBtn     = document.getElementById("set-username-btn");
const usernameDisplayEl  = document.getElementById("username-display");
const usernameContainerEl= document.getElementById("username-container");

const wordContainerEl    = document.getElementById("word-container");
const lettersContainerEl = document.getElementById("letters-container");
const messageEl          = document.getElementById("message");
const hintBtn            = document.getElementById("hint-btn");
const levelDisplayEl     = document.getElementById("level-display");

// ---- Funkcja do wysyÅki danych ----
function sendUserData() {
  const data = new URLSearchParams();
  data.append("username", userName);
  data.append("level", currentLevel);
  fetch(G_SHEETS_URL, { method: "POST", body: data })
    .then(() => console.log("â Dane wysÅane do Sheets"))
    .catch(err => console.error("â BÅÄd wysyÅki:", err));
}

// ---- Åadowanie sÅÃ³w ----
async function loadWords() {
  const res = await fetch("words.json");
  const json = await res.json();
  return json.levels;
}

// ---- Inicjalizacja gry ----
async function initGame() {
  const levels = await loadWords();
  currentLevel = Math.floor(questionCount / 100) + 1;
  const levelData = levels[currentLevel - 1] || levels[0];
  word = levelData.words[Math.floor(Math.random() * levelData.words.length)].toLowerCase();
  displayedWord = Array.from(word).map(ch => /[a-zÄÄÄÅÅÃ³ÅÅºÅ¼]/i.test(ch) ? "_" : ch);
  wrongGuesses = 0;
  renderWord();
  updateLevelDisplay();
  createLetterButtons();
}

// ---- Renderowanie sÅowa ----
function renderWord() {
  wordContainerEl.textContent = displayedWord.join(" ");
}

// ---- Aktualizacja poziomu ----
function updateLevelDisplay() {
  levelDisplayEl.textContent = `Poziom: ${currentLevel}`;
  sendUserData();
}

// ---- Tworzenie przyciskÃ³w liter ----
function createLetterButtons() {
  lettersContainerEl.innerHTML = "";
  for (let i = 97; i <= 122; i++) {
    const char = String.fromCharCode(i);
    const btn = document.createElement("button");
    btn.textContent = char;
    btn.disabled = displayedWord.includes(char) || wrongGuesses >= maxWrong;
    btn.addEventListener("click", () => handleGuess(char, btn));
    lettersContainerEl.appendChild(btn);
  }
}

// ---- ObsÅuga zgadywania ----
function handleGuess(ch, btn) {
  btn.disabled = true;
  if (word.includes(ch)) {
    for (let i = 0; i < word.length; i++) {
      if (word[i] === ch) displayedWord[i] = ch;
    }
    renderWord();
    if (!displayedWord.includes("_")) {
      messageEl.textContent = "Gratulacje!";
      questionCount++;
      saveGameState();
      initGame();
    }
  } else {
    wrongGuesses++;
    messageEl.textContent = `BÅÄdÃ³w: ${wrongGuesses}/${maxWrong}`;
    if (wrongGuesses >= maxWrong) {
      messageEl.textContent = `PrzegraÅeÅ! HasÅo: ${word}`;
      questionCount++;
      saveGameState();
      setTimeout(initGame, 2000);
    }
  }
}

// ---- Zapis i odczyt stanu gry ----
function saveGameState() {
  localStorage.setItem("questionCount", questionCount);
}
function loadGameState() {
  questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
}

// ---- ObsÅuga nazwy uÅ¼ytkownika ----
window.addEventListener("load", () => {
  loadGameState();
  const savedName = localStorage.getItem("userName");
  if (savedName) {
    userName = savedName;
    usernameDisplayEl.textContent = `Witaj, ${userName}!`;
    usernameContainerEl.style.display = "none";
    initGame();
    sendUserData();
  }
});

setUsernameBtn.addEventListener("click", () => {
  const val = usernameInputEl.value.trim();
  if (!val) return;
  userName = val;
  localStorage.setItem("userName", userName);
  usernameDisplayEl.textContent = `Witaj, ${userName}!`;
  usernameContainerEl.style.display = "none";
  initGame();
  sendUserData();
});