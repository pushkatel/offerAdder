function showOfferOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "offer-clicker-overlay";
  overlay.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;";

  const modal = document.createElement("div");
  modal.style.cssText =
    "background:#fff;padding:32px 48px;border-radius:12px;text-align:center;font-family:sans-serif;box-shadow:0 4px 24px rgba(0,0,0,0.3);";
  modal.innerHTML =
    '<h2 style="margin:0 0 12px;font-size:20px;">Adding Offers...</h2>' +
    '<p style="margin:0;color:#555;font-size:14px;">Please wait and do not click anything or navigate away.</p>';

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function removeOfferOverlay() {
  const overlay = document.getElementById("offer-clicker-overlay");
  if (overlay) overlay.remove();
}
