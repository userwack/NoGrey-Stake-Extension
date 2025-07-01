# NoGrey-Stake-Extension

NoGrey — A browser extension that lets you personalize Stake casino colors and change raw chat URLS to button previews.

![image](https://github.com/user-attachments/assets/12adab65-5218-458a-97b9-31709272a65f)

## Features
- **Custom Theme Colors:**
  - Instantly recolor the entire Stake interface with your preferred accent color (provided in the extension or your custom RGB).
  - Automatic theme application on page load and dynamic content changes.

- **Enhanced Chat Media Previews with Buttons:**
  - Converts supported URLs in chat messages into rich previews and buttons.
  - Supported media:
    - **Gyazo (gyazo.com)**: Hover for instant image preview.
    - **YouTube**:  Display video name, hover to play various videos/songs inside of the website, or go to YouTube.
    - **Streamable**: Hover to play video inside of the website, or go to Streamable.
    - **Lightshot (prnt.sc)**: Quick access button for screenshots.
    - **ImgBB (ibb.co)**: Quick access button for images.
    - **Stake Promotions**: Button to view promotions (Posted by moderators).
    - **Stake Community Boards**: Button to view community "Board" links (Posted by moderators).
    - **Other Features**: Coming soon.
   
## Installation
 
1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select this project folder.
5. The extension will now be active on the related domains.

## Usage
 
- Open any supported domain specified in manifest.json.
- Use the extension popup to select your preferred theme color and enable/disable media previews.
- Chat messages containing supported URLs will automatically show previews or action buttons.
- Hover over Gyazo/YouTube/Streamable links for instant previews or click for more options.

## Supported Domains:
- stake.com
- stake.us
- stake.ac
- stake.games
- stake.bet
- stake.pet
- stake1001.com
- stake1002.com
- stake1003.com
- stake1021.com
- stake1022.com
- stake.mba
- stake.jp
- stake.bz
- staketr.com
- stake.ceo
- stake.krd
 
## Development
 
- Main logic is in `content.js`.
- Theme and preview settings are stored in Chrome sync storage.
 
## License
 
MIT License
 
---
 
**Note:** This extension is not affiliated with Stake or any casino. Use at your own risk.
