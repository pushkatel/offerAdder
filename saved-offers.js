const browserAPI = typeof browser !== "undefined" ? browser : chrome;
const content = document.getElementById("content");

function render(offers) {
  if (!offers || offers.length === 0) {
    content.innerHTML = '<p class="empty">No saved offers yet.</p>';
    return;
  }

  let html =
    "<table><thead><tr><th>Name</th><th>Offer</th><th>Source</th><th>Card</th><th>Expiration</th><th>Date Added</th></tr></thead><tbody>";
  offers.forEach((o) => {
    console.log(o);
    const date = new Date(o.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    html +=
      "<tr>" +
      "<td>" +
      escapeHtml(o.name) +
      "</td>" +
      "<td>" +
      escapeHtml(o.offer) +
      "</td>" +
      "<td>" +
      escapeHtml(o.source) +
      "</td>" +
      "<td>" +
      escapeHtml(o.card || "") +
      "</td>" +
      "<td>" +
      escapeHtml(o.expiration || "") +
      "</td>" +
      "<td>" +
      date +
      "</td>" +
      "</tr>";
  });
  html += "</tbody></table>";
  html += '<button id="clearAll">Clear All</button>';
  content.innerHTML = html;

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
