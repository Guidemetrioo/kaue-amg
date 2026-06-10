// Force scroll to top on reload
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

document.addEventListener("DOMContentLoaded", () => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);
    
    // Optimize ScrollTrigger resize handling on mobile viewports
    ScrollTrigger.config({
        ignoreMobileResize: true
    });

    // Initializations
    initMobileMenu();
    initHeaderScroll();
    initScrollReveal();
    initHeroVideoScroll();
    initTimelineHorizontalScroll();
    initStatsCounter();
    initGalleryAndLightbox();
    initCotaSelection();
    initContactForm();
});

/* ==========================================================================
   MOBILE MENU TOGGLE
   ========================================================================== */
function initMobileMenu() {
    const toggle = document.getElementById("navToggle");
    const menu = document.getElementById("navMenu");
    const links = document.querySelectorAll(".nav-link");

    if (toggle && menu) {
        toggle.addEventListener("click", () => {
            menu.classList.toggle("active");
            toggle.classList.toggle("active");
            
            // Hamburger icon transform
            const bars = toggle.querySelectorAll(".bar");
            if (toggle.classList.contains("active")) {
                bars[0].style.transform = "rotate(45deg) translate(6px, 6px)";
                bars[1].style.opacity = "0";
                bars[2].style.transform = "rotate(-45deg) translate(6px, -6px)";
            } else {
                bars[0].style.transform = "none";
                bars[1].style.opacity = "1";
                bars[2].style.transform = "none";
            }
        });

        // Close menu when clicking a link
        links.forEach(link => {
            link.addEventListener("click", () => {
                menu.classList.remove("active");
                toggle.classList.remove("active");
                const bars = toggle.querySelectorAll(".bar");
                bars[0].style.transform = "none";
                bars[1].style.opacity = "1";
                bars[2].style.transform = "none";
            });
        });
    }
}

/* ==========================================================================
   HEADER SCROLL & ACTIVE LINKS (IntersectionObserver)
   ========================================================================== */
function initHeaderScroll() {
    const header = document.getElementById("mainNav");
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 100) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });

    // Highlight menu links based on scroll section
    const observerOptions = {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Ignore scroll triggers inside hero scroll animation
            if (window.scrollY < window.innerHeight * 1.5) {
                navLinks.forEach(link => link.classList.remove("active"));
                return;
            }

            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                navLinks.forEach(link => {
                    if (link.getAttribute("href") === `#${id}`) {
                        link.classList.add("active");
                    } else {
                        link.classList.remove("active");
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });
}

/* ==========================================================================
   SCROLL REVEAL (IntersectionObserver)
   ========================================================================== */
function initScrollReveal() {
    const revealElements = document.querySelectorAll(".scroll-reveal");

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                revealObserver.unobserve(entry.target); // Reveal once
            }
        });
    }, {
        root: null,
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
}

/* ==========================================================================
   HERO SCROLL-SYNCED VIDEO (GSAP)
   ========================================================================== */
