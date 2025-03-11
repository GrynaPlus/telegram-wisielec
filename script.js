// Globalne zmienne gry
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 6;
let userName = "";
let currentLevel = 1;
const maxLevel = 10;

// Etapy rysowania wisielca (od 0 do 6 błędnych prób)
const hangmanStages = [
` 
 +---+
 |   |
     |
     |
     |
     |
=========
`,
` 
 +---+
 |   |
 O   |
     |
     |
     |
=========
`,
` 
 +---+
 |   |
 O   |
 |   |
     |
     |
=========
`,
` 
 +---+
 |   |
 O   |
/|   |
     |
     |
=========
`,
` 
 +---+
 |   |
 O   |
/|\\  |
     |
     |
=========
`,
` 
 +---+
 |   |
 O   |
/|\\  |
/    |
     |
=========
`,
` 
 +---+
 |   |
 O   |
/|\\  |
/ \\  |
     |
=========
`
];

// Pobieranie elementów DOM
const hangmanDrawingEl = document.getElementById("hangman-drawing");
const wordContainerEl = document.getElementById("word-container");
const lettersContainerEl = document.getElementById("letters-container");
const messageEl = document.getElementById("message");
const restartBtn = document.getElementById("restart-btn");
const hintBtn = document.getElementById("hint-btn");

// Elementy do ustawiania nazwy użytkownika
const usernameInputEl = document.getElementById("username-input");
const setUsernameBtn = document.getElementById("set-username-btn");
const usernameDisplayEl = document.getElementById("username-display");
const usernameContainerEl = document.getElementById("username-container");

// Sprawdzenie, czy nazwa i poziom są zapisane w localStorage
if (localStorage.getItem("userName")) {
  userName = localStorage.getItem("userName");
  usernameDisplayEl.textContent = "Witaj, " + userName + "!";
  usernameContainerEl.style.display = "none";
}
if (localStorage.getItem("currentLevel")) {
  currentLevel = parseInt(localStorage.getItem("currentLevel"));
} else {
  currentLevel = 1;
}

// Ustawienie nazwy użytkownika
setUsernameBtn.addEventListener("click", function() {
  userName = usernameInputEl.value.trim();
  if (userName !== "") {
    localStorage.setItem("userName", userName);
    usernameDisplayEl.textContent = "Witaj, " + userName + "!";
    usernameContainerEl.style.display = "none";
  }
});

// Funkcja do pobierania słów z pliku words.json
async function loadWords() {
  try {
    const response = await fetch('words.json');
    if (!response.ok) {
      throw new Error("Nie udało się wczytać pliku words.json");
    }
    const data = await response.json();
    return data.levels;
  } catch (error) {
    console.error("Błąd przy pobieraniu słów:", error);
    return [];
  }
}

// Wybór losowego słowa z danego poziomu
function chooseRandomWord(levels, chosenLevel) {
  const levelObj = levels.find(l => l.level === chosenLevel);
  if (!levelObj || levelObj.words.length === 0) {
    return "";
  }
  const words = levelObj.words;
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex].toLowerCase();
}

// Aktualizacja rysunku wisielca
function updateHangmanDrawing() {
  hangmanDrawingEl.textContent = hangmanStages[wrongGuesses];
}

// Aktualizacja wyświetlanego słowa
function updateDisplayedWord() {
  let display = "";
  displayedWord.forEach(letter => {
    display += letter + " ";
  });
  wordContainerEl.textContent = display.trim();
}

// Obsługa kliknięcia przycisku z literą
function handleLetterClick(e) {
  const btn = e.target;
  const letter = btn.textContent.toLowerCase();
  btn.disabled = true; // wyłączamy przycisk po kliknięciu

  if (word.includes(letter)) {
    // Trafiona litera – uaktualniamy wyświetlanie słowa
    for (let i = 0; i < word.length; i++) {
      if (word[i] === letter) {
        displayedWord[i] = letter;
      }
    }
    updateDisplayedWord();
    checkWin();
  } else {
    // Nietrafiona – zwiększamy liczbę błędów i aktualizujemy rysunek
    wrongGuesses++;
    updateHangmanDrawing();
    checkLoss();
  }
}

