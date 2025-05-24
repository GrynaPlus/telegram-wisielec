// ======= Gra Wisielec + Google Sheets + Reklamy =======

// ---- Konfiguracja Google Sheets ----
const G_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzDoaaL9n09D9vS1lUmc1EJsYFhFhOgO3PyusYjLyW4aXhkAfGm4Au-nJdJnARka216/exec";
let userName = localStorage.getItem("userName") || "";

// ---- Globalne zmienne gry ----
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 3;
let questionCount = parseInt(localStorage.getItem("questionCount")) || 0;
const maxLevel = 10;
let currentLevel = Math.floor(questionCount/100) + 1;

// ---- Pobranie elementów DOM ----
const wordContainerEl    = document.getElementById("word-container");
const lettersContainerEl = document.getElementById("letters-container");
const messageEl          = document.getElementById("message");
const hintBtn            = document.getElementById("hint-btn");
const levelDisplayEl     = document.getElementById("level-display");

const usernameInputEl    = document.getElementById("username-input");
const setUsernameBtn     = document.getElementById("set-username-btn");
const usernameDisplayEl  = document.getElementById("username-display");
const usernameContainerEl= document.getElementById("username-container");

const progressBar        = document.querySelector(".progress-bar");
const circumference      = 2 * Math.PI * 45;

// ---- Funkcja wysyłki danych ----
function sendUserData() {
  const data = new URLSearchParams();
  data.append("username", userName);
  data.append("question", questionCount);  // numer pytania
  data.append("level", currentLevel);      // poziom

  fetch(G_SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    body: data
  })
  .then(() => console.log("✅ Dane wysłane do Sheets"))
  .catch(err => console.error("❌ Błąd wysyłki:", err));
}

// ---- Zapis / odczyt stanu gry ----
function saveGameState() {
  localStorage.setItem("questionCount", questionCount);
}
window.addEventListener("beforeunload", saveGameState);

// ---- Wczytywanie słów ----
async function loadWords() {
  try {
    const r = await fetch("words.json");
    if (!r.ok) throw "";
    return (await r.json()).levels;
  } catch {
    console.error("Błąd przy fetch words.json");
    return [];
  }
}

// ---- Wybór słowa sekwencyjnie ----
function chooseSequentialWord(levels, q) {
  const lvl = Math.floor(q/100)+1;
  const idx = q % 100;
  const obj = levels.find(l=>l.level===lvl) || levels[0];
  return (obj.words[idx]||obj.words.slice(-1)[0]).toLowerCase();
}

// ---- Progress bar ----
function resetProgress() {
  wrongGuesses = 0;
  progressBar.style.strokeDashoffset = circumference;
}
function updateProgressBar() {
  progressBar.style.strokeDashoffset =
    circumference * (1 - wrongGuesses / maxWrong);
}

// ---- Render, level display ----
function updateDisplayedWord() {
  wordContainerEl.textContent = displayedWord.join(" ");
}
function updateLevelDisplay() {
  currentLevel = Math.floor(questionCount/100) + 1;
  const inLvl = (questionCount % 100) + 1;
  levelDisplayEl.textContent = `Poziom: ${currentLevel} (${inLvl}/100)`;
  // **Usunięte wywołanie sendUserData() stąd**
}

// ---- Obsługa liter i reklamy ----
function disableAllLetterButtons() {
  document.querySelectorAll(".letter-btn").forEach(b=>b.disabled=true);
}
function handleLetterClick(e) {
  const btn = e.target;
  const ch = btn.textContent;
  btn.disabled = true;
  if (word.includes(ch)) {
    for (let i = 0; i < word.length; i++) {
      if (word[i] === ch) displayedWord[i] = ch;
    }
    updateDisplayedWord();
    checkWin();
  } else {
    wrongGuesses++;
    updateProgressBar();
    checkLoss();
  }
}

// ---- Win / Loss ----
function checkWin() {
  if (!displayedWord.includes("_")) {
    messageEl.textContent = `Gratulacje, ${userName||"graczu"}!`;
    disableAllLetterButtons();

    setTimeout(() => {
      // Tylko przy poprawnej odpowiedzi:
      questionCount++;
      saveGameState();
      updateLevelDisplay();
      sendUserData();   // <-- tutaj wysyłamy numer pytania i poziom

      // Reklama co 3 pytania
      if (questionCount % 3 === 0) {
        show_9373354({
          type: 'inApp',
          inAppSettings: { frequency:1, capping:0, interval:120, timeout:1, everyPage:false }
        });
      }

      if (questionCount >= 100 * maxLevel) {
        messageEl.textContent = "Brawo! Ukończyłeś wszystkie pytania!";
      } else {
        initGame();
      }
    }, 2000);
  }
}
function checkLoss() {
  if (wrongGuesses >= maxWrong) {
    disableAllLetterButtons();
    messageEl.textContent = "Przegrałeś!";
    setTimeout(initGame, 2000);
  }
}

// ---- Rewarded hint ----
function revealHint() {
  for (let i=0; i<word.length; i++) {
    if (displayedWord[i] === "_") {
      displayedWord[i] = word[i];
      updateDisplayedWord();
      break;
    }
  }
  checkWin();
}
function handleHintClick() {
  if (displayedWord.includes("_")) {
    show_9373354(); // Rewarded
    revealHint();
  }
}

// ---- Shuffle helper ----
function shuffleArray(a) {
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Create letter buttons ----
function createLetterButtons() {
  lettersContainerEl.innerHTML = "";
  const extAlpha = "abcdefghijklmnopqrstuvwxyząćęłńóśźż".split("");
  const correct = Array.from(new Set(
    word.split("")
        .filter(c=>/[a-ząćęłńóśźż]/i.test(c))
        .map(c=>c)
  ));
  let choices;
  if (word.length <= 5) {
    const pool = extAlpha.filter(c=>!correct.includes(c));
    shuffleArray(pool);
    choices = shuffleArray([...correct, ...pool.slice(0,5)]);
  } else {
    choices = extAlpha;
  }
  choices.forEach(ch => {
    const b = document.createElement("button");
    b.textContent = ch;
    b.className = "letter-btn";
    b.disabled = wrongGuesses >= maxWrong;
    b.addEventListener("click", handleLetterClick);
    lettersContainerEl.appendChild(b);
  });
}

// ---- Obsługa nazwy użytkownika ----
if (userName) {
  usernameDisplayEl.textContent = `Witaj, ${userName}!`;
  usernameContainerEl.style.display = "none";
}
setUsernameBtn.addEventListener("click", () => {
  const v = usernameInputEl.value.trim();
  if (!v) return;
  userName = v;
  localStorage.setItem("userName", v);
  usernameDisplayEl.textContent = `Witaj, ${userName}!`;
  usernameContainerEl.style.display = "none";
  initGame();
  sendUserData();  // możesz też wysłać przy pierwszym uruchomieniu
});

// ---- Telegram WebApp expand ----
window.Telegram.WebApp.expand();

// ---- Podpowiedź event ----
hintBtn.addEventListener("click", handleHintClick);

// ---- Inicjalizacja gry ----
async function initGame() {
  resetProgress();
  messageEl.textContent = "";
  updateLevelDisplay();
  const levels = await loadWords();
  word = chooseSequentialWord(levels, questionCount);
  console.log("Wybrane słowo (lvl "+currentLevel+"):", word);
  displayedWord = word.split("").map(c=>/[a-ząćęłńóśźż]/i.test(c) ? "_" : c);
  updateDisplayedWord();
  createLetterButtons();
}
initGame();
