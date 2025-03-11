// Globalne zmienne gry
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 6;
let userName = "";

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

// Ustawienie nazwy użytkownika
setUsernameBtn.addEventListener("click", function() {
  userName = usernameInputEl.value.trim();
  if (userName !== "") {
    usernameDisplayEl.textContent = "Witaj, " + userName + "!";
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

// Wybór losowego słowa z danego poziomu (domyślnie poziom 1)
function chooseRandomWord(levels, chosenLevel = 1) {
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
    // Możesz tu wysłać wynik do bota Telegram, np. przy użyciu tg.sendData()
  }
}

// Sprawdzenie przegranej
function checkLoss() {
  if (wrongGuesses >= maxWrong) {
    disableAllLetterButtons();
    // Pokaż reklamę In-App Interstitial, a następnie komunikat o przegranej
    showInterstitialAd(() => {
      messageEl.textContent = "Przegrałeś! Prawidłowe słowo to: " + word;
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
      checkWin();
      break;
    }
  }
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

// Inicjalizacja gry
async function initGame() {
  wrongGuesses = 0;
  messageEl.textContent = "";
  updateHangmanDrawing();

  const levels = await loadWords();
  word = chooseRandomWord(levels, 1);
  console.log("Wybrane słowo:", word);
  
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
