// === BÌNH DÂN HỌC AI - Enhanced JavaScript ===
// With all UX improvements from review

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initScrollReveal();
    initCounters();
    initSmoothScroll();
    initActiveSection();
    initCommunitySearch();
    initBackToTop();
    initParallaxOrbs();
});

// === NAVBAR ===
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    // Throttled scroll handler
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleNavbarScroll(navbar);
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Mobile menu toggle
    if (mobileToggle && navbarMenu) {
        mobileToggle.addEventListener('click', () => {
            const isActive = navbarMenu.classList.toggle('active');
            mobileToggle.innerHTML = isActive ? '✕' : '☰';
            mobileToggle.setAttribute('aria-expanded', isActive);
        });
        
        // Close on link click
        navbarMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navbarMenu.classList.remove('active');
                mobileToggle.innerHTML = '☰';
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!navbar.contains(e.target) && navbarMenu.classList.contains('active')) {
                navbarMenu.classList.remove('active');
                mobileToggle.innerHTML = '☰';
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navbarMenu.classList.contains('active')) {
                navbarMenu.classList.remove('active');
                mobileToggle.innerHTML = '☰';
                mobileToggle.focus();
            }
        });
    }
}

function handleNavbarScroll(navbar) {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// === ACTIVE SECTION INDICATOR - per review ===
function initActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-link[href^="#"]');
    
    if (sections.length === 0 || navLinks.length === 0) return;
    
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
}

// === SCROLL REVEAL ===
function initScrollReveal() {
    const reveals = document.querySelectorAll('.scroll-reveal');
    
    const observerOptions = {
        root: null,
        rootMargin: '-50px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                
                // Stagger children if present
                const staggerChildren = entry.target.querySelectorAll('[class*="stagger-"]');
                staggerChildren.forEach(child => child.classList.add('revealed'));
            }
        });
    }, observerOptions);
    
    reveals.forEach(el => observer.observe(el));
    
    // Reveal elements already in viewport on load
    reveals.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('revealed');
        }
    });
}

// === COUNTER ANIMATION - with smooth easing ===
function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    
    const observerOptions = {
        root: null,
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.counter);
    const suffix = element.dataset.suffix || '';
    const duration = 2500;
    const startTime = performance.now();
    
    // Smooth easing function
    function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);
        const current = Math.floor(target * easedProgress);
        
        element.textContent = formatNumber(current) + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatNumber(target) + suffix;
        }
    }
    
    requestAnimationFrame(update);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return Math.floor(num / 1000) + 'K+';
    }
    return num.toLocaleString('vi-VN');
}

// === SMOOTH SCROLL ===
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
                
                window.scrollTo({
                    top: targetPos,
                    behavior: 'smooth'
                });
                
                // Update URL without jumping
                history.pushState(null, null, href);
            }
        });
    });
}

// === COMMUNITY SEARCH/FILTER - per review ===
function initCommunitySearch() {
    const searchInput = document.getElementById('community-search');
    const communityCards = document.querySelectorAll('.community-card:not(.community-main)');
    
    if (!searchInput || communityCards.length === 0) return;
    
    // Debounced search
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            filterCommunities(e.target.value.toLowerCase().trim(), communityCards);
        }, 200);
    });
    
    // Clear on Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            filterCommunities('', communityCards);
        }
    });
}

function filterCommunities(query, cards) {
    let visibleCount = 0;
    
    cards.forEach(card => {
        const name = card.querySelector('.community-card-name')?.textContent.toLowerCase() || '';
        const region = card.querySelector('.community-card-region')?.textContent.toLowerCase() || '';
        
        const matches = name.includes(query) || region.includes(query);
        
        if (matches || query === '') {
            card.classList.remove('hidden');
            card.style.display = '';
            visibleCount++;
        } else {
            card.classList.add('hidden');
            card.style.display = 'none';
        }
    });
    
    // Show/hide no results message
    const noResults = document.getElementById('no-results');
    if (noResults) {
        noResults.style.display = visibleCount === 0 && query !== '' ? 'block' : 'none';
    }
}

// === BACK TO TOP BUTTON - per review ===
function initBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    
    if (!backToTop) return;
    
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 500) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
                ticking = false;
            });
            ticking = true;
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Keyboard accessibility
    backToTop.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
}

// === PARALLAX ORBS ===
function initParallaxOrbs() {
    const orbs = document.querySelectorAll('.hero-orb');
    
    if (orbs.length === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }
    
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                orbs.forEach((orb, i) => {
                    const speed = 0.08 + (i * 0.04);
                    orb.style.transform = `translateY(${scrollY * speed}px)`;
                });
                ticking = false;
            });
            ticking = true;
        }
    });
}

