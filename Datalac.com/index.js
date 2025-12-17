/**
 * DATALAC Website - Interactive JavaScript
 * Handles navigation, animations, and interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    Navigation.init();
    ScrollReveal.init();
    CountUp.init();
    SmoothScroll.init();
});

/**
 * Navigation Module
 * Handles navbar scroll effects and mobile menu
 */
const Navigation = {
    navbar: null,
    navToggle: null,
    navLinks: null,

    init() {
        this.navbar = document.getElementById('navbar');
        this.navToggle = document.getElementById('navToggle');
        this.navLinks = document.getElementById('navLinks');

        if (!this.navbar) return;

        // Scroll effect
        this.handleScroll();
        window.addEventListener('scroll', () => this.handleScroll());

        // Mobile menu toggle
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => this.toggleMenu());
        }

        // Close menu when clicking links
        const links = this.navLinks?.querySelectorAll('.nav-link');
        links?.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.navbar.contains(e.target)) {
                this.closeMenu();
            }
        });
    },

    handleScroll() {
        const scrolled = window.scrollY > 50;
        this.navbar.classList.toggle('scrolled', scrolled);
    },

    toggleMenu() {
        this.navToggle.classList.toggle('active');
        this.navLinks.classList.toggle('active');
        document.body.style.overflow = this.navLinks.classList.contains('active') ? 'hidden' : '';
    },

    closeMenu() {
        this.navToggle?.classList.remove('active');
        this.navLinks?.classList.remove('active');
        document.body.style.overflow = '';
    }
};

/**
 * Scroll Reveal Module
 * Animates elements when they enter the viewport
 */
const ScrollReveal = {
    elements: null,
    observer: null,

    init() {
        this.elements = document.querySelectorAll('.reveal');
        if (!this.elements.length) return;

        // Create Intersection Observer
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersect(entries),
            {
                root: null,
                rootMargin: '0px 0px -100px 0px',
                threshold: 0.1
            }
        );

        // Observe all reveal elements
        this.elements.forEach(el => this.observer.observe(el));
    },

    handleIntersect(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay for grouped elements
                const parent = entry.target.parentElement;
                const siblings = parent?.querySelectorAll('.reveal');

                if (siblings && siblings.length > 1) {
                    const siblingIndex = Array.from(siblings).indexOf(entry.target);
                    entry.target.style.transitionDelay = `${siblingIndex * 0.1}s`;
                }

                entry.target.classList.add('active');
                this.observer.unobserve(entry.target);
            }
        });
    }
};

/**
 * Count Up Module
 * Animates numbers counting up
 */
const CountUp = {
    elements: null,
    observer: null,

    init() {
        this.elements = document.querySelectorAll('[data-count]');
        if (!this.elements.length) return;

        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersect(entries),
            { threshold: 0.5 }
        );

        this.elements.forEach(el => this.observer.observe(el));
    },

    handleIntersect(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.animateCount(entry.target);
                this.observer.unobserve(entry.target);
            }
        });
    },

    animateCount(element) {
        const target = parseInt(element.dataset.count, 10);
        const duration = 2000;
        const startTime = performance.now();

        const updateCount = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOutQuart * target);

            element.textContent = this.formatNumber(current);

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                element.textContent = this.formatNumber(target);
            }
        };

        requestAnimationFrame(updateCount);
    },

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K';
        }
        return num.toLocaleString('vi-VN');
    }
};

/**
 * Smooth Scroll Module
 * Handles smooth scrolling for anchor links
 */
const SmoothScroll = {
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleClick(e, anchor));
        });
    },

    handleClick(e, anchor) {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        const navbarHeight = document.getElementById('navbar')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // Update URL without triggering scroll
        history.pushState(null, '', href);
    }
};

/**
 * Dashboard Animation
 * Animates the dashboard chart bars on scroll
 */
