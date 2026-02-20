// Cross-browser API wrapper (works on Chrome and Firefox)
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

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

  if (isAmex) {
    await browserAPI.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['overlay.js']
    });
  }

  const results = await browserAPI.scripting.executeScript({
    target: { tabId: tab.id },
    func: clickFunction
  });

  const result = results[0].result;
  const count = typeof result === 'object' ? result.count : result;
  const offers = typeof result === 'object' ? result.offers : [];

  // Save offers to local storage
  if (offers.length > 0) {
    const stored = await browserAPI.storage.local.get(['savedOffers']);
    const existing = stored.savedOffers || [];
    await browserAPI.storage.local.set({ savedOffers: [...existing, ...offers] });
  }

  document.getElementById('status').style.color = '#666';
  document.getElementById('status').textContent = `Done! Added ${count} offer(s)`;

  // Navigate back to the original URL after 1 second delay (Chase only)
  if (isChase && count > 0) {
    const originalUrl = tab.url;
    setTimeout(() => {
      browserAPI.tabs.update(tab.id, { url: originalUrl });
    }, 1000);
  }
});

document.getElementById('viewSaved').addEventListener('click', () => {
  browserAPI.tabs.create({ url: browserAPI.runtime.getURL('saved-offers.html') });
});

async function clickAmexButtons() {
  showOfferOverlay();

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

  removeOfferOverlay();
  return count;
}

async function clickChaseButtons() {
  const containers = document.querySelectorAll(
    '[data-testid="grid-items-container"], [data-testid="carousel-curation-category-offer-tile-list-container"], [data-testid="carousel-featured-category-offer-tile-list-container"]'
  );
  if (!containers.length) return { count: 0, offers: [] };

  let count = 0;
  const offers = [];

  const cardEl = document.querySelectorAll('.mds-body-medium-heavier')[0];
  const card = cardEl ? cardEl.textContent.trim() : '';

  for (const container of containers) {
    const buttons = container.querySelectorAll('[role="button"]:not([aria-label*="Success Added"])');
    for (const button of buttons) {
      let name = '';
      let offer = '';

      // button -> first child -> 4th child contains name and offer
      const firstChild = button.children[0];
      if (firstChild && firstChild.children[3]) {
        const infoNode = firstChild.children[3];
        const textNodes = infoNode.querySelectorAll('*');
        offer = textNodes[0].textContent.trim();
        name = textNodes[1].textContent.trim();
      }

      offers.push({
        name: name || 'Unknown',
        offer: offer || 'Chase Offer',
        source: 'Chase',
        card: card || 'Unknown Card',
        date: new Date().toISOString()
      });

      button.click();
      count++;
    }
  }

  return { count, offers };
}
