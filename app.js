/* MM Group Slider — Responsive & Accessible (production) */
"use strict";
(() => {
  const slider = document.querySelector(".slider");
  if (!slider) return;

  const sliderList = slider.querySelector(".list");
  const thumbnail = slider.querySelector(".thumbnail");
  const nextBtn = slider.querySelector(".next");
  const prevBtn = slider.querySelector(".prev");
  const dots = slider.querySelectorAll(".progress-dots .dot");
  const navToggle = document.querySelector(".nav-toggle");
  const primaryNav = document.getElementById("primary-nav");

  let isAnimating = false;
  let autoplayTimer = null;
  let fallbackTimer = null;
  const autoplayDelay = 6500;
  const SWIPE_THRESHOLD = 42;

  function updateActiveState() {
    if (thumbnail) {
      const thumbs = thumbnail.querySelectorAll(".item");
      thumbs.forEach((thumb, i) => {
        const isActive = i === 0;
        thumb.classList.toggle("active", isActive);
        thumb.setAttribute("aria-selected", String(isActive));
        // keep keyboard reachable; active gets tabindex 0, others 0 (roving tabindex optional)
        thumb.tabIndex = 0;
      });
    }
    if (dots && dots.length) dots.forEach((d, i) => d.classList.toggle("active", i === 0));
    if (sliderList) {
      const slides = sliderList.querySelectorAll(".item");
      slides.forEach((slide, i) => slide.setAttribute("aria-label", `${i + 1} of ${slides.length}`));
    }
  }

  function moveSlider(direction) {
    if (isAnimating) return;
    if (!sliderList || !thumbnail) return;
    const sliderItems = sliderList.querySelectorAll(".item");
    const thumbItems = thumbnail.querySelectorAll(".item");
    if (sliderItems.length <= 1) return;

    isAnimating = true;
    if (direction === "next") {
      sliderList.appendChild(sliderItems[0]);
      thumbnail.appendChild(thumbItems[0]);
      slider.classList.add("next");
    } else {
      sliderList.prepend(sliderItems[sliderItems.length - 1]);
      thumbnail.prepend(thumbItems[thumbItems.length - 1]);
      slider.classList.add("prev");
    }

    const onEnd = () => {
      slider.classList.remove("next", "prev");
      updateActiveState();
      isAnimating = false;
      clearTimeout(fallbackTimer);
    };

    slider.addEventListener("animationend", onEnd, { once: true });
    clearTimeout(fallbackTimer);
    fallbackTimer = setTimeout(onEnd, 800);
  }

  updateActiveState();

  // Arrow buttons
  if (nextBtn) nextBtn.addEventListener("click", () => { moveSlider("next"); resetAutoplay(); });
  if (prevBtn) prevBtn.addEventListener("click", () => { moveSlider("prev"); resetAutoplay(); });

  // Thumbnail interaction — works with <button> or <div>
  if (thumbnail) {
    thumbnail.addEventListener("click", (e) => {
      const clicked = e.target.closest(".item");
      if (!clicked) return;
      const items = Array.from(thumbnail.querySelectorAll(".item"));
      const idx = items.indexOf(clicked);
      if (idx <= 0) return;
      let steps = idx;
      const step = () => {
        if (steps <= 0) return;
        if (isAnimating) { setTimeout(step, 650); return; }
        moveSlider("next");
        steps -= 1;
        if (steps > 0) setTimeout(step, 650);
      };
      step();
      resetAutoplay();
    });

    thumbnail.addEventListener("keydown", (e) => {
      const target = e.target.closest(".item");
      if (!target) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); target.click(); }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const items = Array.from(thumbnail.querySelectorAll(".item"));
        let idx = items.indexOf(target);
        idx = e.key === "ArrowRight" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
        items[idx].focus();
      }
    });
  }

  // Global keyboard
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, [contenteditable]")) return;
    if (e.key === "ArrowRight") { moveSlider("next"); resetAutoplay(); }
    if (e.key === "ArrowLeft") { moveSlider("prev"); resetAutoplay(); }
  });

  // Touch swipe
  let startX = 0, startY = 0, isSwiping = false;
  slider.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    isSwiping = true; pauseAutoplay();
  }, { passive: true });
  slider.addEventListener("touchend", (e) => {
    if (!isSwiping) return;
    isSwiping = false;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_THRESHOLD) {
      if (diffX < 0) moveSlider("next"); else moveSlider("prev");
      resetAutoplay();
    }
    setTimeout(resumeAutoplay, 1200);
  }, { passive: true });

  // Mouse drag
  let dragStartX = 0, isDragging = false, hasDragged = false;
  slider.addEventListener("mousedown", (e) => {
    isDragging = true; hasDragged = false; dragStartX = e.clientX;
    slider.style.cursor = "grabbing"; pauseAutoplay();
  });
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    if (Math.abs(e.clientX - dragStartX) > 10) hasDragged = true;
  });
  window.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    isDragging = false; slider.style.cursor = "";
    if (!hasDragged) { resumeAutoplay(); return; }
    const diff = e.clientX - dragStartX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff < 0) moveSlider("next"); else moveSlider("prev");
    }
    setTimeout(resumeAutoplay, 1200);
  });

  // Autoplay
  function startAutoplay() {
    stopAutoplay();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    autoplayTimer = setInterval(() => moveSlider("next"), autoplayDelay);
  }
  function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
  function pauseAutoplay() { stopAutoplay(); }
  function resumeAutoplay() { startAutoplay(); }
  function resetAutoplay() { stopAutoplay(); startAutoplay(); }

  startAutoplay();
  slider.addEventListener("mouseenter", pauseAutoplay);
  slider.addEventListener("mouseleave", resumeAutoplay);
  slider.addEventListener("focusin", pauseAutoplay);
  slider.addEventListener("focusout", resumeAutoplay);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAutoplay(); else resumeAutoplay();
  });

  // Nav toggle
  if (navToggle && primaryNav) {
    const closeNav = () => {
      primaryNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      resumeAutoplay();
    };
    navToggle.addEventListener("click", () => {
      const open = primaryNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
      if (open) pauseAutoplay(); else resumeAutoplay();
    });
    document.addEventListener("click", (e) => {
      if (!primaryNav.contains(e.target) && !navToggle.contains(e.target) && primaryNav.classList.contains("open")) closeNav();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && primaryNav.classList.contains("open")) { closeNav(); navToggle.focus(); }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 900 && primaryNav.classList.contains("open")) closeNav();
    });
    primaryNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  }

  // Orientation resize helper
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (slider) {
        slider.style.height = `${window.innerHeight}px`;
        requestAnimationFrame(() => { slider.style.height = ""; });
      }
    }, 150);
  });

  // Preload next slide image
  (() => {
    const imgs = sliderList ? sliderList.querySelectorAll(".item img") : [];
    if (imgs.length > 1 && imgs[1] && imgs[1].src) {
      const img = new Image();
      img.decoding = "async";
      img.src = imgs[1].src;
    }
  })();
})();
