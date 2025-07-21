const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255, 255, 255, 0.23);
    border-top: 5px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    z-index: 30;
    display: none;
`;
document.body.appendChild(loadingIndicator);

const API_URL = 'https://e621.net/posts.json?limit=1&tags=';
let PUZZLE_PIECES = 12;

const puzzleContainer = document.createElement('div');
puzzleContainer.id = 'puzzle-container';
document.body.appendChild(puzzleContainer);

const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
    }

    #puzzle-container {
        position: fixed;
        top: 55%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: grid;
        background: rgba(30, 30, 30, 0.325);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        transition: all 0.5s ease;
    }
    .puzzle-piece {
        border: 1px solid rgba(0, 0, 0, 0.28);
        cursor: grab;
    }
    .puzzle-piece.dragging {
        opacity: 0.7;
        transform: scale(1.05);
    }
    .puzzle-complete {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        gap: 20px;
        opacity: 0;
        transition: opacity 0.5s ease;
        z-index: 10;
        background: transparent;
    }
    .puzzle-complete button {
        padding: 10px 20px;
        background: rgb(255, 213, 135);
        border: none;
        border-radius: 8px;
        color: #121212;
        font-family: 'Roboto', sans-serif;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.3s ease;
    }
    .puzzle-complete button:hover {
        background: rgb(255, 202, 103);
    }
`;
document.head.appendChild(style);

let currentImage = null;
let imageWidth = 0;
let imageHeight = 0;
let isPuzzleCompleted = false;
let originalPositions = [];
let originalImageName = null;
let cachedBlacklist = null;

const safeBtoa = str => btoa(unescape(encodeURIComponent(str)));

async function loadBlacklistTags() {
    if (cachedBlacklist) return cachedBlacklist;
    
    try {
        const response = await fetch('assets/blacklist.txt');
        if (!response.ok) throw new Error('Failed to load blacklist.txt');
        const text = await response.text();
        cachedBlacklist = text.split('\n')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => `-${tag}`);
        return cachedBlacklist;
    } catch (error) {
        cachedBlacklist = [];
        return [];
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchImageFromE621(attempt = 1, maxAttempts = 5) {
    const positiveTags = [
        ...Array.from(document.querySelectorAll('input[name="tags"]:checked')).map(cb => cb.value),
        ...document.getElementById('custom-tags').value.split(',').map(t => t.trim()).filter(t => t),
        document.getElementById('gif-only').checked ? 'type:gif' : ''
    ].filter(tag => tag);

    const blacklistInput = document.getElementById('blacklist').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t)
        .map(t => `-${t}`);
    const fileBlacklist = await loadBlacklistTags();
    const negativeTags = [...blacklistInput, ...fileBlacklist];

    const allTags = [...positiveTags, ...negativeTags];
    const query = allTags.length > 0 ? `${allTags.join('+')}+order:random` : 'order:random';

    const username = 'ePuzzle';
    const apiKey = 'GPvryGkbnVqNzX9nLGVPJ4BY';
    const auth = safeBtoa(`${username}:${apiKey}`);

    try {
        const response = await fetch(`${API_URL}${query}`, {
            headers: {
                'User-Agent': 'PuzzleGame/1.0 (by ePuzzle)',
                'Authorization': `Basic ${auth}`
            }
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        const post = data.posts[0];
        if (!post) {
            if (attempt < maxAttempts) {
                await delay(2000);
                return fetchImageFromE621(attempt + 1, maxAttempts);
            } else {
                throw new Error('No posts found after maximum attempts');
            }
        }
        
        currentImage = post.file.url;
        imageWidth = post.file.width;
        imageHeight = post.file.height;
        originalImageName = currentImage.split('/').pop() || 'puzzle_image';
        isPuzzleCompleted = false;
        originalPositions = [];
        loadingIndicator.style.display = 'block';
        await preloadImage(currentImage);
        loadingIndicator.style.display = 'none';
        startPuzzle();
    } catch (error) {
        if (attempt < maxAttempts) {
            await delay(2000);
            return fetchImageFromE621(attempt + 1, maxAttempts);
        } else {
            alert('Failed to load image. Try excluding a few tags or check connection.');
        }
    }
}

const preloadImage = url => new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = resolve;
    img.onerror = reject;
});

