document.addEventListener('DOMContentLoaded', function() {
  // Fetch version from about.html and display in top left
  const version = chrome.runtime.getManifest().version;
  const versionDisplay = document.getElementById('versionDisplay');
  if (versionDisplay) {
    versionDisplay.textContent = 'v' + version;
  }
  // About link click handler
  const aboutLink = document.getElementById('aboutExtensionLinkTop');
  if (aboutLink) {
    aboutLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.open('about.html', '_blank');
    });
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const applyColorsButton = document.getElementById('applyColors');
  const themeColorSelect = document.getElementById('themeColor');
  const colorPalette = document.getElementById('colorPalette');
  const resetColorsButton = document.getElementById('resetColors');
  const aboutExtensionLink = document.getElementById('aboutExtensionLinkTop');
  const urlConversionToggle = document.getElementById('urlConversionToggle');
  const mainContent = document.getElementById('mainContent');
  const restrictedMessage = document.getElementById('restrictedMessage');

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

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;

    // Check for special Chrome URLs or invalid URLs
    if (!currentUrl || currentUrl.startsWith('chrome://') || currentUrl.startsWith('about:')) {
      // If on a special Chrome page or an invalid URL, open the about page directly
      window.open(chrome.runtime.getURL('about.html'), '_blank');
      window.close(); // Close the popup
      return; // Exit early
    }

    const url = new URL(currentUrl);
    const hostname = url.hostname;

    const isAllowed = allowedDomains.some(domain => hostname.endsWith(domain));

    if (!isAllowed) {
      // If not on an allowed domain, open the about page directly
      window.open(chrome.runtime.getURL('about.html'), '_blank');
      window.close(); // Close the popup
    } else {
      mainContent.style.display = 'block';
      restrictedMessage.style.display = 'none';
    }
  });

  const colorsMap = {
    "Red": [64, 0, 0],
    "Orange": [204, 85, 0],
    "Yellow": [220, 190, 0],
    "Green": [0, 128, 0],
    "Blue": [0, 0, 127],
    "Indigo": [75, 0, 130],
    "Pink": [233, 30, 99],
    "Magenta": [194, 0, 133],
    "Olive": [85, 107, 47],
    "Slate": [112, 128, 144],
    "Custom": null // Placeholder, will be set dynamically
  };

  // Dynamically generate color swatches and select options
  function populateColorPalette(customHex) {
    colorPalette.innerHTML = '';
    themeColorSelect.innerHTML = '';

    for (const colorName in colorsMap) {
      let rgb = colorsMap[colorName];
      let hexColor = rgb ? rgbToHex(rgb[0], rgb[1], rgb[2]) : (customHex || '#00d4ff');
      const swatch = document.createElement('div');
      swatch.classList.add('color-swatch');
      swatch.dataset.colorName = colorName;
      swatch.title = colorName;
      if (colorName === 'Custom') {
        // Rainbow gradient for custom color
        swatch.style.background = 'linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)';
        swatch.style.border = '2px solid #888';
      } else {
        swatch.style.backgroundColor = hexColor;
      }
      colorPalette.appendChild(swatch);

      const option = document.createElement('option');
      option.value = colorName;
      option.textContent = colorName;
      themeColorSelect.appendChild(option);
    }
  }

  function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function updatePopupInputs(colors) {
    themeColorSelect.value = colors.themeColor || 'Red';
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.classList.remove('selected');
      if (swatch.dataset.colorName === colors.themeColor) {
        swatch.classList.add('selected');
      }
    });
    // Handle custom color UI
    const customColorContainer = document.getElementById('customColorContainer');
    const customColorInput = document.getElementById('customColorInput');
    const customColorRgb = document.getElementById('customColorRgb');
    if (colors.themeColor === 'Custom' && colors.themeColorRgb) {
      customColorContainer.style.display = 'flex';
      const hex = rgbToHex(...colors.themeColorRgb);
      customColorInput.value = hex;
      customColorRgb.textContent = `RGB: ${colors.themeColorRgb.join(', ')}`;
    } else {
      customColorContainer.style.display = 'none';
      customColorRgb.textContent = '';
    }
  }

  // Load saved settings
  chrome.storage.sync.get(['themeColor', 'themeColorRgb', 'urlConversionEnabled'], (result) => {
    let customHex = undefined;
    if (result.themeColor === 'Custom' && result.themeColorRgb) {
      customHex = rgbToHex(...result.themeColorRgb);
    }
    populateColorPalette(customHex);
    if (Object.keys(result).length > 0) {
      updatePopupInputs(result);
    } else {
      const defaultSwatch = document.querySelector('.color-swatch[data-color-name="Red"]');
      if (defaultSwatch) {
        defaultSwatch.classList.add('selected');
      }
    }
    const isUrlConversionEnabled = result.urlConversionEnabled !== false;
    urlConversionToggle.checked = isUrlConversionEnabled;
  });

  // Event Listeners
  colorPalette.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('color-swatch')) {
      document.querySelectorAll('.color-swatch').forEach(swatch => swatch.classList.remove('selected'));
      target.classList.add('selected');
      themeColorSelect.value = target.dataset.colorName;
      // Show/hide custom color picker
      const customColorContainer = document.getElementById('customColorContainer');
      if (target.dataset.colorName === 'Custom') {
        customColorContainer.style.display = 'flex';
      } else {
        customColorContainer.style.display = 'none';
      }
    }
  });

  // Show/hide custom color picker if user changes dropdown (for accessibility)
  themeColorSelect.addEventListener('change', (event) => {
    const customColorContainer = document.getElementById('customColorContainer');
    if (event.target.value === 'Custom') {
      customColorContainer.style.display = 'flex';
    } else {
      customColorContainer.style.display = 'none';
    }
  });

  // Custom color input logic
  const customColorInput = document.getElementById('customColorInput');
  const customColorRgb = document.getElementById('customColorRgb');
  customColorInput.addEventListener('input', (event) => {
    const hex = event.target.value;
    // Convert hex to RGB array
    const rgb = hexToRgbArray(hex);
    customColorRgb.textContent = `RGB: ${rgb.join(', ')}`;
    // Do not update swatch color for custom, keep rainbow background
  });

  function hexToRgbArray(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  aboutExtensionLink.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default link behavior
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('about.html'));
    }
  });

