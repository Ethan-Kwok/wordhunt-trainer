let trieRoot;

const pointValues = [
  0, 0, 0, 100, 400, 800, 1400, 1800, 2200, 2600, 3000, 3400, 3800, 4200, 4600,
  5000, 5400, 5800, 6200, 6600, 7000, 7400, 7800, 8200, 8600, 9000,
];

const mean4x4PointTotal = 73000;
const std4x4PointTotal = 50000;
const min4x4PointTotal = 8000;
const mean5x5PointTotal = 186000;
const std5x5PointTotal = 107000;
const min5x5PointTotal = 16000;

function buildTrieFromStaticFile() {
  // Fetch the static file
  return fetch("ModifiedCollins2019.txt")
    .then((response) => response.text())
    .then((text) => {
      const startTime = performance.now();
      const words = text.split("\n");
      trieRoot = new TrieNode();
      for (const word of words) {
        if (word) trieRoot.addWord(word);
      }
      const endTime = performance.now();
      console.log(
        "Trie has been built in",
        endTime - startTime,
        "milliseconds."
      );
    })
    .catch((error) => {
      console.error("Error building the Trie:", error);
    });
}

class BoardGenerator {
  // Letter frequencies as tracked from 200 Wordhunt boards. See SampleBoardsStats.csv and SampleBoards.txt
  static letterCounts = {
    E: 649,
    A: 516,
    T: 515,
    O: 481,
    I: 462,
    S: 440,
    N: 431,
    R: 383,
    H: 379,
    D: 291,
    L: 266,
    U: 196,
    C: 194,
    F: 170,
    W: 169,
    M: 159,
    P: 140,
    Y: 137,
    G: 133,
    B: 121,
    V: 77,
    K: 54,
    X: 12,
    J: 10,
    Q: 8,
    Z: 7,
  };

  // gridQuality is the minimum number of standard deviations better than the mean that a board has to be.
  static generateBoardLetters(gridSize, minimumGridQuality) {
    let letters = [];
    let weightedLetters = BoardGenerator.createWeightedLetterList(
      this.letterCounts
    );
    BoardGenerator.shuffleArray(weightedLetters);

    let boardGoodEnough = false;
    let possibleWords = [];
    let pointTotal = 0;
    while (!boardGoodEnough) {
      letters = [];
      for (let i = 0; i < gridSize * gridSize; i++) {
        letters.push(
          weightedLetters[Math.floor(Math.random() * weightedLetters.length)]
        );
      }
      let board = [];
      // To hard code a board, update and uncomment this array:
      // letters = ['😃', 'S', 'I', 'Y', 'U', 'P', 'L', 'L', 'N', 'L', 'O', 'S', 'A', 'I', 'M', 'U'];
      for (let i = 0; i < gridSize; i++) {
        board.push(letters.slice(i * gridSize, (i + 1) * gridSize));
      }
      possibleWords = this.findWordsOnBoard(board);
      pointTotal = this.calculatePointTotal(possibleWords);

      let stdPointTotal = 0;
      let meanPointTotal = 0;
      let minPointTotal = 0;
      if (gridSize == 4) {
        stdPointTotal = std4x4PointTotal;
        meanPointTotal = mean4x4PointTotal;
        minPointTotal = min4x4PointTotal;
      } else if (gridSize == 5) {
        stdPointTotal = std5x5PointTotal;
        meanPointTotal = mean5x5PointTotal;
        minPointTotal = min5x5PointTotal;
      }
      if (
        pointTotal >= meanPointTotal + minimumGridQuality * stdPointTotal &&
        pointTotal >= minPointTotal
      ) {
        boardGoodEnough = true;
      }
    }

    this.sortWords(possibleWords);
    return { letters, possibleWords, pointTotal };
  }

  static createWeightedLetterList(letterCounts) {
    let weightedLetters = [];
    for (const letter in letterCounts) {
      const count = letterCounts[letter];
      for (let i = 0; i < count; i++) {
        weightedLetters.push(letter);
      }
    }
    return weightedLetters;
  }

  static shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  static findWordsOnBoard(board) {
    const visited = board.map((row) => row.map(() => false));
    const result = new Set();

    const dfs = (i, j, node, path = "") => {
      if (
        i < 0 ||
        i >= board.length ||
        j < 0 ||
        j >= board[i].length ||
        visited[i][j] ||
        !node
      )
        return;
      visited[i][j] = true;

      const char = board[i][j];
      node = node.children[char];

      if (node && node.isWord) {
        result.add(path + char);
      }

      for (const [di, dj] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        dfs(i + di, j + dj, node, path + char);
      }

      visited[i][j] = false;
    };

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        dfs(i, j, trieRoot);
      }
    }

    return Array.from(result); // Convert Set back to an Array
  }

  static calculatePointTotal(wordList) {
    let total = 0;
    wordList.forEach((word) => {
      total += pointValues[word.length];
    });
    return total;
  }

  static sortWords(words) {
    return words.sort((a, b) => {
      // First, compare by length in descending order
      if (b.length !== a.length) {
        return b.length - a.length;
      }
      // If lengths are equal, compare alphabetically in ascending order
      return a.localeCompare(b);
    });
  }
}

