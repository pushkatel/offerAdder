# Offers Adder

A Chrome extension that automatically adds all Chase and American Express offers to your account with one click.

## Features

- **One-Click Activation**: Add all available offers instantly
- **Supports Both Banks**: Works on Chase and American Express offer pages
- **Progress Tracking**: Keeps count of total offers added for each bank
- **Smart Detection**: Automatically detects which offers page you're on and updates the button text accordingly

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder

## Usage

1. Navigate to your offers page:
   - **Chase**: Go to your Chase account and navigate to the merchant offers section (`chase.com/.../merchantOffers`)
   - **Amex**: Go to `americanexpress.com/offers`

2. Click the extension icon in your browser toolbar

3. Click "Add All Chase Offers" or "Add All Amex Offers" (button text updates based on the page you're on)

4. The extension will automatically click all "Add to Card" buttons and display how many offers were added

## Notes

- The extension only works on Chase and Amex offers pages. On other pages, the button will be disabled.
- For Chase, the page will automatically refresh after adding offers to update the offer states.
- Use the "Reset Count" button to clear your running totals.

## Permissions

- `scripting`: Required to interact with page elements
- `tabs`: Required to detect the current page URL
- `storage`: Required to save offer count totals

## License

MIT