let initialThemeColor;
let initialThemeColorRgb;
let initialUrlConversionEnabled;
let settingsLoadedFromStorage = false; // Flag to track if settings were loaded

// Load saved settings and store initial values
chrome.storage.sync.get(['themeColor', 'themeColorRgb', 'urlConversionEnabled'], (result) => {
  populateColorPalette(); // Populate palette after retrieving settings
  if (Object.keys(result).length > 0) {
    updatePopupInputs(result);
    initialThemeColor = result.themeColor || 'Red';
    initialThemeColorRgb = Array.isArray(result.themeColorRgb) ? result.themeColorRgb.slice() : null;
    initialUrlConversionEnabled = result.urlConversionEnabled !== false;
    settingsLoadedFromStorage = true; // Settings were found in storage
  } else {
    // If no theme color settings, ensure default swatch is selected
    const defaultSwatch = document.querySelector('.color-swatch[data-color-name="Red"]');
    if (defaultSwatch) {
      defaultSwatch.classList.add('selected');
    }
    initialThemeColor = 'Red'; // Default value
    initialThemeColorRgb = [64, 0, 0]; // Default Red
    initialUrlConversionEnabled = true; // Default value
    settingsLoadedFromStorage = false; // No settings found, using defaults
  }

  // Set initial state of URL conversion toggle (enabled by default)
  const isUrlConversionEnabled = result.urlConversionEnabled !== false; // Default to true
  urlConversionToggle.checked = isUrlConversionEnabled;
});

applyColorsButton.addEventListener('click', () => {
  const selectedColorName = themeColorSelect.value;
  let selectedColorRgb = colorsMap[selectedColorName];
  if (selectedColorName === 'Custom') {
    const hex = customColorInput.value;
    selectedColorRgb = hexToRgbArray(hex);
  }
  const isUrlConversionEnabled = urlConversionToggle.checked;

  let customColorChanged = false;
  if (selectedColorName === 'Custom') {
    // Compare arrays
    if (!Array.isArray(initialThemeColorRgb) || initialThemeColorRgb.length !== 3) {
      customColorChanged = true;
    } else {
      for (let i = 0; i < 3; i++) {
        if (selectedColorRgb[i] !== initialThemeColorRgb[i]) {
          customColorChanged = true;
          break;
        }
      }
    }
  }

  const themeColorChanged = selectedColorName !== initialThemeColor;
  const urlConversionChanged = isUrlConversionEnabled !== initialUrlConversionEnabled;

  // Only close if nothing changed (including custom color value)
  if (settingsLoadedFromStorage && !themeColorChanged && !customColorChanged && !urlConversionChanged) {
    window.close();
    return;
  }

  const settings = {
    themeColor: selectedColorName,
    themeColorRgb: selectedColorRgb,
    urlConversionEnabled: isUrlConversionEnabled
  };

  chrome.storage.sync.set(settings, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'UPDATE_URL_CONVERSION_SETTING',
          enabled: isUrlConversionEnabled
        }, () => {
          chrome.tabs.reload(tabs[0].id, () => {
            window.close();
          });
        });
      }
    });
  });
});

  resetColorsButton.addEventListener('click', () => {
    chrome.storage.sync.remove(['themeColor', 'themeColorRgb', 'urlConversionEnabled'], () => {
      themeColorSelect.value = 'Red';

      // Update selected color swatch to default
      document.querySelectorAll('.color-swatch').forEach(swatch => swatch.classList.remove('selected'));
      document.querySelector('.color-swatch[data-color-name="Red"]').classList.add('selected');

      // Reset URL conversion toggle to default (enabled)
      urlConversionToggle.checked = true;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          // Send message to content script to update URL conversion setting
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'UPDATE_URL_CONVERSION_SETTING',
            enabled: true
          }, () => {
            // Reload the tab after the message is sent and processed (or immediately if no response needed)
            chrome.tabs.reload(tabs[0].id, () => {
              window.close(); // Close popup after reload is initiated
            });
          });
        }
      });
    });
  });
});