function initHeroVideoScroll() {
    const video = document.getElementById("hero-video");
    const overlay = document.querySelector(".hero-dark-overlay");
    const content = document.querySelector(".hero-content");
    const heroSec = document.getElementById("hero");
    const indicator = document.querySelector(".scroll-indicator");
    const bannerSec = document.getElementById("banner2");
    
    if (!video || !overlay || !content || !heroSec) return;

    let tlHero;
    let currentIsMobile = window.innerWidth <= 768;

    const setVideoSource = () => {
        const targetSrc = currentIsMobile ? "assets/banner_hero_mobile.mp4" : "assets/banner_hero_desktop.mp4";
        let source = video.querySelector("source");
        if (!source) {
            source = document.createElement("source");
            video.appendChild(source);
        }
        if (source.getAttribute("src") !== targetSrc) {
            source.setAttribute("src", targetSrc);
            video.load();
        }
    };

    const setupScrollTrigger = () => {
        // Clear existing timeline and ScrollTrigger if active to avoid duplicates
        if (tlHero) {
            if (tlHero.scrollTrigger) {
                tlHero.scrollTrigger.kill(true);
            }
            tlHero.kill();
        }

        const duration = video.duration;
        if (!duration || isNaN(duration)) return;
        
        video.pause();
        // Start with the video at the beginning
        video.currentTime = 0;

        const eyebrow = content.querySelector(".hero-eyebrow");
        const nameEl = content.querySelector(".hero-name");
        const tagline = content.querySelector(".hero-tagline");
        const actions = content.querySelector(".hero-actions");

        // Initial styles for text reveal slide:
        // On mobile, start slightly lower (y: 30) instead of off-screen left (x: -100)
        gsap.set([eyebrow, nameEl, tagline, actions], { 
            opacity: 0, 
            x: currentIsMobile ? 0 : -100, 
            y: currentIsMobile ? 30 : 0 
        });
        gsap.set(video, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1.05 });
        gsap.set(content, { opacity: 1 });
        gsap.set(overlay, { opacity: 0.1 });
        if (bannerSec) {
            gsap.set(bannerSec, { opacity: 0, y: 50 });
        }

        // Hardware-throttled low-pass video scrub render loop
        let targetTime = 0;
        let isUpdating = false;
        // Smoother interpolation on mobile for better scroll-controlled video
        const lerpFactor = currentIsMobile ? 0.3 : 0.2;

        function updateVideoFrame() {
            const diff = targetTime - video.currentTime;
            
            if (Math.abs(diff) > 0.01) {
                if (!video.seeking) {
                    video.currentTime = video.currentTime + diff * lerpFactor;
                }
                requestAnimationFrame(updateVideoFrame);
            } else {
                if (!video.seeking) {
                    video.currentTime = targetTime;
                }
                isUpdating = false;
            }
        }

        tlHero = gsap.timeline({
            scrollTrigger: {
                trigger: heroSec,
                start: "top top",
                end: "bottom bottom",
                scrub: currentIsMobile ? 0.5 : true,
                pin: ".hero-sticky",
                invalidateOnRefresh: true,
                onUpdate: self => {
                    const progress = self.progress;
                    
                    if (progress <= 0.8) {
                        const videoProgress = progress / 0.8;
                        targetTime = videoProgress * (duration - 0.05);
                    } else {
                        targetTime = duration - 0.05;
                    }

                    if (!isUpdating) {
                        isUpdating = true;
                        requestAnimationFrame(updateVideoFrame);
                    }
                }
            }
        });

        // 1. Scroll hint disappears immediately
        if (indicator) {
            tlHero.to(indicator, {
                opacity: 0,
                scale: 0.9,
                duration: 1.5,
                ease: "power1.out"
            }, 0);
        }

        // 2. Video scale zoom-out from 1.05 to 1.0
        tlHero.to(video, {
            scale: 1.0,
            xPercent: -50,
            yPercent: -50,
            x: 0,
            y: 0,
            ease: "none",
            duration: 8.0
        }, 0);

        // 3. Overlay fades in from 0.1 to 0.85 from 80% to 100% progress
        tlHero.to(overlay, {
            opacity: 0.85,
            duration: 2.0,
            ease: "power2.out"
        }, 8.0);

        // 4. Reveal text elements staggered from 80% to 100% progress
        tlHero.to(eyebrow, {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 1.2,
            ease: "power2.out"
        }, 8.0);

        tlHero.to(nameEl, {
            opacity: 1,
            x: 0,
            y: 0,
            letterSpacing: currentIsMobile ? "1px" : "2px",
            duration: 1.8,
            ease: "power2.out"
        }, 8.2);

        tlHero.to(tagline, {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 1.5,
            ease: "power2.out"
        }, 8.5);

        tlHero.to(actions, {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 1.2,
            ease: "power2.out"
        }, 8.8);

        if (bannerSec) {
            tlHero.to(bannerSec, {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: "power2.out"
            }, 8.5);
        }
    };

    // Set initial video source
    setVideoSource();

    if (video.readyState >= 1) {
        setupScrollTrigger();
    } else {
        video.addEventListener("loadedmetadata", setupScrollTrigger);
    }

    // Handle screen resize to swap source dynamically if boundary crossed
    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const isMobile = window.innerWidth <= 768;
            if (isMobile !== currentIsMobile) {
                currentIsMobile = isMobile;
                setVideoSource();
                // Re-setup scroll trigger after source change
                video.addEventListener("loadedmetadata", () => {
                    setupScrollTrigger();
                }, { once: true });
            }
        }, 250);
    });
}

