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

function sortOffers(offers) {
  if (!sortCol) return offers;
  return [...offers].sort((a, b) => {
    const va = (a[sortCol] || "").toString();
    const vb = (b[sortCol] || "").toString();
    if (sortCol === "date") {
      return sortAsc
        ? new Date(va) - new Date(vb)
        : new Date(vb) - new Date(va);
    }
    const cmp = va.localeCompare(vb, undefined, { sensitivity: "base" });
    return sortAsc ? cmp : -cmp;
  });
}

function render(offers) {
  allOffers = offers;
  if (!offers || offers.length === 0) {
    content.innerHTML = '<p class="empty">No saved offers yet.</p>';
    return;
  }

  const sorted = sortOffers(offers);

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

  sorted.forEach((o) => {
    const date = new Date(o.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    html +=
      "<tr>" +
      "<td>" + escapeHtml(o.name) + "</td>" +
      "<td>" + escapeHtml(o.offer) + "</td>" +
      "<td>" + escapeHtml(o.source) + "</td>" +
      "<td>" + escapeHtml(o.card || "") + "</td>" +
      "<td>" + escapeHtml(o.expiration || "") + "</td>" +
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

browserAPI.storage.local.get(["savedOffers"]).then((result) => {
  render(result.savedOffers || []);
});
