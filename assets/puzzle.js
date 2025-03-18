console.log('Скрипт puzzle.js загружен');

const loadingIndicator = document.createElement('div');
loadingIndicator.id = 'loading-indicator';
loadingIndicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255, 255, 255, 0.3);
    border-top: 5px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    z-index: 30;
    display: none;
`;
document.body.appendChild(loadingIndicator);

const API_URL = 'https://e621.net/posts.json?limit=1&tags=';
const PUZZLE_PIECES = 12;

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
        background: rgba(30, 30, 30, 0.566);
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

function safeBtoa(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

async function loadBlacklistTags() {
    try {
        const response = await fetch('assets/blacklist.txt');
        if (!response.ok) throw new Error('Не удалось загрузить blacklist.txt');
        const text = await response.text();
        const tags = text.split('\n')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .map(tag => `-${tag}`);
        console.log('Теги черного списка из файла:', tags);
        return tags;
    } catch (error) {
        console.error('Ошибка загрузки blacklist.txt:', error);
        return [];
    }
}

async function fetchImageFromE621(attempt = 1, maxAttempts = 5) {
    console.log('Запуск fetchImageFromE621, попытка:', attempt);

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

    console.log(`Попытка ${attempt}/${maxAttempts}. Запрос: ${API_URL}${query}`);

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
        console.log('Ответ от API:', data);

        const post = data.posts[0];
        if (!post) {
            if (attempt < maxAttempts) {
                console.log('Посты не найдены, повторная попытка...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchImageFromE621(attempt + 1, maxAttempts);
            } else {
                throw new Error('Достигнут лимит попыток: посты не найдены');
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
        await preloadImage(currentImage);
        startPuzzle();
    } catch (error) {
        console.error('Ошибка загрузки изображения:', error);
        if (attempt < maxAttempts) {
            console.log(`Попытка ${attempt} не удалась, повтор через 2 секунды...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return fetchImageFromE621(attempt + 1, maxAttempts);
        } else {
            console.error('Все попытки исчерпаны. Проверьте теги или API.');
            alert('Не удалось загрузить изображение. Проверьте теги или подключение.');
        }
    }
}

function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = reject;
    });
}

