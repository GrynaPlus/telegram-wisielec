// ===== Gry Wisielec z Google Sheets =====

// ---- Konfiguracja Google Sheets ----
const G_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzDoaaL9n09D9vS1lUmc1EJsYFhFhOgO3PyusYjLyW4aXhkAfGm4Au-nJdJnARka216/exec";

// ---- Zmienne globalne gry ----
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 3;
let questionCount = 0;    // łącznie pytań już rozgryzionych
let currentLevel = 1;
let userName = "";

// ---- Elementy DOM ----
const usernameInputEl     = document.getElementById("username-input");
const setUsernameBtn      = document.getElementById("set-username-btn");
const usernameDisplayEl   = document.getElementById("username-display");
const usernameContainerEl = document.getElementById("username-container");

const wordContainerEl     = document.getElementById("word-container");
const lettersContainerEl  = document.getElementById("letters-container");
const messageEl           = document.getElementById("message");
const hintBtn             = document.getElementById("hint-btn");
const levelDisplayEl      = document.getElementById("level-display");

// ---- Funkcja wysyłająca dane do Google Sheets (URL-encoded, brak CORS) ----
function sendUserData() {
  const data = new URLSearchParams();
  data.append("username", userName);
  data.append("level", currentLevel);
  fetch(G_SHEETS_URL, { method: "POST", body: data })
    .then(() => console.log("✅ Dane wysłane do Sheets"))
    .catch(err => console.error("❌ Błąd wysyłki:", err));
}

// ---- Wczytywanie słów ----
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

  // losujemy słowo
  word = levelData.words[Math.floor(Math.random() * levelData.words.length)].toLowerCase();
  // przygotowujemy podkreślenia
  displayedWord = Array.from(word).map(ch => /[a-ząćęłńóśźż]/i.test(ch) ? "_" : ch);
  wrongGuesses = 0;
  messageEl.textContent = "";

  renderWord();
  updateLevelDisplay();
  createLetterButtons();
}

// ---- Renderowanie słowa ----
function renderWord() {
  wordContainerEl.textContent = displayedWord.join(" ");
}

// ---- Aktualizacja wyświetlania poziomu i numeru pytania ----
function updateLevelDisplay() {
  const questionInLevel = (questionCount % 100) + 1;
  levelDisplayEl.textContent = `Poziom: ${currentLevel} (${questionInLevel}/100)`;
  sendUserData();  // wyślij za każdym razem, gdy poziom (lub pytanie) się zmienia
}

// ---- Tworzenie przycisków liter ----
function createLetterButtons() {
  const polish = ["a","ą","b","c","ć","d","e","ę","f","g","h","i","j","k","l","ł","m","n","ń","o","ó","p","q","r","s","ś","t","u","v","w","x","y","z","ź","ż"];
  lettersContainerEl.innerHTML = "";
  polish.forEach(ch => {
    const btn = document.createElement("button");
    btn.textContent = ch;
    btn.disabled = displayedWord.includes(ch) || wrongGuesses >= maxWrong;
    btn.classList.add("letter-btn");
    btn.addEventListener("click", () => handleGuess(ch, btn));
    lettersContainerEl.appendChild(btn);
  });
}

// ---- Obsługa zgadnięcia litery ----
function handleGuess(ch, btn) {
  btn.disabled = true;
  if (word.includes(ch)) {
    // odkrywamy litery
    for (let i = 0; i < word.length; i++) {
      if (word[i] === ch) displayedWord[i] = ch;
    }
    renderWord();
    // sprawdzamy wygraną
    if (!displayedWord.includes("_")) {
      messageEl.textContent = "Gratulacje! 😊";
      questionCount++;
      saveGameState();
      setTimeout(initGame, 1000);
    }
  } else {
    // błąd
    wrongGuesses++;
    messageEl.textContent = `Błędów: ${wrongGuesses}/${maxWrong}`;
    if (wrongGuesses >= maxWrong) {
      messageEl.textContent = `Przegrałeś! Hasło: ${word}`;
      questionCount++;
      saveGameState();
      setTimeout(initGame, 2000);
    }
  }
}

// ---- Zapis i odczyt stanu gry (liczba pytań) ----
function saveGameState() {
  localStorage.setItem("questionCount", questionCount);
}
function loadGameState() {
  questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
}

// ---- Obsługa nazwy użytkownika ----
window.addEventListener("load", () => {
  loadGameState();
  const saved = localStorage.getItem("userName");
  if (saved) {
    userName = saved;
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
