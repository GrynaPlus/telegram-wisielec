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

// Aktualizacja wyświetlania poziomu oraz numeru pytania w danym poziomie
function updateLevelDisplay() {
  currentLevel = Math.floor(questionCount / 100) + 1;
  const questionInLevel = (questionCount % 100) + 1;
  levelDisplayEl.textContent = "Poziom: " + currentLevel + " (" + questionInLevel + "/100)";
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
  Wybieramy słowo sekwencyjnie.
  Dla danego poziomu (currentLevel) wybieramy słowo o indeksie = questionCount % 100.
*/
function chooseSequentialWord(levels, qCount) {
  const level = Math.floor(qCount / 100) + 1;
  const index = qCount % 100;
  const levelObj = levels.find(l => l.level === level);
  if (!levelObj || levelObj.words.length === 0) {
    return "";
  }
  if (index >= levelObj.words.length) {
    return levelObj.words[levelObj.words.length - 1].toLowerCase();
  }
  return levelObj.words[index].toLowerCase();
}

// Reset animacji baterii na początek rundy
function resetBattery() {
  const batteryLevelEl = document.querySelector('#battery .battery-level');
  batteryLevelEl.style.width = '100%';
  batteryLevelEl.style.backgroundColor = '#4caf50';
}

// Aktualizacja animacji baterii przy błędnych odpowiedziach
function updateBattery() {
  const batteryLevelEl = document.querySelector('#battery .battery-level');
  // Obliczamy procent naładowania: przy wrongGuesses=1 -> 66%, 2 -> 33%, 3 -> 0%
  let levelPercent = 100 - (wrongGuesses / maxWrong) * 100;
  batteryLevelEl.style.width = levelPercent + '%';
  
  // Opcjonalnie zmieniamy kolor wskaźnika przy niskim poziomie
  if (levelPercent > 50) {
    batteryLevelEl.style.backgroundColor = '#4caf50'; // zielony
  } else if (levelPercent > 20) {
    batteryLevelEl.style.backgroundColor = '#ff9800'; // pomarańczowy
  } else {
    batteryLevelEl.style.backgroundColor = '#f44336'; // czerwony
  }
}

// Aktualizacja wyświetlanego słowa
function updateDisplayedWord() {
  let display = "";
  displayedWord.forEach(letter => {
    display += letter + " ";
  });
  wordContainerEl.textContent = display.trim();
}

// Obsługa kliknięcia przycisku litery
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
    updateBattery();
    checkLoss();
  }
}

// Sprawdzenie wygranej – gdy nie ma już "_" w wyświetlanym słowie
function checkWin() {
  if (!displayedWord.includes("_")) {
    messageEl.textContent = "Gratulacje, " + (userName || "graczu") + "! Wygrałeś!";
    disableAllLetterButtons();
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

// Sprawdzenie przegranej – po osiągnięciu maksymalnej liczby błędów
function checkLoss() {
  if (wrongGuesses >= maxWrong) {
    disableAllLetterButtons();
    showInterstitialAd(() => {
      // Nie pokazujemy prawidłowego słowa
      messageEl.textContent = "Przegrałeś!";
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

// Funkcja mieszająca tablicę
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

// Tworzenie przycisków liter – litery występujące w haśle + 5 dodatkowych liter
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
  
  let remainingLetters = [];
  for (let char of extendedAlphabet) {
    if (!correctSet.has(char)) {
      remainingLetters.push(char);
    }
  }
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

// Obsługa przycisku podpowiedzi
function handleHintClick() {
  if (displayedWord.includes("_")) {
    showRewardedAd(() => {
      revealHint();
    });
  }
}

// Symulacja reklamy In-App Interstitial
function showInterstitialAd(callback) {
  const adOverlay = document.createElement("div");
  adOverlay.id = "ad-overlay";
  adOverlay.innerHTML = "<div class='ad-content'><p>Reklama Interstitial</p></div>";
  document.body.appendChild(adOverlay);
  setTimeout(() => {
    document.body.removeChild(adOverlay);
    if (callback) callback();
  }, 3000);
}

// Symulacja reklamy Rewarded Ad
function showRewardedAd(callback) {
  const adOverlay = document.createElement("div");
  adOverlay.id = "ad-overlay";
  adOverlay.innerHTML = "<div class='ad-content'><p>Reklama Rewarded: Oglądaj, aby otrzymać podpowiedź</p></div>";
  document.body.appendChild(adOverlay);
  setTimeout(() => {
    document.body.removeChild(adOverlay);
    if (callback) callback();
  }, 3000);
}

// Inicjalizacja gry – reset zmiennych, pobranie słowa, ustawienie świecy i stworzenie przycisków
async function initGame() {
  wrongGuesses = 0;
  messageEl.textContent = "";
  
  // Reset animacji świecy
  resetCandle();
  
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

// Obsługa przycisku podpowiedzi
hintBtn.addEventListener("click", handleHintClick);

// Telegram WebApp – rozszerzenie interfejsu
const tg = window.Telegram.WebApp;
tg.expand();

// Uruchomienie gry po załadowaniu strony
initGame();
