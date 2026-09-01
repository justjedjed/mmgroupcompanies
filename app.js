/* MM Group Slider — Responsive & Accessible */
(() => {
    const slider = document.querySelector('.slider');
    if (!slider) return;

    const sliderList = slider.querySelector('.list');
    const thumbnail = slider.querySelector('.thumbnail');
    const nextBtn = slider.querySelector('.next');
    const prevBtn = slider.querySelector('.prev');
    const dots = slider.querySelectorAll('.progress-dots .dot');
    const navToggle = document.querySelector('.nav-toggle');
    const primaryNav = document.getElementById('primary-nav');

    let isAnimating = false;
    let autoplayTimer = null;
    let autoplayDelay = 6500;

    // Helper: update thumbnails + dots + ARIA
    function updateActiveState() {
        if (!thumbnail) return;
        const thumbs = thumbnail.querySelectorAll('.item');
        thumbs.forEach((thumb, i) => {
            const isActive = i === 0;
            thumb.classList.toggle('active', isActive);
            thumb.setAttribute('aria-selected', isActive ? 'true' : 'false');
            thumb.tabIndex = isActive ? 0 : 0; // keep focusable
        });
        if (dots && dots.length) {
            dots.forEach((d, i) => d.classList.toggle('active', i === 0));
        }
        // Update slides aria-labels (optional)
        if (sliderList) {
            const slides = sliderList.querySelectorAll('.item');
            slides.forEach((slide, i) => {
                slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
            });
        }
    }

    function moveSlider(direction) {
        if (isAnimating) return;
        if (!sliderList || !thumbnail) return;

        const sliderItems = sliderList.querySelectorAll('.item');
        const thumbItems = thumbnail.querySelectorAll('.item');
        if (sliderItems.length <= 1) return;

        isAnimating = true;

        if (direction === 'next') {
            sliderList.appendChild(sliderItems[0]);
            thumbnail.appendChild(thumbItems[0]);
            slider.classList.add('next');
        } else {
            sliderList.prepend(sliderItems[sliderItems.length - 1]);
            thumbnail.prepend(thumbItems[thumbItems.length - 1]);
            slider.classList.add('prev');
        }

        const onEnd = () => {
            slider.classList.remove('next', 'prev');
            updateActiveState();
            isAnimating = false;
            slider.removeEventListener('animationend', onEnd);
            // Fallback timer if animationend not fired (e.g., reduced motion)
            clearTimeout(slider._fallbackTimer);
        };

        slider.addEventListener('animationend', onEnd, { once: true });
        // Fallback: force cleanup after 700ms
        clearTimeout(slider._fallbackTimer);
        slider._fallbackTimer = setTimeout(onEnd, 800);
    }

    // Initial state
    updateActiveState();

    // Buttons
    if (nextBtn) nextBtn.addEventListener('click', () => { moveSlider('next'); resetAutoplay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { moveSlider('prev'); resetAutoplay(); });

    // Thumbnail click + keyboard
    if (thumbnail) {
        thumbnail.addEventListener('click', (e) => {
            const clicked = e.target.closest('.item');
            if (!clicked) return;
            const items = Array.from(thumbnail.querySelectorAll('.item'));
            let idx = items.indexOf(clicked);
            if (idx === 0 || idx === -1) return;
            // move step by step with delay to allow animation
            let steps = idx;
            const step = () => {
                if (steps <= 0 || isAnimating) {
                    if (steps > 0) setTimeout(step, 650);
                    return;
                }
                moveSlider('next');
                steps--;
                if (steps > 0) setTimeout(step, 650);
            };
            step();
            resetAutoplay();
        });

        thumbnail.addEventListener('keydown', (e) => {
            const target = e.target.closest('.item');
            if (!target) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                target.click();
            }
            // Arrow navigation within thumbnails
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const items = Array.from(thumbnail.querySelectorAll('.item'));
                let idx = items.indexOf(target);
                if (e.key === 'ArrowRight') idx = (idx + 1) % items.length;
                else idx = (idx - 1 + items.length) % items.length;
                items[idx].focus();
            }
        });
    }

    // Keyboard global for slider
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { moveSlider('next'); resetAutoplay(); }
        if (e.key === 'ArrowLeft') { moveSlider('prev'); resetAutoplay(); }
    });

    // Touch swipe
    let startX = 0, startY = 0, isSwiping = false;
    const SWIPE_THRESHOLD = 42;

    slider.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
        pauseAutoplay();
    }, { passive: true });

    slider.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        // prevent vertical scroll lock? allow native
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;
        // Only horizontal swipe if horizontal > vertical
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_THRESHOLD) {
            if (diffX < 0) moveSlider('next');
            else moveSlider('prev');
            resetAutoplay();
        }
        setTimeout(resumeAutoplay, 1200);
    }, { passive: true });

    // Mouse drag (desktop)
    let dragStartX = 0, isDragging = false, hasDragged = false;
    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasDragged = false;
        dragStartX = e.clientX;
        slider.style.cursor = 'grabbing';
        pauseAutoplay();
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        if (Math.abs(e.clientX - dragStartX) > 10) hasDragged = true;
    });
    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        slider.style.cursor = '';
        if (!hasDragged) { resumeAutoplay(); return; }
        const diff = e.clientX - dragStartX;
        if (Math.abs(diff) > SWIPE_THRESHOLD) {
            if (diff < 0) moveSlider('next');
            else moveSlider('prev');
        }
        setTimeout(resumeAutoplay, 1200);
    });

    // Autoplay — pause on hover / focus
    function startAutoplay() {
        stopAutoplay();
        // Respect reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        autoplayTimer = setInterval(() => moveSlider('next'), autoplayDelay);
    }
    function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
    function pauseAutoplay() { stopAutoplay(); }
    function resumeAutoplay() { startAutoplay(); }
    function resetAutoplay() { stopAutoplay(); startAutoplay(); }

    // Only autoplay on slider page where thumbnails visible and not in reduced motion
    startAutoplay();
    slider.addEventListener('mouseenter', pauseAutoplay);
    slider.addEventListener('mouseleave', resumeAutoplay);
    slider.addEventListener('focusin', pauseAutoplay);
    slider.addEventListener('focusout', resumeAutoplay);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) pauseAutoplay();
        else resumeAutoplay();
    });

    // Hamburger nav toggle (for index page)
    if (navToggle && primaryNav) {
        navToggle.addEventListener('click', () => {
            const open = primaryNav.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            // Prevent body scroll when menu open on mobile slider? keep slider hidden interaction
            if (open) pauseAutoplay();
            else resumeAutoplay();
        });
        document.addEventListener('click', (e) => {
            if (!primaryNav.contains(e.target) && !navToggle.contains(e.target) && primaryNav.classList.contains('open')) {
                primaryNav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                resumeAutoplay();
            }
        });
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900 && primaryNav.classList.contains('open')) {
                primaryNav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
        // Close on nav link click
        primaryNav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                primaryNav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Respect resize — recalc if needed (no heavy work)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Ensure slider fills viewport after orientation change
            if (slider) {
                slider.style.height = window.innerHeight + 'px';
                requestAnimationFrame(() => {
                    slider.style.height = '';
                });
            }
        }, 150);
    });

    // Preload next image for smoother UX
    function preloadNext() {
        const items = sliderList ? sliderList.querySelectorAll('.item img') : [];
        if (items.length > 1 && items[1]) {
            const img = new Image();
            img.src = items[1].src;
        }
    }
    preloadNext();
})();
