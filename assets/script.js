const tagsButton = document.getElementById('tags-button');
const settingsButton = document.getElementById('settings-button');
const tagsMenu = document.getElementById('tags-menu');
const settingsMenu = document.getElementById('settings-menu');
const playPauseButton = document.getElementById('play-pause-button');
const volumeSlider = document.getElementById('volume-slider');
const backgroundVideo = document.getElementById('background-video');
const backgroundAudio = document.getElementById('background-audio');
const puzzlePiecesSelect = document.getElementById('puzzle-pieces');
const blurCheckbox = document.getElementById('blur-effect');
const darkenCheckbox = document.getElementById('darken-effect');

backgroundAudio.volume = 0.1;
let isPlaying = false;

tagsButton.addEventListener('click', () => {
    tagsMenu.classList.toggle('active');
    settingsMenu.classList.remove('active');
});

settingsButton.addEventListener('click', () => {
    settingsMenu.classList.toggle('active');
    tagsMenu.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.floating-bar')) {
        tagsMenu.classList.remove('active');
        settingsMenu.classList.remove('active');
    }
});

playPauseButton.addEventListener('click', () => {
    if (isPlaying) {
        backgroundAudio.pause();
        playPauseButton.querySelector('.play-icon').style.display = 'block';
        playPauseButton.querySelector('.pause-icon').style.display = 'none';
    } else {
        backgroundAudio.play();
        playPauseButton.querySelector('.play-icon').style.display = 'none';
        playPauseButton.querySelector('.pause-icon').style.display = 'block';
    }
    isPlaying = !isPlaying;
});

volumeSlider.addEventListener('input', (e) => {
    backgroundAudio.volume = e.target.value;
});

document.querySelectorAll('.wallpaper-preview img').forEach(img => {
    img.addEventListener('click', () => {
        const videoSrc = img.getAttribute('data-video');
        backgroundVideo.src = videoSrc;
        backgroundVideo.play();
        settingsMenu.classList.remove('active');
        applyBackgroundEffects();
    });
});

puzzlePiecesSelect.addEventListener('change', () => {
    PUZZLE_PIECES = parseInt(puzzlePiecesSelect.value);
    if (currentImage && !isPuzzleCompleted) {
        puzzleContainer.innerHTML = '';
        startPuzzle();
    }
});

function applyBackgroundEffects() {
    let filter = '';
    if (blurCheckbox.checked) {
        filter += 'blur(5px) ';
    }
    if (darkenCheckbox.checked) {
        filter += 'brightness(0.7)';
    }
    backgroundVideo.style.filter = filter.trim() || 'none';
}

blurCheckbox.addEventListener('change', applyBackgroundEffects);
darkenCheckbox.addEventListener('change', applyBackgroundEffects);