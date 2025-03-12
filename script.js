// Globalne zmienne gry
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 3;
let userName = "";
let questionCount = 0;
const maxLevel = 10;
let currentLevel = Math.floor(questionCount / 100) + 1;

// Pobieranie elementów DOM
const wordContainerEl = document.getElementById("word-container");
const lettersContainerEl = document.getElementById("letters-container");
const messageEl = document.getElementById("message");
const hintBtn = document.getElementById("hint-btn");
const levelDisplayEl = document.getElementById("level-display");
const usernameInputEl = document.getElementById("username-input");
const setUsernameBtn = document.getElementById("set-username-btn");
const usernameDisplayEl = document.getElementById("username-display");
const usernameContainerEl = document.getElementById("username-container");
const progressBar = document.querySelector(".progress-bar");
const circumference = 2 * Math.PI * 45;

// Sprawdzenie zapisanej nazwy
if (localStorage.getItem("userName")) {
  userName = localStorage.getItem("userName");
  usernameDisplayEl.textContent = "Witaj, " + userName + "!";
  usernameContainerEl.style.display = "none";
}

// Ustawienie nazwy
setUsernameBtn.addEventListener("click", function () {
  userName = usernameInputEl.value.trim();
  if (userName !== "") {
    localStorage.setItem("userName", userName);
    usernameDisplayEl.textContent = "Witaj, " + userName + "!";
    usernameContainerEl.style.display = "none";
  }
});

// Aktualizacja poziomu
function updateLevelDisplay() {
  currentLevel = Math.floor(questionCount / 100) + 1;
  const questionInLevel = (questionCount % 100) + 1;
  levelDisplayEl.textContent = "Poziom: " + currentLevel + " (" + questionInLevel + "/100)";
}
updateLevelDisplay();

// Pobieranie słów
async function loadWords() {
  try {
    const response = await fetch('words.json');
    if (!response.ok) throw new Error("Nie udało się wczytać pliku words.json");
    const data = await response.json();
    return data.levels;
  } catch (error) {
    console.error("Błąd przy pobieraniu słów:", error);
    return [];
  }
}

// Wybór słowa
function chooseSequentialWord(levels, qCount) {
  const level = Math.floor(qCount / 100) + 1;
  const index = qCount % 100;
  const levelObj = levels.find(l => l.level === level);
  if (!levelObj || levelObj.words.length === 0) return "";
  return levelObj.words[Math.min(index, levelObj.words.length - 1)].toLowerCase();
}

// Reset progresu
function resetProgress() {
  wrongGuesses = 0;
  progressBar.style.strokeDashoffset = circumference;
}

// Aktualizacja progresu
function updateProgressBar() {
  const progress = wrongGuesses / maxWrong;
  progressBar.style.strokeDashoffset = circumference * (1 - progress);
}

// Aktualizacja słowa
function updateDisplayedWord() {
  wordContainerEl.textContent = displayedWord.join(" ");
}

// Obsługa liter
function handleLetterClick(e) {
  const btn = e.target;
  const letter = btn.textContent.toLowerCase();
  btn.disabled = true;

  if (word.includes(letter)) {
    for (let i = 0; i < word.length; i++) {
      if (word[i] === letter) displayedWord[i] = letter;
    }
    updateDisplayedWord();
    checkWin();
  } else {
    wrongGuesses++;
    updateProgressBar();
    checkLoss();
  }
}

// Wygrana
function checkWin() {
  if (!displayedWord.includes("_")) {
    messageEl.textContent = "Gratulacje, " + (userName || "graczu") + "! Wygrałeś!";
    disableAllLetterButtons();
    setTimeout(() => {
      questionCount++;
      if (questionCount >= 100 * maxLevel) messageEl.textContent = "Brawo! Ukończyłeś wszystkie pytania!";
      else {
        updateLevelDisplay();
        initGame();
      }
    }, 2000);
  }
}

// Przegrana z reklamą interstitial po każdej przegranej
function checkLoss() {
  if (wrongGuesses >= maxWrong) {
    disableAllLetterButtons();
    showInterstitialAd(() => {
      messageEl.textContent = "Przegrałeś!";
      setTimeout(() => {
        initGame();
      }, 2000);
    });
  }
}

// Wyłączenie liter
function disableAllLetterButtons() {
  document.querySelectorAll(".letter-btn").forEach(btn => btn.disabled = true);
}

// Podpowiedź
hintBtn.addEventListener("click", function () {
  if (displayedWord.includes("_")) {
    showRewardedAd(() => {
      revealHint();
    });
  }
});

// Funkcja podpowiedzi
function revealHint() {
  for (let i = 0; i < word.length; i++) {
    if (displayedWord[i] === "_") {
      displayedWord[i] = word[i];
      updateDisplayedWord();
      break;
    }
  }
  checkWin();
}

// --- Reklamy ---
// Interstitial po przegranej
function showInterstitialAd(callback) {
  show_9076387({ 
    type: 'inApp', 
    inAppSettings: { 
      frequency: 1,    // ZAWSZE po przegranej
      capping: 0,      // Brak limitu
      interval: 0,     // Brak odstępów
      timeout: 1, 
      everyPage: false 
    } 
  });

  setTimeout(() => {
    if (typeof callback === 'function') callback();
  }, 5000); // Dopasuj do długości reklamy
}

// Rewarded (za podpowiedź)
function showRewardedAd(callback) {
  show_9076387().then(() => {
    if (typeof callback === 'function') callback();
  }).catch(() => {
    alert('Aby otrzymać podpowiedź, musisz obejrzeć całą reklamę.');
  });
}

// Inicjalizacja gry
async function initGame() {
  wrongGuesses = 0;
  messageEl.textContent = "";
  resetProgress();
  updateLevelDisplay();

  const levels = await loadWords();
  word = chooseSequentialWord(levels, questionCount);

  displayedWord = word.split("").map(char => (/[a-ząćęłńóśźż]/i.test(char) ? "_" : char));
  updateDisplayedWord();
  createLetterButtons();
}

// Przyciski liter
function createLetterButtons() {
  lettersContainerEl.innerHTML = "";
  const alphabet = "abcdefghijklmnopqrstuvwxyząćęłńóśźż".split("").sort(() => Math.random() - 0.5);
  alphabet.forEach(letter => {
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.className = "letter-btn";
    btn.addEventListener("click", handleLetterClick);
    lettersContainerEl.appendChild(btn);
  });
}

// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Start gry
initGame();
