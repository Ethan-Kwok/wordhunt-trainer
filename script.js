let trieRoot;

const pointValues = [0, 0, 0, 100, 400, 800, 1400, 1800, 2200, 2600, 3000,
    3400, 3800, 4200, 4600, 5000, 5400, 5800, 6200, 6600,
    7000, 7400, 7800, 8200, 8600, 9000]

const mean4x4PointTotal = 73000;
const std4x4PointTotal = 50000;
const mean5x5PointTotal = 186000;
const std5x5PointTotal = 107000;

function buildTrieFromStaticFile() {
    // Fetch the static file
    return fetch('ModifiedCollins2019.txt')
        .then(response => response.text())
        .then(text => {
            const startTime = performance.now();
            const words = text.split('\n');
            trieRoot = new TrieNode();
            for (const word of words) {
                if (word) trieRoot.addWord(word);
            }
            const endTime = performance.now();
            console.log("Trie has been built in", endTime - startTime, "milliseconds.");
        })
        .catch(error => {
            console.error("Error building the Trie:", error);
        });
}

class BoardGenerator {
    // Letter frequencies as tracked from 200 Wordhunt boards. See SampleBoardsStats.csv and SampleBoards.txt
    static letterCounts = {
        'E': 649,
        'A': 516,
        'T': 515,
        'O': 481,
        'I': 462,
        'S': 440,
        'N': 431,
        'R': 383,
        'H': 379,
        'D': 291,
        'L': 266,
        'U': 196,
        'C': 194,
        'F': 170,
        'W': 169,
        'M': 159,
        'P': 140,
        'Y': 137,
        'G': 133,
        'B': 121,
        'V': 77,
        'K': 54,
        'X': 12,
        'J': 10,
        'Q': 8,
        'Z': 7
    };

