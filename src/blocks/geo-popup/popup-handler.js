document.addEventListener('DOMContentLoaded', () => {
    const popups = document.querySelectorAll('.geo-popup-overlay');

    popups.forEach(popup => {
        const container = popup.querySelector('.geo-popup-container');
        const closeBtn = popup.querySelector('.geo-popup-close');
        const triggerType = container.dataset.trigger;
        const delay = parseInt(container.dataset.delay) || 0;

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
});

function showPopup(popup) {
    popup.classList.add('is-active');
}

function closePopup(popup) {
    popup.classList.remove('is-active');
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
