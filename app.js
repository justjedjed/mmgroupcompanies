let nextBtn = document.querySelector('.next');
let prevBtn = document.querySelector('.prev');

let slider = document.querySelector('.slider');
let sliderList = slider.querySelector('.slider .list');
let thumbnail = document.querySelector('.slider .thumbnail');

// Function to update thumbnail highlight
function updateActiveThumbnail() {
    let thumbnailItems = thumbnail.querySelectorAll('.item');
    // First thumbnail is always active
    thumbnailItems.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === 0);
    });
}

// Initial highlight
updateActiveThumbnail();

// Next button
nextBtn.onclick = function() {
    moveSlider('next');
}

// Prev button
prevBtn.onclick = function() {
    moveSlider('prev');
}

// Thumbnail click
thumbnail.addEventListener('click', (e) => {
    const clickedThumb = e.target.closest('.item');
    if (!clickedThumb) return;

    let thumbnailItems = Array.from(thumbnail.querySelectorAll('.item'));
    let targetIndex = thumbnailItems.indexOf(clickedThumb);

    if (targetIndex === 0) return; // Already active

    // Move slider to the clicked thumbnail
    while (targetIndex > 0) {
        moveSlider('next');
        targetIndex--;
    }
});

function moveSlider(direction) {
    let sliderItems = sliderList.querySelectorAll('.item');
    let thumbnailItems = thumbnail.querySelectorAll('.item');

    if (direction === 'next') {
        sliderList.appendChild(sliderItems[0]);
        thumbnail.appendChild(thumbnailItems[0]);
        slider.classList.add('next');
    } else {
        sliderList.prepend(sliderItems[sliderItems.length - 1]);
        thumbnail.prepend(thumbnailItems[thumbnailItems.length - 1]);
        slider.classList.add('prev');
    }

    slider.addEventListener('animationend', function() {
        slider.classList.remove('next');
        slider.classList.remove('prev');
        // Update highlight after slide animation
        updateActiveThumbnail();
    }, { once: true });
}
