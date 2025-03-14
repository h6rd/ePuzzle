// user;pswd;api;email
// ePuzzle;iSosalMenyaEbali321;GPvryGkbnVqNzX9nLGVPJ4BY;rehehot964@cybtric.com

const puzzleContainer = document.getElementById('puzzle-container');
const nextButton = document.getElementById('next-button');
const fullscreenButton = document.getElementById('fullscreen-button');
const API_URL = 'https://e621.net/posts.json?limit=1&tags=';
let history = JSON.parse(localStorage.getItem('puzzleHistory')) || [];
let currentImage = null;
let imageWidth = 0;
let imageHeight = 0;
let hiddenBlacklist = '';
let allowedTags = [];

function safeBtoa(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

async function loadHiddenBlacklist() {
    try {
        const response = await fetch('blacklist.txt');
        if (!response.ok) throw new Error('Не удалось загрузить blacklist.txt');
        const text = await response.text();
        const tags = text.split('\n')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => `-${tag}`)
            .join('+');
        hiddenBlacklist = tags;
        console.log('Скрытый блэклист загружен:', hiddenBlacklist);
    } catch (error) {
        console.error('Ошибка загрузки скрытого блэклиста:', error);
        hiddenBlacklist = '';
    }
}

async function loadAllowedTags() {
    try {
        const response = await fetch('allowed.txt');
        if (!response.ok) throw new Error('Не удалось загрузить allowed.txt');
        const text = await response.text();
        allowedTags = text.split('\n')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        console.log('Разрешенные теги загружены:', allowedTags);
    } catch (error) {
        console.error('Ошибка загрузки allowed.txt:', error);
        allowedTags = [];
    }
}

async function loadNewImage() {
    console.log('Начинаем загрузку нового изображения...');
    const tags = Array.from(document.querySelectorAll('input[name="tags"]:checked'))
        .map(cb => cb.value)
        .join('+');
    const blacklistInput = document.getElementById('blacklist').value;
    const blacklist = blacklistInput ? blacklistInput.split(',').map(t => `-${t.trim()}`).join('+') : '';
    const customTagsInput = document.getElementById('custom-tags').value;
    const customTags = customTagsInput ? customTagsInput.split(',').map(t => t.trim()).join('+') : '';
    
    const allTags = [...new Set([...allowedTags, ...(tags.split('+') || [])])].join('+');
    
    const gifOnlyCheckbox = document.getElementById('gif-only');
    const gifOnlyTag = gifOnlyCheckbox && gifOnlyCheckbox.checked ? 'type:gif' : '';
    
    const tagParts = [allTags, customTags, gifOnlyTag, blacklist, hiddenBlacklist].filter(part => part !== '');
    const queryTags = tagParts.length > 0 ? tagParts.join('+') : '';
    const query = queryTags ? `${queryTags}+order:random` : 'order:random';
    console.log('Сформированный запрос:', `${API_URL}${query}`);

    const username = 'ePuzzle';
    const apiKey = 'GPvryGkbnVqNzX9nLGVPJ4BY';
    const auth = safeBtoa(`${username}:${apiKey}`);

    try {
        const response = await fetch(`${API_URL}${query}`, {
            headers: {
                'User-Agent': 'PuzzleGame/1.0',
                'Authorization': `Basic ${auth}`
            }
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log('Полученные данные:', data);

        const post = data.posts[0];
        if (!post || history.includes(post.id)) {
            console.log('Пост пустой или уже был, повторяем запрос...');
            return loadNewImage();
        }

        currentImage = post.file.url;
        imageWidth = post.file.width;
        imageHeight = post.file.height;
        history.push(post.id);
        localStorage.setItem('puzzleHistory', JSON.stringify(history));
        console.log('Изображение загружено:', currentImage);

        await preloadImage(currentImage);
        startPuzzle();
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
    }
}

function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            console.log('Изображение успешно загружено:', url);
            resolve();
        };
        img.onerror = () => {
            console.error('Ошибка загрузки изображения:', url);
            reject(new Error('Не удалось загрузить изображение'));
        };
    });
}

