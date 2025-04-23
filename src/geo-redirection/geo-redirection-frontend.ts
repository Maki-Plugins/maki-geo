/**
 * Client-side geo redirection script
 */
export function runGeoRedirect() {
  // Check if we've already redirected to prevent loops
  if (sessionStorage.getItem("mgeo_redirected")) {
    return;
  }

  if (!window.wp?.apiFetch) {
    console.error("Maki Geo redirection error: No window.wp.apiFetch found.");
    return;
  }
  // Fetch redirection info from the API
  window.wp
    .apiFetch({
      path: "maki-geo/v1/redirection",
    })
    .then(function (response: { redirect: boolean; url: string }) {
      if (response.redirect && response.url) {
        // Set flag to prevent redirect loops
        sessionStorage.setItem("mgeo_redirected", "1");

        // Perform the redirection
        window.location.href = response.url;
      }
    })
    .catch(function (error: Error) {
      console.error("Maki Geo redirection error:", error);
    });
}
