(function () {
  const allowedDomains = [
    "stake.us",
    "stake.com",
    "stake.ac",
    "stake.games",
    "stake.bet",
    "stake.pet",
    "stake1001.com",
    "stake1002.com",
    "stake1003.com",
    "stake1021.com",
    "stake1022.com",
    "stake.mba",
    "stake.jp",
    "stake.bz",
    "staketr.com",
    "stake.ceo",
    "stake.krd"
  ];

  const currentHostname = window.location.hostname;
  const isAllowedDomain = allowedDomains.some(domain => currentHostname.endsWith(domain));

  if (!isAllowedDomain) {
    // If not an allowed domain, exit the content script early
    return;
  }

  chrome.storage.sync.get(['themeColor'], (result) => {
    if (result.themeColor) { // Only apply FOUC prevention if a theme is set
      const style = document.createElement('style');
      style.textContent = '#affiliate-hero-banner { background-image: none !important; }';
      document.head.appendChild(style);
    }
  });

  // Debounce utility
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }


  // Define brightness ratios based on the original --grey-XXX values relative to --grey-500
  // These ratios are derived from the average brightness of the original grey colors.
  const shadeRatios = {
    '100': 4.31,
    '200': 3.70,
    '300': 2.13,
    '350': 1.59,
    '400': 1.28,
    '500': 1.00, // Base color
    '600': 1.08,
    '700': 0.61,
    '800': 0.50,
    '900': 0.43,
  };


  // Function to generate shades based on a base RGB color
  function generateShades(baseRgb) {
    const [r, g, b] = baseRgb;

    const shades = {};
    for (const [shadeNum, ratio] of Object.entries(shadeRatios)) {
      const newR = Math.min(255, Math.floor(r * ratio));
      const newG = Math.min(255, Math.floor(g * ratio));
      const newB = Math.min(255, Math.floor(b * ratio));
      const rgbValue = `rgb(${newR}, ${newG}, ${newB})`;
      if (shadeNum !== '200') {
        shades[`--grey-${shadeNum}`] = rgbValue;
        shades[`--color-grey-${shadeNum}`] = rgbValue; // Add both --grey and --color-grey
      }
      shades[`--color-blue-${shadeNum}`] = rgbValue;
      shades[`--blue-${shadeNum}`] = rgbValue;
    }
    return shades;
  }

  function applyColors(colors) {
    const isStakeUs = currentHostname === 'stake.us';
    if (isStakeUs) {
      document.body.classList.add('stake-us-theme');
    } else {
      document.body.classList.remove('stake-us-theme');
    }

    if (colors.themeColor) {

      const headerWrapper = document.querySelector(
        '.header-wrapper.flex.justify-center.py-8.w-full.bg-cover'
      );
      if (headerWrapper) {
        // Store the original background-image only if it hasn't been stored yet
        if (!headerWrapper.dataset.originalBg) {
          headerWrapper.dataset.originalBg = headerWrapper.style.backgroundImage;
        }
        const pngUrl = chrome.runtime.getURL(
          `png/output_${colors.themeColor}.png`
        );
        headerWrapper.style.setProperty('background-image', `url("${pngUrl}")`, 'important');
      }

      const affiliateHeroBanner = document.getElementById('affiliate-hero-banner');
      if (affiliateHeroBanner) {
        // No need to store originalBg for affiliateHeroBanner as it's always replaced with a webp
        const pngUrl = chrome.runtime.getURL(
          `png/output_${colors.themeColor}.png`
        );
        affiliateHeroBanner.style.setProperty('background-image', `url("${pngUrl}")`, 'important');
      }

    }

    if (colors.themeColorRgb) {
      const shades = generateShades(colors.themeColorRgb);

      // Before applying new shades, attempt to clear conflicting inline styles
      // on elements that are likely to use the --color-grey-XXX variables.
      document.querySelectorAll('[class*="--grey-"]').forEach(element => {
        element.style.removeProperty('color');
        element.style.removeProperty('background-color');
        // Add other properties if they are known to be problematic
        // element.style.removeProperty('border-color');
        // element.style.removeProperty('fill');
        // element.style.removeProperty('stroke');
      });

      // Apply generated shades to :root CSS variables
      const root = document.documentElement;
      for (const varName in shades) {
        root.style.setProperty(varName, shades[varName], 'important');
      }

      // Apply accent colors for consistency
      root.style.setProperty('--accent', colors.themeColor || '#00d4ff');
      if (colors.themeColorRgb) {
        root.style.setProperty('--accent-rgb', colors.themeColorRgb.join(', '));
      }

      // Handle gradient classes like 'from-grey-XXX to-grey-YYY'
      document.querySelectorAll('[class*="from-grey-"][class*="to-grey-"]').forEach(element => {
        const classList = Array.from(element.classList);
        let fromColor = null;
        let toColor = null;

        for (const cls of classList) {
          if (cls.startsWith('from-grey-')) {
            const shadeNum = cls.replace('from-grey-', '');
            fromColor = shades[`--grey-${shadeNum}`];
          } else if (cls.startsWith('to-grey-')) {
            const shadeNum = cls.replace('to-grey-', '');
            toColor = shades[`--grey-${shadeNum}`];
          }
        }

        if (fromColor && toColor) {
          element.style.setProperty('background-image', `linear-gradient(to right, ${fromColor}, ${toColor})`, 'important');
        }
      });

      // Conditional handling for 'bg-grey-XXX' classes
      if (isStakeUs) {
        // Inject dynamic style for bg-grey-XXX classes for stake.us
        const bgStyleId = 'stake-us-bg-style';
        let bgStyleElement = document.getElementById(bgStyleId);
        if (!bgStyleElement) {
          bgStyleElement = document.createElement('style');
          bgStyleElement.id = bgStyleId;
          document.head.appendChild(bgStyleElement);
        }
        let bgCssRules = '';
        for (const shadeNum of Object.keys(shadeRatios)) {
          bgCssRules += `
            body.stake-us-theme .bg-grey-${shadeNum} {
              background-color: ${shades[`--color-grey-${shadeNum}`]} !important;
            }
          `;
        }
        bgStyleElement.textContent = bgCssRules;
      } else {
        // Original logic for other domains: Change 'bg-grey-XXX' classes to 'grey-XXX'
        document.querySelectorAll('[class^="bg-grey-"]').forEach(element => {
          const classList = Array.from(element.classList);
          for (const cls of classList) {
            if (cls.startsWith('bg-grey-')) {
              const newClass = cls.replace('bg-', '');
              element.classList.remove(cls);
              element.classList.add(newClass);
            }
          }
        });
      }

      // Handle specific inline style changes for --border-color
      if (colors.themeColorRgb) {
        const originalRgb = `rgb(${colors.themeColorRgb.join(', ')})`;
        const darkestShade = shades['--grey-900'];

        document.querySelectorAll('[style*="--border-color: #017aff;"]').forEach(element => {
          if (element.style.display === 'contents') {
            element.style.setProperty('--border-color', originalRgb, 'important');
          }
        });

        document.querySelectorAll('[style*="--border-color: #00CA51;"]').forEach(element => {
          if (element.style.display === 'contents') {
            element.style.setProperty('--border-color', darkestShade, 'important');
          }
        });
      }

      // Inject dynamic style for scrollbar-color
      const styleId = 'stake-theme-scrollbar-style';
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      if (shades['--grey-400']) {
        styleElement.textContent = `
          .scrollY {
            scrollbar-color: ${shades['--grey-400']} transparent !important;
          }
          /* For Webkit browsers */
          .scrollY::-webkit-scrollbar-thumb {
            background-color: ${shades['--grey-400']} !important;
          }
          .scrollY::-webkit-scrollbar-track {
            background-color: transparent !important;
          }
        `;
      }
 
      // Handle hover:bg-grey-XXX classes
      const hoverStyleId = 'stake-theme-hover-style';
      let hoverStyleElement = document.getElementById(hoverStyleId);
      if (!hoverStyleElement) {
        hoverStyleElement = document.createElement('style');
        hoverStyleElement.id = hoverStyleId;
        document.head.appendChild(hoverStyleElement);
      }

      let hoverCssRules = '';
      for (const shadeNum of Object.keys(shadeRatios)) {
        if (isStakeUs) {
          hoverCssRules += `
            body.stake-us-theme .hover\\:bg-grey-${shadeNum}:hover {
              background-color: ${shades[`--color-grey-${shadeNum}`]} !important;
            }
          `;
        } else {
          hoverCssRules += `
            html .hover\\:bg-grey-${shadeNum}:hover {
              background-color: ${shades[`--color-grey-${shadeNum}`]} !important;
            }
          `;
        }
      }
      hoverStyleElement.textContent = hoverCssRules;

      // Remove 'bg-transparent' from elements that also have 'hover:bg-grey-XXX'
      document.querySelectorAll('[class*="hover:bg-grey-"]').forEach(element => {
        if (element.classList.contains('bg-transparent')) {
          element.classList.remove('bg-transparent');
        }
      });

      // Locate and change border-t-grey-500 to border-t-grey-100
      document.querySelectorAll('.border-t-grey-500').forEach(element => {
        element.classList.remove('border-t-grey-500');
        element.classList.add('border-t-grey-100');
      });
    } // This closes the if (colors.themeColorRgb) block
 
    window.dispatchEvent(new CustomEvent('themeFullyApplied'));
  } // This closes the applyColors function

  // Apply colors safely and twice for late elements
  function applyColorsImmediately(colors) {
    requestAnimationFrame(() => {
      applyColors(colors);
      setTimeout(() => {
        applyColors(colors);
      }, 100);
    });
  }

  // Link to Button logic with improved message parsing and different website support
function initializeUrlConversionAndPreviews() {
    
    const chatContainer = document.querySelector('#right-sidebar .content.svelte-6tkwn0');
    if (!chatContainer) {
        setTimeout(enableGyazoHoverPreviewDebug, 1000);
        return;
    }


    // Helper function to extract text content from message elements
    function extractMessageText(messageElement) {
        
        // Try multiple approaches to get the text
        const approaches = [
            () => messageElement.textContent,
            () => messageElement.innerText,
            () => {
                const clone = messageElement.cloneNode(true);
                const userTags = clone.querySelectorAll('.user-tags, .wrap.svelte-7vpeow');
                userTags.forEach(tag => tag.remove());
                return clone.textContent;
            }
        ];
        
        for (let i = 0; i < approaches.length; i++) {
            try {
                const text = approaches[i]();
                if (text && text.trim()) {
                    return text.trim();
                }
            } catch (e) {
            }
        }
        
        return '';
    }

    // Function to fetch YouTube video title
    async function fetchYouTubeTitle(videoId) {
        try {
            const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
            const data = await response.json();
            return data.title || 'YouTube Video';
        } catch (error) {
            return 'YouTube Video';
        }
    }

    // Function to create YouTube preview element with hover menu
    function createYouTubePreviewElement(videoId, videoTitle, originalUrl) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'youtube-preview-container';
        previewContainer.style.cssText = `
            display: inline-block;
            position: relative;
            margin: 4px 8px;
            vertical-align: middle;
            background: rgba(255, 0, 0, 0.1);
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(255, 0, 0, 0.3);
            transition: all 0.2s ease;
            cursor: pointer;
        `;

        const youtubeLink = document.createElement('div');
        youtubeLink.className = 'youtube-link';
        youtubeLink.textContent = `▶️ ${videoTitle}`;
        youtubeLink.style.cssText = `
            color:rgb(11, 194, 255);
            text-decoration: none;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: bold;
            position: relative;
            display: inline-block;
            transition: color 0.2s ease;
            max-width: 250px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        // Create hover menu
        const hoverMenu = document.createElement('div');
        hoverMenu.className = 'youtube-hover-menu';
        hoverMenu.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a1a;
            border: 1px solid #ff0000;
            border-radius: 6px;
            padding: 8px;
            z-index: 1000000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            white-space: nowrap;
            margin-top: 4px;
        `;

        // Create menu options
        const viewVideoBtn = document.createElement('button');
        viewVideoBtn.textContent = '🎬 View Video';
        viewVideoBtn.style.cssText = `
            display: block;
            width: 100%;
            background: #ff0000;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 4px;
            transition: background 0.2s ease;
        `;
        viewVideoBtn.onmouseover = () => viewVideoBtn.style.background = '#cc0000';
        viewVideoBtn.onmouseout = () => viewVideoBtn.style.background = '#ff0000';

        const goToPageBtn = document.createElement('button');
        goToPageBtn.textContent = '🔗 Go To Page';
        goToPageBtn.style.cssText = `
            display: block;
            width: 100%;
            background: #666;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s ease;
        `;
        goToPageBtn.onmouseover = () => goToPageBtn.style.background = '#555';
        goToPageBtn.onmouseout = () => goToPageBtn.style.background = '#666';

        // Create the modal that will appear when View Video is clicked
        const modal = document.createElement('div');
        modal.className = 'youtube-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000001;
            justify-content: center;
            align-items: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: relative;
            width: 80%;
            max-width: 800px;
            height: 60vh;
            background: #1a1a1a;
            border-radius: 12px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.9);
            border: 2px solid #ff0000;
            padding: 16px;
            display: flex;
            flex-direction: column;
        `;

        // Create iframe for YouTube video
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            flex: 1;
            width: 100%;
            height: calc(100% - 40px);
            border: none;
            border-radius: 8px;
        `;
        iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: #ff0000;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
        `;

        // Create title display
        const titleDisplay = document.createElement('div');
        titleDisplay.textContent = videoTitle;
        titleDisplay.style.cssText = `
            color: white;
            padding: 8px 0;
            margin-bottom: 8px;
            font-size: 14px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        // Event handlers
        let hoverTimeout;
        let isHoveringContainer = false;
        let isHoveringMenu = false;

        const showMenu = () => {
            clearTimeout(hoverTimeout);
            hoverMenu.style.display = 'block';
        };

        const hideMenu = () => {
            hoverTimeout = setTimeout(() => {
                if (!isHoveringContainer && !isHoveringMenu) {
                    hoverMenu.style.display = 'none';
                }
            }, 200);
        };

        previewContainer.onmouseenter = () => {
            isHoveringContainer = true;
            previewContainer.style.background = 'rgba(255, 0, 0, 0.2)';
            previewContainer.style.borderColor = 'rgba(255, 0, 0, 0.5)';
            youtubeLink.style.color = '#ff6b6b';
            showMenu();
        };

        previewContainer.onmouseleave = () => {
            isHoveringContainer = false;
            previewContainer.style.background = 'rgba(255, 0, 0, 0.1)';
            previewContainer.style.borderColor = 'rgba(255, 0, 0, 0.3)';
            youtubeLink.style.color = '#ff0000';
            hideMenu();
        };

        hoverMenu.onmouseenter = () => {
            isHoveringMenu = true;
            clearTimeout(hoverTimeout);
        };

        hoverMenu.onmouseleave = () => {
            isHoveringMenu = false;
            hideMenu();
        };

        viewVideoBtn.onclick = (e) => {
            e.stopPropagation();
            // Set iframe source without autoplay
            iframe.src = `https://www.youtube.com/embed/${videoId}`;
            modal.style.display = 'flex';
            hoverMenu.style.display = 'none';
        };

        goToPageBtn.onclick = (e) => {
            e.stopPropagation();
            window.open(originalUrl, '_blank', 'noopener,noreferrer');
            hoverMenu.style.display = 'none';
        };

        closeButton.onclick = (e) => {
            e.stopPropagation();
            modal.style.display = 'none';
            // Clear iframe source to stop video
            iframe.src = '';
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                iframe.src = '';
            }
        };

        // Assemble components
        hoverMenu.appendChild(viewVideoBtn);
        hoverMenu.appendChild(goToPageBtn);
        previewContainer.appendChild(youtubeLink);
        previewContainer.appendChild(hoverMenu);
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(titleDisplay);
        modalContent.appendChild(iframe);
        modal.appendChild(modalContent);
        
        // Add modal to document
        document.body.appendChild(modal);

        return previewContainer;
    }

    // Function to create Streamable preview element with hover menu
    function createStreamablePreviewElement(streamableId, originalUrl) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'streamable-preview-container';
        previewContainer.style.cssText = `
            display: inline-block;
            position: relative;
            margin: 4px 8px;
            vertical-align: middle;
            background: rgba(100, 65, 165, 0.1); /* Streamable purple-ish */
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(100, 65, 165, 0.3);
            transition: all 0.2s ease;
            cursor: pointer;
        `;

        const streamableLink = document.createElement('div');
        streamableLink.className = 'streamable-link';
        streamableLink.textContent = `▶️ Streamable Video`;
        streamableLink.style.cssText = `
            color: #6441a5; /* Streamable purple */
            text-decoration: none;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: bold;
            position: relative;
            display: inline-block;
            transition: color 0.2s ease;
            max-width: 250px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        // Create hover menu
        const hoverMenu = document.createElement('div');
        hoverMenu.className = 'streamable-hover-menu';
        hoverMenu.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a1a;
            border: 1px solid #6441a5;
            border-radius: 6px;
            padding: 8px;
            z-index: 1000000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            white-space: nowrap;
            margin-top: 4px;
        `;

        // Create menu options
        const viewVideoBtn = document.createElement('button');
        viewVideoBtn.textContent = '🎬 View Video';
        viewVideoBtn.style.cssText = `
            display: block;
            width: 100%;
            background: #6441a5;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 4px;
            transition: background 0.2s ease;
        `;
        viewVideoBtn.onmouseover = () => viewVideoBtn.style.background = '#503482';
        viewVideoBtn.onmouseout = () => viewVideoBtn.style.background = '#6441a5';

        const goToPageBtn = document.createElement('button');
        goToPageBtn.textContent = '🔗 Go To Page';
        goToPageBtn.style.cssText = `
            display: block;
            width: 100%;
            background: #666;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s ease;
        `;
        goToPageBtn.onmouseover = () => goToPageBtn.style.background = '#555';
        goToPageBtn.onmouseout = () => goToPageBtn.style.background = '#666';

        // Create the modal that will appear when View Video is clicked
        const modal = document.createElement('div');
        modal.className = 'streamable-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000001;
            justify-content: center;
            align-items: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: relative;
            width: 80%;
            max-width: 800px;
            height: 60vh;
            background: #1a1a1a;
            border-radius: 12px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.9);
            border: 2px solid #6441a5;
            padding: 16px;
            display: flex;
            flex-direction: column;
        `;

        // Create iframe for Streamable video
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            flex: 1;
            width: 100%;
            height: calc(100% - 40px);
            border: none;
            border-radius: 8px;
        `;
        iframe.allow = 'autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: #6441a5;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
        `;

        // Create title display (placeholder for Streamable, as no easy title API)
        const titleDisplay = document.createElement('div');
        titleDisplay.textContent = 'Streamable Video';
        titleDisplay.style.cssText = `
            color: white;
            padding: 8px 0;
            margin-bottom: 8px;
            font-size: 14px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        // Event handlers
        let hoverTimeout;
        let isHoveringContainer = false;
        let isHoveringMenu = false;

        const showMenu = () => {
            clearTimeout(hoverTimeout);
            hoverMenu.style.display = 'block';
        };

        const hideMenu = () => {
            hoverTimeout = setTimeout(() => {
                if (!isHoveringContainer && !isHoveringMenu) {
                    hoverMenu.style.display = 'none';
                }
            }, 200);
        };

        previewContainer.onmouseenter = () => {
            isHoveringContainer = true;
            previewContainer.style.background = 'rgba(100, 65, 165, 0.2)';
            previewContainer.style.borderColor = 'rgba(100, 65, 165, 0.5)';
            streamableLink.style.color = '#8a6fc9';
            showMenu();
        };

        previewContainer.onmouseleave = () => {
            isHoveringContainer = false;
            previewContainer.style.background = 'rgba(100, 65, 165, 0.1)';
            previewContainer.style.borderColor = 'rgba(100, 65, 165, 0.3)';
            streamableLink.style.color = '#6441a5';
            hideMenu();
        };

        hoverMenu.onmouseenter = () => {
            isHoveringMenu = true;
            clearTimeout(hoverTimeout);
        };

        hoverMenu.onmouseleave = () => {
            isHoveringMenu = false;
            hideMenu();
        };

        viewVideoBtn.onclick = (e) => {
            e.stopPropagation();
            iframe.src = `https://streamable.com/e/${streamableId}?autoplay=1`;
            modal.style.display = 'flex';
            hoverMenu.style.display = 'none';
        };

        goToPageBtn.onclick = (e) => {
            e.stopPropagation();
            window.open(originalUrl, '_blank', 'noopener,noreferrer');
            hoverMenu.style.display = 'none';
        };

        closeButton.onclick = (e) => {
            e.stopPropagation();
            modal.style.display = 'none';
            iframe.src = ''; // Clear iframe source to stop video
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                iframe.src = '';
            }
        };

        // Assemble components
        hoverMenu.appendChild(viewVideoBtn);
        hoverMenu.appendChild(goToPageBtn);
        previewContainer.appendChild(streamableLink);
        previewContainer.appendChild(hoverMenu);
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(titleDisplay);
        modalContent.appendChild(iframe);
        modal.appendChild(modalContent);
        
        // Add modal to document
        document.body.appendChild(modal);

        return previewContainer;
    }

    // Function to create Gyazo preview element
    function createGyazoPreviewElement(gyazoUrl, gyazoId, index) {
        
        // Function to try loading image with different extensions
        const getGyazoImageUrl = (id, extension) => `https://i.gyazo.com/${id}.${extension}`;
        
        // Create preview container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'gyazo-preview-container';
        previewContainer.style.cssText = `
            display: inline-block;
            position: relative;
            margin: 4px 8px;
            vertical-align: middle;
            background: rgba(0, 220, 255, 0.1);
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(0, 220, 255, 0.3);
            transition: all 0.2s ease;
        `;
        
        // Create the clickable link
        const gyazoLink = document.createElement('a');
        gyazoLink.href = gyazoUrl;
        gyazoLink.target = '_blank';
        gyazoLink.rel = 'noopener noreferrer';
        gyazoLink.className = 'gyazo-link';
        gyazoLink.textContent = `📷 Gyazo Image`;
        gyazoLink.style.cssText = `
            color: #00d4ff;
            text-decoration: none;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: bold;
            position: relative;
            display: inline-block;
            transition: color 0.2s ease;
        `;
        
        // Create the preview image
        const previewImg = document.createElement('img');
        previewImg.alt = 'Gyazo Preview';
        previewImg.className = 'gyazo-preview-img';
        previewImg.dataset.gyazoId = gyazoId; // Store gyazoId for error handling
        previewImg.dataset.currentExtension = 'webp'; // Start with webp
        previewImg.src = getGyazoImageUrl(gyazoId, 'webp'); // Initial attempt with .webp
        previewImg.style.cssText = `
            display: none;
            position: fixed;
            max-width: 500px;
            max-height: 400px;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.9);
            border: 2px solid #00d4ff;
            z-index: 999999;
            background: #1a1a1a;
            padding: 8px;
            pointer-events: none;
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.2s ease, transform 0.2s ease;
        `;
        
        // Add preview image to document first
        document.body.appendChild(previewImg);
        
        // Create hover functionality with unique identifiers
        let previewTimeout;
        let showTimeout;
        let isHovering = false;
        let mouseMoveHandler = null;
        
        const showPreview = (e) => {
            clearTimeout(previewTimeout);
            clearTimeout(showTimeout);
            isHovering = true;
            
            const updatePosition = (event) => {
                const x = event.clientX + 20;
                const y = event.clientY + 20;
                
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                const previewWidth = 520;
                const previewHeight = 420;
                
                let finalX = x;
                let finalY = y;
                
                if (x + previewWidth > viewportWidth) {
                    finalX = event.clientX - previewWidth - 20;
                }
                
                if (y + previewHeight > viewportHeight) {
                    finalY = event.clientY - previewHeight - 20;
                }
                
                finalX = Math.max(10, Math.min(finalX, viewportWidth - previewWidth - 10));
                finalY = Math.max(10, Math.min(finalY, viewportHeight - previewHeight - 10));
                
                previewImg.style.left = finalX + 'px';
                previewImg.style.top = finalY + 'px';
            };
            
            updatePosition(e);
            
            showTimeout = setTimeout(() => {
                if (isHovering) {
                    previewImg.style.display = 'block';
                    previewImg.offsetHeight; // Force reflow
                    previewImg.style.opacity = '1';
                    previewImg.style.transform = 'scale(1)';
                }
            }, 150);
            
            mouseMoveHandler = (event) => {
                if (isHovering) {
                    updatePosition(event);
                }
            };
            
            gyazoLink.addEventListener('mousemove', mouseMoveHandler);
        };
        
        const hidePreview = () => {
            isHovering = false;
            clearTimeout(showTimeout);
            
            if (mouseMoveHandler) {
                gyazoLink.removeEventListener('mousemove', mouseMoveHandler);
                mouseMoveHandler = null;
            }
            
            previewTimeout = setTimeout(() => {
                if (!isHovering) {
                    previewImg.style.opacity = '0';
                    previewImg.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        if (!isHovering) {
                            previewImg.style.display = 'none';
                        }
                    }, 200);
                }
            }, 100);
        };
        
        // Attach hover listeners - THIS IS CRITICAL
        gyazoLink.addEventListener('mouseenter', showPreview);
        gyazoLink.addEventListener('mouseleave', hidePreview);
        
        
        // Add hover effect to container
        previewContainer.addEventListener('mouseenter', () => {
            previewContainer.style.background = 'rgba(0, 220, 255, 0.2)';
            previewContainer.style.borderColor = 'rgba(0, 220, 255, 0.5)';
        });
        
        previewContainer.addEventListener('mouseleave', () => {
            previewContainer.style.background = 'rgba(0, 220, 255, 0.1)';
            previewContainer.style.borderColor = 'rgba(0, 220, 255, 0.3)';
        });
        
        // Handle image loading
        previewImg.addEventListener('load', () => {
            gyazoLink.style.color = '#00d4ff';
            gyazoLink.title = 'Click to open full size';
        });
        
        previewImg.addEventListener('error', function() {
            const currentExt = this.dataset.currentExtension;
            if (currentExt === 'webp') {
                // Try with .png if .webp fails
                this.src = getGyazoImageUrl(this.dataset.gyazoId, 'png');
                this.dataset.currentExtension = 'png';
                gyazoLink.title = 'Image failed to load with .webp, trying .png';
            } else if (currentExt === 'png') {
                // Try with .jpg if .png fails
                this.src = getGyazoImageUrl(this.dataset.gyazoId, 'jpg');
                this.dataset.currentExtension = 'jpg';
                gyazoLink.title = 'Image failed to load with .png, trying .jpg';
            } else {
                // If .jpg also fails, mark as failed
                gyazoLink.style.color = '#ff6b6b';
                gyazoLink.title = 'Image failed to load - click to try opening directly';
                gyazoLink.textContent = `❌ Gyazo Image (Failed)`;
            }
        });
        
        previewContainer.appendChild(gyazoLink);
        
        return previewContainer;
    }

    // Function to recursively replace URLs in text nodes
    async function replaceUrlsInNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;
            let lastIndex = 0;
            const fragment = document.createDocumentFragment();
            
            // Combined regex for all URL types
            const combinedRegex = /(https?:\/\/(?:www\.)?gyazo\.com\/([a-zA-Z0-9]+))|(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\?si=[a-zA-Z0-9_-]+)?)|(https?:\/\/(?:www\.)?streamable\.com\/(?:e\/)?([a-zA-Z0-9]+))|(https?:\/\/(?:www\.)?ibb\.co\/([a-zA-Z0-9]{7,8}))|(https?:\/\/(?:www\.)?prnt\.sc\/([a-zA-Z0-9_]+))|(https?:\/\/(?:www\.)?stake\.com\/promotions\/promotion\/([a-zA-Z0-9-]+))|(https?:\/\/(?:www\.)?stakecommunity\.com\/board\/(\d+)-([a-zA-Z0-9-]+)\/?)/g;
            let match;

            while ((match = combinedRegex.exec(text)) !== null) {
                const fullUrl = match[0];
                const startIndex = match.index;

                // Append text before the URL
                if (startIndex > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, startIndex)));
                }

                let previewElement = null;

                // Determine URL type and create appropriate element
                if (match[1]) { // Gyazo
                    urlType = 'gyazo';
                    const gyazoId = match[2];
                    previewElement = createGyazoPreviewElement(fullUrl, gyazoId, 0); // Index is not critical here
                } else if (match[3]) { // YouTube
                    urlType = 'youtube';
                    const videoId = match[4];
                    const cleanedYoutubeUrl = fullUrl.split('?')[0]; // Remove any query params for the button link
                    const videoTitle = await fetchYouTubeTitle(videoId);
                    previewElement = createYouTubePreviewElement(videoId, videoTitle, cleanedYoutubeUrl);
                } else if (match[5]) { // Streamable
                    urlType = 'streamable';
                    const streamableId = match[6];
                    previewElement = createStreamablePreviewElement(streamableId, fullUrl);
                } else if (match[7]) { // IBB
                    urlType = 'ibb';
                    previewElement = createIbbButton(fullUrl, 0); // Index is not critical here
                } else if (match[9]) { // prnt.sc
                    urlType = 'prntsc';
                    previewElement = createPrntScButton(fullUrl, 0); // Index is not critical here
                } else if (match[11]) { // Stake Promotion
                    urlType = 'stakePromotion';
                    const promotionSlug = match[12];
                    previewElement = createStakePromotionButton(fullUrl, promotionSlug);
                } else if (match[13]) { // Stake Community Board
                    urlType = 'stakeCommunityBoard';
                    const boardId = match[14];
                    const boardSlug = match[15];
                    previewElement = createStakeCommunityBoardButton(fullUrl, boardId, boardSlug);
                }

                if (previewElement) {
                    fragment.appendChild(previewElement);
                } else {
                    // If no preview element was created, just append the original URL text
                    fragment.appendChild(document.createTextNode(fullUrl));
                }
                lastIndex = combinedRegex.lastIndex;
            }

            // Append any remaining text after the last URL
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }

            // Replace the original text node with the fragment, ensuring parent exists
            if (fragment.childNodes.length > 0 && node.parentNode) {
                node.parentNode.replaceChild(fragment, node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Collect all text nodes first to avoid issues with DOM modification during iteration
            const textNodesToProcess = [];
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i];
                if (child.nodeType === Node.TEXT_NODE) {
                    textNodesToProcess.push(child);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    // Recursively process child elements
                    await replaceUrlsInNode(child);
                }
            }

            // Now process the collected text nodes
            for (const textNode of textNodesToProcess) {
                // Ensure the textNode is still in the DOM and has a parent
                if (textNode.parentNode) {
                    await replaceUrlsInNode(textNode);
                }
            }
        }
    }

    // Function to process individual messages for media URLs
    async function processMessageForMedia(messageP) {
        
        if (messageP.getAttribute('data-media-processed')) {
            return;
        }
        
        // Extract the actual message text (for logging/initial check, not for modification)
        let messageText = extractMessageText(messageP);
        
        if (!messageText) {
            return;
        }
        
        // Start the recursive replacement from the messageP element
        await replaceUrlsInNode(messageP);

        messageP.setAttribute('data-media-processed', 'true');
    }

    // Function to create Stake Promotion Button
    function createStakePromotionButton(promotionUrl, promotionSlug) {

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'stake-promotion-button-container';
        buttonContainer.style.cssText = `
            display: inline-block;
            margin: 4px 8px;
            vertical-align: middle;
        `;

        const promotionButton = document.createElement('button');
        promotionButton.textContent = `🎁 View Promotion: ${formatPromotionSlug(promotionSlug)}`;
        promotionButton.style.cssText = `
            background: linear-gradient(90deg, #00d4ff, #007bff);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: bold;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        promotionButton.onmouseover = () => {
            promotionButton.style.background = 'linear-gradient(90deg, #00aaff, #0056b3)';
            promotionButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
            promotionButton.style.transform = 'translateY(-1px)';
        };
        promotionButton.onmouseout = () => {
            promotionButton.style.background = 'linear-gradient(90deg, #00d4ff, #007bff)';
            promotionButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            promotionButton.style.transform = 'translateY(0)';
        };
        promotionButton.onclick = (e) => {
            e.stopPropagation();
            window.open(promotionUrl, '_blank', 'noopener,noreferrer');
        };

        buttonContainer.appendChild(promotionButton);
        return buttonContainer;
    }

    // Function to create Stake Community Board Button
    function createStakeCommunityBoardButton(boardUrl, boardId, boardSlug) {

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'stake-community-board-button-container';
        buttonContainer.style.cssText = `
            display: inline-block;
            margin: 4px 8px;
            vertical-align: middle;
        `;

        const boardButton = document.createElement('button');
        boardButton.textContent = `📚 View Community Link: ${formatPromotionSlug(boardSlug)}`; // Reusing formatPromotionSlug for consistency
        boardButton.style.cssText = `
            background: linear-gradient(90deg, #6a11cb, #2575fc); /* Purple to Blue gradient */
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: bold;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        boardButton.onmouseover = () => {
            boardButton.style.background = 'linear-gradient(90deg, #5a0eaf, #1a5bbd)';
            boardButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
            boardButton.style.transform = 'translateY(-1px)';
        };
        boardButton.onmouseout = () => {
            boardButton.style.background = 'linear-gradient(90deg, #6a11cb, #2575fc)';
            boardButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            boardButton.style.transform = 'translateY(0)';
        };
        boardButton.onclick = (e) => {
            e.stopPropagation();
            window.open(boardUrl, '_blank', 'noopener,noreferrer');
        };

        buttonContainer.appendChild(boardButton);
        return buttonContainer;
    }

    // Helper function to format the promotion slug into a more readable title
    function formatPromotionSlug(slug) {
        return slug.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Enhanced mutation observer
    const mediaObserver = new MutationObserver((mutations) => {
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node itself is a message paragraph not yet processed
                        if (node.matches && node.matches('p:not([data-media-processed])')) {
                            processMessageForMedia(node);
                        }
                        
                        // Check for message paragraph elements within the added node's subtree
                        const messageElements = node.querySelectorAll ? node.querySelectorAll('p:not([data-media-processed])') : [];
                        messageElements.forEach((messageP) => {
                            processMessageForMedia(messageP);
                        });
                    }
                });
            }
        });
    });

    // Start observing with more comprehensive options
    mediaObserver.observe(chatContainer, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    // Process existing messages on startup
    const selectors = [
        '.messages .message-content .content.svelte-hrloqv p:not([data-media-processed])',
        '.messages .message-content p:not([data-media-processed])',
        '.messages p:not([data-media-processed])',
        'p:not([data-media-processed])'
    ];
    
    for (const selector of selectors) {
        const existingMessages = chatContainer.querySelectorAll(selector);
        
        if (existingMessages.length > 0) {
            existingMessages.forEach((messageP, index) => {
                processMessageForMedia(messageP);
            });
            break;
        }
    }
    
}

