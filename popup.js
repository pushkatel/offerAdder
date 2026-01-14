// Load and display counts on popup open
chrome.storage.local.get(['amexClicks', 'chaseClicks'], (result) => {
  const amexTotal = result.amexClicks || 0;
  const chaseTotal = result.chaseClicks || 0;
  document.getElementById('amexTotal').textContent = `Amex: ${amexTotal}`;
  document.getElementById('chaseTotal').textContent = `Chase: ${chaseTotal}`;
});

// URL patterns
const chasePattern = /chase\.com.*merchantOffers/i;

// Update button text based on current URL
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const isChase = chasePattern.test(tab.url);
  const isAmex = tab.url.includes('americanexpress.com/offers');
  const addButton = document.getElementById('addAll');
  const status = document.getElementById('status');

  if (isChase) {
    addButton.textContent = 'Add All Chase Offers';
  } else if (isAmex) {
    addButton.textContent = 'Add All Amex Offers';
  } else {
    addButton.textContent = 'Add All Offers';
    addButton.disabled = true;
    addButton.classList.add('disabled');
    status.textContent = 'Navigate to Chase or Amex offers page to use this extension';
  }
});

document.getElementById('addAll').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const isAmex = tab.url.includes('americanexpress.com/offers');
  const isChase = chasePattern.test(tab.url);

  if (!isAmex && !isChase) {
    document.getElementById('status').textContent = 'Error: This extension only works on americanexpress.com or chase.com';
    document.getElementById('status').style.color = 'red';
    return;
  }

  const clickFunction = isChase ? clickChaseButtons : clickAmexButtons;

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: clickFunction
  });

  const count = results[0].result;

  // Update total in storage
  const storageKey = isChase ? 'chaseClicks' : 'amexClicks';
  const displayId = isChase ? 'chaseTotal' : 'amexTotal';
  const label = isChase ? 'Chase' : 'Amex';

  chrome.storage.local.get([storageKey], (result) => {
    const newTotal = (result[storageKey] || 0) + count;
    chrome.storage.local.set({ [storageKey]: newTotal });
    document.getElementById(displayId).textContent = `${label}: ${newTotal}`;
  });

  document.getElementById('status').style.color = '#666';
  document.getElementById('status').textContent = `Clicked ${count} button(s)`;

  // Navigate back to the original URL after 1 second delay (Chase only)
  if (isChase && count > 0) {
    const originalUrl = tab.url;
    setTimeout(() => {
      chrome.tabs.update(tab.id, { url: originalUrl });
    }, 1000);
  }
});

document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.local.set({ amexClicks: 0, chaseClicks: 0 });
  document.getElementById('amexTotal').textContent = 'Amex: 0';
  document.getElementById('chaseTotal').textContent = 'Chase: 0';
});

function clickAmexButtons() {
  const buttons = document.querySelectorAll('[title="add to list card"]');
  let count = 0;

  buttons.forEach(button => {
    button.click();
    count++;
  });

  return count;
}

async function clickChaseButtons() {
  const containers = document.querySelectorAll(
    '[data-testid="grid-items-container"], [data-testid="carousel-curation-category-offer-tile-list-container"], [data-testid="carousel-featured-category-offer-tile-list-container"]'
  );
  if (!containers.length) return 0;

  let count = 0;

  for (const container of containers) {
    const buttons = container.querySelectorAll('[role="button"]');
    for (const button of buttons) {
      button.click();
      count++;
    }
  }

  return count;
}
