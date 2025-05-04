// ZeroTrustKerberosLink Documentation Site Enhancement Script

// Function to inject our custom CSS
function injectCustomStyles() {
  try {
    // Create a link element for our custom CSS
    const customCSS = document.createElement('link');
    customCSS.rel = 'stylesheet';
    customCSS.href = 'https://zerotrustkerberoslink.com/site-assets/docs-logo.css';
    customCSS.type = 'text/css';
    
    // Append it to the head
    document.head.appendChild(customCSS);
    
    // Add logo if it's missing
    const logoElement = document.querySelector('.md-header__button.md-logo');
    if (logoElement && !logoElement.querySelector('img')) {
      const logoImg = document.createElement('img');
      logoImg.src = 'https://zerotrustkerberoslink.com/assets/cerberus-symbol.png';
      logoImg.alt = 'ZeroTrustKerberosLink';
      logoElement.appendChild(logoImg);
      console.log('Logo image added to header');
    }
    
    // Add a link back to the main site in the header title
    const headerTitle = document.querySelector('.md-header__topic');
    if (headerTitle && !document.querySelector('.back-to-main')) {
      const backLink = document.createElement('a');
      backLink.href = 'https://zerotrustkerberoslink.com/';
      backLink.className = 'back-to-main';
      backLink.textContent = 'Back to Main Site';
      headerTitle.appendChild(backLink);
    }
    
    console.log('ZeroTrustKerberosLink custom styles and logo injected');
  } catch (error) {
    console.error('Error injecting ZeroTrustKerberosLink styles:', error);
  }
}

// Run when the page loads
document.addEventListener('DOMContentLoaded', injectCustomStyles);

// Also run now in case the DOM is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  injectCustomStyles();
}

// Create a MutationObserver to handle dynamic content loading
const observer = new MutationObserver(function(mutations) {
  try {
    // Check if our logo is still present
    const logoElement = document.querySelector('.md-header__button.md-logo');
    if (logoElement && !logoElement.querySelector('img')) {
      injectCustomStyles();
    }
  } catch (error) {
    console.error('Error in MutationObserver:', error);
  }
});

// Start observing the document with the configured parameters
try {
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  console.log('MutationObserver started for logo monitoring');
} catch (error) {
  console.error('Error starting MutationObserver:', error);
}

// Force logo injection after a short delay to handle various load conditions
setTimeout(injectCustomStyles, 1000);
