// UI Helper Functions
class UIHelpers {
    constructor() {
        this.initializeHelpers();
    }

    initializeHelpers() {
        // Auto-focus first input in modals when they open
        this.setupModalFocus();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup form enhancements
        this.setupFormEnhancements();
    }

    setupModalFocus() {
        // Observer for modal visibility changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const modal = mutation.target;
                    if (modal.classList.contains('modal') && modal.style.display === 'block') {
                        // Modal was opened, focus first input
                        setTimeout(() => {
                            const firstInput = modal.querySelector('input, textarea, select');
                            if (firstInput) {
                                firstInput.focus();
                            }
                        }, 100);
                    }
                }
            });
        });

        // Observe all modals
        document.querySelectorAll('.modal').forEach(modal => {
            observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape key to close modals
            if (e.key === 'Escape') {
                const visibleModal = document.querySelector('.modal[style*="block"]');
                if (visibleModal && window.app) {
                    window.app.closeModal(visibleModal.id);
                }
            }

            // Ctrl/Cmd + Enter to submit form
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const activeForm = document.activeElement.closest('form');
                if (activeForm) {
                    const submitBtn = activeForm.querySelector('button[type="submit"], input[type="submit"]');
                    if (submitBtn && !submitBtn.disabled) {
                        submitBtn.click();
                    }
                }
            }

            // Ctrl/Cmd + Shift + S for screenshot
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                if (window.screenshotManager) {
                    window.screenshotManager.takeScreenshot();
                }
            }
        });
    }

    setupFormEnhancements() {
        // Auto-resize textareas
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'TEXTAREA') {
                this.autoResizeTextarea(e.target);
            }
        });

        // Form validation visual feedback
        document.addEventListener('blur', (e) => {
            if (e.target.matches('input[required], textarea[required], select[required]')) {
                this.validateField(e.target);
            }
        }, true);

        // Clear validation on input
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.clearFieldValidation(e.target);
            }
        });
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    validateField(field) {
        const isValid = field.checkValidity();
        
        if (isValid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
        }
    }

    clearFieldValidation(field) {
        field.classList.remove('valid', 'invalid');
    }

    // Utility function to show toast notifications
    showToast(message, type = 'info', duration = 4000) {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);

        // Auto-remove toast
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);

        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        });
    }

    // Utility function to format timestamps
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }

        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        }

        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }

        // More than 24 hours - show date
        return date.toLocaleDateString();
    }

    // Utility function to copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard', 'success', 2000);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showToast('Failed to copy to clipboard', 'error', 3000);
            return false;
        }
    }

    // Utility function to truncate text
    truncateText(text, maxLength = 50, suffix = '...') {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    // Utility function to debounce function calls
    debounce(func, wait) {
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

    // Utility function to throttle function calls
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Utility function to animate element
    animateElement(element, animation, duration = 300) {
        return new Promise((resolve) => {
            element.style.animation = `${animation} ${duration}ms ease-out`;
            
            const handleAnimationEnd = () => {
                element.style.animation = '';
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', handleAnimationEnd);
        });
    }

    // Utility function to check if element is in viewport
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Utility function to scroll element into view smoothly
    scrollIntoView(element, behavior = 'smooth') {
        element.scrollIntoView({
            behavior: behavior,
            block: 'center',
            inline: 'nearest'
        });
    }
}

// Add CSS for toast slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .form-group input.valid,
    .form-group textarea.valid,
    .form-group select.valid {
        border-color: #28a745;
        box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.1);
    }
    
    .form-group input.invalid,
    .form-group textarea.invalid,
    .form-group select.invalid {
        border-color: #dc3545;
        box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.1);
    }
`;
document.head.appendChild(style);

// Initialize UI helpers
window.uiHelpers = new UIHelpers();

// Export commonly used functions globally
window.showToast = (message, type, duration) => window.uiHelpers.showToast(message, type, duration);
window.copyToClipboard = (text) => window.uiHelpers.copyToClipboard(text);
window.formatTimestamp = (timestamp) => window.uiHelpers.formatTimestamp(timestamp);