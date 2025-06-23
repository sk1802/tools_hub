document.addEventListener('DOMContentLoaded', function () {
    // Animate fadein/popin elements
    document.querySelectorAll('.animated-fadein, .animated-popin').forEach((el, idx) => {
        const delay = parseFloat(el.style.animationDelay) || 0;
        setTimeout(() => el.classList.add('start-animation'), delay * 1000);
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const html = document.documentElement;
    function setTheme(mode) {
        if (mode === 'dark') {
            html.setAttribute('data-bs-theme', 'dark');
            themeIcon.className = 'bi bi-moon-stars-fill';
        } else {
            html.setAttribute('data-bs-theme', 'light');
            themeIcon.className = 'bi bi-brightness-high-fill';
        }
        localStorage.setItem('theme', mode);
    }
    // Initial theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        let mode = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        setTheme(mode);
    });
});