const browserAPI = typeof browser !== "undefined" ? browser : chrome;
const content = document.getElementById("content");

const columns = [
  { label: "Name", key: "name" },
  { label: "Offer", key: "offer" },
  { label: "Source", key: "source" },
  { label: "Card", key: "card" },
  { label: "Expiration", key: "expiration" },
  { label: "Date Added", key: "date" },
];

let sortCol = null;
let sortAsc = true;
let allOffers = [];
let searchQuery = "";

function sortOffers(offers) {
  if (!sortCol) return offers;
  return [...offers].sort((first, second) => {
    const valA = (first[sortCol] || "").toString();
    const valB = (second[sortCol] || "").toString();
    if (sortCol === "date") {
      return sortAsc
        ? new Date(valA) - new Date(valB)
        : new Date(valB) - new Date(valA);
    }
    const cmp = valA.localeCompare(valB, undefined, { sensitivity: "base" });
    return sortAsc ? cmp : -cmp;
  });
}

function filterOffers(offers) {
  if (!searchQuery) return offers;
  const query = searchQuery.toLowerCase();
  return offers.filter((offer) =>
    [offer.name, offer.offer, offer.source, offer.card, offer.expiration].some((value) =>
      (value || "").toLowerCase().includes(query),
    ),
  );
}

function render(offers) {
  allOffers = offers;
  if (!offers || offers.length === 0) {
    content.innerHTML = '<p class="empty">No saved offers yet.</p>';
    return;
  }

  const filtered = filterOffers(offers);
  if (filtered.length === 0) {
    content.innerHTML = '<p class="empty">No offers match your search.</p>';
    return;
  }

  const sorted = sortOffers(filtered);

  let html = "<table><thead><tr>";
  columns.forEach((col) => {
    let arrow;
    if (sortCol === col.key) {
      arrow = '<span class="sort-arrow">' + (sortAsc ? "\u25B2" : "\u25BC") + "</span>";
    } else {
      arrow = '<span class="sort-arrow" style="opacity:0.4">\u25B2\u25BC</span>';
    }
    html += '<th data-key="' + col.key + '">' + col.label + arrow + "</th>";
  });
  html += "</tr></thead><tbody>";

  sorted.forEach((offer) => {
    const date = new Date(offer.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    html +=
      "<tr>" +
      "<td>" + escapeHtml(offer.name) + "</td>" +
      "<td>" + escapeHtml(offer.offer) + "</td>" +
      "<td>" + escapeHtml(offer.source) + "</td>" +
      "<td>" + escapeHtml(offer.card || "") + "</td>" +
      "<td>" + escapeHtml(offer.expiration || "") + "</td>" +
      "<td>" + date + "</td>" +
      "</tr>";
  });
  html += "</tbody></table>";
  html += '<button id="clearAll">Clear All</button>';
  content.innerHTML = html;

  document.querySelectorAll("th[data-key]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-key");
      if (sortCol === key) {
        sortAsc = !sortAsc;
      } else {
        sortCol = key;
        sortAsc = true;
      }
      render(allOffers);
    });
  });

  document.getElementById("clearAll").addEventListener("click", async () => {
    await browserAPI.storage.local.set({ savedOffers: [] });
    render([]);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("searchBox").addEventListener("input", (event) => {
  searchQuery = event.target.value;
  render(allOffers);
});

browserAPI.storage.local.get(["savedOffers"]).then((result) => {
  render(result.savedOffers || []);
});