// Enhanced test function with better debugging
function createTestChatMessages() {
    
    const chatContainer = document.querySelector('#right-sidebar .content.svelte-6tkwn0');
    if (!chatContainer) {
        return;
    }
    
    // Create a messages container if it doesn't exist
    let messagesContainer = chatContainer.querySelector('.messages');
    if (!messagesContainer) {
        messagesContainer = document.createElement('div');
        messagesContainer.className = 'messages';
        messagesContainer.style.cssText = 'padding: 10px;';
        chatContainer.appendChild(messagesContainer);
    }
    
    // Test messages with different scenarios
    const testMessages = [
        {
            user: 'TestUser1',
            text: 'Check out this screenshot: https://gyazo.com/ab2b6ac0f0274dd74de0b4654c422f73',
            hasMedia: true
        },
        {
            user: 'TestUser2', 
            text: 'Here are two images: https://gyazo.com/ab2b6ac0f0274dd74de0b4654c422f73 and https://gyazo.com/eb5c5741b6a9a16c692170a41a49c858',
            hasMedia: true
        },
        {
            user: 'MusicFan',
            text: 'Check out this song: https://www.youtube.com/watch?v=5qm8PH4xAss',
            hasMedia: true
        },
        {
            user: 'VideoLover',
            text: 'Short URL test: https://youtu.be/dQw4w9WgXcQ',
            hasMedia: true
        },
        {
            user: 'MixedMediaUser',
            text: 'Both types: Gyazo https://gyazo.com/ab2b6ac0f0274dd74de0b4654c422f73 https://youtu.be/dQw4w9WgXcQ and YouTube https://www.youtube.com/watch?v=9bZkp7q19f0',
            hasMedia: true
        },
        {
            user: 'StreamableFan',
            text: 'Check out this cool clip: https://streamable.com/8e0jic',
            hasMedia: true
        },
        {
            user: 'PromotionHunter',
            text: 'New Stake promotion: https://stake.com/promotions/promotion/alexandre-pantoja-first-round-finish-bonus',
            hasMedia: true
        },
        {
            user: 'ImageSharer',
            text: 'Check out this image: https://ibb.co/tprgDHg0',
            hasMedia: true
        },
        {
            user: 'AnotherImage',
            text: 'Here is another one: https://ibb.co/TqFMhWJC',
            hasMedia: true
        },
        {
            user: 'ImageSharer',
            text: 'Check out this image: https://ibb.co/TqFMhWJC',
            hasMedia: true
        },
        {
            user: 'LightshotUser',
            text: 'Here is a Lightshot image: https://prnt.sc/mmr_1mhuROPT https://prnt.sc/WJmbF8MlAm9C https://prnt.sc/9B8V8MhyjrRh',
            hasMedia: true
        },
        {
            user: 'BoardExplorer',
            text: 'Check out this board discussion: https://stakecommunity.com/board/389-daily-challenge-buzzer-beater/',
            hasMedia: true
        }
    ];
    
    testMessages.forEach((msg, index) => {
        setTimeout(() => {
            const messageElement = createMockMessageElement(msg.user, msg.text);
            messagesContainer.appendChild(messageElement);
            
            // Trigger processing manually for testing
            const messageP = messageElement.querySelector('p');
            if (messageP && typeof processMessageForMedia === 'function') {
                processMessageForMedia(messageP);
            }
        }, index * 1000);
    });
}