// === COMMUNITY DATA FOR POTENTIAL DYNAMIC RENDERING ===
const communityData = [
    { name: "Bình Dân Học AI (Gốc)", url: "https://web.facebook.com/groups/363657942789633", region: "Cộng đồng chính", members: "400K+", isMain: true },
    { name: "Hà Nội Học AI", url: "https://web.facebook.com/groups/1683352255766829/", region: "Thủ đô" },
    { name: "TP Hồ Chí Minh Học AI", url: "https://web.facebook.com/groups/1075863104262168/", region: "Miền Nam" },
    { name: "Đà Nẵng Học AI", url: "https://web.facebook.com/groups/488665503658987/", region: "Miền Trung" },
    { name: "Hải Phòng Học AI", url: "https://web.facebook.com/groups/1005548954625265/", region: "Miền Bắc" },
    { name: "Cần Thơ Học AI", url: "https://web.facebook.com/groups/1068312391525806/", region: "Miền Nam" },
    { name: "Quảng Ninh Học AI", url: "https://web.facebook.com/groups/456770387327674/", region: "Miền Bắc" },
    { name: "Thái Nguyên Học AI", url: "https://web.facebook.com/groups/1061624828625907/", region: "Miền Bắc" },
    { name: "Bắc Ninh Học AI", url: "https://web.facebook.com/groups/790361816417043/", region: "Miền Bắc" },
    { name: "Cao Bằng Học AI", url: "https://web.facebook.com/groups/839376981043889/", region: "Miền Bắc" },
    { name: "Lạng Sơn Học AI", url: "https://web.facebook.com/groups/449104794618721/", region: "Miền Bắc" },
    { name: "Lào Cai Học AI", url: "https://web.facebook.com/groups/1017536793295056/", region: "Miền Bắc" },
    { name: "Lai Châu Học AI", url: "https://web.facebook.com/groups/1484367785787879/", region: "Miền Bắc" },
    { name: "Điện Biên Học AI", url: "https://web.facebook.com/groups/1195388771803055/", region: "Miền Bắc" },
    { name: "Sơn La Học AI", url: "https://web.facebook.com/groups/786067340406765/", region: "Miền Bắc" },
    { name: "Tuyên Quang Học AI", url: "https://web.facebook.com/groups/858331086144932/", region: "Miền Bắc" },
    { name: "Phú Thọ Học AI", url: "https://web.facebook.com/groups/1154617945806879/", region: "Miền Bắc" },
    { name: "Hưng Yên Học AI", url: "https://web.facebook.com/groups/1301049160855052/", region: "Miền Bắc" },
    { name: "Ninh Bình Học AI", url: "https://web.facebook.com/groups/975811484223779/", region: "Miền Bắc" },
    { name: "Thanh Hoá Học AI", url: "https://web.facebook.com/groups/326918583708938/", region: "Miền Trung" },
    { name: "Nghệ An Học AI", url: "https://web.facebook.com/groups/1026832155522926/", region: "Miền Trung" },
    { name: "Hà Tĩnh Học AI", url: "https://web.facebook.com/groups/836440994737739/", region: "Miền Trung" },
    { name: "Quảng Trị Học AI", url: "https://web.facebook.com/groups/910293380903920/", region: "Miền Trung" },
    { name: "Huế Học AI", url: "https://web.facebook.com/groups/394538489759363/", region: "Miền Trung" },
    { name: "Quảng Ngãi Học AI", url: "https://web.facebook.com/groups/414879647535143/", region: "Miền Trung" },
    { name: "Khánh Hòa Học AI", url: "https://web.facebook.com/groups/1887595741740241/", region: "Miền Trung" },
    { name: "Gia Lai Học AI", url: "https://web.facebook.com/groups/794935262837458/", region: "Tây Nguyên" },
    { name: "Đắk Lắk Học AI", url: "https://web.facebook.com/groups/414957804227862/", region: "Tây Nguyên" },
    { name: "Lâm Đồng Học AI", url: "https://web.facebook.com/groups/2581965958662819", region: "Tây Nguyên" },
    { name: "Đồng Nai Học AI", url: "https://web.facebook.com/groups/dongnaihocai/", region: "Miền Nam" },
    { name: "Tây Ninh Học AI", url: "https://web.facebook.com/groups/1117517535978818/", region: "Miền Nam" },
    { name: "Đồng Tháp Học AI", url: "https://web.facebook.com/groups/3591639397666303/", region: "Miền Nam" },
    { name: "Vĩnh Long Học AI", url: "https://web.facebook.com/groups/3365842973715521/", region: "Miền Nam" },
    { name: "An Giang Học AI", url: "https://web.facebook.com/groups/1203908820743002/", region: "Miền Nam" },
    { name: "Cà Mau Học AI", url: "https://web.facebook.com/groups/486370417409068/", region: "Miền Nam" }
];

// Export for potential use
window.communityData = communityData;