/* ==========================================================================
   HORIZONTAL TIMELINE SCROLL (GSAP)
   ========================================================================== */
function initTimelineHorizontalScroll() {
    const timelineSec = document.getElementById("trajetoria");
    const wrapper = document.querySelector(".timeline-wrapper");
    const progress = document.querySelector(".timeline-track-progress");
    const nodes = document.querySelectorAll(".timeline-node");

    if (!timelineSec || !wrapper || !progress || nodes.length === 0) return;

    const setupTimeline = () => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: timelineSec,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.5,
                pin: ".trajectory-sticky",
                pinType: "transform",
                invalidateOnRefresh: true
            }
        });

        // 1. Move wrapper horizontally (right to left)
        tl.to(wrapper, {
            x: () => -Math.max(0, wrapper.scrollWidth - window.innerWidth),
            ease: "none",
            duration: 10
        }, 0);

        // 2. Animate timeline progress bar
        tl.to(progress, {
            width: "100%",
            ease: "none",
            duration: 10
        }, 0);

        // 3. Staggered scale/fade cards and active state of dots as they slide across center
        const numNodes = nodes.length;
        nodes.forEach((node, i) => {
            const dot = node.querySelector(".timeline-dot");
            const card = node.querySelector(".timeline-card");
            
            if (i % 2 !== 0) {
                node.classList.add("timeline-node-even");
            }
            
            // Calculate scroll trigger point in range 0-10
            const triggerTime = (i / (numNodes - 1)) * 10;

            // Reset elements initial CSS state
            gsap.set(card, { opacity: 0.1, scale: 0.85 });

            // Activate dot slightly before the node crosses the viewport center
            tl.to(dot, {
                backgroundColor: "#ECEE01",
                borderColor: "#000",
                scale: 1.35,
                boxShadow: "0 0 15px rgba(236, 238, 1, 0.7)",
                duration: 1,
                ease: "power1.out"
            }, Math.max(0, triggerTime - 0.5));

            // Animate card content when it approaches the screen center
            tl.to(card, {
                opacity: 1,
                scale: 1,
                duration: 1.5,
                ease: "power2.out"
            }, Math.max(0, triggerTime - 1.0));
        });
    };

    setupTimeline();
}

/* ==========================================================================
   STAT COUNTER ANIMATION
   ========================================================================== */
function initStatsCounter() {
    const statsSec = document.getElementById("estatisticas");
    const counters = document.querySelectorAll(".stat-number");
    
    if (!statsSec || counters.length === 0) return;

    let hasCounted = false;

    const countUp = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute("data-target");
            const duration = 2000; // 2 seconds
            const startTime = performance.now();

            const updateCount = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                // Easing function outQuad
                const easedProgress = progress * (2 - progress);
                const currentValue = Math.floor(easedProgress * target);

                counter.innerText = currentValue;

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    counter.innerText = target;
                }
            };

            requestAnimationFrame(updateCount);
        });
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasCounted) {
                countUp();
                hasCounted = true;
                statsObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.3
    });

    statsObserver.observe(statsSec);
}

/* ==========================================================================
   GALLERY FILTER & LIGHTBOX
   ========================================================================== */