function createMockMessageElement(username, messageText) {
    // Create the main message paragraph element that matches your real structure
    const messageP = document.createElement('p');
    messageP.className = 'weight-normal line-height-default align-left size-default text-size-default variant-highlighted svelte-1f6lug3';
    messageP.style.cssText = 'margin: 8px 0; padding: 4px;';
    
    // Create the user wrapper div
    const wrapDiv = document.createElement('div');
    wrapDiv.className = 'wrap svelte-7vpeow';
    
    // Create user tags container
    const userTagsDiv = document.createElement('div');
    userTagsDiv.className = 'user-tags svelte-713zbk';
    
    // Create user tag span
    const userTagSpan = document.createElement('span');
    userTagSpan.className = 'svelte-713zbk';
    
    // Create hoverable div for user icon
    const hoverableDiv = document.createElement('div');
    hoverableDiv.className = 'hoverable svelte-bbyuql';
    
    // Create icon wrapper
    const iconWrapSpan = document.createElement('span');
    iconWrapSpan.className = 'wrap svelte-nc081s';
    
    // Create SVG icon (simplified version)
    const svgIcon = document.createElement('div');
    svgIcon.innerHTML = '⭐'; // Simple star emoji instead of complex SVG
    svgIcon.style.cssText = 'display: inline-block; margin-right: 4px; color: #6FDDE7;';
    
    // Create username button
    const usernameBtn = document.createElement('button');
    usernameBtn.type = 'button';
    usernameBtn.className = 'inline-flex relative items-center gap-2 justify-center rounded-sm font-semibold whitespace-nowrap ring-offset-background transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] bg-transparent text-grey-200 hover:bg-transparent hover:text-white focus-visible:text-white focus-visible:outline-hidden text-sm leading-normal';
    usernameBtn.textContent = username;
    usernameBtn.style.cssText = 'background: none; border: none; color: #00d4ff; font-weight: bold; cursor: pointer; padding: 2px 4px;';
    
    // Assemble the user section
    iconWrapSpan.appendChild(svgIcon);
    hoverableDiv.appendChild(iconWrapSpan);
    userTagSpan.appendChild(hoverableDiv);
    userTagsDiv.appendChild(userTagSpan);
    userTagsDiv.appendChild(usernameBtn);
    wrapDiv.appendChild(userTagsDiv);
    
    // Add colon and message text
    const colonText = document.createTextNode(': ');
    const messageTextNode = document.createTextNode(messageText);
    
    // Assemble the complete message
    messageP.appendChild(wrapDiv);
    messageP.appendChild(colonText);
    messageP.appendChild(messageTextNode);
    
    return messageP;
}

