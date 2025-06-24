document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });

    // Theme switcher functionality
    const themeSwitch = document.getElementById('checkbox');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeSwitch.checked = currentTheme === 'dark';

    themeSwitch.addEventListener('change', function() {
        const theme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Add smooth transition effect
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'linear-gradient(135deg, rgba(79, 70, 229, 0.95), rgba(6, 182, 212, 0.95))';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'linear-gradient(135deg, #4f46e5, #06b6d4)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
    });

    // Load team structure
    loadTeamStructure();

    // Add parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroParticles = document.querySelector('.hero-particles');
        if (heroParticles) {
            heroParticles.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Add hover effects to tool cards
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add typing effect to hero title
    typeWriter();
});

// Tool launch functionality
function openTool(toolName) {
    // Add loading state
    const event = new CustomEvent('toolLaunch', { detail: { tool: toolName } });
    document.dispatchEvent(event);
    
    // Simulate tool launch with loading animation
    showLoadingModal(toolName);
    
    // Replace these URLs with your actual deployed tool URLs
    const toolUrls = {
        'gerrit-count': '/tools/gerrit-count',
        'cr-database': '/tools/cr-database',
        'rampup': '/tools/rampup',
        'calculator1': '/tools/calculator1',
        'calculator2': '/tools/calculator2',
        'linux-next': '/tools/linux-next'
    };
    
    setTimeout(() => {
        hideLoadingModal();
        if (toolUrls[toolName]) {
            window.open(toolUrls[toolName], '_blank');
        } else {
            showNotification(`${toolName} tool is coming soon!`, 'info');
        }
    }, 1500);
}

// Loading modal functionality
function showLoadingModal(toolName) {
    const modal = document.createElement('div');
    modal.className = 'loading-modal';
    modal.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner-large">
                <i class="fas fa-cog fa-spin"></i>
            </div>
            <h3>Launching ${toolName}</h3>
            <p>Please wait while we prepare your tool...</p>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .loading-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(10px);
        }
        .loading-content {
            text-align: center;
            color: white;
            background: var(--bg-card);
            padding: 3rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
        }
        .loading-spinner-large i {
            font-size: 3rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
}

function hideLoadingModal() {
    const modal = document.querySelector('.loading-modal');
    if (modal) {
        modal.remove();
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--bg-card);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            border-left: 4px solid var(--primary-color);
            z-index: 9998;
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: slideInRight 0.3s ease;
        }
        .notification button {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 1rem;
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Team structure loading
async function loadTeamStructure() {
    try {
        const response = await fetch('/api/team-structure');
        const teamData = await response.json();
        renderTeamStructure(teamData);
    } catch (error) {
        console.error('Error loading team structure:', error);
        showNotification('Failed to load team structure', 'error');
    }
}

function renderTeamStructure(data, level = 0) {
    const container = level === 0 ? document.getElementById('team-hierarchy') : document.createElement('div');
    
    if (level === 0) {
        container.innerHTML = '';
        container.className = 'team-hierarchy';
    } else {
        container.className = 'team-children';
    }
    
    const memberDiv = document.createElement('div');
    memberDiv.className = 'team-member';
    memberDiv.innerHTML = `
        <img src="${data.avatar}" alt="${data.name}" />
        <h4>${data.name}</h4>
        <p>${data.role}</p>
    `;
    
    container.appendChild(memberDiv);
    
    if (data.children && data.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'team-children';
        
        data.children.forEach(child => {
            const childElement = renderTeamStructure(child, level + 1);
            childrenContainer.appendChild(childElement);
        });
        
        container.appendChild(childrenContainer);
    }
    
    return container;
}

// Typing effect for hero title
function typeWriter() {
    const titleElement = document.querySelector('.hero-title');
    if (!titleElement) return;
    
    const text = 'PCIe Tools\nDevelopment Hub';
    const words = text.split('\n');
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            titleElement.innerHTML = `
                <span class="text-gradient">${currentWord.substring(0, charIndex - 1)}</span><br>
                ${wordIndex === 1 ? words[1] : 'Development Hub'}
            `;
            charIndex--;
        } else {
            if (wordIndex === 0) {
                titleElement.innerHTML = `
                    <span class="text-gradient">${currentWord.substring(0, charIndex + 1)}</span><br>
                    Development Hub
                `;
            } else {
                titleElement.innerHTML = `
                    <span class="text-gradient">PCIe Tools</span><br>
                    ${currentWord.substring(0, charIndex + 1)}
                `;
            }
            charIndex++;
        }
        
        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            setTimeout(type, 1000);
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            setTimeout(type, 500);
        } else {
            setTimeout(type, isDeleting ? 50 : 100);
        }
    }
    
    // Start typing effect after page load
    setTimeout(type, 2000);
}

// Add smooth hover animations
document.addEventListener('mouseover', function(e) {
    if (e.target.classList.contains('btn')) {
        e.target.style.transform = 'translateY(-2px) scale(1.05)';
    }
});

document.addEventListener('mouseout', function(e) {
    if (e.target.classList.contains('btn')) {
        e.target.style.transform = 'translateY(0) scale(1)';
    }
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});