// Sprawdzenie wygranej – gdy nie ma już znaków podkreślenia
function checkWin() {
  if (!displayedWord.includes("_")) {
    messageEl.textContent = "Gratulacje, " + (userName || "graczu") + "! Wygrałeś!";
    disableAllLetterButtons();
    // Po krótkim czasie przechodzimy do kolejnego poziomu
    setTimeout(() => {
      nextLevel();
    }, 2000);
  }
}

// Sprawdzenie przegranej
function checkLoss() {
  if (wrongGuesses >= maxWrong) {
    disableAllLetterButtons();
    // Pokaż reklamę In-App Interstitial, a następnie komunikat o przegranej
    showInterstitialAd(() => {
      messageEl.textContent = "Przegrałeś! Prawidłowe słowo to: " + word;
      // Po krótkim czasie restartujemy poziom (bez zmiany poziomu)
      setTimeout(() => {
        initGame();
      }, 2000);
    });
  }
}

// Wyłączenie wszystkich przycisków liter
function disableAllLetterButtons() {
  const buttons = document.querySelectorAll(".letter-btn");
  buttons.forEach(btn => btn.disabled = true);
}

// Tworzenie przycisków dla liter A-Z
function createLetterButtons() {
  lettersContainerEl.innerHTML = "";
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  for (let letter of alphabet) {
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.className = "letter-btn";
    btn.addEventListener("click", handleLetterClick);
    lettersContainerEl.appendChild(btn);
  }
}

// Funkcja odsłaniająca jedną literę jako podpowiedź
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

// Obsługa kliknięcia przycisku podpowiedzi
function handleHintClick() {
  // Jeżeli są jeszcze nieodkryte litery, wywołujemy reklamę Rewarded Ad
  if (displayedWord.includes("_")) {
    showRewardedAd(() => {
      revealHint();
    });
  }
}

// Funkcje symulujące wyświetlanie reklam
function showInterstitialAd(callback) {
  const adOverlay = document.createElement("div");
  adOverlay.id = "ad-overlay";
  adOverlay.innerHTML = "<div class='ad-content'><p>Reklama Interstitial</p></div>";
  document.body.appendChild(adOverlay);
  setTimeout(() => {
    document.body.removeChild(adOverlay);
    if (callback) callback();
  }, 3000); // symulacja 3 sekund
}

function showRewardedAd(callback) {
  const adOverlay = document.createElement("div");
  adOverlay.id = "ad-overlay";
  adOverlay.innerHTML = "<div class='ad-content'><p>Reklama Rewarded: Oglądaj, aby otrzymać podpowiedź</p></div>";
  document.body.appendChild(adOverlay);
  setTimeout(() => {
    document.body.removeChild(adOverlay);
    if (callback) callback();
  }, 3000); // symulacja 3 sekund
}

// Funkcja przechodząca do kolejnego poziomu
async function nextLevel() {
  if (currentLevel < maxLevel) {
    currentLevel++;
    localStorage.setItem("currentLevel", currentLevel);
    messageEl.textContent = "Przechodzisz do poziomu " + currentLevel + "...";
    setTimeout(() => {
      initGame();
    }, 1500);
  } else {
    messageEl.textContent = "Brawo! Ukończyłeś wszystkie poziomy!";
    // Opcjonalnie można zresetować poziom lub zaoferować restart gry
  }
}

// Inicjalizacja gry
async function initGame() {
  wrongGuesses = 0;
  messageEl.textContent = "";
  updateHangmanDrawing();

  const levels = await loadWords();
  word = chooseRandomWord(levels, currentLevel);
  console.log("Wybrane słowo (poziom " + currentLevel + "):", word);
  
  displayedWord = [];
  for (let char of word) {
    if (char.match(/[a-z]/i)) {
      displayedWord.push("_");
    } else {
      displayedWord.push(char);
    }
  }
  updateDisplayedWord();
  createLetterButtons();
}

// Obsługa przycisku restart
restartBtn.addEventListener("click", initGame);

// Obsługa przycisku podpowiedzi
hintBtn.addEventListener("click", handleHintClick);

// Telegram WebApp – rozszerzenie interfejsu
const tg = window.Telegram.WebApp;
tg.expand();

// Uruchomienie gry po załadowaniu strony
initGame();
