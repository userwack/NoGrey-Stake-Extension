// contentPreload.js - FOUC prevention with synchronous theme application
(function() {
  // Immediately hide page content with maximum priority CSS
  const criticalStyle = document.createElement('style');
  criticalStyle.id = 'critical-fouc-prevention';
  criticalStyle.textContent = `
    html.theme-loading {
      visibility: hidden !important;
      opacity: 0 !important;
    }
    html.theme-loading * {
      transition: none !important;
      animation: none !important;
      visibility: hidden !important;
    }
    /* Keep only the loader visible and the header-wrapper for PNG */
    html.theme-loading #siteLoader,
    html.theme-loading #siteLoader * {
      visibility: visible !important;
      opacity: 1 !important;
    }
    /* Hide the original background image if it's applied via a pseudo-element */
    html.theme-loading .header-wrapper.flex.justify-center.py-8.w-full.bg-cover {
      background-image: none !important;
    }
  `;
  
  // Insert at the very beginning of head for maximum priority
  if (document.head) {
    document.head.insertBefore(criticalStyle, document.head.firstChild);
  } else {
    // If head doesn't exist yet, create it
    const head = document.createElement('head');
    head.appendChild(criticalStyle);
    document.documentElement.insertBefore(head, document.documentElement.firstChild);
  }
  
  document.documentElement.classList.add('theme-loading');
  
  // Synchronously apply theme colors from storage
  function applyCriticalTheme() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['themeColor', 'themeColorRgb'], result => {
          if (result.themeColorRgb) {
            const [r, g, b] = result.themeColorRgb;
            const [dr, dg, db] = [Math.floor(r * 0.7), Math.floor(g * 0.7), Math.floor(b * 0.7)];
            
            // Create comprehensive theme styles
            const themeStyle = document.createElement('style');
            themeStyle.id = 'critical-theme-injection';
            themeStyle.textContent = `
              /* Critical theme styles applied immediately */
              body {
                background: rgb(${dr}, ${dg}, ${db}) !important;
                transition: none !important;
              }
              footer {
                background-color: rgb(${r}, ${g}, ${b}) !important;
                transition: none !important;
              }
              .group.variant-.svelte-wqnjon {
                background-color: rgb(${r}, ${g}, ${b}) !important;
                transition: none !important;
              }
              .sidebar.svelte-il9p4a {
                background-color: rgb(${dr}, ${dg}, ${db}) !important;
                transition: none !important;
              }
              .input-wrap.svelte-1xxjdnu {
                background-color: rgb(${dr}, ${dg}, ${db}) !important;
                transition: none !important;
              }
              input.svelte-1xxjdnu {
                background-color: rgb(${dr}, ${dg}, ${db}) !important;
                transition: none !important;
              }
              .index-ribbon.svelte-1qzrgyz {
                background-color: rgb(${dr}, ${dg}, ${db}) !important;
                transition: none !important;
              }
              .sidebar.normal.svelte-1o1elgh {
                background-color: rgb(${dr}, ${dg}, ${db}) !important;
                transition: none !important;
              }
              .add-background.svelte-1o1elgh {
                background-color: rgb(${dr}, ${dg}, ${db}) !important;
                transition: none !important;
              }
              :root {
                --grey-500: rgb(${r}, ${g}, ${b}) !important;
              }
              table.table-content thead.bg-grey-600 {
                background-color: rgb(${dr}, ${dg}, ${db}) !important;
                transition: none !important;
              }
              table.table-content thead.chromatic-ignore.bg-grey-600 {
                background-color: rgb(${dr}, ${dg}, ${db}) !important;
                transition: none !important;
              }
              /* Ensure all elements inherit the no-transition rule initially */
              html.theme-loading * {
                transition: none !important;
                animation: none !important;
              }
              /* Hide the original header background image */
              .header-wrapper.flex.justify-center.py-8.w-full.bg-cover {
                background-image: none !important;
              }
            `;
            document.head.appendChild(themeStyle);
            window.criticalThemeStyle = themeStyle;
          }
          resolve(result);
        });
      } else {
        resolve({});
      }
    });
  }
  
  // Track page state more precisely
  window.pageRevealState = {
    criticalThemeApplied: false,
    loaderHidden: false,
    contentReady: false,
    finalThemeApplied: false
  };
  
  // Function to check if page should be revealed
  function checkPageReveal() {
    const state = window.pageRevealState;
    
    // Only reveal when loader is hidden AND we have theme applied
    if (state.loaderHidden && state.criticalThemeApplied) {
      revealPage();
    }
  }
  
  // Reveal page with smooth transition
  function revealPage() {
    
    // Remove the loading class to show content
    document.documentElement.classList.remove('theme-loading');
    
    // Add a brief transition back after revealing
    setTimeout(() => {
      if (window.criticalThemeStyle) {
        // Update the style to allow transitions again
        const transitionStyle = document.createElement('style');
        transitionStyle.textContent = `
          * {
            transition: background-color 0.3s ease, color 0.3s ease !important;
          }
        `;
        document.head.appendChild(transitionStyle);
        
        // Clean up after transitions are restored
        setTimeout(() => {
          const criticalStyle = document.getElementById('critical-fouc-prevention');
          if (criticalStyle) criticalStyle.remove();
        }, 50);
      }
    }, 100);
  }
  
  // Enhanced loader monitoring with MutationObserver
  function monitorLoader() {
    const checkLoader = () => {
      const siteLoader = document.getElementById('siteLoader');
      if (siteLoader) {
        const isHidden = window.getComputedStyle(siteLoader).display === 'none' || 
                        siteLoader.style.display === 'none' ||
                        !siteLoader.offsetParent;
        
        if (isHidden && !window.pageRevealState.loaderHidden) {
          window.pageRevealState.loaderHidden = true;
          checkPageReveal();
        }
      } else {
        // No loader found, consider it hidden
        if (!window.pageRevealState.loaderHidden) {
          window.pageRevealState.loaderHidden = true;
          checkPageReveal();
        }
      }
    };
    
    // Check immediately
    checkLoader();
    
    // Set up observer for the entire document to catch loader changes
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      for (const mutation of mutations) {
        // Check for attribute changes (style modifications)
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
          const target = mutation.target;
          if (target.id === 'siteLoader' || target.closest('#siteLoader')) {
            shouldCheck = true;
            break;
          }
        }
        
        // Check for removed nodes (loader being removed)
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          for (const node of mutation.removedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && 
                (node.id === 'siteLoader' || node.querySelector('#siteLoader'))) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
      
      if (shouldCheck) {
        // Small delay to ensure DOM has settled
        setTimeout(checkLoader, 10);
      }
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Periodic check as backup
    const interval = setInterval(() => {
      if (window.pageRevealState.loaderHidden) {
        clearInterval(interval);
        return;
      }
      checkLoader();
    }, 100);
    
    // Clear interval after reasonable time
    setTimeout(() => clearInterval(interval), 10000);
  }
  
  // Initialize everything
  async function initialize() {
    // Apply critical theme first
    await applyCriticalTheme();
    window.pageRevealState.criticalThemeApplied = true;
    
    // Start monitoring loader
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(monitorLoader, 10);
      });
    } else {
      setTimeout(monitorLoader, 10);
    }
    
    // Check initial state
    checkPageReveal();
  }
  
  // Listen for theme updates from the main content script
  window.addEventListener('themeFullyApplied', () => {
    window.pageRevealState.finalThemeApplied = true;
  });
  
  // Safety fallback - force reveal after timeout
  setTimeout(() => {
    if (document.documentElement.classList.contains('theme-loading')) {
      revealPage();
    }
  }, 5000);
  
  // Start initialization
  initialize();
})();