function initGalleryAndLightbox() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    const galleryItems = document.querySelectorAll(".gallery-item");
    
    // Lightbox elements
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxCaption = document.getElementById("lightboxCaption");
    const closeBtn = document.getElementById("lightboxClose");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");

    if (galleryItems.length === 0 || !lightbox) return;

    let currentImages = []; // List of currently visible items
    let currentIndex = 0;

    // 1. FILTER FUNCTIONALITY
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove active class
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filterValue = btn.getAttribute("data-filter");

            galleryItems.forEach(item => {
                const category = item.getAttribute("data-category");
                
                if (filterValue === "all" || category === filterValue) {
                    item.style.display = "block";
                    // Trigger fade in animation
                    setTimeout(() => {
                        item.style.opacity = "1";
                        item.style.transform = "scale(1)";
                    }, 50);
                } else {
                    item.style.opacity = "0";
                    item.style.transform = "scale(0.8)";
                    setTimeout(() => {
                        item.style.display = "none";
                    }, 400);
                }
            });
        });
    });

    // 2. LIGHTBOX FUNCTIONALITY
    const updateActiveImages = () => {
        currentImages = Array.from(galleryItems).filter(item => item.style.display !== "none");
    };

    const openLightbox = (imgSrc, altText, item) => {
        updateActiveImages();
        currentIndex = currentImages.indexOf(item);

        lightboxImg.src = imgSrc;
        lightboxCaption.innerText = altText;
        lightbox.setAttribute("aria-hidden", "false");
        
        // Prevent body scroll
        document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
        lightbox.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    };

    const navigateLightbox = (direction) => {
        updateActiveImages();
        if (currentImages.length <= 1) return;

        currentIndex += direction;
        if (currentIndex < 0) {
            currentIndex = currentImages.length - 1;
        } else if (currentIndex >= currentImages.length) {
            currentIndex = 0;
        }

        const nextItem = currentImages[currentIndex];
        const img = nextItem.querySelector("img");
        lightboxImg.src = img.src;
        lightboxCaption.innerText = img.alt;
    };

    // Attach click events to gallery items
    galleryItems.forEach(item => {
        item.addEventListener("click", () => {
            const img = item.querySelector(".gallery-img");
            openLightbox(img.src, img.alt, item);
        });
    });

    // Close lightbox
    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Navigation buttons
    prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
    });
    nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigateLightbox(1);
    });

    // Keyboard support
    document.addEventListener("keydown", (e) => {
        if (lightbox.getAttribute("aria-hidden") === "false") {
            if (e.key === "Escape") {
                closeLightbox();
            } else if (e.key === "ArrowLeft") {
                navigateLightbox(-1);
            } else if (e.key === "ArrowRight") {
                navigateLightbox(1);
            }
        }
    });
}

/* ==========================================================================
   COTA SELECTION & SCROLL TO FORM
   ========================================================================== */
function initCotaSelection() {
    const cotaBtns = document.querySelectorAll(".select-cota");
    const cotaSelect = document.getElementById("form_cota");

    if (cotaBtns.length === 0 || !cotaSelect) return;

    cotaBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const cota = btn.getAttribute("data-cota");
            cotaSelect.value = cota;

            // Smooth scroll to form section
            const contactSec = document.getElementById("contato");
            if (contactSec) {
                contactSec.scrollIntoView({ behavior: "smooth" });
                
                // Highlight input field border briefly
                cotaSelect.style.borderColor = "#39FF14";
                setTimeout(() => {
                    cotaSelect.style.borderColor = "";
                }, 1500);
            }
        });
    });
}

/* ==========================================================================
   CONTACT FORM SUBMISSION FEEDBACK
   ========================================================================== */
function initContactForm() {
    const form = document.getElementById("contactForm");
    const feedback = document.getElementById("formFeedback");

    if (!form || !feedback) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        // Mock AJAX success callback
        // In a real application, you would submit form data using fetch() here.
        
        // Show success animation overlay
        feedback.classList.add("active");

        // Clear the form fields after delay
        setTimeout(() => {
            form.reset();
        }, 1000);

        // Hide success modal after 5 seconds or on double-click
        setTimeout(() => {
            feedback.classList.remove("active");
        }, 5000);
    });

    feedback.addEventListener("click", () => {
        feedback.classList.remove("active");
    });
}


