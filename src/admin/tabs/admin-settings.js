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

  // Delete All Rules
  document
    .getElementById("delete-all-rules")
    ?.addEventListener("click", async function () {
      if (
        !confirm(
          "Are you sure you want to delete all geo rules? This action cannot be undone.",
        )
      ) {
        return;
      }

      try {
        const response = await wp.apiFetch({
          path: "maki-geo/v1/rules",
          method: "DELETE",
        });

        if (response.success) {
          alert("All rules have been deleted successfully.");
          window.location.reload();
        }
      } catch (error) {
        console.error("Failed to delete rules:", error);
        alert("Failed to delete rules. Please try again.");
      }
    });
});
