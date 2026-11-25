/* Shurmble — Shopify theme JS.
   Converted from the demo site: same look and interactions, but the cart
   talks to Shopify's AJAX cart API (/cart/add.js, /cart.js, /cart/change.js)
   and checkout goes to Shopify's real checkout (/checkout).
   Products come from <script type="application/json" class="products-json">
   blobs rendered by Liquid from the store's collection. When the store has
   no products yet, sections fall back to the 8 demo cookies (variant_id
   null) — those render fine, and Add buttons explain the setup needed.
*/
"use strict";

var SHURMBLE = window.SHURMBLE || {};
var FREE_SHIP = SHURMBLE.freeShipThreshold || 3000;
var CUR_SYM = SHURMBLE.currencySymbol || "Rs. ";
var CUR_CODE = SHURMBLE.currencyCode || "PKR";
var SETUP_MSG = "Demo cookie — add your real cookies in Shopify admin (Products + a Cookies collection) to enable ordering. See the theme README.";

function on(id, ev, fn){ var el = document.getElementById(id); if (el) el.addEventListener(ev, fn); }

/* ---------- Product data (from Liquid-rendered JSON blobs) ---------- */
var PRODUCTS = [];
var byId = {};
var SETS = { hero: [], best: [], shop: [], box: [] };
(function loadBlobs(){
  var tags = document.querySelectorAll('script.products-json[type="application/json"]');
  for (var i = 0; i < tags.length; i++){
    var role = tags[i].getAttribute('data-role') || 'shop';
    try {
      var arr = JSON.parse(tags[i].textContent);
      if (SETS[role]) SETS[role] = arr;
      for (var j = 0; j < arr.length; j++){
        var p = arr[j];
        if (!byId[p.id]){ byId[p.id] = p; PRODUCTS.push(p); }
      }
    } catch (e){ /* ignore a bad blob */ }
  }
})();

var BOX_PRODUCT = null;
(function loadBoxProduct(){
  var t = document.getElementById('box-product-json');
  if (t){ try { BOX_PRODUCT = JSON.parse(t.textContent); } catch (e){ BOX_PRODUCT = null; } }
})();

function packCount(label){ var m = label.match(/(\d+)\s*$/); return m ? parseInt(m[1], 10) : 1; }
function unitPrice(p){ return Math.round(p.packs[0][1] / packCount(p.packs[0][0])); }
function money(n){ return CUR_SYM + Math.round(n).toLocaleString("en-PK") + ".00 " + CUR_CODE; }
function moneyShort(n){ return CUR_SYM + Math.round(n).toLocaleString("en-PK"); }
function stars(r){ return "★★★★★".slice(0, Math.round(r)); }
function pad2(n){ return (n < 10 ? "0" : "") + n; }

var wishlist = {};
try { wishlist = JSON.parse(localStorage.getItem('shurmble_wishlist') || '{}'); } catch (e){ wishlist = {}; }
function saveWishlist(){ try { localStorage.setItem('shurmble_wishlist', JSON.stringify(wishlist)); } catch (e){} }

var toastTimer = null;
function toast(msg){
  var t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove("show"); }, 2600);
}

/* ---------- Shopify cart ---------- */
var cartState = { items: [], item_count: 0, total_price: 0 };
function fetchCart(){
  return fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
    .then(function(r){ return r.json(); })
    .then(function(c){ cartState = c; renderCart(); })
    .catch(function(){ /* cart unavailable (preview) */ });
}
function postCart(url, data){
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data)
  }).then(function(r){
    if (!r.ok) throw new Error('cart request failed');
    return r.json();
  }).then(function(){ return fetchCart(); });
}
function addVariant(variantId, qty, properties){
  if (!variantId){ toast(SETUP_MSG); return Promise.resolve(false); }
  var body = { id: variantId, quantity: qty || 1 };
  if (properties) body.properties = properties;
  return postCart('/cart/add.js', body).then(function(){ return true; })
    .catch(function(){ toast('Could not add that to the cart — please try again.'); return false; });
}
function changeLine(line, qty){
  return postCart('/cart/change.js', { line: line, quantity: qty })
    .catch(function(){ toast('Could not update the cart — please try again.'); });
}