function startPuzzle() {
    puzzleContainer.innerHTML = '';
    const aspectRatio = imageWidth / imageHeight;

    let gridCols = Math.ceil(Math.sqrt(PUZZLE_PIECES * aspectRatio));
    let gridRows = Math.ceil(PUZZLE_PIECES / gridCols);
    while (gridCols * gridRows !== PUZZLE_PIECES) {
        if (gridCols * gridRows > PUZZLE_PIECES) {
            if (gridCols > gridRows) gridCols--;
            else gridRows--;
        } else {
            if (gridCols < gridRows) gridCols++;
            else gridRows++;
        }
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

    pieces.forEach((piece, i) => {
        const div = document.createElement('div');
        div.className = 'puzzle-piece';
        div.draggable = true;
        div.style.backgroundImage = `url(${currentImage})`;
        div.style.backgroundSize = `${imageWidth * scale}px ${imageHeight * scale}px`;
        const shuffledIndex = indices[i];
        div.style.backgroundPosition = `${pieces[shuffledIndex].x * scale}px ${pieces[shuffledIndex].y * scale}px`;
        div.addEventListener('dragstart', dragStart);
        div.addEventListener('dragover', dragOver);
        div.addEventListener('dragend', dragEnd);
        div.addEventListener('drop', drop);
        if (isPuzzleSolved()) {
            div.style.border = 'none';
        }
        puzzleContainer.appendChild(div);
    });

    console.log('Исходные позиции:', originalPositions.map(pos => `${pos.x}px ${pos.y}px`));
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
    draggedPiece.classList.add('dragging');
    e.dataTransfer.setData('text/plain', draggedPiece.style.backgroundPosition);
    console.log('Drag start, position:', draggedPiece.style.backgroundPosition);
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function drop(e) {
    e.preventDefault();
    const dropTarget = e.target;
    if (dropTarget.className === 'puzzle-piece' && dropTarget !== draggedPiece) {
        const tempPos = draggedPiece.style.backgroundPosition;
        draggedPiece.style.backgroundPosition = dropTarget.style.backgroundPosition;
        dropTarget.style.backgroundPosition = tempPos;

        console.log('После перетаскивания:', {
            dragged: draggedPiece.style.backgroundPosition,
            target: dropTarget.style.backgroundPosition
        });

        if (isPuzzleSolved()) {
            console.log('Пазл собран');
            showCompletionAnimation();
        } else {
            console.log('Пазл еще не собран');
        }
    }
}

function isPuzzleSolved() {
    const pieces = Array.from(puzzleContainer.children);
    const currentPositions = pieces.map(piece => {
        let [x, y] = piece.style.backgroundPosition.split(' ').map(val => {
            return parseFloat(val.replace('px', '')).toFixed(3);
        });
        return { x: parseFloat(x), y: parseFloat(y) };
    });

    const normalizedOriginalPositions = originalPositions.map(pos => ({
        x: parseFloat(pos.x.toFixed(3)),
        y: parseFloat(pos.y.toFixed(3))
    }));

    const tolerance = 0.1;
    const solved = pieces.every((piece, index) => {
        const currX = parseFloat(piece.style.backgroundPosition.split(' ')[0].replace('px', '')).toFixed(3);
        const currY = parseFloat(piece.style.backgroundPosition.split(' ')[1].replace('px', '')).toFixed(3);
        const origX = normalizedOriginalPositions[index].x;
        const origY = normalizedOriginalPositions[index].y;
        const xMatch = Math.abs(origX - parseFloat(currX)) <= tolerance;
        const yMatch = Math.abs(origY - parseFloat(currY)) <= tolerance;
        if (!xMatch || !yMatch) {
            console.log(`Несоответствие на куске ${index}: текущая позиция=${piece.style.backgroundPosition}, ожидаемая=${origX}px ${origY}px`);
        }
        return xMatch && yMatch;
    });

    console.log('Проверка завершения пазла:', solved);
    return solved;
}

function showCompletionAnimation() {
    console.log('Запуск анимации завершения');
    isPuzzleCompleted = true;
    shootConfetti();
    const completeDiv = document.createElement('div');
    completeDiv.className = 'puzzle-complete';
    completeDiv.innerHTML = `
        <button id="save-puzzle">Save</button>
        <button id="next-puzzle">Next</button>
    `;
    puzzleContainer.appendChild(completeDiv);
    console.log('Добавлен div.puzzle-complete');

    if (isPuzzleCompleted) {
        const pieces = puzzleContainer.getElementsByClassName('puzzle-piece');
        for (let piece of pieces) {
            piece.style.border = 'none';
        }
    }

    setTimeout(() => {
        completeDiv.style.opacity = '1';
        console.log('Кнопки opacity: 1');
    }, 3000);

    const saveButton = document.getElementById('save-puzzle');
    const nextButton = document.getElementById('next-puzzle');
    if (saveButton && nextButton) {
        saveButton.addEventListener('click', savePuzzle);
        nextButton.addEventListener('click', () => {
            console.log('Переход к следующему пазлу');
            puzzleContainer.innerHTML = '';
            fetchImageFromE621();
        });
        console.log('Обработчики событий для кнопок привязаны');
    } else {
        console.error('Кнопки не найдены в DOM');
    }
}

function savePuzzle() {
    console.log('Скачивание изображения:', originalImageName);
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = originalImageName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log('Инициировано скачивание или открытие в новой вкладке:', originalImageName);

    setTimeout(() => {
        if (document.location.href.includes(currentImage)) {
            alert('Автоматическое скачивание не поддерживается. Изображение открыто в новой вкладке. Нажмите правой кнопкой мыши и выберите "Сохранить как", чтобы скачать.');
        } else {
            console.log('Скачивание успешно инициировано');
        }
    }, 100);
}

document.getElementById('next-button').addEventListener('click', () => {
    console.log('Клик по кнопке Next');
    puzzleContainer.innerHTML = '';
    fetchImageFromE621();
});

console.log('Инициализация пазла');
fetchImageFromE621();

window.addEventListener('resize', () => {
    if (currentImage && !isPuzzleCompleted) {
        console.log('Изменение размера окна, пересоздаем пазл');
        startPuzzle();
    } else {
        console.log('Пазл завершен или не загружен, пропускаем resize');
    }
});