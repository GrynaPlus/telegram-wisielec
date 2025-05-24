// ======= Wisielec z Google Sheets + Reklamy (oryginalny kod) =======

// ---- Google Sheets Integration ----
const G_SHEETS_URL = "https://script.google.com/macros/s/AKfycbzDoaaL9n09D9vS1lUmc1EJsYFhFhOgO3PyusYjLyW4aXhkAfGm4Au-nJdJnARka216/exec";
let userName = localStorage.getItem("userName") || "";

// ---- Globalne zmienne gry ----
let word = "";
let displayedWord = [];
let wrongGuesses = 0;
const maxWrong = 3; // 3 błędy = przegrana
let questionCount = parseInt(localStorage.getItem("questionCount"), 10) || 0;
const maxLevel = 10;
let currentLevel = Math.floor(questionCount / 100) + 1;

// ---- Pobieranie elementów DOM ----
const wordContainerEl   = document.getElementById("word-container");
const lettersContainerEl= document.getElementById("letters-container");
const messageEl         = document.getElementById("message");
const hintBtn           = document.getElementById("hint-btn");
const levelDisplayEl    = document.getElementById("level-display");

const usernameInputEl   = document.getElementById("username-input");
const setUsernameBtn    = document.getElementById("set-username-btn");
const usernameDisplayEl = document.getElementById("username-display");
const usernameContainerEl = document.getElementById("username-container");

const progressBar       = document.querySelector(".progress-bar");
const circumference     = 2 * Math.PI * 45;

// ---- Funkcja wysyłająca do Sheets ----
function sendUserData() {
  const data = new URLSearchParams();
  data.append("username", userName);
  data.append("level", currentLevel);
  fetch(G_SHEETS_URL, { method: "POST", body: data })
    .then(()=>console.log("✅ Sheets OK"))
    .catch(e=>console.error("❌ Sheets ERR",e));
}

// ---- Zapis stanu gry ----
function saveGameState() {
  localStorage.setItem("questionCount", questionCount);
}
window.addEventListener("beforeunload", saveGameState);

// ---- Wczytanie słów ----
async function loadWords() {
  try {
    const r = await fetch("words.json");
    if (!r.ok) throw "";
    return (await r.json()).levels;
  } catch {
    console.error("Nie udało się wczytać words.json");
    return [];
  }
}

// ---- Wybór słowa sekwencyjnie ----
function chooseSequentialWord(levels, qCount) {
  const lvl = Math.floor(qCount/100)+1;
  const idx = qCount % 100;
  const obj = levels.find(l=>l.level===lvl) || levels[0];
  return (obj.words[idx]||obj.words[obj.words.length-1]).toLowerCase();
}

// ---- Reset + Update progres bar ----
function resetProgress() {
  wrongGuesses = 0;
  progressBar.style.strokeDashoffset = circumference;
}
function updateProgressBar() {
  const offset = circumference*(1 - (wrongGuesses/maxWrong));
  progressBar.style.strokeDashoffset = offset;
}

// ---- Update wyświetlania słowa i poziomu ----
function updateDisplayedWord() {
  wordContainerEl.textContent = displayedWord.join(" ");
}
function updateLevelDisplay() {
  currentLevel = Math.floor(questionCount/100)+1;
  const inLvl = (questionCount%100)+1;
  levelDisplayEl.textContent = `Poziom: ${currentLevel} (${inLvl}/100)`;
  sendUserData();
}

// ---- Obsługa liter ----
function disableAllLetterButtons() {
  document.querySelectorAll(".letter-btn").forEach(b=>b.disabled=true);
}
function handleLetterClick(e) {
  const btn = e.target;
  const ch = btn.textContent.toLowerCase();
  btn.disabled = true;
  if (word.includes(ch)) {
    for (let i=0;i<word.length;i++) if(word[i]===ch) displayedWord[i]=ch;
    updateDisplayedWord();
    checkWin();
  } else {
    wrongGuesses++;
    updateProgressBar();
    checkLoss();
  }
}

// ---- Win/Loss + reklamy ----
function checkWin() {
  if (!displayedWord.includes("_")) {
    messageEl.textContent = `Gratulacje, ${userName||"graczu"}! Wygrałeś!`;
    disableAllLetterButtons();
    setTimeout(()=>{
      questionCount++; saveGameState(); updateLevelDisplay();
      if (questionCount%3===0) show_9373354({type:'inApp',inAppSettings:{frequency:1,capping:0,interval:120,timeout:1,everyPage:false}});
      if(questionCount>=100*maxLevel) {
        messageEl.textContent="Brawo! Ukończyłeś wszystkie pytania!";
      } else initGame();
    },2000);
  }
}
function checkLoss() {
  if (wrongGuesses>=maxWrong) {
    disableAllLetterButtons();
    messageEl.textContent="Przegrałeś!";
    setTimeout(initGame,2000);
  }
}

// ---- Podpowiedź Rewarded ----
function revealHint() {
  for(let i=0;i<word.length;i++) if(displayedWord[i]==="_"){
    displayedWord[i]=word[i]; updateDisplayedWord(); break;
  }
  checkWin();
}
function handleHintClick() {
  if(displayedWord.includes("_")) {
    show_9373354();
    revealHint();
  }
}

// ---- Mieszanie tablicy ----
function shuffleArray(a) {
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

// ---- Tworzenie przycisków liter z ograniczeniem dla ≤5 ----
function createLetterButtons() {
  lettersContainerEl.innerHTML="";
  const extAlpha = "abcdefghijklmnopqrstuvwxyząćęłńóśźż".split("");
  const correctSet = new Set(word.split("").filter(c=>/[a-ząćęłńóśźż]/i.test(c)).map(c=>c.toLowerCase()));
  let choices;
  if (word.length<=5) {
    const uniq = Array.from(correctSet);
    const pool = extAlpha.filter(c=>!correctSet.has(c));
    shuffleArray(pool);
    choices = shuffleArray(uniq.concat(pool.slice(0, Math.min(5,pool.length))));
  } else {
    choices = extAlpha;
  }
  choices.forEach(ch=>{
    const b=document.createElement("button");
    b.textContent=ch; b.className="letter-btn";
    b.disabled=displayedWord.includes(ch)||wrongGuesses>=maxWrong;
    b.addEventListener("click",handleLetterClick);
    lettersContainerEl.appendChild(b);
  });
}

// ---- Obsługa nazwy użytkownika ----
if (userName) {
  usernameDisplayEl.textContent=`Witaj, ${userName}!`;
  usernameContainerEl.style.display="none";
}
setUsernameBtn.addEventListener("click",()=>{
  const v=usernameInputEl.value.trim();
  if(!v) return;
  userName=v; localStorage.setItem("userName",v);
  usernameDisplayEl.textContent=`Witaj, ${userName}!`;
  usernameContainerEl.style.display="none";
});

// ---- Rozszerzenie Telegram SDK ----
window.Telegram.WebApp.expand();

// ---- Inicjalizacja gry ----
hintBtn.addEventListener("click",handleHintClick);
initGame();