function renderCart(){
  var n = cartState.item_count || 0;
  var badge = document.getElementById("cartCount");
  if (badge){ badge.hidden = n === 0; badge.textContent = n; }
  var dc = document.getElementById("drawerCount");
  if (dc) dc.textContent = n ? "(" + n + ")" : "";
  var body = document.getElementById("cartBody");
  var foot = document.getElementById("cartFoot");
  if (!body || !foot) return;
  if (!cartState.items.length){
    body.innerHTML = '<div class="empty-cart"><div class="big">🍪</div><p><strong>Your box is empty.</strong></p><p>Warm cookies are one click away.</p></div>';
    foot.innerHTML = "";
    return;
  }
  body.innerHTML = cartState.items.map(function(it, idx){
    var props = '';
    if (it.properties){
      var bits = [];
      for (var k in it.properties){
        if (it.properties[k]) bits.push(k + ': ' + it.properties[k]);
      }
      if (bits.length) props = '<div class="ci-meta">' + bits.join(' · ') + '</div>';
    }
    return '<div class="cart-item">' +
      '<img src="' + it.image + '" alt="' + it.title.replace(/"/g, '') + '" />' +
      '<div class="ci-body"><h4>' + it.title + '</h4>' +
        '<div class="ci-meta">' + (it.variant_title || '') + ' · ' + moneyShort(it.price / 100) + '</div>' +
        props +
        '<div class="qty-row">' +
          '<button class="qty-btn" data-line="' + (idx + 1) + '" data-delta="-1" aria-label="Decrease quantity">−</button>' +
          '<span class="qty-num">' + it.quantity + '</span>' +
          '<button class="qty-btn" data-line="' + (idx + 1) + '" data-delta="1" aria-label="Increase quantity">+</button>' +
        '</div></div>' +
      '<div class="ci-right"><span class="ci-price">' + moneyShort(it.line_price / 100) + '</span>' +
        '<button class="remove-btn" data-line="' + (idx + 1) + '">Remove</button></div>' +
    '</div>';
  }).join("");

  var sub = cartState.total_price / 100;
  var free = sub >= FREE_SHIP;
  var pct = Math.min(100, Math.round(sub / FREE_SHIP * 100));
  foot.innerHTML =
    '<div class="ship-progress"><p>' +
      (free ? "🎉 You've unlocked FREE nationwide shipping!" :
        "Add " + moneyShort(FREE_SHIP - sub) + " more for FREE nationwide shipping") +
      '</p><div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
    '<div class="total-row"><span>Subtotal</span><span>' + moneyShort(sub) + '</span></div>' +
    '<div class="total-row" style="font-size:.92rem;font-weight:600"><span>Shipping</span><span>Calculated at checkout</span></div>' +
    '<div class="total-row"><span>Total</span><span>' + moneyShort(sub) + '</span></div>' +
    '<a class="checkout-btn" href="/checkout">Checkout</a>';
}

/* ---------- Product cards ---------- */
function cardHTML(p){
  var wished = wishlist[p.id] ? " active" : "";
  var badge = p.badge ? '<span class="badge">' + p.badge + '</span>' : '';
  var title = p.url ? '<a href="' + p.url + '">' + p.name + '</a>' : p.name;
  var rating = (p.rating && p.rating > 0)
    ? '<div class="stars">' + stars(p.rating) + ' <span>' + p.rating.toFixed(1) + ' (' + (p.reviews || 0) + ')</span></div>'
    : '<div class="stars"><span class="no-rating">Fresh batch — be the first to review</span></div>';
  return '<article class="card">' +
    '<div class="card-media">' + badge +
      '<button class="wish-btn' + wished + '" data-wish="' + p.id + '" aria-label="Add ' + p.name.replace(/"/g, '') + ' to wishlist">' +
        '<svg viewBox="0 0 24 24" fill="' + (wishlist[p.id] ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 20.7C6.4 17 3 13.6 3 9.9 3 7.2 5 5 7.6 5c1.7 0 3.4.9 4.4 2.4C13 5.9 14.7 5 16.4 5 19 5 21 7.2 21 9.9c0 3.7-3.4 7.1-9 10.8Z"/></svg>' +
      '</button>' +
      '<img src="' + p.img + '" alt="' + (p.alt || p.name).replace(/"/g, '') + '" loading="lazy" />' +
    '</div>' +
    '<div class="card-body">' +
      '<h3>' + title + '</h3>' +
      rating +
      '<p class="desc">' + p.desc + '</p>' +
      '<div class="price">' + money(p.packs[0][1]) + '</div>' +
      '<button class="add-btn" data-add="' + p.id + '">Add to Box — ' + p.packs[0][0] + '</button>' +
      '<button class="view-btn" data-quickview="' + p.id + '">Quick view</button>' +
    '</div></article>';
}

var activeFilter = "all";
var activeSort = "featured";
function renderBest(){
  var el = document.getElementById("bestGrid");
  if (!el) return;
  var list = SETS.best.length ? SETS.best : PRODUCTS.slice(0, 4);
  el.innerHTML = list.slice(0, 4).map(cardHTML).join("");
}
function renderShop(){
  var el = document.getElementById("shopGrid");
  if (!el) return;
  var list = (SETS.shop.length ? SETS.shop : PRODUCTS).filter(function(p){
    return activeFilter === "all" || p.cat === activeFilter;
  });
  if (activeSort === "price-low") list = list.slice().sort(function(a,b){ return a.packs[0][1]-b.packs[0][1]; });
  if (activeSort === "price-high") list = list.slice().sort(function(a,b){ return b.packs[0][1]-a.packs[0][1]; });
  if (activeSort === "rating") list = list.slice().sort(function(a,b){ return (b.rating||0)-(a.rating||0); });
  if (activeSort === "name") list = list.slice().sort(function(a,b){ return a.name.localeCompare(b.name); });
  el.innerHTML = list.map(cardHTML).join("");
  var nr = document.getElementById("noResults");
  if (nr) nr.hidden = list.length > 0;
}
function renderWishBadge(){
  var n = Object.keys(wishlist).length;
  var b = document.getElementById("wishCount");
  if (!b) return;
  b.hidden = n === 0;
  b.textContent = n;
}
function refreshCards(){ renderBest(); renderShop(); }

function addToCart(id, packLabel, qty){
  var p = byId[id];
  if (!p) return;
  var pack = null;
  for (var i = 0; i < p.packs.length; i++){ if (p.packs[i][0] === packLabel){ pack = p.packs[i]; break; } }
  pack = pack || p.packs[0];
  addVariant(pack[2], qty || 1).then(function(ok){
    if (ok) toast(p.name + ' (' + pack[0] + ') added to your box 🍪');
  });
}
function toggleWish(id){
  var p = byId[id];
  if (!p) return;
  if (wishlist[id]){ delete wishlist[id]; toast(p.name + ' removed from wishlist'); }
  else { wishlist[id] = true; toast(p.name + ' saved to your wishlist ♥'); }
  saveWishlist();
  renderWishBadge();
  refreshCards();
  syncQvWish();
}

/* ---------- Hero flavour switcher ---------- */
var heroList = SETS.hero.length ? SETS.hero : PRODUCTS;
var heroIdx = 0;
var swTimer = null;
function renderSwNums(){
  var el = document.getElementById("swNums");
  if (!el) return;
  el.innerHTML = heroList.map(function(p, i){
    return '<button class="num-btn' + (i === heroIdx ? ' active' : '') + '" data-hero="' + i + '" aria-label="Flavour ' + pad2(i + 1) + ': ' + p.hero.replace(/"/g, '') + '">' + pad2(i + 1) + '</button>';
  }).join("");
}
function setHero(i, instant){
  if (!heroList.length) return;
  heroIdx = (i + heroList.length) % heroList.length;
  var p = heroList[heroIdx];
  var img = document.getElementById("swImg");
  if (!img) return;
  function apply(){ img.src = p.img; img.alt = p.alt || p.name; img.classList.remove("swap"); }
  if (instant){ apply(); }
  else {
    img.classList.add("swap");
    clearTimeout(swTimer);
    swTimer = setTimeout(apply, 180);
  }
  document.documentElement.style.setProperty("--tint", p.tint || "#e9edf6");
  var swNo = document.getElementById("swNo"); if (swNo) swNo.textContent = "Cookie N0." + pad2(heroIdx + 1);
  var swName = document.getElementById("swName"); if (swName) swName.textContent = p.hero;
  var sticker = document.getElementById("swSticker");
  if (sticker){
    if (p.badge){ sticker.textContent = p.badge; sticker.style.display = "inline-block"; }
    else sticker.style.display = "none";
  }
  var notes = document.getElementById("swNotes");
  if (notes) notes.innerHTML = (p.notes || []).map(function(n){ return '<span class="note-chip">' + n + '</span>'; }).join("");
  var desc = document.getElementById("swDesc"); if (desc) desc.textContent = p.desc;
  var packLabel = document.getElementById("swPackLabel"); if (packLabel) packLabel.textContent = p.packs[0][0];
  var price = document.getElementById("swPrice"); if (price) price.textContent = money(p.packs[0][1]);
  renderSwNums();
}
on("swPrev", "click", function(){ setHero(heroIdx - 1); });
on("swNext", "click", function(){ setHero(heroIdx + 1); });
on("swNums", "click", function(e){
  var b = e.target.closest("[data-hero]");
  if (b) setHero(parseInt(b.getAttribute("data-hero"), 10));
});
on("swAdd", "click", function(){
  var p = heroList[heroIdx];
  if (!p) return;
  addToCart(p.id, p.packs[0][0], 1);
  openCart();
});
on("swQuick", "click", function(){
  var p = heroList[heroIdx];
  if (p) openQuick(p.id);
});
document.addEventListener("keydown", function(e){
  if (e.key === "ArrowLeft" && !document.querySelector(".modal.open")) setHero(heroIdx - 1);
  if (e.key === "ArrowRight" && !document.querySelector(".modal.open")) setHero(heroIdx + 1);
});

/* ---------- Build Your Box ---------- */
var BOX_DISCOUNT = { 4: 0, 6: 0.05, 8: 0.10 };
var boxSize = 6;
var boxPicks = [];
function boxCounts(){
  var c = {};
  boxPicks.forEach(function(id){ c[id] = (c[id] || 0) + 1; });
  return c;
}
function boxSubtotal(){
  return boxPicks.reduce(function(s, id){ return s + unitPrice(byId[id]); }, 0);
}
function boxVariant(size){
  if (!BOX_PRODUCT || !BOX_PRODUCT.variants) return null;
  for (var i = 0; i < BOX_PRODUCT.variants.length; i++){
    if (BOX_PRODUCT.variants[i].title === "Box of " + size) return BOX_PRODUCT.variants[i];
  }
  return null;
}
function boxTotal(){
  var v = boxVariant(boxSize);
  if (v) return v.price;
  return Math.round(boxSubtotal() * (1 - BOX_DISCOUNT[boxSize]));
}
function boxList(){
  return SETS.box.length ? SETS.box : PRODUCTS;
}
function renderPicker(){
  var el = document.getElementById("boxPicker");
  if (!el) return;
  var counts = boxCounts();
  el.innerHTML = boxList().map(function(p){
    var c = counts[p.id] || 0;
    return '<div class="pick">' +
      '<img src="' + p.img + '" alt="' + (p.alt || p.name).replace(/"/g, '') + '" loading="lazy" />' +
      '<div class="pk-body"><h4>' + p.hero + (c ? '<span class="pk-count">× ' + c + '</span>' : '') + '</h4>' +
      '<div class="pk-price">' + moneyShort(unitPrice(p)) + ' per cookie</div></div>' +
      '<button class="pick-add" data-pick="' + p.id + '" aria-label="Add ' + p.name.replace(/"/g, '') + ' to your box">+</button>' +
    '</div>';
  }).join("");
}
function renderBox(){
  var slots = document.getElementById("boxSlots");
  if (!slots) return;
  var html = "";
  for (var i = 0; i < boxSize; i++){
    if (boxPicks[i]){
      var p = byId[boxPicks[i]];
      html += '<div class="slot filled"><img src="' + p.img + '" alt="' + (p.alt || p.name).replace(/"/g, '') + '" />' +
        '<button class="rm" data-unpick="' + i + '" aria-label="Remove ' + p.hero.replace(/"/g, '') + ' from box">✕</button></div>';
    } else {
      html += '<div class="slot">' + (i + 1) + '</div>';
    }
  }
  slots.innerHTML = html;
  slots.style.gridTemplateColumns = "repeat(4,1fr)";
  var sub = boxSubtotal();
  var total = boxTotal();
  var cl = document.getElementById("boxCountLabel"); if (cl) cl.textContent = boxPicks.length + " / " + boxSize;
  var sb = document.getElementById("boxSubtotal"); if (sb) sb.textContent = moneyShort(sub);
  var saveRow = document.getElementById("boxSaveRow");
  if (saveRow){
    if (sub > total){ saveRow.hidden = false; var sv = document.getElementById("boxSave"); if (sv) sv.textContent = "− " + moneyShort(sub - total); }
    else saveRow.hidden = true;
  }
  var bt = document.getElementById("boxTotal"); if (bt) bt.textContent = moneyShort(total);
  var ba = document.getElementById("boxAdd"); if (ba) ba.disabled = boxPicks.length !== boxSize;
  var status = document.getElementById("boxStatus");
  if (status){
    if (boxPicks.length === 0) status.textContent = "Pick a size, then tap + on any cookie to start filling your box.";
    else if (boxPicks.length < boxSize) status.textContent = (boxSize - boxPicks.length) + " more cookie" + (boxSize - boxPicks.length > 1 ? "s" : "") + " to go — mix flavours or double up on a favourite.";
    else status.textContent = boxSize === 8 ? "Box full! It ships FREE nationwide. 🎉" : "Box full — looking delicious. Add it to your cart!";
  }
  renderPicker();
}
on("sizeRow", "click", function(e){
  var b = e.target.closest("[data-size]");
  if (!b) return;
  boxSize = parseInt(b.getAttribute("data-size"), 10);
  var btns = document.querySelectorAll("#sizeRow .size-btn");
  for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("active", btns[i] === b);
  if (boxPicks.length > boxSize) boxPicks = boxPicks.slice(0, boxSize);
  renderBox();
});
on("boxPicker", "click", function(e){
  var b = e.target.closest("[data-pick]");
  if (!b) return;
  if (boxPicks.length >= boxSize){
    toast("Your box of " + boxSize + " is full — remove a cookie or pick a bigger box");
    return;
  }
  boxPicks.push(b.getAttribute("data-pick"));
  renderBox();
});
on("boxSlots", "click", function(e){
  var b = e.target.closest("[data-unpick]");
  if (!b) return;
  boxPicks.splice(parseInt(b.getAttribute("data-unpick"), 10), 1);
  renderBox();
});
on("boxClear", "click", function(){ boxPicks = []; renderBox(); });
on("boxAdd", "click", function(){
  if (boxPicks.length !== boxSize) return;
  var v = boxVariant(boxSize);
  if (!v){ toast(SETUP_MSG + ' Create a "Build Your Own Box" product with Box of 4 / 6 / 8 variants and pick it in the Build Your Own Box section.'); return; }
  var counts = boxCounts();
  var flavours = Object.keys(counts).map(function(id){ return byId[id].hero + " × " + counts[id]; }).join(", ");
  var props = { "Box size": "Box of " + boxSize, "Flavours": flavours };
  addVariant(v.id, 1, props).then(function(ok){
    if (ok){
      toast("Your custom box of " + boxSize + " (" + moneyShort(boxTotal()) + ") is in the cart 🍪");
      boxPicks = [];
      renderBox();
      openCart();
    }
  });
});

/* ---------- Quick view ---------- */
var qv = { id: null, pack: null, qty: 1 };
function openQuick(id){
  var p = byId[id];
  if (!p) return;
  qv = { id: id, pack: p.packs[0][0], qty: 1 };
  var img = document.getElementById("qvImg"); if (img){ img.src = p.img; img.alt = p.alt || p.name; }
  var nm = document.getElementById("qvName"); if (nm) nm.textContent = p.name;
  var ds = document.getElementById("qvDesc"); if (ds) ds.textContent = p.long || p.desc;
  var st = document.getElementById("qvStars");
  if (st) st.innerHTML = (p.rating && p.rating > 0)
    ? stars(p.rating) + ' <span>' + p.rating.toFixed(1) + ' · ' + (p.reviews || 0) + ' reviews</span>'
    : '<span class="no-rating">Fresh batch — be the first to review</span>';
  var b = document.getElementById("qvBadge");
  if (b){ if (p.badge){ b.textContent = p.badge; b.style.display = "inline-block"; } else b.style.display = "none"; }
  renderQvPacks();
  syncQv();
  syncQvWish();
  var m = document.getElementById("quickModal");
  if (m) m.classList.add("open");
  var s = document.getElementById("scrim"); if (s) s.classList.add("show");
}
function renderQvPacks(){
  var p = byId[qv.id];
  var el = document.getElementById("qvPacks");
  if (!p || !el) return;
  el.innerHTML = p.packs.map(function(pk){
    return '<button class="pack-btn' + (pk[0] === qv.pack ? ' active' : '') + '" data-pack="' + pk[0] + '">' + pk[0] + ' · ' + moneyShort(pk[1]) + '</button>';
  }).join("");
}
function syncQv(){
  var p = byId[qv.id];
  if (!p) return;
  var pack = p.packs[0];
  for (var i = 0; i < p.packs.length; i++){ if (p.packs[i][0] === qv.pack){ pack = p.packs[i]; break; } }
  var q = document.getElementById("qvQty"); if (q) q.textContent = qv.qty;
  var pr = document.getElementById("qvPrice"); if (pr) pr.textContent = money(pack[1] * qv.qty);
}
function syncQvWish(){
  var btn = document.getElementById("qvWish");
  if (!btn || !qv.id) return;
  btn.classList.toggle("active", !!wishlist[qv.id]);
}
function closeQuick(){
  var m = document.getElementById("quickModal");
  if (m) m.classList.remove("open");
  var d = document.getElementById("cartDrawer");
  if (!d || !d.classList.contains("open")){
    var s = document.getElementById("scrim"); if (s) s.classList.remove("show");
  }
}

/* ---------- Cart drawer ---------- */
function openCart(){
  renderCart();
  var d = document.getElementById("cartDrawer");
  if (d) d.classList.add("open");
  var s = document.getElementById("scrim"); if (s) s.classList.add("show");
}
function closeCart(){
  var d = document.getElementById("cartDrawer");
  if (d) d.classList.remove("open");
  var qm = document.getElementById("quickModal");
  if (!qm || !qm.classList.contains("open")){
    var s = document.getElementById("scrim"); if (s) s.classList.remove("show");
  }
}

/* ---------- Global click delegation ---------- */
document.addEventListener("click", function(e){
  var add = e.target.closest("[data-add]");
  if (add){ addToCart(add.getAttribute("data-add"), byId[add.getAttribute("data-add")].packs[0][0], 1); return; }
  var q = e.target.closest("[data-quickview]");
  if (q){ openQuick(q.getAttribute("data-quickview")); return; }
  var w = e.target.closest("[data-wish]");
  if (w){ toggleWish(w.getAttribute("data-wish")); return; }
  var qb = e.target.closest("[data-line]");
  if (qb){
    var line = parseInt(qb.getAttribute("data-line"), 10);
    if (qb.classList.contains("remove-btn")){ changeLine(line, 0); return; }
    var delta = parseInt(qb.getAttribute("data-delta") || "0", 10);
    var it = cartState.items[line - 1];
    if (it) changeLine(line, Math.max(0, it.quantity + delta));
    return;
  }
  var pk = e.target.closest("[data-pack]");
  if (pk){ qv.pack = pk.getAttribute("data-pack"); renderQvPacks(); syncQv(); return; }
  var cl = e.target.closest("[data-close]");
  if (cl){
    if (cl.closest("#quickModal")) closeQuick();
    return;
  }
});

on("cartBtn", "click", openCart);
on("closeCart", "click", closeCart);
on("scrim", "click", function(){ closeCart(); closeQuick(); });
on("wishBtn", "click", function(){
  var n = Object.keys(wishlist).length;
  toast(n ? "You have " + n + " cookie" + (n > 1 ? "s" : "") + " in your wishlist ♥" : "Your wishlist is empty — tap a heart to save a cookie");
});
on("menuBtn", "click", function(){
  var m = document.getElementById("mobileNav");
  if (m) m.classList.toggle("open");
});
on("mobileNav", "click", function(){
  var m = document.getElementById("mobileNav");
  if (m) m.classList.remove("open");
});
on("searchBtn", "click", function(){
  var bar = document.getElementById("searchBar");
  if (!bar) return;
  bar.classList.toggle("open");
  if (bar.classList.contains("open")){
    var inp = document.getElementById("searchInput");
    if (inp) inp.focus();
  }
});

on("qvPlus", "click", function(){ qv.qty = Math.min(20, qv.qty + 1); syncQv(); });
on("qvMinus", "click", function(){ qv.qty = Math.max(1, qv.qty - 1); syncQv(); });
on("qvAdd", "click", function(){
  addToCart(qv.id, qv.pack, qv.qty);
  closeQuick();
  openCart();
});
on("qvWish", "click", function(){ if (qv.id) toggleWish(qv.id); });

on("filterBar", "click", function(e){
  var chip = e.target.closest("[data-filter]");
  if (!chip) return;
  activeFilter = chip.getAttribute("data-filter");
  var chips = document.querySelectorAll("#filterBar .chip");
  for (var i = 0; i < chips.length; i++) chips[i].classList.toggle("active", chips[i] === chip);
  renderShop();
});
on("sortSelect", "change", function(e){ activeSort = e.target.value; renderShop(); });

on("searchForm", "submit", function(e){
  e.preventDefault();
  var inp = document.getElementById("searchInput");
  var term = inp ? inp.value.trim().toLowerCase() : "";
  var box = document.getElementById("searchResults");
  if (!box) return;
  if (!term){ box.innerHTML = ""; return; }
  var hits = PRODUCTS.filter(function(p){
    return (p.name + " " + p.desc + " " + p.cat).toLowerCase().indexOf(term) !== -1;
  });
  box.innerHTML = hits.length
    ? hits.map(function(p){ return '<button type="button" data-quickview="' + p.id + '">' + p.name + ' — ' + moneyShort(p.packs[0][1]) + '</button>'; }).join("") +
      '<a href="/search?q=' + encodeURIComponent(term) + '" style="display:block;font-weight:700;padding:.5rem 0">See all results →</a>'
    : '<span style="font-weight:700;color:var(--muted)">No cookies found for “' + term + '” — try “chocolate” or “gift”.</span>';
});

document.addEventListener("keydown", function(e){
  if (e.key === "Escape"){ closeCart(); closeQuick(); }
});

/* Duplicate marquee content so the loops run seamlessly */
(function(){
  var track = document.getElementById("announceTrack");
  if (track) track.innerHTML += track.innerHTML;
  var mt = document.getElementById("marqueeTrack");
  if (mt) mt.innerHTML += mt.innerHTML;
})();

/* ---------- Init ---------- */
if (document.getElementById("swImg")) setHero(0, true);
renderBox();
renderBest();
renderShop();
renderWishBadge();
fetchCart();
