document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initializePage();
    
    // Load data
    loadAnalytics();
    loadCRData();
    
    // Setup event listeners
    setupEventListeners();
});

let crData = [];
let analyticsData = {};
let charts = {};
let dataTable;

function initializePage() {
    // Theme switcher
    const themeSwitch = document.getElementById('theme-checkbox');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeSwitch.checked = currentTheme === 'dark';
    
    themeSwitch.addEventListener('change', function() {
        const theme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update charts for theme change
        setTimeout(() => {
            updateChartsForTheme();
        }, 100);
    });
}

function setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });
    
    // Chart type buttons
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const chartName = this.dataset.chart;
            const chartType = this.dataset.type;
            
            // Update active button
            this.parentElement.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Recreate chart with new type
            createChart(chartName, chartType);
        });
    });
    
    // Search and filter controls
    document.getElementById('search-input').addEventListener('input', debounce(filterTable, 300));
    document.getElementById('status-filter').addEventListener('change', filterTable);
    document.getElementById('priority-filter').addEventListener('change', filterTable);
    document.getElementById('component-filter').addEventListener('change', filterTable);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
}

function switchSection(section) {
    // Update navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Trigger resize for charts if analytics section is shown
    if (section === 'analytics') {
        setTimeout(() => {
            Object.values(charts).forEach(chart => {
                if (chart) chart.resize();
            });
        }, 100);
    }
}

async function loadAnalytics() {
    try {
        showLoading('analytics');
        const response = await fetch('/api/cr-analytics');
        analyticsData = await response.json();
        
        updateSummaryCards();
        createAllCharts();
        
    } catch (error) {
        console.error('Error loading analytics:', error);
        showError('Failed to load analytics data', 'analytics-section');
    }
}

async function loadCRData() {
    try {
        showLoading('search');
        const response = await fetch('/api/cr-data');
        crData = await response.json();
        
        initializeDataTable();
        
    } catch (error) {
        console.error('Error loading CR data:', error);
        showError('Failed to load CR data', 'search-section');
    }
}

function updateSummaryCards() {
    const { lines_stats } = analyticsData;
    const totalCrs = crData.length || 0;
    const avgComments = crData.length > 0 ? 
        Math.round(crData.reduce((sum, cr) => sum + cr.comments, 0) / crData.length) : 0;
    
    animateNumber('total-crs', totalCrs);
    animateNumber('lines-added', lines_stats.total_added);
    animateNumber('lines-removed', lines_stats.total_removed);
    animateNumber('avg-comments', avgComments);
}

function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.round(startValue + (targetValue - startValue) * progress);
        
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function createAllCharts() {
    createChart('status', 'pie');
    createChart('priority', 'pie');
    createChart('component', 'bar');
    createChart('author', 'bar');
}

function createChart(chartName, chartType) {
    const canvas = document.getElementById(`${chartName}-chart`);
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (charts[chartName]) {
        charts[chartName].destroy();
    }
    
    const data = analyticsData[`${chartName}_distribution`];
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    const colors = generateColors(labels.length);
    
    let chartConfig = {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: chartType === 'pie' ? 'right' : 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim()
                    }
                },
                tooltip: {
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim(),
                    titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
                    bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim(),
                    borderWidth: 1
                }
            },
            scales: chartType !== 'pie' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim()
                    }
                }
            } : {}
        }
    };
    
    // Special handling for histogram
    if (chartType === 'histogram') {
        chartConfig.type = 'bar';
        chartConfig.options.plugins.legend.display = false;
    }
    
    charts[chartName] = new Chart(ctx, chartConfig);
}

function generateColors(count) {
    const baseColors = [
        '#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ef4444',
        '#8b5cf6', '#f97316', '#84cc16', '#ec4899', '#6366f1'
    ];
    
    const background = [];
    const border = [];
    
    for (let i = 0; i < count; i++) {
        const color = baseColors[i % baseColors.length];
        background.push(color + '80'); // Add transparency
        border.push(color);
    }
    
    return { background, border };
}

function updateChartsForTheme() {
    Object.keys(charts).forEach(chartName => {
        if (charts[chartName]) {
            const chartType = charts[chartName].config.type;
            createChart(chartName, chartType);
        }
    });
}

