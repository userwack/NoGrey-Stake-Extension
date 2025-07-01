document.addEventListener('DOMContentLoaded', () => {
  // Feature list toggle for about.html
  var toggleBtn = document.getElementById('toggleFeaturesButton');
  var featuresList = document.getElementById('featuresList');
  if (toggleBtn && featuresList) {
    toggleBtn.addEventListener('click', function () {
      if (featuresList.classList.contains('features-list-hidden')) {
        featuresList.classList.remove('features-list-hidden');
        featuresList.classList.add('features-list-visible');
        toggleBtn.textContent = '-';
      } else {
        featuresList.classList.remove('features-list-visible');
        featuresList.classList.add('features-list-hidden');
        toggleBtn.textContent = '+';
      }
    });
  }
  const creatorName = document.getElementById('creatorName');
  const creatorNameLink = document.getElementById('creatorNameLink');
  const githubLogoLink = document.getElementById('githubLogoLink');
  const donateButton = document.getElementById('donateButton');
  const gratitudeMessage = document.getElementById('gratitudeMessage');
  const cryptoSelection = document.getElementById('cryptoSelection');
  const cryptoSelectContainer = document.getElementById('cryptoSelectContainer');
  const cryptoSearchInput = document.getElementById('cryptoSearchInput');
  const cryptoDropdownList = document.getElementById('cryptoDropdownList');
  const cryptoSelectedDisplay = document.getElementById('cryptoSelectedDisplay');
  const proceedToNetworkSelectionButton = document.getElementById('proceedToNetworkSelection');

  // Modal elements
  const donationModal = document.getElementById('donationModal');
  const closeButton = document.querySelector('.modal .close-button');
  const modalCryptoName = document.getElementById('modalCryptoName');
  const modalNetworkSelection = document.getElementById('modalNetworkSelection');
  const modalNetworkSelect = document.getElementById('modalNetworkSelect');
  const proceedButton = document.getElementById('proceedButton'); // The second proceed button inside the modal
  const qrCodeAndDetails = document.getElementById('qrCodeAndDetails');
  const qrcodeContainer = document.getElementById('qrcode'); // This is the div for the QR code in the modal
  const modalNetwork = document.getElementById('modalNetwork');
  const modalWalletAddress = document.getElementById('modalWalletAddress');
  const copyAddressButton = document.getElementById('copyAddressButton');
  const modalMemoContainer = document.getElementById('modalMemoContainer'); // New element
  const modalMemo = document.getElementById('modalMemo'); // New element
  const copyMemoButton = document.getElementById('copyMemoButton'); // New element

  let currentSelectedCrypto = null;

  const GITHUB_PROFILE_URL = 'https://github.com/userwack'; // Replace with actual GitHub profile URL
  const GITHUB_REPO_URL = 'https://github.com/userwack/casino-theme-extension'; // Replace with actual GitHub repo URL

  // Set creator name and link
  creatorName.textContent = 'userwack';
  creatorNameLink.href = GITHUB_PROFILE_URL;
  creatorNameLink.addEventListener('click', (event) => {
    event.preventDefault();
    chrome.tabs.create({ url: GITHUB_PROFILE_URL });
  });

  // GitHub Logo Link
  githubLogoLink.addEventListener('click', (event) => {
    event.preventDefault();
    chrome.tabs.create({ url: GITHUB_REPO_URL });
  });

  const githubRepoTextLink = document.getElementById('githubRepoTextLink');
  if (githubRepoTextLink) {
    githubRepoTextLink.addEventListener('click', (event) => {
      event.preventDefault();
      chrome.tabs.create({ url: GITHUB_REPO_URL });
    });
  }

  // Cryptocurrency Addresses
  const cryptoAddresses = {
    "USDC": [
      { network: "ERC20", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "SOL", address: "3YoYfRCNqj5sesmpXu6S88Cg9UdKCZRHR8TBDJuMsCKK" },
      { network: "Cronos", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Arbitrum One", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Avalanche C-Chain", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Optimism", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Polygon", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Sonic", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Algorand", address: "YFTIHXRXBF6FX5TPNQV55YJ5H5KX6J6FOAJVQE7ATE7MNRDGWN5DAPRTKU" },
      { network: "SUI", address: "0x816f0a0b5dc1dbf0e6a135df6901a2a2da09ffeb038b25e125d426d743278b18" },
      { network: "Cronos zkEVM", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Base", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" }
    ],
    "BTC": [
      { network: "BTC", address: "3GLw8BB7zfpgynvdM8s1wvu8P1G9bJYB5Y" },
      { network: "Cronos (CDCBTC)", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Ethereum (21BTC)", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Solana (21BTC)", address: "3YoYfRCNqj5sesmpXu6S88Cg9UdKCZRHR8TBDJuMsCKK" }
    ],
    "USDT": [
      { network: "ERC20", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Cronos", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "SOL", address: "3YoYfRCNqj5sesmpXu6S88Cg9UdKCZRHR8TBDJuMsCKK" },
      { network: "Polygon", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Arbitrum One", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" },
      { network: "Optimism", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" }
    ],
    "ADA": [
      { network: "ADA", address: "Ae2tdPwUPEZ4THkKCqdvb3i8wZxKEg4dNSmfVTXfZ5wbbkBHresiRPEZs57" },
      { network: "Cronos", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" }
    ],
    "XRP": [
      { network: "XRP", address: "rKNwXQh9GMjaU8uTqKLECsqyib47g5dMvo", memo: "3005993709" }
    ],
    "DOGE": [
      { network: "DOGE", address: "DE3NW1jpgKYxLMnP2TpYJr1zLphcAnkwU4" }
    ],
    "SOL": [
      { network: "SOL", address: "3YoYfRCNqj5sesmpXu6S88Cg9UdKCZRHR8TBDJuMsCKK" },
      { network: "Cronos", address: "0x2D2D4129feF5f463Ab498F369D8111f548e1ac24" }
    ]
  };

  donateButton.addEventListener('click', () => {
    gratitudeMessage.style.display = 'block';
    cryptoSelection.style.display = 'block';
    cryptoSelection.style.opacity = '0';
    setTimeout(() => {
      cryptoSelection.style.opacity = '1';
      cryptoSelection.style.transition = 'opacity 0.5s ease-in-out';
    }, 10);
  });


  // --- Custom searchable dropdown with logos ---

  // --- Dynamically build crypto list from cryptoAddresses ---
  // Optionally, you can add a logo mapping here or fetch from a CDN
  const logoMap = {
    'BTC': 'icons/crypto/btc.png',
    'ETH': 'icons/crypto/eth.png',
    'USDT': 'icons/crypto/usdt.png',
    'USDC': 'icons/crypto/usdc.png',
    'XRP': 'icons/crypto/xrp.png',
    'DOGE': 'icons/crypto/doge.png',
    'SOL': 'icons/crypto/sol.png',
    'ADA': 'icons/crypto/ada.png',
    // Add more as needed
  };

  function getCryptoLabel(symbol) {
    // Use a more readable label if needed
    if (symbol === 'USDT') return 'USD Tether';
    if (symbol === 'USDC') return 'USD Coin';
    if (symbol === 'BTC') return 'Bitcoin';
    if (symbol === 'ETH') return 'Ethereum';
    if (symbol === 'XRP') return 'Ripple';
    if (symbol === 'DOGE') return 'Dogecoin';
    if (symbol === 'SOL') return 'Solana';
    if (symbol === 'ADA') return 'Cardano';
    return symbol;
  }

  const CRYPTO_LIST = Object.keys(cryptoAddresses).map(symbol => ({
    name: symbol,
    label: getCryptoLabel(symbol),
    logo: logoMap[symbol] || 'https://cryptologos.cc/logos/generic-coin-generic-logo.png'
  }));

  let filteredCryptos = CRYPTO_LIST.slice();
  let selectedCrypto = null;

  function renderCryptoDropdown(list) {
    cryptoDropdownList.innerHTML = '';
    if (!list.length) {
      const noResult = document.createElement('div');
      noResult.textContent = 'No results';
      noResult.style.padding = '8px';
      cryptoDropdownList.appendChild(noResult);
      return;
    }
    list.forEach(crypto => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.padding = '6px 10px';
      item.style.cursor = 'pointer';
      item.style.gap = '10px';
      item.style.fontSize = '1em';
      item.onmouseenter = () => item.style.background = '#333333'; /* Darker grey for hover */
      item.onmouseleave = () => item.style.background = '';
      item.innerHTML = `<img src="${crypto.logo}" alt="${crypto.name}" style="width:22px;height:22px;object-fit:contain;margin-right:8px;"> <span>${crypto.label} <span style='color:#888;font-size:0.95em;'>(${crypto.name})</span></span>`;
      item.onclick = () => {
        selectedCrypto = crypto;
        cryptoSearchInput.value = crypto.label + ' (' + crypto.name + ')';
        cryptoDropdownList.style.opacity = '0';
        cryptoDropdownList.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          cryptoDropdownList.style.display = 'none';
        }, 200); // Match CSS transition duration
        // Set for modal
        currentSelectedCrypto = crypto.name;
        // Show selected display
        if (cryptoSelectedDisplay) {
          cryptoSelectedDisplay.innerHTML = `<img src='${crypto.logo}' alt='${crypto.name}' style='width:20px;height:20px;object-fit:contain;margin-right:7px;'> <span>${crypto.label} <span style='color:#888;font-size:0.97em;'>(${crypto.name})</span></span>`;
          cryptoSelectedDisplay.style.display = 'flex';
          cryptoSearchInput.style.visibility = 'hidden';
        }
      };
      cryptoDropdownList.appendChild(item);
    });
  }

  function filterCryptos(query) {
    query = query.trim().toLowerCase();
    if (!query) return CRYPTO_LIST.slice();
    return CRYPTO_LIST.filter(c => c.name.toLowerCase().includes(query) || c.label.toLowerCase().includes(query));
  }

  cryptoSearchInput.addEventListener('focus', () => {
    // If input matches selected crypto, clear it and show all
    if (selectedCrypto && cryptoSearchInput.value.trim() === (selectedCrypto.label + ' (' + selectedCrypto.name + ')')) {
      cryptoSearchInput.value = '';
      filteredCryptos = CRYPTO_LIST.slice();
    } else {
      filteredCryptos = filterCryptos(cryptoSearchInput.value);
    }
    renderCryptoDropdown(filteredCryptos);
    cryptoDropdownList.style.display = 'block';
    setTimeout(() => {
      cryptoDropdownList.style.opacity = '1';
      cryptoDropdownList.style.transform = 'translateY(0)';
    }, 10);
    // Hide selected display and show input
    if (cryptoSelectedDisplay) {
      cryptoSelectedDisplay.style.display = 'none';
      cryptoSearchInput.style.visibility = 'visible';
    }
  });
  // Also allow clicking the selected display to re-open input
  if (cryptoSelectedDisplay) {
    cryptoSelectedDisplay.addEventListener('click', () => {
      cryptoSelectedDisplay.style.display = 'none';
      cryptoSearchInput.style.visibility = 'visible';
      cryptoSearchInput.focus();
    });
  }
  cryptoSearchInput.addEventListener('input', () => {
    filteredCryptos = filterCryptos(cryptoSearchInput.value);
    renderCryptoDropdown(filteredCryptos);
    cryptoDropdownList.style.display = 'block';
  });
  document.addEventListener('click', (e) => {
    if (!cryptoSelectContainer.contains(e.target)) {
      cryptoDropdownList.style.opacity = '0';
      cryptoDropdownList.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        cryptoDropdownList.style.display = 'none';
      }, 200); // Match CSS transition duration
    }
  });
  // Keyboard navigation (optional)
  cryptoSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const items = Array.from(cryptoDropdownList.children);
      let idx = items.findIndex(i => i.classList && i.classList.contains('selected'));
      if (e.key === 'ArrowDown') idx++;
      if (e.key === 'ArrowUp') idx--;
      idx = Math.max(0, Math.min(items.length - 1, idx));
      items.forEach(i => i.classList && i.classList.remove('selected'));
      if (items[idx]) {
        items[idx].classList.add('selected');
        items[idx].scrollIntoView({ block: 'nearest' });
      }
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const sel = cryptoDropdownList.querySelector('.selected');
      if (sel) sel.click();
    }
  });
  // Initial render
  renderCryptoDropdown(CRYPTO_LIST);

  proceedToNetworkSelectionButton.addEventListener('click', () => {
    if (!selectedCrypto) {
      alert('Please select a cryptocurrency.');
      return;
    }
    currentSelectedCrypto = selectedCrypto.name;
    if (currentSelectedCrypto && cryptoAddresses[currentSelectedCrypto]) {
      const cryptoInfo = cryptoAddresses[currentSelectedCrypto];
      modalCryptoName.textContent = `${currentSelectedCrypto} Wallet Address:`;
      // Populate modal network select
      modalNetworkSelect.innerHTML = '<option value="">Select a network</option>';
      cryptoInfo.forEach(item => {
        const option = document.createElement('option');
        option.value = item.network;
        option.textContent = item.network;
        modalNetworkSelect.appendChild(option);
      });
      modalNetworkSelection.style.display = 'block'; // Show network selection in modal
      qrCodeAndDetails.style.display = 'none'; // Hide QR code and details initially
      proceedButton.style.display = 'none'; // Hide proceed button initially
      donationModal.style.display = 'flex'; // Show the modal
      setTimeout(() => {
        donationModal.classList.add('show');
      }, 10);
    }
  });

  proceedToNetworkSelectionButton.addEventListener('click', () => {
    // This block is redundant and references cryptoSelect, which is not defined. It is removed for clarity.
  });

  modalNetworkSelect.addEventListener('change', () => {
    if (modalNetworkSelect.value) {
      proceedButton.style.display = 'block';
    } else {
      proceedButton.style.display = 'none';
    }
  });

  proceedButton.addEventListener('click', () => {
    const selectedNetwork = modalNetworkSelect.value;
    const selectedCryptoData = cryptoAddresses[currentSelectedCrypto].find(item => item.network === selectedNetwork);

    if (selectedCryptoData) {
      const walletAddress = selectedCryptoData.address;
      const memo = selectedCryptoData.memo;

      modalNetwork.textContent = selectedNetwork;
      modalWalletAddress.textContent = walletAddress;

      // Clear previous QR code and memo display
      qrcodeContainer.innerHTML = '';
      modalMemoContainer.style.display = 'none';
      modalMemo.textContent = '';

      new QRCode(qrcodeContainer, {
        text: walletAddress + (memo ? `?memo=${memo}` : ''),
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });

      // Display memo if available and for XRP network
      if (memo && selectedNetwork === 'XRP') {
        modalMemo.textContent = memo;
        modalMemoContainer.style.display = 'block';
      } else {
        modalMemoContainer.style.display = 'none';
      }

      modalNetworkSelection.style.display = 'none'; // Hide network selection
      qrCodeAndDetails.style.display = 'block'; // Show QR code and details
    }
  });

  closeButton.addEventListener('click', () => {
    donationModal.classList.remove('show');
    setTimeout(() => {
      donationModal.style.display = 'none';
      // Reset modal state when closed
      modalNetworkSelect.innerHTML = '<option value="">Select a network</option>';
      proceedButton.style.display = 'none';
      modalNetworkSelection.style.display = 'none';
      qrCodeAndDetails.style.display = 'none';
    }, 300); // Match CSS transition duration
  });

  window.addEventListener('click', (event) => {
    if (event.target === donationModal) {
      donationModal.classList.remove('show');
      setTimeout(() => {
        donationModal.style.display = 'none';
        // Reset modal state when closed by clicking outside
        modalNetworkSelect.innerHTML = '<option value="">Select a network</option>';
        proceedButton.style.display = 'none';
        modalNetworkSelection.style.display = 'none';
        qrCodeAndDetails.style.display = 'none';
      }, 300); // Match CSS transition duration
    }
  });

  copyAddressButton.addEventListener('click', () => {
    const addressToCopy = modalWalletAddress.textContent;
    navigator.clipboard.writeText(addressToCopy).then(() => {
      // Change button text to "Copied!" and revert after 3 seconds
      copyAddressButton.textContent = 'Copied!';
      copyAddressButton.disabled = true; // Disable button to prevent multiple clicks
      copyAddressButton.style.color = 'white'; // Ensure white color

      setTimeout(() => {
        copyAddressButton.textContent = 'Copy';
        copyAddressButton.disabled = false;
        copyAddressButton.style.color = ''; // Reset color
      }, 3000);
    }).catch(err => {
      console.error('Failed to copy address: ', err);
    });
  });

  // Add event listener for copying memo
  copyMemoButton.addEventListener('click', () => {
    const memoToCopy = modalMemo.textContent;
    navigator.clipboard.writeText(memoToCopy).then(() => {
      copyMemoButton.textContent = 'Copied!';
      copyMemoButton.disabled = true;
      copyMemoButton.style.color = 'white'; // Apply white color to the button text

      setTimeout(() => {
        copyMemoButton.textContent = 'Copy';
        copyMemoButton.disabled = false;
        copyMemoButton.style.color = ''; // Reset color
      }, 3000);
    }).catch(err => {
      console.error('Failed to copy memo: ', err);
    });
  });
});