// Enhanced initialization function
function initializeUrlConversionAndPreviews() {
    const chatContainer = document.querySelector('#right-sidebar .content.svelte-6tkwn0');
    if (!chatContainer) {
        setTimeout(initializeUrlConversionAndPreviews, 1000);
        return;
    }

    // Helper function to extract text content from message elements
    function extractMessageText(messageElement) {
        // Try multiple approaches to get the text
        const approaches = [
            () => messageElement.textContent,
            () => messageElement.innerText,
            () => {
                const clone = messageElement.cloneNode(true);
                const userTags = clone.querySelectorAll('.user-tags, .wrap.svelte-7vpeow');
                userTags.forEach(tag => tag.remove());
                return clone.textContent;
            }
        ];
        
        for (let i = 0; i < approaches.length; i++) {
            try {
                const text = approaches[i]();
                if (text && text.trim()) {
                    return text.trim();
                }
            } catch (e) {
            }
        }
        
        return '';
    }

    // Function to fetch YouTube video title
    async function fetchYouTubeTitle(videoId) {
        try {
            const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
            const data = await response.json();
            return data.title || 'YouTube Video';
        } catch (error) {
            return 'YouTube Video';
        }
    }

    // Function to create YouTube preview element with hover menu
    function createYouTubePreviewElement(videoId, videoTitle, originalUrl) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'youtube-preview-container';
        previewContainer.style.cssText = `
            display: inline-block;
            position: relative;
            margin: 4px 8px;
            vertical-align: middle;
            background: rgba(255, 0, 0, 0.1);
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(255, 0, 0, 0.3);
            transition: all 0.2s ease;
            cursor: pointer;
        `;

        const youtubeLink = document.createElement('div');
        youtubeLink.className = 'youtube-link';
        youtubeLink.textContent = `▶️ ${videoTitle}`;
        youtubeLink.style.cssText = `
            color:rgb(11, 194, 255);
            text-decoration: none;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: bold;
            position: relative;
            display: inline-block;
            transition: color 0.2s ease;
            max-width: 250px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        // Create hover menu
        const hoverMenu = document.createElement('div');
        hoverMenu.className = 'youtube-hover-menu';
        hoverMenu.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a1a;
            border: 1px solid #ff0000;
            border-radius: 6px;
            padding: 8px;
            z-index: 1000000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            white-space: nowrap;
            margin-top: 4px;
        `;

        // Create menu options
        const viewVideoBtn = document.createElement('button');
        viewVideoBtn.textContent = '🎬 View Video';
        viewVideoBtn.style.cssText = `
            display: block;
            width: 100%;
            background: #ff0000;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 4px;
            transition: background 0.2s ease;
        `;
        viewVideoBtn.onmouseover = () => viewVideoBtn.style.background = '#cc0000';
        viewVideoBtn.onmouseout = () => viewVideoBtn.style.background = '#ff0000';

        const goToPageBtn = document.createElement('button');
        goToPageBtn.textContent = '🔗 Go To Page';
        goToPageBtn.style.cssText = `
            display: block;
            width: 100%;
            background: #666;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s ease;
        `;
        goToPageBtn.onmouseover = () => goToPageBtn.style.background = '#555';
        goToPageBtn.onmouseout = () => goToPageBtn.style.background = '#666';

        // Create the modal that will appear when View Video is clicked
        const modal = document.createElement('div');
        modal.className = 'youtube-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000001;
            justify-content: center;
            align-items: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: relative;
            width: 80%;
            max-width: 800px;
            height: 60vh;
            background: #1a1a1a;
            border-radius: 12px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.9);
            border: 2px solid #ff0000;
            padding: 16px;
            display: flex;
            flex-direction: column;
        `;

        // Create iframe for YouTube video
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            flex: 1;
            width: 100%;
            height: calc(100% - 40px);
            border: none;
            border-radius: 8px;
        `;
        iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: #ff0000;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
        `;

        // Create title display
        const titleDisplay = document.createElement('div');
        titleDisplay.textContent = videoTitle;
        titleDisplay.style.cssText = `
            color: white;
            padding: 8px 0;
            margin-bottom: 8px;
            font-size: 14px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        // Event handlers
        let hoverTimeout;
        let isHoveringContainer = false;
        let isHoveringMenu = false;

        const showMenu = () => {
            clearTimeout(hoverTimeout);
            hoverMenu.style.display = 'block';
        };

        const hideMenu = () => {
            hoverTimeout = setTimeout(() => {
                if (!isHoveringContainer && !isHoveringMenu) {
                    hoverMenu.style.display = 'none';
                }
            }, 200);
        };

        previewContainer.onmouseenter = () => {
            isHoveringContainer = true;
            previewContainer.style.background = 'rgba(255, 0, 0, 0.2)';
            previewContainer.style.borderColor = 'rgba(255, 0, 0, 0.5)';
            youtubeLink.style.color = '#ff6b6b';
            showMenu();
        };

        previewContainer.onmouseleave = () => {
            isHoveringContainer = false;
            previewContainer.style.background = 'rgba(255, 0, 0, 0.1)';
            previewContainer.style.borderColor = 'rgba(255, 0, 0, 0.3)';
            youtubeLink.style.color = '#ff0000';
            hideMenu();
        };

        hoverMenu.onmouseenter = () => {
            isHoveringMenu = true;
            clearTimeout(hoverTimeout);
        };

        hoverMenu.onmouseleave = () => {
            isHoveringMenu = false;
            hideMenu();
        };

        viewVideoBtn.onclick = (e) => {
            e.stopPropagation();
            // Set iframe source without autoplay
            iframe.src = `https://www.youtube.com/embed/${videoId}`;
            modal.style.display = 'flex';
            hoverMenu.style.display = 'none';
        };

        goToPageBtn.onclick = (e) => {
            e.stopPropagation();
            window.open(originalUrl, '_blank', 'noopener,noreferrer');
            hoverMenu.style.display = 'none';
        };

        closeButton.onclick = (e) => {
            e.stopPropagation();
            modal.style.display = 'none';
            // Clear iframe source to stop video
            iframe.src = '';
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                iframe.src = '';
            }
        };

        // Assemble components
        hoverMenu.appendChild(viewVideoBtn);
        hoverMenu.appendChild(goToPageBtn);
        previewContainer.appendChild(youtubeLink);
        previewContainer.appendChild(hoverMenu);
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(titleDisplay);
        modalContent.appendChild(iframe);
        modal.appendChild(modalContent);
        
        // Add modal to document
        document.body.appendChild(modal);

        return previewContainer;
    }

    // Function to create Streamable preview element with hover menu
    function createStreamablePreviewElement(streamableId, originalUrl) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'streamable-preview-container';
        previewContainer.style.cssText = `
            display: inline-block;
            position: relative;
            margin: 4px 8px;
            vertical-align: middle;
            background: rgba(100, 65, 165, 0.1); /* Streamable purple-ish */
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(100, 65, 165, 0.3);
            transition: all 0.2s ease;
            cursor: pointer;
        `;

        const streamableLink = document.createElement('div');
        streamableLink.className = 'streamable-link';
        streamableLink.textContent = `▶️ Streamable Video`;
        streamableLink.style.cssText = `
            color: #6441a5; /* Streamable purple */
            text-decoration: none;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: bold;
            position: relative;
            display: inline-block;
            transition: color 0.2s ease;
            max-width: 250px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        // Create hover menu
        const hoverMenu = document.createElement('div');
        hoverMenu.className = 'streamable-hover-menu';
        hoverMenu.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a1a;
            border: 1px solid #6441a5;
            border-radius: 6px;
            padding: 8px;
            z-index: 1000000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            white-space: nowrap;
            margin-top: 4px;
        `;

        // Create menu options
        const viewVideoBtn = document.createElement('button');
        viewVideoBtn.textContent = '🎬 View Video';
        viewVideoBtn.style.cssText = `
            display: block;
            width: 100%;
            background: #6441a5;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 4px;
            transition: background 0.2s ease;
        `;
        viewVideoBtn.onmouseover = () => viewVideoBtn.style.background = '#503482';
        viewVideoBtn.onmouseout = () => viewVideoBtn.style.background = '#6441a5';

        const goToPageBtn = document.createElement('button');
        goToPageBtn.textContent = '🔗 Go To Page';
        goToPageBtn.style.cssText = `
            display: block;
            width: 100%;
            background: #666;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s ease;
        `;
        goToPageBtn.onmouseover = () => goToPageBtn.style.background = '#555';
        goToPageBtn.onmouseout = () => goToPageBtn.style.background = '#666';

        // Create the modal that will appear when View Video is clicked
        const modal = document.createElement('div');
        modal.className = 'streamable-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 1000001;
            justify-content: center;
            align-items: center;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: relative;
            width: 80%;
            max-width: 800px;
            height: 60vh;
            background: #1a1a1a;
            border-radius: 12px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.9);
            border: 2px solid #6441a5;
            padding: 16px;
            display: flex;
            flex-direction: column;
        `;

        // Create iframe for Streamable video
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            flex: 1;
            width: 100%;
            height: calc(100% - 40px);
            border: none;
            border-radius: 8px;
        `;
        iframe.allow = 'autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: #6441a5;
            color: white;
            border: none;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
        `;

        // Create title display (placeholder for Streamable, as no easy title API)
        const titleDisplay = document.createElement('div');
        titleDisplay.textContent = 'Streamable Video';
        titleDisplay.style.cssText = `
            color: white;
            padding: 8px 0;
            margin-bottom: 8px;
            font-size: 14px;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        // Event handlers
        let hoverTimeout;
        let isHoveringContainer = false;
        let isHoveringMenu = false;

        const showMenu = () => {
            clearTimeout(hoverTimeout);
            hoverMenu.style.display = 'block';
        };

        const hideMenu = () => {
            hoverTimeout = setTimeout(() => {
                if (!isHoveringContainer && !isHoveringMenu) {
                    hoverMenu.style.display = 'none';
                }
            }, 200);
        };

        previewContainer.onmouseenter = () => {
            isHoveringContainer = true;
            previewContainer.style.background = 'rgba(100, 65, 165, 0.2)';
            previewContainer.style.borderColor = 'rgba(100, 65, 165, 0.5)';
            streamableLink.style.color = '#8a6fc9';
            showMenu();
        };

        previewContainer.onmouseleave = () => {
            isHoveringContainer = false;
            previewContainer.style.background = 'rgba(100, 65, 165, 0.1)';
            previewContainer.style.borderColor = 'rgba(100, 65, 165, 0.3)';
            streamableLink.style.color = '#6441a5';
            hideMenu();
        };

        hoverMenu.onmouseenter = () => {
            isHoveringMenu = true;
            clearTimeout(hoverTimeout);
        };

        hoverMenu.onmouseleave = () => {
            isHoveringMenu = false;
            hideMenu();
        };

        viewVideoBtn.onclick = (e) => {
            e.stopPropagation();
            iframe.src = `https://streamable.com/e/${streamableId}?autoplay=1`;
            modal.style.display = 'flex';
            hoverMenu.style.display = 'none';
        };

        goToPageBtn.onclick = (e) => {
            e.stopPropagation();
            window.open(originalUrl, '_blank', 'noopener,noreferrer');
            hoverMenu.style.display = 'none';
        };

        closeButton.onclick = (e) => {
            e.stopPropagation();
            modal.style.display = 'none';
            iframe.src = ''; // Clear iframe source to stop video
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                iframe.src = '';
            }
        };

        // Assemble components
        hoverMenu.appendChild(viewVideoBtn);
        hoverMenu.appendChild(goToPageBtn);
        previewContainer.appendChild(streamableLink);
        previewContainer.appendChild(hoverMenu);
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(titleDisplay);
        modalContent.appendChild(iframe);
        modal.appendChild(modalContent);
        
        // Add modal to document
        document.body.appendChild(modal);

        return previewContainer;
    }

    // Function to create Gyazo preview element
    function createGyazoPreviewElement(gyazoUrl, gyazoId, index) {
        
        // Function to try loading image with different extensions
        const getGyazoImageUrl = (id, extension) => `https://i.gyazo.com/${id}.${extension}`;
        
        // Create preview container
        const previewContainer = document.createElement('div');
        previewContainer.className = 'gyazo-preview-container';
        previewContainer.style.cssText = `
            display: inline-block;
            position: relative;
            margin: 4px 8px;
            vertical-align: middle;
            background: rgba(0, 220, 255, 0.1);
            padding: 4px 8px;
            border-radius: 6px;
            border: 1px solid rgba(0, 220, 255, 0.3);
            transition: all 0.2s ease;
        `;
        
        // Create the clickable link
        const gyazoLink = document.createElement('a');
        gyazoLink.href = gyazoUrl;
        gyazoLink.target = '_blank';
        gyazoLink.rel = 'noopener noreferrer';
        gyazoLink.className = 'gyazo-link';
        gyazoLink.textContent = `📷 Gyazo Image`;
        gyazoLink.style.cssText = `
            color: #00d4ff;
            text-decoration: none;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: bold;
            position: relative;
            display: inline-block;
            transition: color 0.2s ease;
        `;
        
        // Create the preview image
        const previewImg = document.createElement('img');
        previewImg.alt = 'Gyazo Preview';
        previewImg.className = 'gyazo-preview-img';
        previewImg.dataset.gyazoId = gyazoId; // Store gyazoId for error handling
        previewImg.dataset.currentExtension = 'webp'; // Start with webp
        previewImg.src = getGyazoImageUrl(gyazoId, 'webp'); // Initial attempt with .webp
        previewImg.style.cssText = `
            display: none;
            position: fixed;
            max-width: 500px;
            max-height: 400px;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.9);
            border: 2px solid #00d4ff;
            z-index: 999999;
            background: #1a1a1a;
            padding: 8px;
            pointer-events: none;
            opacity: 0;
            transform: scale(0.9);
            transition: opacity 0.2s ease, transform 0.2s ease;
        `;
        
        // Add preview image to document first
        document.body.appendChild(previewImg);
        
        // Create hover functionality with unique identifiers
        let previewTimeout;
        let showTimeout;
        let isHovering = false;
        let mouseMoveHandler = null;
        
        const showPreview = (e) => {
            clearTimeout(previewTimeout);
            clearTimeout(showTimeout);
            isHovering = true;
            
            const updatePosition = (event) => {
                const x = event.clientX + 20;
                const y = event.clientY + 20;
                
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                const previewWidth = 520;
                const previewHeight = 420;
                
                let finalX = x;
                let finalY = y;
                
                if (x + previewWidth > viewportWidth) {
                    finalX = event.clientX - previewWidth - 20;
                }
                
                if (y + previewHeight > viewportHeight) {
                    finalY = event.clientY - previewHeight - 20;
                }
                
                finalX = Math.max(10, Math.min(finalX, viewportWidth - previewWidth - 10));
                finalY = Math.max(10, Math.min(finalY, viewportHeight - previewHeight - 10));
                
                previewImg.style.left = finalX + 'px';
                previewImg.style.top = finalY + 'px';
            };
            
            updatePosition(e);
            
            showTimeout = setTimeout(() => {
                if (isHovering) {
                    previewImg.style.display = 'block';
                    previewImg.offsetHeight; // Force reflow
                    previewImg.style.opacity = '1';
                    previewImg.style.transform = 'scale(1)';
                }
            }, 150);
            
            mouseMoveHandler = (event) => {
                if (isHovering) {
                    updatePosition(event);
                }
            };
            
            gyazoLink.addEventListener('mousemove', mouseMoveHandler);
        };
        
        const hidePreview = () => {
            isHovering = false;
            clearTimeout(showTimeout);
            
            if (mouseMoveHandler) {
                gyazoLink.removeEventListener('mousemove', mouseMoveHandler);
                mouseMoveHandler = null;
            }
            
            previewTimeout = setTimeout(() => {
                if (!isHovering) {
                    previewImg.style.opacity = '0';
                    previewImg.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        if (!isHovering) {
                            previewImg.style.display = 'none';
                        }
                    }, 200);
                }
            }, 100);
        };
        
        // Attach hover listeners - THIS IS CRITICAL
        gyazoLink.addEventListener('mouseenter', showPreview);
        gyazoLink.addEventListener('mouseleave', hidePreview);
        
        
        // Add hover effect to container
        previewContainer.addEventListener('mouseenter', () => {
            previewContainer.style.background = 'rgba(0, 220, 255, 0.2)';
            previewContainer.style.borderColor = 'rgba(0, 220, 255, 0.5)';
        });
        
        previewContainer.addEventListener('mouseleave', () => {
            previewContainer.style.background = 'rgba(0, 220, 255, 0.1)';
            previewContainer.style.borderColor = 'rgba(0, 220, 255, 0.3)';
        });
        
        // Handle image loading
        previewImg.addEventListener('load', () => {
            gyazoLink.style.color = '#00d4ff';
            gyazoLink.title = 'Click to open full size';
        });
        
        previewImg.addEventListener('error', function() {
            const currentExt = this.dataset.currentExtension;
            if (currentExt === 'webp') {
                // Try with .png if .webp fails
                this.src = getGyazoImageUrl(this.dataset.gyazoId, 'png');
                this.dataset.currentExtension = 'png';
                gyazoLink.title = 'Image failed to load with .webp, trying .png';
            } else if (currentExt === 'png') {
                // Try with .jpg if .png fails
                this.src = getGyazoImageUrl(this.dataset.gyazoId, 'jpg');
                this.dataset.currentExtension = 'jpg';
                gyazoLink.title = 'Image failed to load with .png, trying .jpg';
            } else {
                // If .jpg also fails, mark as failed
                gyazoLink.style.color = '#ff6b6b';
                gyazoLink.title = 'Image failed to load - click to try opening directly';
                gyazoLink.textContent = `❌ Gyazo Image (Failed)`;
            }
        });
        
        previewContainer.appendChild(gyazoLink);
        
        return previewContainer;
    }

    // Function to create IBB button element
    function createIbbButton(ibbUrl, index) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'ibb-button-container';
        buttonContainer.style.cssText = `
            display: inline-block;
            margin: 4px 8px;
            vertical-align: middle;
        `;

        const ibbButton = document.createElement('button');
        ibbButton.textContent = `🖼️ View IBB Image`;
        ibbButton.style.cssText = `
            background: linear-gradient(90deg, #008000, #006400); /* Green gradient for IBB */
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: bold;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        ibbButton.onmouseover = () => {
            ibbButton.style.background = 'linear-gradient(90deg, #006400, #004d00)';
            ibbButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
            ibbButton.style.transform = 'translateY(-1px)';
        };
        ibbButton.onmouseout = () => {
            ibbButton.style.background = 'linear-gradient(90deg, #008000, #006400)';
            ibbButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            ibbButton.style.transform = 'translateY(0)';
        };
        ibbButton.onclick = (e) => {
            e.stopPropagation();
            window.open(ibbUrl, '_blank', 'noopener,noreferrer');
        };

        buttonContainer.appendChild(ibbButton);
        return buttonContainer;
    }

    // Function to create prnt.sc button element
    function createPrntScButton(prntScUrl, index) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'prntsc-button-container';
        buttonContainer.style.cssText = `
            display: inline-block;
            margin: 4px 8px;
            vertical-align: middle;
        `;

        const prntScButton = document.createElement('button');
        prntScButton.textContent = `📸 View Lightshot Image`;
        prntScButton.style.cssText = `
            background: linear-gradient(90deg, #ffa500, #cc8400); /* Orange gradient for Lightshot */
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: bold;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        prntScButton.onmouseover = () => {
            prntScButton.style.background = 'linear-gradient(90deg, #cc8400, #996300)';
            prntScButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
            prntScButton.style.transform = 'translateY(-1px)';
        };
        prntScButton.onmouseout = () => {
            prntScButton.style.background = 'linear-gradient(90deg, #ffa500, #cc8400)';
            prntScButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            prntScButton.style.transform = 'translateY(0)';
        };
        prntScButton.onclick = (e) => {
            e.stopPropagation();
            window.open(prntScUrl, '_blank', 'noopener,noreferrer');
        };

        buttonContainer.appendChild(prntScButton);
        return buttonContainer;
    }

    // Function to recursively replace URLs in text nodes
    async function replaceUrlsInNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;
            let lastIndex = 0;
            const fragment = document.createDocumentFragment();
            
            // Combined regex for all URL types
            const combinedRegex = /(https?:\/\/(?:www\.)?gyazo\.com\/([a-zA-Z0-9]+))|(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\?si=[a-zA-Z0-9_-]+)?)|(https?:\/\/(?:www\.)?streamable\.com\/(?:e\/)?([a-zA-Z0-9]+))|(https?:\/\/(?:www\.)?ibb\.co\/([a-zA-Z0-9]{7,8}))|(https?:\/\/(?:www\.)?prnt\.sc\/([a-zA-Z0-9_]+))|(https?:\/\/(?:www\.)?stake\.com\/promotions\/promotion\/([a-zA-Z0-9-]+))|(https?:\/\/(?:www\.)?stakecommunity\.com\/board\/(\d+)-([a-zA-Z0-9-]+)\/?)/g;
            let match;

            while ((match = combinedRegex.exec(text)) !== null) {
                const fullUrl = match[0];
                const startIndex = match.index;

                // Append text before the URL
                if (startIndex > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, startIndex)));
                }

                let previewElement = null;
                let urlType = '';

                // Determine URL type and create appropriate element
                if (match[1]) { // Gyazo
                    urlType = 'gyazo';
                    const gyazoId = match[2];
                    previewElement = createGyazoPreviewElement(fullUrl, gyazoId, 0); // Index is not critical here
                } else if (match[3]) { // YouTube
                    urlType = 'youtube';
                    const videoId = match[4];
                    const cleanedYoutubeUrl = fullUrl.split('?')[0]; // Remove any query params for the button link
                    const videoTitle = await fetchYouTubeTitle(videoId);
                    previewElement = createYouTubePreviewElement(videoId, videoTitle, cleanedYoutubeUrl);
                } else if (match[5]) { // Streamable
                    urlType = 'streamable';
                    const streamableId = match[6];
                    previewElement = createStreamablePreviewElement(streamableId, fullUrl);
                } else if (match[7]) { // IBB
                    urlType = 'ibb';
                    previewElement = createIbbButton(fullUrl, 0); // Index is not critical here
                } else if (match[9]) { // prnt.sc
                    urlType = 'prntsc';
                    previewElement = createPrntScButton(fullUrl, 0); // Index is not critical here
                } else if (match[11]) { // Stake Promotion
                    urlType = 'stakePromotion';
                    const promotionSlug = match[12];
                    previewElement = createStakePromotionButton(fullUrl, promotionSlug);
                } else if (match[13]) { // Stake Community Board
                    urlType = 'stakeCommunityBoard';
                    const boardId = match[14];
                    const boardSlug = match[15];
                    previewElement = createStakeCommunityBoardButton(fullUrl, boardId, boardSlug);
                }

                if (previewElement) {
                    fragment.appendChild(previewElement);
                } else {
                    // If no preview element was created, just append the original URL text
                    fragment.appendChild(document.createTextNode(fullUrl));
                }
                lastIndex = combinedRegex.lastIndex;
            }

            // Append any remaining text after the last URL
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }

            // Replace the original text node with the fragment, ensuring parent exists
            if (fragment.childNodes.length > 0 && node.parentNode) {
                node.parentNode.replaceChild(fragment, node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Collect all text nodes first to avoid issues with DOM modification during iteration
            const textNodesToProcess = [];
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = node.childNodes[i];
                if (child.nodeType === Node.TEXT_NODE) {
                    textNodesToProcess.push(child);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    // Recursively process child elements
                    await replaceUrlsInNode(child);
                }
            }

            // Now process the collected text nodes
            for (const textNode of textNodesToProcess) {
                // Ensure the textNode is still in the DOM and has a parent
                if (textNode.parentNode) {
                    await replaceUrlsInNode(textNode);
                }
            }
        }
    }

    // Function to process individual messages for media URLs
    async function processMessageForMedia(messageP) {
        
        if (messageP.getAttribute('data-media-processed')) {
            return;
        }
        
        // Extract the actual message text (for logging/initial check, not for modification)
        let messageText = extractMessageText(messageP);
        
        if (!messageText) {
            return;
        }
        
        // Start the recursive replacement from the messageP element
        await replaceUrlsInNode(messageP);

        messageP.setAttribute('data-media-processed', 'true');
    }

    // Function to create Stake Promotion Button
    function createStakePromotionButton(promotionUrl, promotionSlug) {

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'stake-promotion-button-container';
        buttonContainer.style.cssText = `
            display: inline-block;
            margin: 4px 8px;
            vertical-align: middle;
        `;

        const promotionButton = document.createElement('button');
        promotionButton.textContent = `🎁 View Promotion: ${formatPromotionSlug(promotionSlug)}`;
        promotionButton.style.cssText = `
            background: linear-gradient(90deg, #00d4ff, #007bff);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: bold;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        promotionButton.onmouseover = () => {
            promotionButton.style.background = 'linear-gradient(90deg, #00aaff, #0056b3)';
            promotionButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
            promotionButton.style.transform = 'translateY(-1px)';
        };
        promotionButton.onmouseout = () => {
            promotionButton.style.background = 'linear-gradient(90deg, #00d4ff, #007bff)';
            promotionButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            promotionButton.style.transform = 'translateY(0)';
        };
        promotionButton.onclick = (e) => {
            e.stopPropagation();
            window.open(promotionUrl, '_blank', 'noopener,noreferrer');
        };

        buttonContainer.appendChild(promotionButton);
        return buttonContainer;
    }

    // Function to create Stake Community Board Button
    function createStakeCommunityBoardButton(boardUrl, boardId, boardSlug) {

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'stake-community-board-button-container';
        buttonContainer.style.cssText = `
            display: inline-block;
            margin: 4px 8px;
            vertical-align: middle;
        `;

        const boardButton = document.createElement('button');
        boardButton.textContent = `📚 View Community Link: ${formatPromotionSlug(boardSlug)}`; // Reusing formatPromotionSlug for consistency
        boardButton.style.cssText = `
            background: linear-gradient(90deg, #6a11cb, #2575fc); /* Purple to Blue gradient */
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: bold;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        boardButton.onmouseover = () => {
            boardButton.style.background = 'linear-gradient(90deg, #5a0eaf, #1a5bbd)';
            boardButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
            boardButton.style.transform = 'translateY(-1px)';
        };
        boardButton.onmouseout = () => {
            boardButton.style.background = 'linear-gradient(90deg, #6a11cb, #2575fc)';
            boardButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            boardButton.style.transform = 'translateY(0)';
        };
        boardButton.onclick = (e) => {
            e.stopPropagation();
            window.open(boardUrl, '_blank', 'noopener,noreferrer');
        };

        buttonContainer.appendChild(boardButton);
        return buttonContainer;
    }

    // Helper function to format the promotion slug into a more readable title
    function formatPromotionSlug(slug) {
        return slug.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Enhanced mutation observer
    const mediaObserver = new MutationObserver((mutations) => {
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node itself is a message paragraph not yet processed
                        if (node.matches && node.matches('p:not([data-media-processed])')) {
                            processMessageForMedia(node);
                        }
                        
                        // Check for message paragraph elements within the added node's subtree
                        const messageElements = node.querySelectorAll ? node.querySelectorAll('p:not([data-media-processed])') : [];
                        messageElements.forEach((messageP) => {
                            processMessageForMedia(messageP);
                        });
                    }
                });
            }
        });
    });

    // Start observing with more comprehensive options
    mediaObserver.observe(chatContainer, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    // Process existing messages on startup
    const selectors = [
        '.messages .message-content .content.svelte-hrloqv p:not([data-media-processed])',
        '.messages .message-content p:not([data-media-processed])',
        '.messages p:not([data-media-processed])',
        'p:not([data-media-processed])'
    ];
    
    for (const selector of selectors) {
        const existingMessages = chatContainer.querySelectorAll(selector);
        
        if (existingMessages.length > 0) {
            existingMessages.forEach((messageP, index) => {
                processMessageForMedia(messageP);
            });
            break;
        }
    }
}

