// ========================================
// MODAL EVENT HANDLER FIXES
// ========================================

// 1. PROPER MODAL CLASS IMPLEMENTATION
class ModalManager {
    constructor() {
        this.activeModals = [];
        this.init();
    }

    init() {
        // Add global escape key handler
        document.addEventListener('keydown', this.handleEscapeKey.bind(this));

        // Add global click handler for backdrop clicks
        document.addEventListener('click', this.handleBackdropClick.bind(this));
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal || this.isModalOpen(modalId)) return;

        // Clean up any existing event listeners first
        this.removeModalEventListeners(modalId);

        // Add modal to active list
        this.activeModals.push(modalId);

        // Show the modal
        modal.style.display = 'block';
        modal.classList.add('active');

        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');

        // Add modal-specific event listeners
        this.addModalEventListeners(modalId);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Remove from active modals
        this.activeModals = this.activeModals.filter(id => id !== modalId);

        // Hide the modal
        modal.style.display = 'none';
        modal.classList.remove('active');

        // Clean up event listeners
        this.removeModalEventListeners(modalId);

        // Remove modal-backdrop if present
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

        // Restore body scrolling if no other modals are open
        if (this.activeModals.length === 0) {
            document.body.style.overflow = 'auto';
            document.body.classList.remove('modal-open');
        }
    }

    addModalEventListeners(modalId) {
        const modal = document.getElementById(modalId);
        const closeButtons = modal.querySelectorAll('.modal-close, [data-modal-close]');

        // Add close button listeners
        closeButtons.forEach(button => {
            button.addEventListener('click', () => this.closeModal(modalId));
        });
    }

    removeModalEventListeners(modalId) {
        const modal = document.getElementById(modalId);
        const closeButtons = modal.querySelectorAll('.modal-close, [data-modal-close]');

        // Remove close button listeners by cloning elements (removes all listeners)
        closeButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
    }

    handleEscapeKey(event) {
        if (event.key === 'Escape' && this.activeModals.length > 0) {
            // Close the most recently opened modal
            const lastModal = this.activeModals[this.activeModals.length - 1];
            this.closeModal(lastModal);
        }
    }

    handleBackdropClick(event) {
        // Only close if clicking on the modal backdrop itself
        if (event.target.classList.contains('modal') && 
            this.activeModals.includes(event.target.id)) {
            this.closeModal(event.target.id);
        }
    }

    isModalOpen(modalId) {
        return this.activeModals.includes(modalId);
    }

    // Emergency cleanup function (like the one that worked for you)
    forceCloseAllModals() {
        // Remove all modal elements
        document.querySelectorAll('.modal, .modal-backdrop, [data-modal]').forEach(el => el.remove());

        // Restore body state
        document.body.style.overflow = 'auto';
        document.body.classList.remove('modal-open');

        // Clear active modals
        this.activeModals = [];
    }
}

// ========================================
// RESTAURANT DASHBOARD SPECIFIC FIXES
// ========================================

// Initialize the modal manager
const modalManager = new ModalManager();

// Fix for Restaurant Distribution Chart Modal
function initializeRestaurantModal() {
    const chartModal = document.getElementById('restaurant-chart-modal');
    if (!chartModal) return;

    // Add proper close functionality
    const closeBtn = chartModal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modalManager.closeModal('restaurant-chart-modal');
        });
    }

    // Add trigger button
    const chartTrigger = document.querySelector('[data-chart-trigger]');
    if (chartTrigger) {
        chartTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            modalManager.openModal('restaurant-chart-modal');
        });
    }
}

// ========================================
// SEARCH BAR FIXES
// ========================================

function initializeSearchBar() {
    const searchInput = document.getElementById('restaurant-search');
    if (!searchInput) return;

    // Remove any existing event listeners
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    // Add proper search functionality
    let searchTimeout;
    newSearchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value);
        }, 300); // Debounce search
    });
}

function performSearch(query) {
    const restaurantCards = document.querySelectorAll('.restaurant-card');
    const lowerQuery = query.toLowerCase();

    restaurantCards.forEach(card => {
        const name = card.querySelector('.restaurant-name')?.textContent.toLowerCase() || '';
        const category = card.querySelector('.restaurant-category')?.textContent.toLowerCase() || '';

        if (name.includes(lowerQuery) || category.includes(lowerQuery) || query === '') {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ========================================
// INITIALIZATION AND ERROR HANDLING
// ========================================

// Safe initialization with error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeRestaurantModal();
        initializeSearchBar();

        console.log('Restaurant dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);

        // Fallback: add emergency close function to window
        window.emergencyCloseModal = () => {
            modalManager.forceCloseAllModals();
        };
    }
});

// Add global error handler for modal issues
window.addEventListener('error', function(event) {
    if (event.message.includes('modal') || event.message.includes('Modal')) {
        console.warn('Modal error detected, attempting cleanup...');
        modalManager.forceCloseAllModals();
    }
});

// Add a global keyboard shortcut: Ctrl+Shift+M to force close all modals
// This should be after DOMContentLoaded to ensure modalManager exists

document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
        modalManager.forceCloseAllModals();
        console.warn('All modals force-closed via keyboard shortcut.');
    }
});

// Periodic check to auto-cleanup stuck modals and overlays when no modals are open
setInterval(() => {
    if (modalManager.activeModals.length === 0) {
        document.querySelectorAll('.modal, .modal-backdrop').forEach(el => {
            if (el.style.display !== 'none') el.remove();
        });
        document.body.style.overflow = 'auto';
        document.body.classList.remove('modal-open');
    }
}, 5000); // every 5 seconds