function initializeDataTable() {
    // Destroy existing table if it exists
    if (dataTable) {
        dataTable.destroy();
    }
    
    // Populate table with data
    const tbody = document.querySelector('#cr-table tbody');
    tbody.innerHTML = '';
    
    crData.forEach(cr => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cr.id}</td>
            <td>${cr.title}</td>
            <td>${cr.author}</td>
            <td>${cr.reviewer}</td>
            <td><span class="status-badge status-${cr.status.toLowerCase().replace(' ', '-')}">${cr.status}</span></td>
            <td><span class="priority-badge priority-${cr.priority.toLowerCase()}">${cr.priority}</span></td>
            <td>${cr.component}</td>
            <td>${cr.created_date}</td>
            <td>${cr.updated_date}</td>
            <td class="text-success">+${cr.lines_added}</td>
            <td class="text-danger">-${cr.lines_removed}</td>
            <td>${cr.comments}</td>
            <td class="${cr.score >= 0 ? 'text-success' : 'text-danger'}">${cr.score > 0 ? '+' : ''}${cr.score}</td>
            <td>
                <button class="action-btn btn-view" onclick="viewCRDetails('${cr.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Initialize DataTable
    dataTable = $('#cr-table').DataTable({
        pageLength: 25,
        order: [[7, 'desc']], // Sort by created date descending
        columnDefs: [
            { orderable: false, targets: [13] } // Disable sorting for actions column
        ],
        language: {
            search: '',
            searchPlaceholder: 'Search table...'
        }
    });
}

function filterTable() {
    if (!dataTable) return;
    
    const searchTerm = document.getElementById('search-input').value;
    const statusFilter = document.getElementById('status-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    const componentFilter = document.getElementById('component-filter').value;
    
    // Apply global search
    dataTable.search(searchTerm);
    
    // Apply column filters
    dataTable.column(4).search(statusFilter); // Status column
    dataTable.column(5).search(priorityFilter); // Priority column
    dataTable.column(6).search(componentFilter); // Component column
    
    dataTable.draw();
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('priority-filter').value = '';
    document.getElementById('component-filter').value = '';
    
    if (dataTable) {
        dataTable.search('').columns().search('').draw();
    }
}

function viewCRDetails(crId) {
    const cr = crData.find(item => item.id === crId);
    if (!cr) return;
    
    const modalContent = document.getElementById('cr-details-content');
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Basic Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>ID:</strong></td><td>${cr.id}</td></tr>
                    <tr><td><strong>Title:</strong></td><td>${cr.title}</td></tr>
                    <tr><td><strong>Author:</strong></td><td>${cr.author}</td></tr>
                    <tr><td><strong>Reviewer:</strong></td><td>${cr.reviewer}</td></tr>
                    <tr><td><strong>Status:</strong></td><td><span class="status-badge status-${cr.status.toLowerCase().replace(' ', '-')}">${cr.status}</span></td></tr>
                    <tr><td><strong>Priority:</strong></td><td><span class="priority-badge priority-${cr.priority.toLowerCase()}">${cr.priority}</span></td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Details</h6>
                <table class="table table-sm">
                    <tr><td><strong>Component:</strong></td><td>${cr.component}</td></tr>
                    <tr><td><strong>Branch:</strong></td><td>${cr.branch}</td></tr>
                    <tr><td><strong>Created:</strong></td><td>${cr.created_date}</td></tr>
                    <tr><td><strong>Updated:</strong></td><td>${cr.updated_date}</td></tr>
                    <tr><td><strong>Lines Added:</strong></td><td class="text-success">+${cr.lines_added}</td></tr>
                    <tr><td><strong>Lines Removed:</strong></td><td class="text-danger">-${cr.lines_removed}</td></tr>
                    <tr><td><strong>Comments:</strong></td><td>${cr.comments}</td></tr>
                    <tr><td><strong>Score:</strong></td><td class="${cr.score >= 0 ? 'text-success' : 'text-danger'}">${cr.score > 0 ? '+' : ''}${cr.score}</td></tr>
                </table>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h6>Description</h6>
                <p class="text-muted">${cr.description}</p>
            </div>
        </div>
    `;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('cr-details-modal'));
    modal.show();
}

function showLoading(section) {
    const loadingHtml = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading ${section} data...</p>
        </div>
    `;
    
    if (section === 'analytics') {
        document.getElementById('analytics-section').innerHTML = loadingHtml;
    } else if (section === 'search') {
        document.querySelector('#search-section .table-container').innerHTML = loadingHtml;
    }
}

function showError(message, sectionId) {
    const errorHtml = `
        <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
        </div>
    `;
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.innerHTML = errorHtml;
    }
}

// Utility functions
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

// Export functions for global access
window.viewCRDetails = viewCRDetails;