class TrieNode {
  constructor() {
    this.children = {};
    this.isWord = false;
    this.refs = 0;
  }

  addWord(word) {
    word = word.trim();
    let cur = this;
    cur.refs += 1;
    for (const c of word) {
      if (!(c in cur.children)) {
        cur.children[c] = new TrieNode();
      }
      cur = cur.children[c];
      cur.refs += 1;
    }
    cur.isWord = true;
  }

  removeWord(word) {
    let cur = this;
    cur.refs -= 1;
    for (const c of word) {
      if (c in cur.children) {
        cur = cur.children[c];
        cur.refs -= 1;
      }
    }
  }
}

class Game {
  static CURR_WORD_FADEOUT_TIME = 0.25;

  constructor(gridId) {
    this.grid = document.getElementById(gridId);
    this.gridRect = grid.getBoundingClientRect();
    this.gridSize = 4; // Default = 4x4
    this.letterGrid = [];
    this.currWordTextBox = document.getElementById("currWordTextBox");
    this.scoreDisplayTextBox = document.getElementById("scoreDisplayTextBox");
    this.wordsText = document.getElementById("wordsText");
    this.scoreText = document.getElementById("scoreText");
    this.totalPossiblePointsTextBox = document.getElementById("totalPossiblePointsTextBox");
    this.timerTextBox = document.getElementById("timer");
    this.gridCover = document.getElementById("gridCover");
    this.initialCountdownTime = 80;
    this.activeSolves = []; // This needs to be carried over between games to stop autoSolves

    this.init();
  }

  // Sets the box sizes, letter container size, and currWord position based on if the board is 4x4 or 5x5.
  updateGameElementSizes() {
    const lettersContainer = document.getElementById("lettersContainer");
    if (this.gridSize == 5) {
      this.grid.classList.add("five-by-five");
      lettersContainer.classList.add("wide");
      this.currWordTextBox.classList.add("high");
    } else {
      this.grid.classList.remove("five-by-five");
      lettersContainer.classList.remove("wide");
      this.currWordTextBox.classList.remove("high");
    }
  }

  init() {
    this.clearGrid();
    this.totalPoints = 0;
    this.foundWordsTrieRoot = null;
    this.numWordsFound = 0;
    this.updateScore();
    this.toggleLineColor("fail");
    this.currWord = "";
    this.lastActiveBox = null;
    this.isMouseDown = false;
    this.gridCover.style.display = "none";
    this.currentLineContainer;

    if (document.getElementById("boardSizeCheckBox").checked) {
      this.gridSize = 5;
    } else {
      this.gridSize = 4;
    }

    const minimumBoardQualitySlider = document.getElementById("minimumQualitySlider");
    const secretMinimumQualitySlider = document.getElementById("secretMinimumQualitySlider");
    const minimumBoardQualityValue = Math.max(minimumBoardQualitySlider.value, secretMinimumQualitySlider.value);

    const boardQualitySliderScale = 0.1;

    const { letters, possibleWords, pointTotal } =
      BoardGenerator.generateBoardLetters(
        this.gridSize,
        boardQualitySliderScale * minimumBoardQualityValue
      );
    this.boardLetters = letters;
    this.possibleWords = possibleWords;
    this.pointTotal = pointTotal;
    this.wordElementsMap = new Map();

    this.totalPossiblePointsTextBox.textContent = `Total Possible Points: ${pointTotal}`;

    this.generateBlankWordList(this.possibleWords);
    this.generatePointList(this.possibleWords);

    this.foundWordsTrieRoot = new TrieNode();
    this.updateGameElementSizes();
    this.createGrid(this.boardLetters);
    this.addEventListeners();

    if (document.getElementById("timerCheckBox").checked) {
      this.timerTextBox.style.display = "flex";
      this.startTimer(this.initialCountdownTime);
    } else {
      this.timerTextBox.style.display = "none";
    }

    this.initBoxCenters();

    this.initAudio();

    this.initLineContainer();

    this.cancelAllAutoSolves();
    const autoSolverSpeed = document.getElementById("autoSolverSpeedSlider").value; // CPS
    this.autoSolverDelayPerCharacter = 1000 / autoSolverSpeed; // MS delay between characters
    this.autoSolverOn = false;
    if (document.getElementById("autoSolverCheckBox").checked) {
      this.autoSolverOn = true;
      this.autoSolve();
    }
  }