    static generateBoardLetters(gridSize, mode) {
        let letters = [];
        let weightedLetters = BoardGenerator.createWeightedLetterList(this.letterCounts);
        BoardGenerator.shuffleArray(weightedLetters);
        
        let boardNotGoodEnough = true;
        let possibleWords = [];
        let pointTotal = 0;

        while (boardNotGoodEnough) {
            letters = [];
            for (let i = 0; i < gridSize * gridSize; i++) {
                letters.push(weightedLetters[Math.floor(Math.random() * weightedLetters.length)]);
            }
            let board = [];
            for (let i = 0; i < gridSize; i++) {
                board.push(letters.slice(i * gridSize, (i + 1) * gridSize));
            }
            possibleWords = this.findWordsOnBoard(board);
            pointTotal = this.calculatePointTotal(possibleWords);
            
            let stdPointTotal = 0;
            let meanPointTotal = 0;
            if (gridSize == 4) {
                stdPointTotal = std4x4PointTotal;
                meanPointTotal = mean4x4PointTotal;
            }
            else if (gridSize == 5) {
                stdPointTotal = std5x5PointTotal;
                meanPointTotal = mean5x5PointTotal;
            }
            switch(mode) {
                case "Average":
                    if (pointTotal >= meanPointTotal) {
                        boardNotGoodEnough = false;
                    }
                    break;
                case "Good":
                    if (pointTotal >= meanPointTotal + stdPointTotal) {
                        boardNotGoodEnough = false;
                    }
                  break;
                case "Great":
                    if (pointTotal >= meanPointTotal + 2 * stdPointTotal) {
                        boardNotGoodEnough = false;
                    }
                    break;
                case "Amazing":
                    if (pointTotal >= meanPointTotal + 3 * stdPointTotal) {
                        boardNotGoodEnough = false;
                    }
                    break;
                case "Experimental":
                    if (pointTotal >= meanPointTotal + 6 * stdPointTotal) {
                        boardNotGoodEnough = false;
                    }
                    break;
                default:
                    boardNotGoodEnough = false;
            }
        }


        this.sortWords(possibleWords);
        return {letters, possibleWords, pointTotal};
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
        const visited = board.map(row => row.map(() => false));
        const result = new Set();
    
        const dfs = (i, j, node, path = '') => {
            if (i < 0 || i >= board.length || j < 0 || j >= board[i].length || visited[i][j] || !node) return;
            visited[i][j] = true;
    
            const char = board[i][j];
            node = node.children[char];
    
            if (node && node.isWord) {
                result.add(path + char);
            }
    
            for (const [di, dj] of [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]) {
                dfs(i + di, j + dj, node, path + char);
            }
    
            visited[i][j] = false;
        };
    
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                dfs(i, j, trieRoot);
            }
        }
    
        return Array.from(result);  // Convert Set back to an Array
    }

    static calculatePointTotal(wordList) {
        let total = 0;
        wordList.forEach(word => {
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
        word = word.trim()
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
        this.gridSize = 4; // Default = 4x4
        this.letterGrid = [];
        this.currWordTextBox = document.getElementById('currWordTextBox');
        this.scoreDisplayTextBox = document.getElementById('scoreDisplayTextBox');
        this.init();
    }

    // Sets the box to 4x4 or 5x5 since css sucks
    updateBoxSize() {
        if (this.gridSize == 5) {

        // TODO
        // TODO
        // TODO
        // TODO
        // TODO
        } else {
            this.grid.style.gridTemplateColumns = `repeat(4, 21%)`;
            this.grid.style.gridTemplateRows = `repeat(4, 21%)`;
            this.grid.style.gap = '3.2%';

            // TODO
            // this.currWordTextBox.style.marginBottom = (this.gridSize * 75 + 120) + 'px';
        }
    }

    init() {
        this.clearGrid()
        this.totalPoints = 0;
        this.scoreDisplayTextBox.textContent = 'SCORE: 0';
        this.foundWordsTrieRoot = null;
        this.numWordsFound = 0;
        this.updateScoreDisplay();
        this.toggleLineColor('fail');
        this.currWord = "";
        this.lastActiveBox = null;
        this.isMouseDown = false;
        // TODO
        // this.gridSize = document.querySelector('input[name="boardDimension"]:checked').value;
        this.gridSize = 4;

        // TODO
        // const selectedMode = document.querySelector('input[name="boardRating"]:checked').value;
        const selectedMode = "Any";
        
        const { letters, possibleWords, pointTotal } = BoardGenerator.generateBoardLetters(this.gridSize, selectedMode);
        this.boardLetters = letters;
        this.possibleWords = possibleWords;
        this.pointTotal = pointTotal;
        this.wordElementsMap = new Map();

        // TODO
        // this.numLettersRevealed = 0;
        // this.generateBlankWordList(this.possibleWords);
        // this.generatePointList(this.possibleWords);
        // this.displayTotalPossiblePoints(this.pointTotal);
        
        this.foundWordsTrieRoot = new TrieNode();
        this.updateBoxSize();
        this.createGrid(this.boardLetters);
        this.addEventListeners();
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
        const box = document.createElement('div');
        box.classList.add('box');
        box.textContent = letter;
        box.dataset.row = row;
        box.dataset.column = col;
        return box;
    }

    addEventListeners() {
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchend', () => this.handleTouchEnd());
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.grid.querySelectorAll('.box').forEach(box => {
            box.addEventListener('mousemove', (e) => this.handleMouseMove(e, box));
            box.addEventListener('mousedown', (e) => this.handleBoxClick(e, box));
            box.addEventListener('touchstart', (e) => this.handleBoxTouch(e, box));
        });
    }


    // Input detection
    handleTouchStart(e) {
        const touch = e.touches[0];
        if (touch.target.classList.contains('box')) {
            this.isMouseDown = true;
        }
    }
    handleMouseDown(e) {
        if (e.target.classList.contains('box')) {
            this.isMouseDown = true;
        }
    }

    handleMouseMove(e, box) {
        if (this.isMouseDown) {
            this.activateBox(e, box);
        }
    }
    handleTouchMove(e) {
        const touch = e.touches[0];
        const boxes = this.grid.querySelectorAll('.box');
        
        // For some reason we can't attach the touchmove listeners to each box individually
        // because only 1 runs at a time. So we attach it to the document itself and adjust.
        boxes.forEach(box => {
            const rect = box.getBoundingClientRect();
            const isTouchWithinBox = touch.clientX >= rect.left &&
                                     touch.clientX <= rect.right &&
                                     touch.clientY >= rect.top &&
                                     touch.clientY <= rect.bottom;
    
            if (this.isMouseDown && isTouchWithinBox) {

                this.activateBox(touch, box);
            }
        });
    }

    handleBoxClick(e, box) {
        this.activateBox(e, box);
    }
    handleBoxTouch(e, box) {
        const touch = e.touches[0];
        this.activateBox(touch, box);
    }

    handleMouseUp() {
        this.isMouseDown = false;
        this.lastActiveBox = null;
        if (this.isWord(this.currWord, trieRoot) && !this.isWord(this.currWord, this.foundWordsTrieRoot)) {
            this.totalPoints += pointValues[this.currWord.length]
            this.numWordsFound += 1;
            
            this.foundWordsTrieRoot.addWord(this.currWord);
            this.updateScoreDisplay();
            // TODO
            // this.displayFoundWord(this.currWord);
        }
        this.clearCurrWord();
        this.grid.querySelectorAll('.box').forEach(box => box.classList.remove('active'));
        this.fadeOutLines();
    }
    handleTouchEnd() {
        this.handleMouseUp()
    }
    
    updateScoreDisplay() {
        const formattedScore = this.totalPoints.toString().padStart(4, '0');
        this.scoreDisplayTextBox.innerHTML = `
            <div class="words">WORDS: ${this.numWordsFound}</div>
            <div class="score">SCORE: ${formattedScore}</div>
        `;
    }
    
    fadeOutLines() {
        const lines = this.grid.querySelectorAll('.line');
        lines.forEach(line => {

            line.style.transition = `opacity ${Game.CURR_WORD_FADEOUT_TIME}s ease-out`;
        });
        lines.forEach(line => {
            line.classList.add('fade-out');
            setTimeout(() => {
                line.remove();
            }, (1000 * Game.CURR_WORD_FADEOUT_TIME));
        });
    }

    isAdjacent(box1, box2) {
        if (!box2) return true;
        let row1 = parseInt(box1.dataset.row);
        let col1 = parseInt(box1.dataset.column);
        let row2 = parseInt(box2.dataset.row);
        let col2 = parseInt(box2.dataset.column);
        return Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1;
    }

    /*
    isInCenter(e, box) {
        const boxRect = box.getBoundingClientRect();
        const centerX = boxRect.left + boxRect.width / 2;
        const centerY = boxRect.top + boxRect.height / 2;
        const clickX = e.clientX;
        const clickY = e.clientY;
        const distance = Math.sqrt(Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2));
        const centerThreshold = boxRect.width / 2; // What counts as "center" for input detection; tweak as needed
        
        return distance < centerThreshold;
    }*/

    activateBox(e, box) {
        if (!box.classList.contains('active') && this.isAdjacent(box, this.lastActiveBox)) {
            if (this.lastActiveBox) {
                this.drawLine(this.lastActiveBox, box);
            }
            box.classList.add('active');
            this.currWord += box.textContent;
            this.updateCurrWord();
            if (this.isWord(this.currWord, trieRoot)) {
                if (this.isWord(this.currWord, this.foundWordsTrieRoot)) {
                    this.toggleLineColor('repeated');
                }
                else {
                    this.toggleLineColor('success');
                }
            }
            else {
                this.toggleLineColor('fail');
            }
            this.lastActiveBox = box;
        }
    }

    toggleLineColor(state) {
        this.grid.classList.remove('use-success-color', 'use-repeated-word-color');
        this.currWordTextBox.classList.remove('use-success-color', 'use-repeated-word-color');
        if (state === 'success') {
            this.grid.classList.add('use-success-color');
            this.currWordTextBox.classList.add('use-success-color');
        } else if (state === 'repeated') {
            this.grid.classList.add('use-repeated-word-color');
            this.currWordTextBox.classList.add('use-repeated-word-color');
        }
    }
    
    drawLine(box1, box2) {
        console.log("DRAWING");
        const line = document.createElement('div');
        line.className = 'line';
        this.grid.appendChild(line);
    
        const x1 = box1.offsetLeft + box1.offsetWidth / 2;
        const y1 = box1.offsetTop + box1.offsetHeight / 2;
        const x2 = box2.offsetLeft + box2.offsetWidth / 2;
        const y2 = box2.offsetTop + box2.offsetHeight / 2;
    
        const length = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) * 1.1;
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    
        line.style.width = `${length}px`;
        line.style.transform = `rotate(${angle}deg) translateY(-50%)`;
        line.style.position = 'absolute';
        line.style.top = `${y1}px`;
        line.style.left = `${x1}px`;
    }

    clearCurrWord() {
        this.currWordTextBox.style.transition = `opacity ${Game.CURR_WORD_FADEOUT_TIME}s ease-out`;
        this.currWordTextBox.classList.add('fade-out');
        this.currWord = "";
    }

    updateCurrWord() {
        this.currWordTextBox.value = this.currWord;

        if (this.currWord === "") {
            // If empty, fade out the textbox
            this.currWordTextBox.style.transition = `opacity ${Game.CURR_WORD_FADEOUT_TIME}s ease-out`;
            this.currWordTextBox.classList.add('fade-out');
        } else {
            if (this.isWord(this.currWord, trieRoot) && !this.isWord(this.currWord, this.foundWordsTrieRoot)) {
                let pointValue = pointValues[this.currWord.length];
                this.currWordTextBox.value += ' (+' + pointValue + ')';
            }

            this.currWordTextBox.style.visibility = 'visible';
            this.currWordTextBox.style.transition = '';
            // this.currWordTextBox.style.opacity = 1;
            this.currWordTextBox.classList.remove('fade-out');
            
            // Create a temporary span element to dynamically change the size of the textbox to fit the text
            const tempSpan = document.createElement('span');
            document.body.appendChild(tempSpan);
            tempSpan.style.font = window.getComputedStyle(this.currWordTextBox).font;
            tempSpan.style.visibility = 'hidden';
            tempSpan.style.whiteSpace = 'pre';
            tempSpan.textContent = this.currWordTextBox.value;
            const textWidth = tempSpan.offsetWidth;
            document.body.removeChild(tempSpan);

            this.currWordTextBox.style.width = textWidth + 'px';
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

    displayTotalPossiblePoints(pointTotal) {
        const pointTotalText = document.getElementById('pointTotalText');
        pointTotalText.textContent = 'Total Possible Points: ' + pointTotal;
    }

    revealAllWords(words = this.possibleWords) {
        // To be consistent with colorings, this method checks if a string has an underscore (i.e. it was not completely found).
        // It only reveals it in blue if the string does have an underscore.
        words.forEach(word => {
            const wordElement = this.wordElementsMap.get(word);
            if (wordElement.textContent.includes('_')) {
                wordElement.textContent = word;
                const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--hover-color').trim();
                wordElement.style.color = hoverColor;
                this.foundWordsTrieRoot.addWord(word);
            }
        })
    }

    generateBlankWordList(words = this.possibleWords) {
        this.clearWordList();
        const wordList = document.getElementById('wordList');
        this.wordElementsMap.clear();

        words.forEach(word => {
            const wordElement = document.createElement('div');
            wordElement.textContent = Array.from(word, () => '_').join('');
            wordElement.className = 'blank-word-element';
            wordElement.onclick = () => this.handleWordClick(wordElement, word);
            this.wordElementsMap.set(word, wordElement);
            wordList.appendChild(wordElement);
        });
    }

    displayFoundWord(word) {
        const wordElement = this.wordElementsMap.get(word);
        let numRevealedLetters = wordElement.textContent.split('').filter(char => char !== '_').length;
        const visiblePart = word.substring(0, numRevealedLetters);
        const hiddenPart = word.substring(numRevealedLetters);
        const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--hover-color').trim();
        
        wordElement.textContent = word;
        wordElement.innerHTML = `<span style="color: ${hoverColor};">${visiblePart}</span>${hiddenPart}`;
    }


    handleWordClick(wordElement, word) {
        let numRevealedLetters = wordElement.textContent.split('').filter(char => char !== '_').length;
        const visiblePart = word.substring(0, numRevealedLetters + 1);
        const hiddenPart = Array.from(word.substring(numRevealedLetters + 1), () => '_').join('');
        const hoverColor = getComputedStyle(document.documentElement).getPropertyValue('--hover-color').trim();
        
        wordElement.textContent = visiblePart + hiddenPart;
        wordElement.innerHTML = `<span style="color: ${hoverColor};">${visiblePart}</span>${hiddenPart}`;
    }

    generatePointList(words = this.possibleWords) {
        this.clearPointList();
        const pointList = document.getElementById('pointList');

        words.forEach(word => {
            const pointElement = document.createElement('div');
            pointElement.textContent = pointValues[word.length];
            pointList.appendChild(pointElement);
        });
    }

    clearWordList() {
        const wordList = document.getElementById('wordList');
        wordList.innerHTML = '';
    }

    clearPointList() {
        const pointList = document.getElementById('pointList');
        pointList.innerHTML = '';
    }
}

function test(filename, filename2) {
    let wordList = [];
    let pointList = [];
    let startTime = performance.now();

    for (let i = 0; i < 100000; i++) {
        const { letters, possibleWords, pointTotal } = BoardGenerator.generateBoardLetters(4, "Average");
        possibleWords.forEach(word => wordList.push(word));
        pointList.push(pointTotal);
        if (i % 10000 == 0) {
            console.log("Generating Word List:", i);
        }
    }
    // console.log(wordList);
    let endTime = performance.now();
    let timeTaken = endTime - startTime;
    console.log(`Time taken: ${timeTaken} milliseconds`);

    // Convert the array of arrays into CSV string
    let csvContent = wordList.join('\n');

    // Create an anchor element and set attributes for download
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', filename);

    // Append the element to the document, trigger click for download, and remove the element
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    

    let csvContent2 = pointList.join('\n');

    let element2 = document.createElement('a');
    element2.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent2));
    element2.setAttribute('download', filename2);

    document.body.appendChild(element2);
    element2.click();
    document.body.removeChild(element2);
}

