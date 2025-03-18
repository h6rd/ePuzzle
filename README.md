# E621 Puzzle Game
This is a web-based puzzle game built with JavaScript, HTML, and CSS, utilizing the e621 API to fetch images for puzzle creation. The game features drag-and-drop mechanics, customizable tags, and a visually appealing interface with animations.

# Features
+ Puzzle Generation: Creates a 12-piece puzzle from random e621 images based on user-selected tags.
+ Customization: Supports positive tags (via checkboxes and input), blacklist tags (from input and blacklist.txt), and GIF-only mode.
+ Interactivity: Drag-and-drop pieces to solve the puzzle; pieces snap into place with a tolerance of 0.1px.
+ Completion Effects: Displays "Save" and "Next" buttons after solving, with a confetti animation using @tsparticles/confetti.
+ Image Download: Attempts to download the solved image; falls back to opening in a new tab if unsupported.
+ Loading Indicator: Spinning animation during image fetch.
+ UI Elements: Floating control bar, dropdown menu, and fixed footer.
+ Responsive Design: Adjusts puzzle size on window resize.