  initBoxCenters() {
    const boxes = document.querySelectorAll("#grid .box");
    this.boxCenters = Array.from(boxes).map((box) => {
      const rect = box.getBoundingClientRect();
      return {
        box: box,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };
    });
  }

  initAudio() {
    this.audio_activate_nonword_box = new Howl({
      src: ["audio/activate-nonword-box.mp3"],
      preload: true,
    });
    this.audio_activate_valid_word_box = new Howl({
      src: ["audio/activate-valid-word-box.mp3"],
      preload: true,
    });
    this.audio_submit_nonword = new Howl({
      src: ["audio/submit-nonword.mp3"],
      preload: true,
    });
    this.audio_100 = new Howl({
      src: ["audio/100.mp3"],
      preload: true,
    });
    this.audio_400 = new Howl({
      src: ["audio/400.mp3"],
      preload: true,
    });
    this.audio_800 = new Howl({
      src: ["audio/800.mp3"],
      preload: true,
    });
    this.audio_1400 = new Howl({
      src: ["audio/1400.mp3"],
      preload: true,
    });
    this.audio_1800 = new Howl({
      src: ["audio/1800.mp3"],
      preload: true,
    });
    this.audio_2200 = new Howl({
      src: ["audio/2200+.mp3"],
      preload: true,
    });
    this.audio_low_on_time = new Howl({
      src: ["audio/low-on-time.mp3"],
      preload: true,
    });
  }

  playAudioForValidWord(points) {
    switch (points) {
      case 100:
        this.audio_100.play();
        break;
      case 400:
        this.audio_400.play();
        break;
      case 800:
        this.audio_800.play();
        break;
      case 1400:
        this.audio_1400.play();
        break;
      case 1800:
        this.audio_1800.play();
        break;
      default:
        this.audio_2200.play();
    }
  }

  clearGrid() {
    while (this.grid.firstChild) {
      this.grid.removeChild(this.grid.firstChild);
    }
  }

  // Create nxn grid of letters
  createGrid(letters) {
    let index = 0;
    for (let i = 0; i < this.gridSize; i++) {
      let row = [];
      for (let j = 0; j < this.gridSize; j++) {
        const letter = letters[index++];
        row.push(letter);
        const box = this.createBox(letter, i, j);
        this.grid.appendChild(box);
      }
      this.letterGrid.push(row);
    }
  }

  // Create individual letter boxes
  createBox(letter, row, col) {
    const box = document.createElement("div");
    box.classList.add("box");
    box.textContent = letter;
    box.dataset.row = row;
    box.dataset.column = col;

    if (this.gridSize === 5) {
      box.classList.add("small");
    }

    return box;
  }

  initLineContainer() {
    // initialize line container
    this.lineContainer = document.createElement("div");
    this.lineContainer.className = "line-container";

    this.grid.appendChild(this.lineContainer);
  }

  addEventListeners() {
    document.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    document.addEventListener("mouseup", () => this.handleMouseUp());
    document.addEventListener("touchstart", (e) => this.handleTouchStart(e));
    document.addEventListener("touchend", () => this.handleTouchEnd());
    document.addEventListener("touchmove", (e) => this.handleTouchMove(e));
    document.addEventListener("touchcancel", () => this.handleTouchEnd());

    this.grid.querySelectorAll(".box").forEach((box) => {
      box.addEventListener("mousemove", (e) => this.handleMouseMove(e, box));
    });
    // Fixes bug where changing the window size will offset the box centers for input detection
    window.addEventListener('resize', () => this.initBoxCenters());
  }

