const images = [
    '/images/harshcold.jpg',
];

let currentIndex = 0;
const photoContainer = document.querySelector('.photo-container');

// Function to change the background image
function changeBackground() {
    currentIndex = (currentIndex + 1) % images.length;
    photoContainer.style.backgroundImage = `url('${images[currentIndex]}')`;
}

// Initial setup (set the first image when the page loads)
photoContainer.style.backgroundImage = `url('${images[currentIndex]}')`;

// Change the image every 4 seconds
setInterval(changeBackground, 4000);
