/**
 * SMCC Landing Page - Interactive JavaScript
 * Elegant animations and smooth interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollEffects();
    initTabs();
    initCounters();
    initAnimations();
});

/**
 * Navigation Module
 */
function initNavigation() {
    const header = document.getElementById('header');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav__link');

    // Header scroll effect
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                const headerHeight = header.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Close mobile menu on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

/**
 * Scroll Effects Module
 */
function initScrollEffects() {
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Stagger children animations
                const staggerItems = entry.target.querySelectorAll('.feature, .award, .stat, .roi__item');
                staggerItems.forEach((item, index) => {
                    item.style.transitionDelay = `${index * 0.1}s`;
                    item.classList.add('animate');
                });
            }
        });
    }, observerOptions);

    // Observe sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('reveal');
        observer.observe(section);
    });
}

/**
 * Tabs Module
 */
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked
            tab.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Touch support for mobile
    let touchStartX = 0;
    const contentWrapper = document.querySelector('.applications__content');
    
    if (contentWrapper) {
        contentWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        contentWrapper.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) {
                const currentIndex = [...tabs].findIndex(t => t.classList.contains('active'));
                let newIndex;
                
                if (diff > 0 && currentIndex < tabs.length - 1) {
                    newIndex = currentIndex + 1;
                } else if (diff < 0 && currentIndex > 0) {
                    newIndex = currentIndex - 1;
                }
                
                if (newIndex !== undefined) {
                    tabs[newIndex].click();
                }
            }
        }, { passive: true });
    }
}

/**
 * Counters Module
 */
function initCounters() {
    const counters = document.querySelectorAll('.stat__number');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseFloat(counter.dataset.target);
                animateCounter(counter, target);
                observer.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    const duration = 2000;
    const isDecimal = target % 1 !== 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out expo
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const current = easeProgress * target;
        
        if (isDecimal) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = isDecimal ? target.toFixed(1) : formatNumber(target);
        }
    }
    
    requestAnimationFrame(update);
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Animations Module
 */
function initAnimations() {
    // Add CSS for reveal animations
    const style = document.createElement('style');
    style.textContent = `
        .reveal {
            opacity: 0;
            transform: translateY(40px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .reveal.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .feature,
        .award,
        .stat,
        .roi__item {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .feature.animate,
        .award.animate,
        .stat.animate,
        .roi__item.animate {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Hover enhancement for pricing rows */
        .pricing__table tbody tr {
            position: relative;
        }
        
        .pricing__table tbody tr::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: var(--primary);
            transform: scaleY(0);
            transition: transform 0.3s ease;
        }
        
        .pricing__table tbody tr:hover::before {
            transform: scaleY(1);
        }
        
        /* Button pulse effect */
        .btn--primary {
            position: relative;
            overflow: hidden;
        }
        
        .btn--primary::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }
        
        .btn--primary:active::before {
            width: 400px;
            height: 400px;
        }
        
        /* Feature card shimmer */
        .feature {
            position: relative;
            overflow: hidden;
        }
        
        .feature::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(87, 126, 202, 0.03),
                transparent
            );
            transition: 0.6s;
        }
        
        .feature:hover::after {
            left: 100%;
        }
    `;
    document.head.appendChild(style);

    // Parallax effect for hero (desktop only)
    if (window.innerWidth > 768) {
        const heroShapes = document.querySelectorAll('.hero__shape');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            heroShapes.forEach((shape, index) => {
                const speed = 0.1 + (index * 0.05);
                shape.style.transform = `translateY(${scrolled * speed}px)`;
            });
        }, { passive: true });
    }

    // Mouse move effect for dashboard (desktop only)
    if (window.innerWidth > 1024) {
        const dashboard = document.querySelector('.hero__dashboard');
        const heroVisual = document.querySelector('.hero__visual');
        
        if (dashboard && heroVisual) {
            heroVisual.addEventListener('mousemove', (e) => {
                const rect = heroVisual.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                
                dashboard.style.transform = `
                    perspective(1000px)
                    rotateY(${x * 5}deg)
                    rotateX(${-y * 5}deg)
                `;
            });
            
            heroVisual.addEventListener('mouseleave', () => {
                dashboard.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
            });
        }
    }
}

/**
 * Utility: Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Lazy load images (if needed)
 */
function initLazyLoad() {
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
}