// Auto-start the enhanced system
// The initialization of URL conversion is now handled within initializeThemeAndObserver
// based on user settings.

  // Mutation observer to reapply theme and SVG replacements on dynamic content
  function setupMutationObserver() {
    const debouncedApply = debounce(() => {
      // Check if chrome.runtime is still available before accessing storage
      // This prevents "Extension context invalidated" errors if the tab is closed or extension reloaded
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && !chrome.runtime.lastError) {
        chrome.storage.sync.get(['themeColor', 'themeColorRgb', 'urlConversionEnabled'], latest => {
          if (Object.keys(latest).length > 0) {
            applyColors(latest);
          }
          // Re-evaluate URL conversion based on latest settings
          const isUrlConversionEnabled = latest.urlConversionEnabled !== false; // Default to true
          if (isUrlConversionEnabled) {
            initializeUrlConversionAndPreviews();
          } else {
            // If disabled, remove any existing previews/buttons and stop observers
            // This part needs to be implemented if a full "disable" is required
            // For now, simply not re-initializing is sufficient.
          }
        });
      }
    }, 300);

    const observer = new MutationObserver((mutations) => {
      let shouldApply = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Detect if new content contains any of our target elements or images
              const hasTargets =
                node.matches && (
                  node.matches('footer, .group.variant-.svelte-wqnjon, .sidebar.svelte-il9p4a, .header-wrapper.flex.justify-center.py-8.w-full.bg-cover, #affiliate-hero-banner, [class*="--grey-"], [class*="grey-"]') ||
                  node.querySelector('footer, .group.variant-.svelte-wqnjon, .sidebar.svelte-il9p4a, img.productImg.svelte-1frpv8v, .header-wrapper.flex.justify-center.py-8.w-full.bg-cover, #affiliate-hero-banner, [class*="--grey-"], [class*="grey-"]')
                );
              if (hasTargets) {
                shouldApply = true;
                break;
              }
            }
          }
        }
      }

      if (shouldApply) {
        debouncedApply();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true, // Observe attribute changes
      attributeFilter: ['src', 'style', 'class'] // Observe 'src', 'style', and 'class' attributes
    });
  }

  // Initialization, read theme from storage and apply
  function initializeThemeAndObserver() {
    // Check if chrome.runtime is still available before accessing storage
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && !chrome.runtime.lastError) {
      chrome.storage.sync.get(['themeColor', 'themeColorRgb'], result => {
        if (result.themeColor) { // Check specifically for themeColor
          applyColorsImmediately(result);
          setupMutationObserver(); // Only set up observer if a theme is applied
        } else {
          // Ensure affiliate-hero-banner has its default background if no theme is applied
          const affiliateHeroBanner = document.getElementById('affiliate-hero-banner');
          if (affiliateHeroBanner) {
            // No default background image for affiliate-hero-banner
          }
        }
      });
    }
  }

  // Listener for messages from your extension background or popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_THEME_COLORS') {
        const currentColors = { themeColor: '' };
        sendResponse({ type: 'RETURN_THEME_COLORS', colors: currentColors });
        return true;
      } else if (message.type === 'UPDATE_URL_CONVERSION_SETTING') {
        if (message.enabled) {
          initializeUrlConversionAndPreviews();
        } else {
          // Logic to disable/remove existing URL conversions if needed
          // For now, a page reload (handled by popup.js) will effectively disable it.
        }
        sendResponse({ success: true });
        return true;
      }
    });
  }

  // Start the script after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeThemeAndObserver();
      // Only enable preview if chrome.runtime is available
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        // Call the URL conversion and preview initialization based on stored setting
        chrome.storage.sync.get('urlConversionEnabled', (result) => {
          const isUrlConversionEnabled = result.urlConversionEnabled !== false; // Default to true
          if (isUrlConversionEnabled) {
            initializeUrlConversionAndPreviews();
          }
        });
      }
    });
  } else {
    initializeThemeAndObserver();
    // Call the URL conversion and preview initialization based on stored setting
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      chrome.storage.sync.get('urlConversionEnabled', (result) => {
        const isUrlConversionEnabled = result.urlConversionEnabled !== false; // Default to true
        if (isUrlConversionEnabled) {
          initializeUrlConversionAndPreviews();
        }
      });
    }
  }
})();