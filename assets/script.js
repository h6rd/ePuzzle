const tagsButton = document.getElementById('tags-button');
const settingsButton = document.getElementById('settings-button');
const tagsMenu = document.getElementById('tags-menu');
const settingsMenu = document.getElementById('settings-menu');
const backgroundVideo = document.getElementById('background-video');
const puzzlePiecesSelect = document.getElementById('puzzle-pieces');
const blurCheckbox = document.getElementById('blur-effect');
const darkenCheckbox = document.getElementById('darken-effect');
const applyTagsButton = document.getElementById('apply-tags-button');

tagsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    tagsMenu.classList.toggle('active');
    settingsMenu.classList.remove('active');
});
settingsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsMenu.classList.toggle('active');
    tagsMenu.classList.remove('active');
});
applyTagsButton.addEventListener('click', () => {
    document.getElementById('next-button').click();
    tagsMenu.classList.remove('active');
});

tagsMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});
settingsMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.floating-bar') &&
        !e.target.closest('#tags-menu') &&
        !e.target.closest('#settings-menu')) {
        tagsMenu.classList.remove('active');
        settingsMenu.classList.remove('active');
    }
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