function startPuzzle() {
    console.log('Запускаем пазл...');
    puzzleContainer.innerHTML = '';
    const puzzleWrapper = document.getElementById('puzzle-wrapper');

    const targetPieces = 12;
    const aspectRatio = imageWidth / imageHeight;

    let gridCols, gridRows;
    if (aspectRatio > 1) {
        gridCols = Math.ceil(Math.sqrt(targetPieces * aspectRatio));
        gridRows = Math.ceil(targetPieces / gridCols);
    } else {
        gridRows = Math.ceil(Math.sqrt(targetPieces / aspectRatio));
        gridCols = Math.ceil(targetPieces / gridRows);
    }

    while (gridCols * gridRows !== targetPieces) {
        if (gridCols * gridRows > targetPieces) {
            if (gridCols > gridRows) gridCols--;
            else gridRows--;
        } else {
            if (gridCols < gridRows) gridCols++;
            else gridRows++;
        }
    }

    const pieceSize = Math.min(imageWidth / gridCols, imageHeight / gridRows);
    let puzzleWidth = pieceSize * gridCols;
    let puzzleHeight = pieceSize * gridRows;

    const maxWidth = puzzleWrapper.clientWidth;
    const maxHeight = puzzleWrapper.clientHeight;
    const scale = Math.min(maxWidth / puzzleWidth, maxHeight / puzzleHeight, 1);
    puzzleWidth *= scale;
    puzzleHeight *= scale;

    puzzleContainer.style.gridTemplateColumns = `repeat(${gridCols}, ${pieceSize * scale}px)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${gridRows}, ${pieceSize * scale}px)`;
    puzzleContainer.style.width = `${puzzleWidth}px`;
    puzzleContainer.style.height = `${puzzleHeight}px`;

    console.log(`Сетка: ${gridCols}x${gridRows}, масштаб: ${scale}, размеры: ${puzzleWidth}x${puzzleHeight}`);

    const pieces = createPuzzlePieces(gridCols, gridRows, pieceSize);
    const indices = Array.from({ length: targetPieces }, (_, i) => i);
    shuffleArray(indices);

    pieces.forEach((piece, index) => {
        const shuffledIndex = indices[index];
        const div = document.createElement('div');
        div.className = 'puzzle-piece';
        div.draggable = true;
        div.style.backgroundImage = `url(${currentImage})`;
        div.style.backgroundSize = `${imageWidth * scale}px ${imageHeight * scale}px`;
        const [posX, posY] = pieces[shuffledIndex].position.split(' ').map(val => parseFloat(val));
        div.style.backgroundPosition = `${posX * scale}px ${posY * scale}px`;
        div.dataset.correctPosition = index;
        div.dataset.currentPosition = index;
        div.addEventListener('dragstart', dragStart);
        div.addEventListener('dragover', dragOver);
        div.addEventListener('drop', drop);
        puzzleContainer.appendChild(div);
    });
}

function createPuzzlePieces(cols, rows, pieceSize) {
    const pieces = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            pieces.push({
                position: `${-x * pieceSize}px ${-y * pieceSize}px`
            });
        }
    }
    console.log('Созданы части:', pieces);
    return pieces;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

let draggedPiece = null;

function dragStart(e) {
    draggedPiece = e.target;
    e.dataTransfer.setData('text/plain', draggedPiece.dataset.currentPosition);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const dropTarget = e.target;
    if (dropTarget.className === 'puzzle-piece' && dropTarget !== draggedPiece) {
        const tempBg = draggedPiece.style.backgroundPosition;
        draggedPiece.style.backgroundPosition = dropTarget.style.backgroundPosition;
        dropTarget.style.backgroundPosition = tempBg;

        const draggedPos = draggedPiece.dataset.currentPosition;
        draggedPiece.dataset.currentPosition = dropTarget.dataset.currentPosition;
        dropTarget.dataset.currentPosition = draggedPos;

        if (isPuzzleSolved()) {
            console.log('Пазл собран!');
        }
    }
}

function isPuzzleSolved() {
    const pieces = puzzleContainer.children;
    for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];
        if (piece.dataset.correctPosition !== piece.dataset.currentPosition) {
            return false;
        }
    }
    return true;
}

nextButton.addEventListener('click', () => {
    console.log('Клик по кнопке "Следующий пазл"');
    loadNewImage();
});

fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

Promise.resolve()
    .then(() => loadHiddenBlacklist())
    .then(() => loadNewImage());