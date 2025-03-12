// Globalne zmienne gry
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 6;
let userName = "";
let questionCount = 0; // Liczba pytań, które użytkownik odgadł (poprawnie)
const maxLevel = 10;

// Aktualny poziom wyznaczamy jako: Math.floor(questionCount / 100) + 1
let currentLevel = Math.floor(questionCount / 100) + 1;

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
const hintBtn = document.getElementById("hint-btn");
const levelDisplayEl = document.getElementById("level-display");

// Elementy do ustawiania nazwy użytkownika
const usernameInputEl = document.getElementById("username-input");
const setUsernameBtn = document.getElementById("set-username-btn");
const usernameDisplayEl = document.getElementById("username-display");
const usernameContainerEl = document.getElementById("username-container");

// Sprawdzenie, czy nazwa jest zapisana w localStorage
if (localStorage.getItem("userName")) {
  userName = localStorage.getItem("userName");
  usernameDisplayEl.textContent = "Witaj, " + userName + "!";
  usernameContainerEl.style.display = "none";
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

// Funkcja aktualizująca wyświetlanie poziomu
function updateLevelDisplay() {
  currentLevel = Math.floor(questionCount / 100) + 1;
  levelDisplayEl.textContent = "Poziom: " + currentLevel;
}
updateLevelDisplay();

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

/*
  Funkcja wybierająca słowo sekwencyjnie.
  Dla danego poziomu (currentLevel) wybieramy słowo o indeksie = questionCount % 100.
*/
function chooseSequentialWord(levels, qCount) {
  const level = Math.floor(qCount / 100) + 1;
  const index = qCount % 100; // Dla pierwszych 100 pytań: index 0-99, itd.
  const levelObj = levels.find(l => l.level === level);
  if (!levelObj || levelObj.words.length === 0) {
    return "";
  }
  if (index >= levelObj.words.length) {
    // Jeśli w danym poziomie jest mniej niż 100 słów, wybieramy ostatnie dostępne
    return levelObj.words[levelObj.words.length - 1].toLowerCase();
  }
  return levelObj.words[index].toLowerCase();
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
    // Po krótkim czasie zwiększamy licznik pytań i przechodzimy do kolejnego słowa
    setTimeout(() => {
      questionCount++;
      if (questionCount >= 100 * maxLevel) {
        messageEl.textContent = "Brawo! Ukończyłeś wszystkie pytania!";
      } else {
        updateLevelDisplay();
        initGame();
      }
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
      // Po krótkim czasie restartujemy z tym samym słowem (bez zwiększania questionCount)
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

// Funkcja mieszająca elementy tablicy
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

// Tworzenie przycisków dla liter – tylko te występujące w słowie + 3 losowe litery z rozszerzonego alfabetu
function createLetterButtons() {
  lettersContainerEl.innerHTML = "";
  
  // Rozszerzony alfabet z polskimi znakami (wszystkie litery małe)
  const extendedAlphabet = "abcdefghijklmnopqrstuvwxyząćęłńóśźż";
  
  // Zbiór liter występujących w słowie (pomijamy spacje i interpunkcję)
  const correctSet = new Set();
  for (let char of word) {
    if (/[a-ząćęłńóśźż]/i.test(char)) {
      correctSet.add(char.toLowerCase());
    }
  }
  const correctLetters = Array.from(correctSet);
  
  // Zbiór liter, które mogą być dodatkowymi opcjami (wszystkie z alfabetu, ale usunięte te już w słowie)
  let remainingLetters = [];
  for (let char of extendedAlphabet) {
    if (!correctSet.has(char)) {
      remainingLetters.push(char);
    }
  }
  remainingLetters = shuffleArray(remainingLetters);
  
  // Wybieramy do 3 losowych liter jako dystraktory
  const distractorCount = Math.min(3, remainingLetters.length);
  const distractorLetters = remainingLetters.slice(0, distractorCount);
  
  // Łączymy litery ze słowa oraz dystraktory i mieszamy
  const availableLetters = shuffleArray(correctLetters.concat(distractorLetters));
  
  // Tworzymy przyciski dla każdej litery
  for (let letter of availableLetters) {
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
  // Wybieramy słowo sekwencyjnie: dla pytania o numerze questionCount wybieramy słowo z poziomu = Math.floor(questionCount/100)+1
  word = chooseSequentialWord(levels, questionCount);
  console.log("Wybrane słowo (poziom " + currentLevel + "):", word);
  
  // Inicjujemy tablicę wyświetlania słowa – litery, które są literami, zastępujemy "_" 
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

// Obsługa przycisku podpowiedzi
hintBtn.addEventListener("click", handleHintClick);

// Telegram WebApp – rozszerzenie interfejsu
const tg = window.Telegram.WebApp;
tg.expand();

// Uruchomienie gry po załadowaniu strony
initGame();
