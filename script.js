const TIME_LIMIT = 64;

const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const timerFillElement = document.getElementById("timerFill");
const hintElement = document.getElementById("hint");
const scrambledWordElement = document.getElementById("scrambledWord");
const answerForm = document.getElementById("answerForm");
const answerInput = document.getElementById("answerInput");
const feedbackElement = document.getElementById("feedback");
const restartButton = document.getElementById("restartButton");

const gameOverModal = document.getElementById("gameOverModal");
const finalScoreElement = document.getElementById("finalScore");
const playAgainButton = document.getElementById("playAgainButton");

let words = [];
let availableWords = [];
let currentWord = null;
let score = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let isGameOver = false;

async function loadWords() {
  try {
    const response = await fetch("palavras.json");

    if (!response.ok) {
      throw new Error("Não foi possível carregar o arquivo palavras.json.");
    }

    words = await response.json();

    if (!Array.isArray(words) || words.length === 0) {
      throw new Error("O arquivo palavras.json está vazio ou inválido.");
    }

    startGame();
  } catch (error) {
    hintElement.textContent =
      "Erro ao carregar as palavras. Verifique se o arquivo palavras.json está na mesma pasta e se você abriu o projeto com Live Server.";
    scrambledWordElement.textContent = "ERRO";

    console.error(error);
  }
}

function startGame() {
  score = 0;
  isGameOver = false;

  answerInput.disabled = false;
  answerInput.value = "";

  scoreElement.textContent = score;
  gameOverModal.classList.add("hidden");

  availableWords = shuffleArray([...words]);

  nextRound();
}

function nextRound() {
  if (availableWords.length === 0) {
    availableWords = shuffleArray([...words]);
  }

  currentWord = availableWords.pop();

  const scrambled = scrambleWord(currentWord.palavra);

  hintElement.textContent = currentWord.dica;
  scrambledWordElement.textContent = scrambled;

  answerInput.disabled = false;
  answerInput.value = "";
  answerInput.focus();

  feedbackElement.textContent = "";
  feedbackElement.className = "feedback";

  resetTimer();
}

function resetTimer() {
  clearInterval(timerInterval);

  timeLeft = TIME_LIMIT;
  updateTimerView();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerView();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function updateTimerView() {
  timerElement.textContent = `${timeLeft}s`;

  const percentage = (timeLeft / TIME_LIMIT) * 100;
  timerFillElement.style.width = `${percentage}%`;

  if (timeLeft <= 10) {
    timerFillElement.style.background = "linear-gradient(90deg, #fb7185, #f97316)";
  } else if (timeLeft <= 25) {
    timerFillElement.style.background = "linear-gradient(90deg, #fbbf24, #f97316)";
  } else {
    timerFillElement.style.background = "linear-gradient(90deg, #7c3aed, #38bdf8)";
  }
}

function checkAnswer(event) {
  event.preventDefault();

  if (isGameOver || !currentWord) {
    return;
  }

  const userAnswer = normalizeText(answerInput.value);
  const correctAnswer = normalizeText(currentWord.palavra);

  if (!userAnswer) {
    showFeedback("Digite uma resposta antes de enviar.", "error");
    return;
  }

  if (userAnswer === correctAnswer) {
    const roundPoints = calculatePoints();

    score += roundPoints;
    scoreElement.textContent = score;

    showFeedback(`Correto! +${roundPoints} pontos.`, "success");

    clearInterval(timerInterval);

    setTimeout(() => {
      if (!isGameOver) {
        nextRound();
      }
    }, 700);
  } else {
    showFeedback("Errado. Tente novamente antes do tempo acabar.", "error");
    answerInput.select();
  }
}

function calculatePoints() {
  const basePoints = 10;
  const timeBonus = timeLeft;

  return basePoints + timeBonus;
}

function endGame() {
  if (isGameOver) {
    return;
  }

  clearInterval(timerInterval);

  isGameOver = true;
  answerInput.disabled = true;

  showFeedback(`Tempo esgotado. A resposta certa era: ${currentWord.palavra}.`, "error");

  setTimeout(() => {
    finalScoreElement.textContent = score;
    gameOverModal.classList.remove("hidden");
    answerInput.blur();
  }, 1500);
}

function showFeedback(message, type) {
  feedbackElement.textContent = message;
  feedbackElement.className = `feedback ${type}`;
}

function scrambleWord(word) {
  const cleanWord = word.trim();
  let letters = cleanWord.split("");

  if (letters.length <= 2) {
    return cleanWord;
  }

  let scrambled = cleanWord;

  while (normalizeText(scrambled) === normalizeText(cleanWord)) {
    letters = shuffleArray([...letters]);
    scrambled = letters.join("");
  }

  return scrambled;
}

function shuffleArray(array) {
  const newArray = [...array];

  for (let i = newArray.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [newArray[i], newArray[randomIndex]] = [newArray[randomIndex], newArray[i]];
  }

  return newArray;
}

function normalizeText(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

answerForm.addEventListener("submit", checkAnswer);

restartButton.addEventListener("click", startGame);

playAgainButton.addEventListener("click", startGame);

loadWords();