  // Input detection
  handleMouseDown(e) {
    if (this.autoSolverOn) {
      return;
    }
    this.fadeOutLines(this.lineContainer);
    // When touching anywhere within the grid, activate the box nearest the initial touch.
    if (document.getElementById("grid").contains(e.target)) {
      this.isMouseDown = true;
      const box = this.findClosestBox(e.clientX, e.clientY);
      if (box && !box.classList.contains("active")) {
        this.activateBox(box);
      }
      this.initLineContainer();
    }
  }
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.handleMouseDown(touch);
  }

  handleMouseMove(e, box) {
    if (
      this.isMouseDown &&
      !box.classList.contains("active") &&
      this.isInCenter(e, box) &&
      this.isAdjacent(box, this.lastActiveBox)
    ) {
      this.activateBox(box);
    }
  }
  handleTouchMove(e) {
    const touch = e.touches[0];
    const boxes = this.grid.querySelectorAll(".box");
    // We can't attach the touchmove listeners to each box individually because only 1 runs at 
    // a time. So we attach it to the document itself and adjust.
    boxes.forEach((box) => {
      if (
        this.isMouseDown &&
        !box.classList.contains("active") &&
        this.isInCenter(touch, box) &&
        this.isAdjacent(box, this.lastActiveBox)
      ) {
        this.activateBox(box);
      }
    });
  }

  handleMouseUp() {
    if (this.autoSolverOn) {
      return;
    }
    this.confirmWord();
  }
  handleTouchEnd() {
    if (this.autoSolverOn) {
      return;
    }
    this.confirmWord();
  }
  confirmWord() {
    this.isMouseDown = false;
    this.lastActiveBox = null;
    if (
      this.isWord(this.currWord, trieRoot) &&
      !this.isWord(this.currWord, this.foundWordsTrieRoot)
    ) {
      this.numWordsFound += 1;
      const pointValue = pointValues[this.currWord.length];
      this.updateScore(pointValue);
      this.foundWordsTrieRoot.addWord(this.currWord);
      this.displayFoundWord(this.currWord);
      this.playAudioForValidWord(pointValue);
    } else if (this.currWord.length >= 2) {
      this.audio_submit_nonword.play();
    }
    this.clearCurrWord();
    this.grid
      .querySelectorAll(".box")
      .forEach((box) => box.classList.remove("active"));
    this.fadeOutLines(this.lineContainer);
  }

  findClosestBox(x, y) {
    let closestBox = null;
    let closestDistance = Infinity;

    this.boxCenters.forEach(({ box, centerX, centerY }) => {
      const distance = Math.abs(centerX - x) + Math.abs(centerY - y);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestBox = box;
      }
    });

    return closestBox;
  }

  isAdjacent(box1, box2) {
    if (!box2) return true;
    let row1 = parseInt(box1.dataset.row);
    let col1 = parseInt(box1.dataset.column);
    let row2 = parseInt(box2.dataset.row);
    let col2 = parseInt(box2.dataset.column);
    return Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1;
  }

  isInCenter(e, box) {
    const boxRect = box.getBoundingClientRect();
    const centerX = boxRect.left + boxRect.width / 2;
    const centerY = boxRect.top + boxRect.height / 2;
    const clickX = e.clientX;
    const clickY = e.clientY;
    const distance = Math.sqrt(
      Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2)
    );
    const centerThreshold = boxRect.width / 1.9; // What counts as "center" for input detection; tweak as needed

    return distance < centerThreshold;
  }

  activateBox(box) {
    if (this.lastActiveBox) {
      this.drawLine(this.lastActiveBox, box);
    }
    box.classList.add("active");
    this.currWord += box.textContent;
    this.updateCurrWord();
    if (this.isWord(this.currWord, trieRoot)) {
      if (this.isWord(this.currWord, this.foundWordsTrieRoot)) {
        this.toggleLineColor("repeated");
        this.audio_activate_nonword_box.play();
      } else {
        this.toggleLineColor("success");
        this.audio_activate_valid_word_box.play();
      }
    } else {
      this.toggleLineColor("fail");
      this.audio_activate_nonword_box.play();
    }
    this.lastActiveBox = box;
  }

  fadeOutLines(lineContainer) {
    lineContainer.style.transition = `opacity ${Game.CURR_WORD_FADEOUT_TIME}s ease-out`; //TODO
    lineContainer.classList.add("fade-out");

    setTimeout(() => {
      lineContainer.remove();
    }, 1000 * Game.CURR_WORD_FADEOUT_TIME);
  }

  updateScore(addedScore = 0) {
    // Animate the score display box by incrementing the score until it reaches the new value. The amount that it
    // increments by is given by a function of elapsed time t in seconds: f(t) = addedScore * (1 - e^(-6.32t)).
    const growthRate = 6.32;
    const startScore = this.totalPoints;
    const endScore = this.totalPoints + addedScore;
    this.totalPoints += addedScore;
    const startTime = performance.now();

    const animateScore = (currentTime) => {
      const elapsedTime = (currentTime - startTime) / 1000;
      const currentDisplayedScore = Math.floor(
        startScore + addedScore * (1 - Math.exp(-growthRate * elapsedTime))
      );

      // The incrementation stops once the current displayed score is less than 5 under the end score.
      if (Math.abs(endScore - currentDisplayedScore) < 5) {
        const finalFormattedScore = endScore.toString().padStart(4, "0");
        this.wordsText.textContent = `WORDS: ${this.numWordsFound}`;
        this.scoreText.textContent = `SCORE: ${finalFormattedScore}`;
        return;
      } else {
        const formattedScore = currentDisplayedScore
          .toString()
          .padStart(4, "0");
        this.wordsText.textContent = `WORDS: ${this.numWordsFound}`;
        this.scoreText.textContent = `SCORE: ${formattedScore}`;
      }

      requestAnimationFrame(animateScore);
    };

    requestAnimationFrame(animateScore);
  }

  toggleLineColor(state) {
    this.grid.classList.remove("use-success-color", "use-repeated-word-color");
    this.currWordTextBox.classList.remove(
      "use-success-color",
      "use-repeated-word-color"
    );
    if (state === "success") {
      this.grid.classList.add("use-success-color");
      this.currWordTextBox.classList.add("use-success-color");
    } else if (state === "repeated") {
      this.grid.classList.add("use-repeated-word-color");
      this.currWordTextBox.classList.add("use-repeated-word-color");
    }
  }

  drawLine(box1, box2) {
    const lineWidth = 1.4
    const line = document.createElement("div");
    line.className = "line";

    const x1 = box1.offsetLeft + box1.offsetWidth / 2;
    const y1 = box1.offsetTop + box1.offsetHeight / 2;
    const x2 = box2.offsetLeft + box2.offsetWidth / 2;
    const y2 = box2.offsetTop + box2.offsetHeight / 2;

    const length = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    const angle = (Math.atan2(y2 - y1, x2 - x1));

    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}rad) translateY(-50%)`;
    line.style.position = "absolute";
    line.style.top = `${y1}px`;
    line.style.left = `${x1}px`;

    this.lineContainer.appendChild(line);

    // Add line caps to make ends of lines round
    const lineCap1 = document.createElement("div");
    lineCap1.className = "line-cap";
    lineCap1.style.top = `calc(${y1}px - ${lineWidth / 2}vh)`;
    lineCap1.style.left = `calc(${x1}px - ${lineWidth / 2}vh)`;

    const lineCap2 = document.createElement("div");
    lineCap2.className = "line-cap";
    lineCap2.style.top = `calc(${y2}px - ${lineWidth / 2}vh)`;
    lineCap2.style.left = `calc(${x2}px - ${lineWidth / 2}vh)`;

    this.lineContainer.appendChild(lineCap1);
    this.lineContainer.appendChild(lineCap2);
  }

  clearCurrWord() {
    this.currWordTextBox.style.transition = `opacity ${Game.CURR_WORD_FADEOUT_TIME}s ease-out`;
    this.currWordTextBox.classList.add("fade-out");
    this.currWord = "";
    setTimeout(() => {
      document.body.className = "";
    }, 1000 * Game.CURR_WORD_FADEOUT_TIME);
  }

  updateCurrWord() {
    this.currWordTextBox.value = this.currWord;

    if (this.currWord === "") {
      // If empty, fade out the textbox
      this.currWordTextBox.style.transition = `opacity ${Game.CURR_WORD_FADEOUT_TIME}s ease-out`;
      this.currWordTextBox.classList.add("fade-out");
      setTimeout(() => {
        document.body.className = "";
      }, 1000 * Game.CURR_WORD_FADEOUT_TIME);
    } else {
      if (
        this.isWord(this.currWord, trieRoot) &&
        !this.isWord(this.currWord, this.foundWordsTrieRoot)
      ) {
        let pointValue = pointValues[this.currWord.length];
        this.currWordTextBox.value += " (+" + pointValue + ")";
      }

      this.currWordTextBox.style.visibility = "visible";
      this.currWordTextBox.style.transition = "";
      // this.currWordTextBox.style.opacity = 1;
      this.currWordTextBox.classList.remove("fade-out");

      // Create a temporary span element to dynamically change the size of the textbox to fit the text
      const tempSpan = document.createElement("span");
      document.body.appendChild(tempSpan);
      tempSpan.style.font = window.getComputedStyle(this.currWordTextBox).font;
      tempSpan.style.visibility = "hidden";
      tempSpan.style.whiteSpace = "pre";
      tempSpan.textContent = this.currWordTextBox.value;
      const textWidth = tempSpan.offsetWidth;
      document.body.removeChild(tempSpan);

      this.currWordTextBox.style.width = textWidth + "px";
    }
  }

  isWord(word, root) {
    word = word.toUpperCase().trim();
    let node = root;
    if (root == null) {
      return false;
    }
    for (const char of word) {
      if (!node.children[char]) {
        return false;
      }
      node = node.children[char];
    }
    return node.isWord;
  }

  revealAllWords(words = this.possibleWords) {
    const covers = document.querySelectorAll(".word-element-cover");
    covers.forEach((cover) => cover.remove());
    words.forEach((word) => {
      if (!this.isWord(word, this.foundWordsTrieRoot)) {
        const wordElement = this.wordElementsMap.get(word);
        wordElement.classList.add("revealed-word");
      }
      this.foundWordsTrieRoot.addWord(word);
    });
  }

  generateBlankWordList(words = this.possibleWords) {
    this.clearWordList();
    const wordList = document.getElementById("wordList");
    this.wordElementsMap.clear();

    words.forEach((word) => {
      const wordElement = document.createElement("div");
      wordElement.textContent = word;
      wordElement.className = "word-element";
      const wordElementCover = document.createElement("div");
      wordElementCover.className = "word-element-cover";
      wordElementCover.addEventListener("click", () =>
        this.revealWord(wordElementCover, word)
      );
      wordElementCover.textContent = "?";
      wordElement.appendChild(wordElementCover);

      this.wordElementsMap.set(word, wordElement);
      wordList.appendChild(wordElement);
    });
  }

  revealWord(wordElementCover, word) {
    this.foundWordsTrieRoot.addWord(word);
    wordElementCover.remove();
    const wordElement = this.wordElementsMap.get(word);
    wordElement.classList.add("revealed-word");
  }

  displayFoundWord(word) {
    if (!this.wordElementsMap.has(word)) {
      console.error('ERROR: "' + word + '" is not a possible word!');
      return;
    }
    const wordElement = this.wordElementsMap.get(word);
    wordElement.textContent = word;
  }

  generatePointList(words = this.possibleWords) {
    this.clearPointList();
    const pointList = document.getElementById("pointList");

    words.forEach((word) => {
      const pointElement = document.createElement("div");
      pointElement.className = "point-element";
      pointElement.textContent = pointValues[word.length];
      pointList.appendChild(pointElement);
    });
  }

  clearWordList() {
    const wordList = document.getElementById("wordList");
    wordList.textContent = "";
  }

  clearPointList() {
    const pointList = document.getElementById("pointList");
    pointList.textContent = "";
  }

  startTimer(duration) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.gridCover.style.display = "none";
    let remainingTime = duration;

    const updateTimerDisplay = () => {
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      this.timerTextBox.textContent = `${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;
    };

    this.timerInterval = setInterval(() => {
      if (this.isPaused) return; // Skip updates if paused
      if (remainingTime > 0 && document.getElementById("timerCheckBox").checked) {
        remainingTime--;
        updateTimerDisplay();
        if (remainingTime === 4) {
          this.audio_low_on_time.play();
        }
      } else if (document.getElementById("timerCheckBox").checked) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.handleMouseUp();
        this.gridCover.style.display = "block";
      }
    }, 1000);

    updateTimerDisplay();
  }

  pauseTimer() {
    if (this.timerInterval || this.autoSolverOn) {
      this.isPaused = true;
    }
  }

  unpauseTimer() {
    if (this.timerInterval || this.autoSolverOn) {
      this.isPaused = false;
    }
  }

  cancelAllAutoSolves() {
    // Abort all active solves
    this.activeSolves.forEach(controller => {
      controller.abort();
    });
    this.activeSolves = []; // Clear the array of active controllers
  }

  async autoSolve() {
    // Controller to allow all solves to be canceled on demand
    const controller = new AbortController();
    this.activeSolves.push(controller);

    let board = [];
    let boxCentersGrid = [];
    for (let i = 0; i < this.gridSize; i++) {
      board.push(this.boardLetters.slice(i * this.gridSize, (i + 1) * this.gridSize));
      boxCentersGrid.push(this.boxCenters.slice(i * this.gridSize, (i + 1) * this.gridSize));
    }

    const visited = board.map((row) => row.map(() => false));
    const result = new Set();
  
    const waitWhilePaused = async () => {
      while (this.isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Check every 100ms
      }
    };
  
    const dfs = async (i, j, node, path = "", boxCentersPassed = []) => {
      if (
        i < 0 ||
        i >= board.length ||
        j < 0 ||
        j >= board[i].length ||
        visited[i][j] ||
        !node
      ) {
        return;
      }
      visited[i][j] = true;
  
      const char = board[i][j];
      const currBoxCenter = boxCentersGrid[i][j];
      node = node.children[char];
  
      // If a word is found, simulate mouse/touch to form the word
      if (node && node.isWord && !result.has(path + char)) {
        result.add(path + char);
        boxCentersPassed.push(currBoxCenter);

        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        for (let index = 0; index < boxCentersPassed.length; index++) {
          // Handle pausing
          if (this.isPaused) {
            this.confirmWord();
            index = 0;
            await waitWhilePaused();
          }
          if (controller.signal.aborted) {
            return;
          }
          const boxCenter = boxCentersPassed[index];
          if (index === 0) {
            this.fadeOutLines(this.lineContainer);
            this.initLineContainer()
            // this.isMouseDown = true;
          }
          const box = this.findClosestBox(boxCenter.centerX, boxCenter.centerY);
          if (box && !box.classList.contains("active")) {
            this.activateBox(box);
          }
          await delay(this.autoSolverDelayPerCharacter);
        }
        this.confirmWord();
        await delay(this.autoSolverDelayPerCharacter);
      }
  
      for (const [di, dj] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        if (controller.signal.aborted) {
          return;
        }
        await dfs(i + di, j + dj, node, path + char, [...boxCentersPassed, currBoxCenter]); // Pause in recursive calls
      }
  
      visited[i][j] = false;
    };
  
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (controller.signal.aborted) {
          return;
        }
        await waitWhilePaused();
        await dfs(i, j, trieRoot); // Pause between starting DFS from different cells
      }
    }
  
    return;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  // Create "Game"
  await buildTrieFromStaticFile();
});

