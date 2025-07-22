const tagsButton = document.getElementById('tags-button');
const settingsButton = document.getElementById('settings-button');
const tagsMenu = document.getElementById('tags-menu');
const settingsMenu = document.getElementById('settings-menu');
const backgroundVideo = document.getElementById('background-video');
const puzzlePiecesSelect = document.getElementById('puzzle-pieces');
const blurCheckbox = document.getElementById('blur-effect');
const darkenCheckbox = document.getElementById('darken-effect');
const applyTagsButton = document.getElementById('apply-tags-button');
const randomTagsCheckbox = document.getElementById('random');

const tagColumns = {
    species: ['bear', 'boar', 'bull', 'canid', 'felid', 'elephant', 'dragon', 'horse'],
    attributes: ['belly', 'fat', 'musclegut', 'underwear', 'jockstrap', 'tank_top', 'socks', 'open_bottomwear'],
    fetishes: ['urine', 'bulge', 'messy', 'armpit_hair', 'licking', 'fellatio', 'footjob', 'sniffing', 'age_difference', 'size_difference'],
    other: ['male', 'anthro', 'father_(lore)', 'father_and_son_(lore)', 'incest_(lore)', 'mature_male', 'saliva', 'hairy', 'chastity_device'],
    penisType: ['canine_penis', 'knot', 'equine_penis', 'humanoid_genitalia', 'foreskin', 'circumcised']
};

function getRandomTagFromColumn(column) {
    const tags = tagColumns[column];
    return tags[Math.floor(Math.random() * tags.length)];
}

function applyRandomTags() {
    if (randomTagsCheckbox.checked) {
        document.querySelectorAll('input[name="tags"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        const randomTags = [
            getRandomTagFromColumn('species'),
            getRandomTagFromColumn('attributes'),
            getRandomTagFromColumn('fetishes'),
            getRandomTagFromColumn('other'),
            getRandomTagFromColumn('penisType')
        ];

        randomTags.forEach(tag => {
            const checkbox = document.querySelector(`input[name="tags"][value="${tag}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });

        document.getElementById('custom-tags').value = '';

        console.log('Random tags applied:', randomTags);
    }
}

randomTagsCheckbox.addEventListener('change', () => {
    if (randomTagsCheckbox.checked) {
        applyRandomTags();
    }
});

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
    if (randomTagsCheckbox.checked) {
        applyRandomTags();
    }

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