(function() {
    console.log('Initializing popup handler...');
    const popups = document.querySelectorAll('.geo-popup-overlay');
    console.log('Found popups:', popups.length);

    popups.forEach((popup, index) => {
        const container = popup.querySelector('.geo-popup-container');
        const closeBtn = popup.querySelector('.geo-popup-close');
        const triggerType = container.dataset.trigger;
        const delay = parseInt(container.dataset.delay) || 0;

        console.log(`Popup ${index + 1} configuration:`, {
            triggerType,
            delay,
            hasContainer: !!container,
            hasCloseBtn: !!closeBtn
        });

        // Close popup when clicking outside
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closePopup(popup);
            }
        });

        // Close button handler
        closeBtn?.addEventListener('click', () => closePopup(popup));

        // Handle different trigger types
        switch (triggerType) {
            case 'immediate':
                showPopup(popup);
                break;
            case 'delayed':
                setTimeout(() => showPopup(popup), delay * 1000);
                break;
            case 'exit':
                handleExitIntent(popup);
                break;
        }
    });
})();

function showPopup(popup) {
    console.log('Showing popup...');
    console.log('Initial display:', popup.style.display);
    console.log('Initial classList:', popup.classList);

    popup.style.display = 'flex';
    // Force a reflow before adding the active class
    void popup.offsetWidth;
    popup.classList.add('is-active');

    console.log('After showing:', {
        display: popup.style.display,
        classList: popup.classList,
        opacity: window.getComputedStyle(popup.querySelector('.geo-popup-container')).opacity
    });
}

function closePopup(popup) {
    console.log('Closing popup...');
    console.log('Before closing:', {
        classList: popup.classList,
        display: popup.style.display
    });

    popup.classList.remove('is-active');
    
    // Wait for transition to complete before hiding
    setTimeout(() => {
        if (!popup.classList.contains('is-active')) {
            popup.style.display = 'none';
            console.log('Popup hidden');
        }
    }, 300);
}

function handleExitIntent(popup) {
    let shouldShow = true;
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0 && shouldShow) {
            showPopup(popup);
            shouldShow = false;
        }
    });
}