document.addEventListener('DOMContentLoaded', async function() {
    await buildTrieFromStaticFile();

    const game = new Game('grid');

    document.getElementById('startButton').addEventListener('click', function() {
        console.log("Game Start");
        game.init(); // Reinitialize the game with the current mode
    });

    // TODO
    // document.getElementById('revealAllWordsButton').addEventListener('click', function() {
    //     game.revealAllWords(game.possibleWords);
    // });

    // TODO
    // const toggleWordListButton = document.getElementById('toggleWordListButton');
    // const combinedWordList = document.getElementById('combinedWordList');
    // const maxHeight = document.querySelector('.list-box').offsetHeight + 'px';
    // combinedWordList.style.height = maxHeight;
    // toggleWordListButton.addEventListener('click', function() {
    //     if (combinedWordList.style.height && combinedWordList.style.height !== '0px') {
    //         combinedWordList.style.height = '0';
    //         toggleWordListButton.textContent = 'Show Word List';
    //     } else {
    //         combinedWordList.style.height = maxHeight;
    //         toggleWordListButton.textContent = 'Hide Word List';
    //     }
    // });


    // TODO?
    // document.getElementById('test').addEventListener('click', function() {
    //     test('sampleBoardsWordList.csv', 'sampleBoardsPointTotal.csv');
    // });
});

