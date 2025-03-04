document.addEventListener("DOMContentLoaded", function () {
  // API Key Verification
  document
    .getElementById("verify-api-key")
    ?.addEventListener("click", async function () {
      const apiKeyInput = document.querySelector('input[name="mgeo_api_key"]');
      const apiKey = apiKeyInput.value.trim();

      if (!apiKey) {
        alert("Please enter an API key first.");
        return;
      }

      try {
        const response = await wp.apiFetch({
          path: "maki-geo/v1/verify-key",
          method: "POST",
          data: { api_key: apiKey },
        });

        if (response.success) {
          alert(
            "API key verified successfully! Monthly limit: " +
              response.data.monthly_limit,
          );
        } else {
          alert("Invalid API key. Please check and try again.");
        }
      } catch (error) {
        console.error("Failed to verify key:", error);
        alert("Failed to verify API key. Please try again.");
      }
    });
});