function startPuzzle() {
    puzzleContainer.innerHTML = '';
    if (!currentImage) return;

    let gridCols, gridRows;
    if (PUZZLE_PIECES === 12) {
        gridCols = 4;
        gridRows = 3;
    } else if (PUZZLE_PIECES === 18) {
        gridCols = 6;
        gridRows = 3;
    } else {
        gridCols = 6;
        gridRows = 4;
    }

    const pieceWidth = imageWidth / gridCols;
    const pieceHeight = imageHeight / gridRows;
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.8;
    const scale = Math.min(maxWidth / (pieceWidth * gridCols), maxHeight / (pieceHeight * gridRows), 1);

    puzzleContainer.style.gridTemplateColumns = `repeat(${gridCols}, ${pieceWidth * scale}px)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${gridRows}, ${pieceHeight * scale}px)`;

    const pieces = [];
    for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
            pieces.push({ x: -x * pieceWidth, y: -y * pieceHeight });
        }
    }

    originalPositions = pieces.map(piece => ({
        x: piece.x * scale,
        y: piece.y * scale
    }));

    const indices = Array.from({ length: PUZZLE_PIECES }, (_, i) => i);
    shuffleArray(indices);

    const fragment = document.createDocumentFragment();
    pieces.forEach((piece, i) => {
        const div = document.createElement('div');
        div.className = 'puzzle-piece';
        div.draggable = true;
        div.style.cssText = `
            background-image: url(${currentImage});
            background-size: ${imageWidth * scale}px ${imageHeight * scale}px;
            background-position: ${pieces[indices[i]].x * scale}px ${pieces[indices[i]].y * scale}px;
        `;
        div.addEventListener('dragstart', dragStart);
        div.addEventListener('dragover', dragOver);
        div.addEventListener('dragend', dragEnd);
        div.addEventListener('drop', drop);
        fragment.appendChild(div);
    });
    puzzleContainer.appendChild(fragment);
}

const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

let draggedPiece = null;

function dragStart(e) {
    draggedPiece = e.target;
    draggedPiece.classList.add('dragging');
    e.dataTransfer.setData('text/plain', draggedPiece.style.backgroundPosition);
}

const dragOver = e => e.preventDefault();

const dragEnd = e => e.target.classList.remove('dragging');

function drop(e) {
    e.preventDefault();
    const dropTarget = e.target;
    if (dropTarget.className === 'puzzle-piece' && dropTarget !== draggedPiece) {
        const tempPos = draggedPiece.style.backgroundPosition;
        draggedPiece.style.backgroundPosition = dropTarget.style.backgroundPosition;
        dropTarget.style.backgroundPosition = tempPos;

        if (isPuzzleSolved()) {
            showCompletionAnimation();
        }
    }
}

function isPuzzleSolved() {
    const pieces = Array.from(puzzleContainer.children);
    const tolerance = 0.1;
    
    return pieces.every((piece, index) => {
        const [currX, currY] = piece.style.backgroundPosition.split(' ').map(val => 
            parseFloat(val.replace('px', ''))
        );
        const { x: origX, y: origY } = originalPositions[index];
        return Math.abs(origX - currX) <= tolerance && Math.abs(origY - currY) <= tolerance;
    });
}

function showCompletionAnimation() {
    isPuzzleCompleted = true;
    shootConfetti();
    
    const completeDiv = document.createElement('div');
    completeDiv.className = 'puzzle-complete';
    completeDiv.innerHTML = `
        <button id="save-puzzle">Save</button>
        <button id="next-puzzle">Next</button>
    `;
    puzzleContainer.appendChild(completeDiv);

    Array.from(puzzleContainer.getElementsByClassName('puzzle-piece')).forEach(piece => {
        piece.style.border = 'none';
    });

    setTimeout(() => {
        completeDiv.style.opacity = '1';
        
        document.getElementById('save-puzzle').addEventListener('click', savePuzzle);
        document.getElementById('next-puzzle').addEventListener('click', () => {
            puzzleContainer.innerHTML = '';
            fetchImageFromE621();
        });
    }, 3000);
}

function savePuzzle() {
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = originalImageName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
        if (document.location.href.includes(currentImage)) {
            alert('Image opened in new tab. Right-click and select "Save as" to download.');
        }
    }, 100);
}

document.getElementById('next-button').addEventListener('click', () => {
    puzzleContainer.innerHTML = '';
    fetchImageFromE621();
});

fetchImageFromE621();

window.addEventListener('resize', () => {
    if (currentImage && !isPuzzleCompleted) {
        startPuzzle();
    }
});
