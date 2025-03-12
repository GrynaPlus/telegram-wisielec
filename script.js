// Globalne zmienne gry
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 3; // Po 3 błędnych odpowiedziach przegrywa
let userName = "";
let questionCount = 0; // Numer bieżącego pytania (poprawne odpowiedzi)
const totalQuestionsPerLevel = 100; // Zakładamy 100 pytań na poziom
const maxLevel = 10;

// Aktualny poziom wyliczamy jako: Math.floor(questionCount / totalQuestionsPerLevel) + 1
let currentLevel = Math.floor(questionCount / totalQuestionsPerLevel) + 1;
const circumference = 2 * Math.PI * 45; // Obwód okręgu o promieniu 45

// Pobieranie elementów DOM
const progressSvg = document.getElementById("progress-svg");
const progressBar = document.querySelector(".progress-bar");
const wordContainerEl = document.getElementById("word-container");
const lettersContainerEl = document.getElementById("letters-container");
const messageEl = document.getElementById("message");
const hintBtn = document.getElementById("hint-btn");
const levelDisplayEl = document.getElementById("level-display");
const levelTextEl = document.getElementById("level-text");

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

// Aktualizacja wyświetlania poziomu i tekstu w kółeczku
function updateLevelDisplay() {
  currentLevel = Math.floor(questionCount / totalQuestionsPerLevel) + 1;
  levelDisplayEl.textContent = "Poziom: " + currentLevel;
  levelTextEl.textContent = "Level " + currentLevel;
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
  Wybieramy słowo sekwencyjnie:
  Dla danego poziomu (currentLevel) wybieramy słowo o indeksie = questionCount % totalQuestionsPerLevel.
*/
function chooseSequentialWord(levels, qCount) {
  const level = Math.floor(qCount / totalQuestionsPerLevel) + 1;
  const index = qCount % totalQuestionsPerLevel;
  const levelObj = levels.find(l => l.level === level);
  if (!levelObj || levelObj.words.length === 0) {
    return "";
  }
  if (index >= levelObj.words.length) {
    return levelObj.words[levelObj.words.length - 1].toLowerCase();
  }
  return levelObj.words[index].toLowerCase();
}

// Aktualizacja paska postępu – wypełnienie zależy od postępu w bieżącym poziomie
function updateProgressBar() {
  let progress = (questionCount % totalQuestionsPerLevel) / totalQuestionsPerLevel;
  const offset = circumference * (1 - progress);
  progressBar.style.strokeDashoffset = offset;
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
    if (wrongGuesses >= maxWrong) {
      checkLoss();
    }
  }
}

// Sprawdzenie wygranej – gdy nie ma już "_" w haśle
function checkWin() {
  if (!displayedWord.includes("_")) {
    messageEl.textContent = "Gratulacje, " + (userName || "graczu") + "! Wygrałeś!";
    disableAllLetterButtons();
    setTimeout(() => {
      questionCount++;
      updateLevelDisplay();
      updateProgressBar();
      if (questionCount >= totalQuestionsPerLevel * maxLevel) {
        messageEl.textContent = "Brawo! Ukończyłeś wszystkie pytania!";
      } else {
        initGame();
      }
    }, 2000);
  }
}

// Sprawdzenie przegranej – gdy liczba błędów osiągnie 3
function checkLoss() {
  disableAllLetterButtons();
  showInterstitialAd(() => {
    messageEl.textContent = "Przegrałeś! Prawidłowe słowo to: " + word;
    setTimeout(() => {
      initGame();
    }, 2000);
  });
}

// Wyłączenie przycisków liter
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

// Tworzenie przycisków liter – wyświetlamy litery występujące w haśle + 4 dystraktory
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
  
  const distractorCount = Math.min(4, remainingLetters.length);
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

// Inicjalizacja gry: resetujemy zmienne, pobieramy słowo sekwencyjnie, tworzymy przyciski i aktualizujemy pasek postępu
async function initGame() {
  wrongGuesses = 0;
  messageEl.textContent = "";
  updateProgressBar();
  
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

// Rozszerzenie interfejsu Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Uruchomienie gry przy załadowaniu strony
initGame();
