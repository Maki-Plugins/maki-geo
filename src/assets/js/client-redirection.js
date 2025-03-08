/**
 * Client-side geo redirection script
 */
(function() {
    // Check if we've already redirected to prevent loops
    if (sessionStorage.getItem('mgeo_redirected')) {
        return;
    }

    // Fetch redirection info from the API
    wp.apiFetch({
        path: 'maki-geo/v1/redirection'
    }).then(function(response) {
        if (response.redirect && response.url) {
            // Set flag to prevent redirect loops
            sessionStorage.setItem('mgeo_redirected', '1');
            
            // Perform the redirection
            window.location.href = response.url;
        }
    }).catch(function(error) {
        console.error('Geo redirection error:', error);
    });
})();
