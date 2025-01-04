document.addEventListener("DOMContentLoaded", function () {
  const popups = document.querySelectorAll(".geo-popup-overlay");

  popups.forEach((popup) => {
    const container = popup.querySelector(".geo-popup-container");
    const closeBtn = popup.querySelector(".geo-popup-close");
    const triggerType = container.dataset.trigger;
    const delay = parseInt(container.dataset.delay) || 0;

    // Close popup when clicking outside
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        closePopup(popup);
      }
    });

    // Close button handler
    closeBtn?.addEventListener("click", () => closePopup(popup));

    // Handle different trigger types
    switch (triggerType) {
      case "immediate":
        // showPopup(popup);
        break;
      case "delayed":
        setTimeout(() => showPopup(popup), delay * 1000);
        break;
      case "exit":
        handleExitIntent(popup);
        break;
    }
  });
});

function showPopup(popup) {
  popup.style.display = "flex";
  // Force a reflow before adding the active class
  void popup.offsetWidth;
  popup.classList.add("is-active");
}

function closePopup(popup) {
  popup.classList.remove("is-active");

  // Wait for transition to complete before hiding
  setTimeout(() => {
    if (!popup.classList.contains("is-active")) {
      popup.style.display = "none";
    }
  }, 300);
}

function handleExitIntent(popup) {
  let shouldShow = true;

  const handleMouseMove = (e) => {
    // Check if the mouse is moving towards the top of the viewport
    if (e.clientY < 10 && shouldShow) {
      showPopup(popup);
      shouldShow = false;
      // Remove the event listener after showing the popup
      document.removeEventListener("mousemove", handleMouseMove);
    }
  };

  document.addEventListener("mousemove", handleMouseMove);
}
