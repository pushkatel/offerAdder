// Cross-browser API wrapper (works on Chrome and Firefox)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Load and display counts on popup open
browserAPI.storage.local.get(['amexClicks', 'chaseClicks']).then((result) => {
  const amexTotal = result.amexClicks || 0;
  const chaseTotal = result.chaseClicks || 0;
  document.getElementById('amexTotal').textContent = `Amex: ${amexTotal}`;
  document.getElementById('chaseTotal').textContent = `Chase: ${chaseTotal}`;
});

// URL patterns
const chasePattern = /chase\.com.*merchantOffers/i;

// Update button text based on current URL
browserAPI.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  const isChase = chasePattern.test(tab.url);
  const isAmex = tab.url.includes('americanexpress.com/offers');
  const addButton = document.getElementById('addAll');
  const status = document.getElementById('status');

  if (isChase) {
    addButton.textContent = 'Add All Chase Offers';
  } else if (isAmex) {
    addButton.textContent = 'Add All Amex Offers';
  } else {
    addButton.textContent = 'Navigate to offers page to Add All Offers';
    addButton.disabled = true;
    addButton.classList.add('disabled');
    status.textContent = 'Navigate to Chase or Amex offers page to use this extension';
  }
});

document.getElementById('addAll').addEventListener('click', async () => {
  const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

  const isAmex = tab.url.includes('americanexpress.com/offers');
  const isChase = chasePattern.test(tab.url);

  if (!isAmex && !isChase) {
    document.getElementById('status').textContent = 'Error: This extension only works on americanexpress.com or chase.com';
    document.getElementById('status').style.color = 'red';
    return;
  }

  const clickFunction = isChase ? clickChaseButtons : clickAmexButtons;

  const results = await browserAPI.scripting.executeScript({
    target: { tabId: tab.id },
    func: clickFunction
  });

  const count = results[0].result;

  // Update total in storage
  const storageKey = isChase ? 'chaseClicks' : 'amexClicks';
  const displayId = isChase ? 'chaseTotal' : 'amexTotal';
  const label = isChase ? 'Chase' : 'Amex';

  const storageResult = await browserAPI.storage.local.get([storageKey]);
  const newTotal = (storageResult[storageKey] || 0) + count;
  await browserAPI.storage.local.set({ [storageKey]: newTotal });
  document.getElementById(displayId).textContent = `${label}: ${newTotal}`;

  document.getElementById('status').style.color = '#666';
  document.getElementById('status').textContent = `Clicked ${count} button(s)`;

  // Navigate back to the original URL after 1 second delay (Chase only)
  if (isChase && count > 0) {
    const originalUrl = tab.url;
    setTimeout(() => {
      browserAPI.tabs.update(tab.id, { url: originalUrl });
    }, 1000);
  }
});

document.getElementById('reset').addEventListener('click', async () => {
  await browserAPI.storage.local.set({ amexClicks: 0, chaseClicks: 0 });
  document.getElementById('amexTotal').textContent = 'Amex: 0';
  document.getElementById('chaseTotal').textContent = 'Chase: 0';
});

async function clickAmexButtons() {
  // Create modal overlay to prevent user interaction
  const overlay = document.createElement('div');
  overlay.id = 'offer-clicker-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;';
  const modal = document.createElement('div');
  modal.style.cssText = 'background:#fff;padding:32px 48px;border-radius:12px;text-align:center;font-family:sans-serif;box-shadow:0 4px 24px rgba(0,0,0,0.3);';
  modal.innerHTML = '<h2 style="margin:0 0 12px;font-size:20px;">Adding Offers...</h2><p style="margin:0;color:#555;font-size:14px;">Please wait and do not click anything or navigate away.</p>';
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const buttons = document.querySelectorAll('[title="add to list card"]');
  let count = 0;

  buttons.forEach(button => {
    button.click();
    count++;
  });

  // Wait until no elements with aria-busy="true" remain on the page
  await new Promise(resolve => {
    const poll = setInterval(() => {
      if (!document.querySelector('[aria-busy="true"]')) {
        clearInterval(poll);
        resolve();
      }
    }, 1000);
  });

  overlay.remove();
  return count;
}

async function clickChaseButtons() {
  const containers = document.querySelectorAll(
    '[data-testid="grid-items-container"], [data-testid="carousel-curation-category-offer-tile-list-container"], [data-testid="carousel-featured-category-offer-tile-list-container"]'
  );
  if (!containers.length) return 0;

  let count = 0;

  for (const container of containers) {
    const buttons = container.querySelectorAll('[role="button"]:not([aria-label*="Success Added"])');
    for (const button of buttons) {
      button.click();
      count++;
    }
  }

  return count;
}
