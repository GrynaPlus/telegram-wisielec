
// ===== Wysyłanie danych do Google Sheets =====
function sendUserData() {
  fetch("https://script.google.com/macros/s/AKfycbzDoaaL9n09D9vS1lUmc1EJsYFhFhOgO3PyusYjLyW4aXhkAfGm4Au-nJdJnARka216/exec", {
    method: "POST",
    body: JSON.stringify({
      username: userName,
      level: currentLevel
    }),
    headers: {
      "Content-Type": "application/json"
    }
  }).then(res => console.log("Wysłano dane:", res.status))
  .catch(err => console.error("Błąd wysyłki do Sheets:", err));
}


// Globalne zmienne gry
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 3; // Użytkownik przegrywa po 3 błędach
let userName = "";
let questionCount = 0; // Numer bieżącego pytania
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
const circumference = 2 * Math.PI * 45; // Obwód okręgu o promieniu 45

// Sprawdzenie, czy nazwa użytkownika jest zapisana w localStorage
if (localStorage.getItem("userName")) {
  userName = localStorage.getItem("userName");
  usernameDisplayEl.textContent = "Witaj, " + userName + "!";
  usernameContainerEl.style.display = "none";
}

// Ustawienie nazwy użytkownika
setUsernameBtn.addEventListener("click", function () {
  userName = usernameInputEl.value.trim();
  if (userName !== "") {
    localStorage.setItem("userName", userName);
    usernameDisplayEl.textContent = "Witaj, " + userName + "!";
    usernameContainerEl.style.display = "none";
  }

    // wysyłamy dane do Google Sheets
    sendUserData();});

// Aktualizacja wyświetlania poziomu oraz numeru pytania w danym poziomie
function updateLevelDisplay() {
  sendUserData(); // wysyłka po zmianie poziomu
  currentLevel = Math.floor(questionCount / 100) + 1;
  const questionInLevel = (questionCount % 100) + 1;
  levelDisplayEl.textContent = "Poziom: " + currentLevel + " (" + questionInLevel + "/100)";
}
updateLevelDisplay();

// Przywrócenie zapisanego stanu gry (questionCount) z localStorage, jeśli istnieje
if (localStorage.getItem("questionCount")) {
  questionCount = parseInt(localStorage.getItem("questionCount"), 10);
  updateLevelDisplay();
}

// Funkcja zapisująca stan gry
function saveGameState() {
  localStorage.setItem("questionCount", questionCount);
}

// Zapis stanu gry przy zamykaniu
window.addEventListener("beforeunload", saveGameState);

// Ładowanie słów
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
  if (index >= levelObj.words.length) return levelObj.words[levelObj.words.length - 1].toLowerCase();
  return levelObj.words[index].toLowerCase();
}

// Reset koła postępu
function resetProgress() {
  wrongGuesses = 0;
  progressBar.style.strokeDashoffset = circumference;
}

// Aktualizacja koła postępu
function updateProgressBar() {
  const progress = wrongGuesses / maxWrong;
  const offset = circumference * (1 - progress);
  progressBar.style.strokeDashoffset = offset;
}

// Wyświetlanie słowa
function updateDisplayedWord() {
  let display = "";
  displayedWord.forEach(letter => {
    display += letter + " ";
  });
  wordContainerEl.textContent = display.trim();
}

// Kliknięcie litery
function handleLetterClick(e) {
  const btn = e.target;
  const letter = btn.textContent.toLowerCase();
  btn.disabled = true;

  if (word.includes(letter)) {
    for (let i = 0; i < word.length; i++) {
      if (word[i] === letter) {
        displayedWord[i] = letter;
      }
    }
    updateDisplayedWord();
    checkWin();
  } else {
    wrongGuesses++;
    updateProgressBar();
    checkLoss();
  }
}

// Sprawdzenie wygranej
function checkWin() {
  if (!displayedWord.includes("_")) {
    messageEl.textContent = "Gratulacje, " + (userName || "graczu") + "! Wygrałeś!";
    disableAllLetterButtons();

    setTimeout(() => {
      questionCount++;
      saveGameState();
      updateLevelDisplay();

      // Reklama po każdych 3 pytaniach
      if (questionCount % 3 === 0) {
   show_9373354({
  type: 'inApp',
  inAppSettings: {
    frequency: 1,
    capping: 0,
    interval: 120,
    timeout: 1,
    everyPage: false
  }
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

// Sprawdzenie przegranej
function checkLoss() {
  if (wrongGuesses >= maxWrong) {
    disableAllLetterButtons();
    messageEl.textContent = "Przegrałeś!";
    setTimeout(() => {
      initGame();
    }, 2000);
  }
}

// Wyłączenie przycisków liter
function disableAllLetterButtons() {
  const buttons = document.querySelectorAll(".letter-btn");
  buttons.forEach(btn => btn.disabled = true);
}

// Mieszanie tablicy
function shuffleArray(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

// Tworzenie przycisków liter
function createLetterButtons() {
  lettersContainerEl.innerHTML = "";

  const extendedAlphabet = "abcdefghijklmnopqrstuvwxyząćęłńóśźż";
  const correctSet = new Set();
  for (let char of word) {
    if (/[a-ząćęłńóśźż]/i.test(char)) {
      correctSet.add(char.toLowerCase());
    }
  }
  const correctLetters = Array.from(correctSet);
  let remainingLetters = extendedAlphabet.split("").filter(c => !correctSet.has(c));
  remainingLetters = shuffleArray(remainingLetters);

  const distractorCount = Math.min(5, remainingLetters.length);
  const distractorLetters = remainingLetters.slice(0, distractorCount);
  const availableLetters = shuffleArray(correctLetters.concat(distractorLetters));

  for (let letter of availableLetters) {
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.className = "letter-btn";
    btn.addEventListener("click", handleLetterClick);
    lettersContainerEl.appendChild(btn);
  }
}

// Podpowiedź
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

function handleHintClick() {
  if (displayedWord.includes("_")) {
    showRewardedAd(() => {
      revealHint();
    });
  }
}

function showRewardedAd(callback) {
  console.log("Pokazuję reklamę Rewarded...");
  show_9373354();
  if (callback) callback();
}

// Inicjalizacja gry
async function initGame() {
  wrongGuesses = 0;
  messageEl.textContent = "";

  resetProgress();
  updateLevelDisplay();

  const levels = await loadWords();
  word = chooseSequentialWord(levels, questionCount);
  console.log("Wybrane słowo (poziom " + currentLevel + "):", word);

  displayedWord = [];
  for (let char of word) {
    if (/[a-ząćęłńóśźż]/i.test(char)) {
      displayedWord.push("_");
    } else {
      displayedWord.push(char);
    }
  }
  updateDisplayedWord();
  createLetterButtons();
}

// Obsługa podpowiedzi
hintBtn.addEventListener("click", handleHintClick);

// Rozszerzenie Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Start gry
initGame();