const DashboardAnimation = {
    init() {
        const dashboard = document.querySelector('.sl-dashboard');
        if (!dashboard) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateBars(dashboard);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.3 }
        );

        observer.observe(dashboard);
    },

    animateBars(dashboard) {
        const bars = dashboard.querySelectorAll('.chart-bar');
        bars.forEach((bar, index) => {
            bar.style.animationDelay = `${index * 0.1}s`;
            bar.style.animation = 'barGrow 1s ease-out forwards';
        });
    }
};

// Initialize dashboard animation
document.addEventListener('DOMContentLoaded', () => {
    DashboardAnimation.init();
});

/**
 * Parallax Effect for Hero Orbs
 */
const ParallaxOrbs = {
    orbs: null,

    init() {
        this.orbs = document.querySelectorAll('.hero-orb');
        if (!this.orbs.length) return;

        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    },

    handleMouseMove(e) {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        this.orbs.forEach((orb, index) => {
            const speed = (index + 1) * 15;
            const xOffset = x * speed;
            const yOffset = y * speed;

            orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    }
};

// Initialize parallax on desktop only
if (window.innerWidth > 768) {
    document.addEventListener('DOMContentLoaded', () => {
        ParallaxOrbs.init();
    });
}

/**
 * Active Section Highlighting
 * Highlights the current section in navigation
 */
const ActiveSection = {
    sections: null,
    navLinks: null,

    init() {
        this.sections = document.querySelectorAll('section[id]');
        this.navLinks = document.querySelectorAll('.nav-link[href^="#"]');

        if (!this.sections.length || !this.navLinks.length) return;

        window.addEventListener('scroll', () => this.handleScroll());
    },

    handleScroll() {
        const scrollY = window.scrollY + 100;

        this.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ActiveSection.init();
});

/**
 * Typing Effect for Hero Title (Optional Enhancement)
 */
const TypingEffect = {
    element: null,
    text: '',
    index: 0,
    speed: 50,

    init(selector) {
        this.element = document.querySelector(selector);
        if (!this.element) return;

        this.text = this.element.textContent;
        this.element.textContent = '';
        this.type();
    },

    type() {
        if (this.index < this.text.length) {
            this.element.textContent += this.text.charAt(this.index);
            this.index++;
            setTimeout(() => this.type(), this.speed);
        }
    }
};

/**
 * Preloader (Optional)
 */
const Preloader = {
    init() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        window.addEventListener('load', () => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 500);
        });
    }
};

/**
 * Form Validation (For future contact form)
 */
const FormValidation = {
    init(formSelector) {
        const form = document.querySelector(formSelector);
        if (!form) return;

        form.addEventListener('submit', (e) => this.handleSubmit(e, form));
    },

    handleSubmit(e, form) {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Validate
        let isValid = true;
        const errors = {};

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.email = 'Vui lòng nhập email hợp lệ';
            isValid = false;
        }

        if (!data.name || data.name.trim().length < 2) {
            errors.name = 'Vui lòng nhập tên của bạn';
            isValid = false;
        }

        if (isValid) {
            // Submit form
            console.log('Form submitted:', data);
            this.showSuccess(form);
        } else {
            this.showErrors(form, errors);
        }
    },

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    showErrors(form, errors) {
        Object.keys(errors).forEach(field => {
            const input = form.querySelector(`[name="${field}"]`);
            const errorEl = form.querySelector(`.error-${field}`);

            if (input) input.classList.add('error');
            if (errorEl) errorEl.textContent = errors[field];
        });
    },

    showSuccess(form) {
        form.innerHTML = `
            <div class="form-success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h4>Cảm ơn bạn!</h4>
                <p>Chúng tôi sẽ liên hệ sớm nhất có thể.</p>
            </div>
        `;
    }
};

/**
 * Utility: Debounce function
 */
function debounce(func, wait = 20) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Utility: Throttle function
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export modules for potential external use
window.Datalac = {
    Navigation,
    ScrollReveal,
    CountUp,
    SmoothScroll,
    DashboardAnimation,
    ParallaxOrbs,
    FormValidation
};