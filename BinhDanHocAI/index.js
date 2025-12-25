// === BÌNH DÂN HỌC AI - JavaScript ===

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initNavbar();
    initScrollAnimations();
    initCounterAnimations();
    initSmoothScroll();
    initCommunityFilter();
});

// === NAVBAR ===
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    // Scroll effect
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add/remove background based on scroll
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(15, 23, 42, 0.98)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.boxShadow = 'none';
        }
        
        // Hide/show navbar on scroll
        if (currentScroll > lastScroll && currentScroll > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
    
    // Mobile menu toggle
    if (mobileToggle && navbarMenu) {
        mobileToggle.addEventListener('click', () => {
            navbarMenu.classList.toggle('active');
            mobileToggle.innerHTML = navbarMenu.classList.contains('active') ? '✕' : '☰';
        });
        
        // Close menu on link click
        navbarMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navbarMenu.classList.remove('active');
                mobileToggle.innerHTML = '☰';
            });
        });
    }
}

// === SCROLL ANIMATIONS ===
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('scroll-visible');
                entry.target.classList.remove('scroll-hidden');
                
                // Stagger children if present
                const children = entry.target.querySelectorAll('[data-stagger]');
                children.forEach((child, index) => {
                    child.style.animationDelay = `${index * 0.1}s`;
                    child.classList.add('animate-fadeInUp');
                });
            }
        });
    }, observerOptions);
    
    // Observe all elements with scroll-hidden class
    document.querySelectorAll('.scroll-hidden').forEach(el => {
        observer.observe(el);
    });
    
    // Also observe sections for general animations
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
}

// === COUNTER ANIMATIONS ===
function initCounterAnimations() {
    const counters = document.querySelectorAll('[data-counter]');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-counter'));
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;
                
                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = formatNumber(Math.floor(current));
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = formatNumber(target);
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => observer.observe(counter));
}

// Format number with commas/suffix
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K+';
    }
    return num.toLocaleString();
}

// === SMOOTH SCROLL ===
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// === COMMUNITY FILTER ===
function initCommunityFilter() {
    const searchInput = document.getElementById('community-search');
    const communityCards = document.querySelectorAll('.community-card:not(.community-main)');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            communityCards.forEach(card => {
                const name = card.querySelector('.community-card-name').textContent.toLowerCase();
                
                if (name.includes(searchTerm)) {
                    card.style.display = 'flex';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        if (!name.includes(searchInput.value.toLowerCase())) {
                            card.style.display = 'none';
                        }
                    }, 300);
                }
            });
        });
    }
}

// === PARALLAX EFFECT ===
function initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        parallaxElements.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-parallax')) || 0.5;
            el.style.transform = `translateY(${scrollY * speed}px)`;
        });
    });
}

// === TYPING EFFECT (for hero) ===
function initTypingEffect() {
    const typingElement = document.querySelector('[data-typing]');
    
    if (typingElement) {
        const text = typingElement.getAttribute('data-typing');
        typingElement.textContent = '';
        let index = 0;
        
        const type = () => {
            if (index < text.length) {
                typingElement.textContent += text.charAt(index);
                index++;
                setTimeout(type, 100);
            }
        };
        
        type();
    }
}

// === UTILITY: Debounce function ===
function debounce(func, wait) {
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

// === UTILITY: Throttle function ===
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

// === COMMUNITY DATA ===
const communityData = [
    { name: "Bình Dân Học AI (Gốc)", url: "https://web.facebook.com/groups/363657942789633", isMain: true },
    { name: "Cao Bằng Học AI", url: "https://web.facebook.com/groups/839376981043889/" },
    { name: "Lạng Sơn Học AI", url: "https://web.facebook.com/groups/449104794618721/" },
    { name: "Lào Cai Học AI", url: "https://web.facebook.com/groups/1017536793295056/" },
    { name: "Lai Châu Học AI", url: "https://web.facebook.com/groups/1484367785787879/" },
    { name: "Điện Biên Học AI", url: "https://web.facebook.com/groups/1195388771803055/" },
    { name: "Sơn La Học AI", url: "https://web.facebook.com/groups/786067340406765/" },
    { name: "Tuyên Quang Học AI", url: "https://web.facebook.com/groups/858331086144932/" },
    { name: "Thái Nguyên Học AI", url: "https://web.facebook.com/groups/1061624828625907/" },
    { name: "Phú Thọ Học AI", url: "https://web.facebook.com/groups/1154617945806879/" },
    { name: "Bắc Ninh Học AI", url: "https://web.facebook.com/groups/790361816417043/" },
    { name: "Hưng Yên Học AI", url: "https://web.facebook.com/groups/1301049160855052/" },
    { name: "Quảng Ninh Học AI", url: "https://web.facebook.com/groups/456770387327674/" },
    { name: "Hà Nội Học AI", url: "https://web.facebook.com/groups/1683352255766829/" },
    { name: "Hải Phòng Học AI", url: "https://web.facebook.com/groups/1005548954625265/" },
    { name: "Ninh Bình Học AI", url: "https://web.facebook.com/groups/975811484223779/" },
    { name: "Thanh Hoá Học AI", url: "https://web.facebook.com/groups/326918583708938/" },
    { name: "Nghệ An Học AI", url: "https://web.facebook.com/groups/1026832155522926/" },
    { name: "Hà Tĩnh Học AI", url: "https://web.facebook.com/groups/836440994737739/" },
    { name: "Quảng Trị Học AI", url: "https://web.facebook.com/groups/910293380903920/" },
    { name: "Huế Học AI", url: "https://web.facebook.com/groups/394538489759363/" },
    { name: "Đà Nẵng Học AI", url: "https://web.facebook.com/groups/488665503658987/" },
    { name: "Quảng Ngãi Học AI", url: "https://web.facebook.com/groups/414879647535143/" },
    { name: "Gia Lai Học AI", url: "https://web.facebook.com/groups/794935262837458/" },
    { name: "Đắk Lắk Học AI", url: "https://web.facebook.com/groups/414957804227862/" },
    { name: "Lâm Đồng Học AI", url: "https://web.facebook.com/groups/2581965958662819" },
    { name: "Khánh Hòa Học AI", url: "https://web.facebook.com/groups/1887595741740241/" },
    { name: "Đồng Nai Học AI", url: "https://web.facebook.com/groups/dongnaihocai/" },
    { name: "Tây Ninh Học AI", url: "https://web.facebook.com/groups/1117517535978818/" },
    { name: "TP Hồ Chí Minh Học AI", url: "https://web.facebook.com/groups/1075863104262168/" },
    { name: "Đồng Tháp Học AI", url: "https://web.facebook.com/groups/3591639397666303/" },
    { name: "Vĩnh Long Học AI", url: "https://web.facebook.com/groups/3365842973715521/" },
    { name: "Cần Thơ Học AI", url: "https://web.facebook.com/groups/1068312391525806/" },
    { name: "An Giang Học AI", url: "https://web.facebook.com/groups/1203908820743002/" },
    { name: "Cà Mau Học AI", url: "https://web.facebook.com/groups/486370417409068/" }
];

// Export for use in HTML if needed
window.communityData = communityData;
