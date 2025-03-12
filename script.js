// Globalne zmienne gry
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 3;
let userName = "";
let questionCount = 0; // Numer bieżącego pytania
const maxLevel = 10;

// Aktualny poziom wyliczamy jako: floor(questionCount / 100) + 1
let currentLevel = Math.floor(questionCount / 100) + 1;

// Definicja animacji – zamiast wisielca, używamy animowanego okręgu
const circumference = 2 * Math.PI * 45; // obwód okręgu o promieniu 45

// Pobieranie elementów DOM
const progressSvg = document.getElementById("progress-svg");
const progressBar = document.querySelector(".progress-bar");
const wordContainerEl = document.getElementById("word-container");
const lettersContainerEl = document.getElementById("letters-container");
const messageEl = document.getElementById("message");
const hintBtn = document.getElementById("hint-btn");
const levelDisplayEl = document.getElementById("level-display");

// Elementy ustawiania nazwy użytkownika
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

// Aktualizacja wyświetlania poziomu
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
  const index = qCount % 100; // dla pytań 0-99, indeks 0-99 itd.
  const levelObj = levels.find(l => l.level === level);
  if (!levelObj || levelObj.words.length === 0) {
    return "";
  }
  if (index >= levelObj.words.length) {
    // Jeśli słów jest mniej niż 100 w danym poziomie, wybieramy ostatnie dostępne
    return levelObj.words[levelObj.words.length - 1].toLowerCase();
  }
  return levelObj.words[index].toLowerCase();
}

// Aktualizacja animowanego paska postępu
function updateProgressBar() {
  const progress = wrongGuesses / maxWrong;
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
    updateProgressBar();
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

// Sprawdzenie przegranej – gdy liczba błędów osiągnie maxWrong
function checkLoss() {
  if (wrongGuesses >= maxWrong) {
    disableAllLetterButtons();
    showInterstitialAd(() => {
      // Usuwamy wyświetlanie poprawnego hasła
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

// Tworzenie przycisków liter – tylko litery występujące w słowie + 3 dodatkowe litery
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

// Obsługa kliknięcia przycisku podpowiedzi
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

// Inicjalizacja gry – resetujemy zmienne, pobieramy słowo sekwencyjnie i tworzymy przyciski
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

// Telegram WebApp – rozszerzenie interfejsu
const tg = window.Telegram.WebApp;
tg.expand();

// Uruchomienie gry po załadowaniu strony
initGame();