document.getElementById("startButton").addEventListener("click", function() {
  document.getElementById("howToPlayBackground").remove();

  const game = new Game("grid");

  // Restart button
  document.getElementById("restartButton").addEventListener("click", function () {
    game.init(); // Reinitialize the game with the current mode
  });

  // Word panel
  document.querySelector(".word-panel-toggle").addEventListener("click", () => {
    document
      .querySelector("#phoneScreen")
      .classList.toggle("word-panel-opened");
  });

  // Reveal words button
  document
    .getElementById("revealAllWordsButton")
    .addEventListener("click", function () {
      game.revealAllWords(game.possibleWords);
    });

  // Settings menu functionality
  const settingsMenu = document.getElementById("settingsMenu");
  const settingsScreenCover = document.getElementById("settingsScreenCover");
  
  // Settings button
  const settingsButton = document.querySelector(".settings-button");
  settingsButton.addEventListener("click", () => {
    if (
      settingsScreenCover.style.display === "none" ||
      !settingsScreenCover.style.display
    ) {
      settingsScreenCover.style.display = "flex";
      game.pauseTimer();
    }
  });

  // Board quality info popup
  const boardQualityInfoPopup = document.getElementById("boardQualityInfoPopup"); // For "board quality info button"
  const boardQualityInfoButton = document.querySelector(
    ".board-quality-info-button"
  );
  const closeBoardQualityInfoButton = document.querySelector(
    ".close-board-quality-info-button"
  );
  boardQualityInfoButton.addEventListener("click", () => {
    boardQualityInfoPopup.classList.add("show");
  });
  closeBoardQualityInfoButton.addEventListener("click", () => {
    boardQualityInfoPopup.classList.remove("show");
  });
  // If the settings menu is clicked, then the user clicked outside the info popup so close the popup.
  settingsMenu.addEventListener("click", (event) => {
    if (event.target === settingsMenu) {
      boardQualityInfoPopup.classList.remove("show");
    }
  });

  // Board quality slider sync
  const minQualitySlider = document.getElementById("minimumQualitySlider");
  const minQualitySliderValue = document.getElementById("sliderValue");

  // Update text input when slider moves
  function getBoardQualityCategory(minQualitySliderValue) {
    const value = parseInt(minQualitySliderValue);
    let boardQualityCategory;
    if (value <= -5) {
      boardQualityCategory = "Any";
    } else if (value <= 5) {
      boardQualityCategory = "Average";
    } else if (value <= 15) {
      boardQualityCategory = "Good";
    } else if (value <= 25) {
      boardQualityCategory = "Great";
    } else if (value <= 35) {
      boardQualityCategory = "Amazing";
    } else if (value <= 45) {
      boardQualityCategory = "Pro";
    } else {
      boardQualityCategory = "WTF"
    }
    return boardQualityCategory;
  }
  minQualitySlider.addEventListener("input", () => {
    minQualitySliderValue.textContent = getBoardQualityCategory(minQualitySlider.value);
  });

  // Closing settings menu
  const settingsBackButton = document.getElementById("settingsBackButton");
  const settingsOkButton = document.getElementById("settingsOkButton");
  const timerCheckBox = document.getElementById("timerCheckBox");
  const boardSizeCheckBox = document.getElementById("boardSizeCheckBox");
  // Audio checkbox
  const audioCheckBox = document.getElementById("audioCheckBox");

  let currentSettings = {
    boardQuality: minQualitySlider.value,
    timerEnabled: timerCheckBox.checked,
    is5x5: boardSizeCheckBox.checked,
    audioEnabled: audioCheckBox.checked
  }; 

  // Detect when a user clicks out of the settings menu.
  settingsScreenCover.addEventListener("click", (event) => {
    if (event.target === settingsScreenCover) {
      if (boardQualityInfoPopup.classList.contains("show")) {
        // If the board quality info popup is open, then clicking out will only close out of the popup, not the menu.
        boardQualityInfoPopup.classList.remove("show");
      } else {
        // Clicking out of the settings menu will not save the new settings.
        closeSettingsWithoutSaving();
      }
    }
  });

  settingsBackButton.addEventListener("click", () => {
    closeSettingsWithoutSaving();
  });

  settingsOkButton.addEventListener("click", () => {
    saveAndCloseSettings();
  })

  function closeSettingsWithoutSaving() {
    minQualitySlider.value = currentSettings.boardQuality;
    minQualitySliderValue.textContent = getBoardQualityCategory(minQualitySlider.value);
    timerCheckBox.checked = currentSettings.timerEnabled;
    boardSizeCheckBox.checked = currentSettings.is5x5;
    audioCheckBox.checked = currentSettings.audioEnabled;

    settingsScreenCover.style.display = "none";
    boardQualityInfoPopup.classList.remove("show");
    game.unpauseTimer();
  }

  function saveAndCloseSettings() {
    let newBoardQuality = minQualitySlider.value;
    let newTimerEnabled = timerCheckBox.checked;
    let newIs5x5 = boardSizeCheckBox.checked;
    let newAudioEnabled = audioCheckBox.checked;

    // If any settings (besides audio) are changed, restart the game
    if (newBoardQuality !== currentSettings.boardQuality ||
        newTimerEnabled !== currentSettings.timerEnabled ||
        newIs5x5 !== currentSettings.is5x5) {
      game.init();
    }
    if (newAudioEnabled) {
      Howler.mute(false);
    } else {
      Howler.mute(true);
    }
    settingsScreenCover.style.display = "none";
    boardQualityInfoPopup.classList.remove("show");
    game.unpauseTimer();
    currentSettings = {
      boardQuality: newBoardQuality,
      timerEnabled: newTimerEnabled,
      is5x5: newIs5x5,
      audioEnabled: newAudioEnabled
    };
  }



  // Secret settings menu functionality
  const secretSettingsScreenCover = document.getElementById("secretSettingsScreenCover");
  
  // Secret settings button
  document.getElementById("secretSettingsButton").addEventListener("click", function () {
    if (
      secretSettingsScreenCover.style.display === "none" ||
      !secretSettingsScreenCover.style.display
    ) {
      secretSettingsScreenCover.style.display = "flex";
      game.pauseTimer();
    }
  });

  // Slider sync
  const secretMinQualitySlider = document.getElementById("secretMinimumQualitySlider");
  const secretMinQualitySliderValue = document.getElementById("secretSliderValue");
  const autoSolverSpeedSlider = document.getElementById("autoSolverSpeedSlider");
  const autoSolverSpeedSliderValue = document.getElementById("autoSolverSpeedSliderValue");

  // Update text input when slider moves
  secretMinQualitySlider.addEventListener("input", () => {
    secretMinQualitySliderValue.textContent = getBoardQualityCategory(secretMinQualitySlider.value);
  });
  autoSolverSpeedSlider.addEventListener("input", () => {
    autoSolverSpeedSliderValue.textContent = autoSolverSpeedSlider.value + " CPS";
  });

  // Closing secret settings menu
  const autoSolverCheckBox = document.getElementById("autoSolverCheckBox");
  const secretSettingsBackButton = document.getElementById("secretSettingsBackButton");
  const secretSettingsOkButton = document.getElementById("secretSettingsOkButton");

  let currentSecretSettings = {
    boardQuality: secretMinQualitySlider.value,
    autoSolverOn: autoSolverCheckBox.checked,
    autoSolverSpeed: autoSolverSpeedSlider.value
  }; 

  // Detect when a user clicks out of the secret settings menu.
  secretSettingsScreenCover.addEventListener("click", (event) => {
    if (event.target === secretSettingsScreenCover) {
        closeSecretSettingsWithoutSaving();
    }
  });

  secretSettingsBackButton.addEventListener("click", () => {
    closeSecretSettingsWithoutSaving();
  });

  secretSettingsOkButton.addEventListener("click", () => {
    saveAndCloseSecretSettings();
  })

  function closeSecretSettingsWithoutSaving() {
    secretMinQualitySlider.value = currentSecretSettings.boardQuality;
    secretMinQualitySliderValue.textContent = getBoardQualityCategory(secretMinQualitySlider.value);
    autoSolverCheckBox.checked = currentSecretSettings.autoSolverOn;
    autoSolverSpeedSlider.value = currentSecretSettings.autoSolverSpeed;

    secretSettingsScreenCover.style.display = "none";
    game.unpauseTimer();
  }

  function saveAndCloseSecretSettings() {
    let newBoardQuality = secretMinQualitySlider.value;
    let newAutoSolverOn = autoSolverCheckBox.checked;
    let newAutoSolverSpeed = autoSolverSpeedSlider.value;

    // If any settings are changed, restart the game
    if (newBoardQuality !== currentSecretSettings.boardQuality ||
        newAutoSolverOn !== currentSecretSettings.autoSolverOn ||
        newAutoSolverSpeed !== currentSecretSettings.autoSolverSpeed
    ) {
      game.init();
    }
    secretSettingsScreenCover.style.display = "none";
    game.unpauseTimer();
    currentSecretSettings = {
      boardQuality: newBoardQuality
    };
  }
});
