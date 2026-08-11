/* ==========================================================================
   ZYRO WEAR — APPLICATION LOGIC & STORE MANAGEMENT
   ========================================================================== */

// 1. Central Configuration
const CONFIG = {
    WHATSAPP_PHONE: "917200515977", // Target Business Phone Number
    UNIFORM_PRICE: 299,
    MRP_PRICE: 699,
    CURRENCY_SYMBOL: "₹"
};

// 2. Product Database mapped to ZYRO_Wear_Studio_Imgs assets
const PRODUCTS = [
    {
        id: "arg-home-10",
        name: "Argentina Home Kit (Messi #10)",
        team: "Argentina",
        player: "Lionel Messi #10",
        category: "star",
        nation: "Argentina",
        price: CONFIG.UNIFORM_PRICE,
        mrp: CONFIG.MRP_PRICE,
        frontImg: "ZYRO_Wear_Studio_Imgs/Argentina_Home_Front.png",
        backImg: "ZYRO_Wear_Studio_Imgs/Argentina_Home_Messi_10_Back.png",
        description: "Official 2026 Argentina Home Jersey featuring legend Lionel Messi #10. Crafted with ultra-light breathable fabric for peak performance and style."
    },
    {
        id: "bel-home-7",
        name: "Belgium Home Kit (De Bruyne #7)",
        team: "Belgium",
        player: "Kevin De Bruyne #7",
        category: "star",
        nation: "Belgium",
        price: CONFIG.UNIFORM_PRICE,
        mrp: CONFIG.MRP_PRICE,
        frontImg: "ZYRO_Wear_Studio_Imgs/Belgium_Home_Front (2).png",
        backImg: "ZYRO_Wear_Studio_Imgs/Belgium_Home_De_Bruyne_7_Back.png",
        description: "Official Belgium Red Devils Home Kit featuring playmaker Kevin De Bruyne #7. Bold geometric graphics and sweat-wicking comfort."
    },
    {
        id: "bra-home-7",
        name: "Brazil Home Kit (Vini Jr #7)",
        team: "Brazil",
        player: "Vini Jr #7",
        category: "star",
        nation: "Brazil",
        price: CONFIG.UNIFORM_PRICE,
        mrp: CONFIG.MRP_PRICE,
        frontImg: "ZYRO_Wear_Studio_Imgs/Brazil_Home_Front.png",
        backImg: "ZYRO_Wear_Studio_Imgs/Brazil_Home_Vini_Jr_7_Back.png",
        description: "Iconic Seleção Canary Yellow Home Jersey with Vinícius Jr #7. Represents Samba football energy, built for comfort."
    },
    {
        id: "eng-home-10",
        name: "England Home Kit (Bellingham #10)",
        team: "England",
        player: "Jude Bellingham #10",
        category: "star",
        nation: "England",
        price: CONFIG.UNIFORM_PRICE,
        mrp: CONFIG.MRP_PRICE,
        frontImg: "ZYRO_Wear_Studio_Imgs/England_Home_Front.png",
        backImg: "ZYRO_Wear_Studio_Imgs/England_Home_Bellingham_10_Back.png",
        description: "Classic Three Lions Pure White Home Jersey featuring Jude Bellingham #10. Premium tailored fit and high-definition badge."
    },
    {
        id: "fra-home-10",
        name: "France Home Kit (Mbappé #10)",
        team: "France",
        player: "Kylian Mbappé #10",
        category: "star",
        nation: "France",
        price: CONFIG.UNIFORM_PRICE,
        mrp: CONFIG.MRP_PRICE,
        frontImg: "ZYRO_Wear_Studio_Imgs/France_Home_Front.png",
        backImg: "ZYRO_Wear_Studio_Imgs/France_Home_Mbappe_10_Back.png",
        description: "Elegant Royal Blue Les Bleus Home Kit with speedster Kylian Mbappé #10. Gold rooster crest detail and modern athletic cut."
    },
    {
        id: "ger-home-10",
        name: "Germany Home Kit (Musiala #10)",
        team: "Germany",
        player: "Jamal Musiala #10",
        category: "star",
        nation: "Germany",
        price: CONFIG.UNIFORM_PRICE,
        mrp: CONFIG.MRP_PRICE,
        frontImg: "ZYRO_Wear_Studio_Imgs/Germany_Home_Front.png",
        backImg: "ZYRO_Wear_Studio_Imgs/Germany_Home_Musiala_10_Back.png",
        description: "Modern DFB White & Flame Graphic Home Kit featuring Jamal Musiala #10. Precision engineering and breathable texture."
    },
    {
        id: "nor-home-9",
        name: "Norway Home Kit (Haaland #9)",
        team: "Norway",
        player: "Erling Haaland #9",
        category: "star",
        nation: "Norway",
        price: CONFIG.UNIFORM_PRICE,
        mrp: CONFIG.MRP_PRICE,
        frontImg: "ZYRO_Wear_Studio_Imgs/Norway_Home_Front.png",
        backImg: "ZYRO_Wear_Studio_Imgs/Norway_Home_Haaland_9_Back.png",
        description: "Vibrant Crimson Red Norway National Kit featuring goal machine Erling Haaland #9. Striking Norse pattern."
    },
    {
        id: "por-home-7",
        name: "Portugal Home Kit (Ronaldo #7)",
        team: "Portugal",
        player: "Cristiano Ronaldo #7",
        category: "star",
        nation: "Portugal",
        price: CONFIG.UNIFORM_PRICE,
        mrp: CONFIG.MRP_PRICE,
        frontImg: "ZYRO_Wear_Studio_Imgs/Portugal_Home_Ronaldo_7_front.png",
        backImg: "ZYRO_Wear_Studio_Imgs/Portugal_Home_Ronaldo_7_Back.png",
        description: "Legendary Portugal Red & Green Home Kit with Cristiano Ronaldo #7 (CR7). Premium fabric designed for ultimate comfort."
    },
    {
        id: "esp-home-19",
        name: "Spain Home Kit (Lamine Yamal #19)",
        team: "Spain",
        player: "Lamine Yamal #19",
        category: "star",
        nation: "Spain",
        price: CONFIG.UNIFORM_PRICE,
        mrp: CONFIG.MRP_PRICE,
        frontImg: "ZYRO_Wear_Studio_Imgs/Spain_Home_Lamine_Yamal_19_front.png",
        backImg: "ZYRO_Wear_Studio_Imgs/Spain_Home_Lamine_Yamal_19_Back.png",
        description: "Official La Roja Red & Yellow Home Jersey featuring wonderkid Lamine Yamal #19. Champion quality fabric."
    }
];

// 3. Customer Reviews Screenshots mapped from Reviews/ directory
const REVIEW_IMAGES = [
    "Reviews/review 1.png",
    "Reviews/review 2.png",
    "Reviews/review 3.png",
    "Reviews/review 4.png"
];

// 4. Cart State
let cart = [];
let activeFilter = "all";
let searchQuery = "";

// 5. DOM Element References
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    renderProducts();
    renderReviews();
    setupEventListeners();
    updateCartUI();
    initHeroSlideshow();
}

// Automatic Hero Featured Jersey Slideshow
let currentHeroIndex = 0;

function initHeroSlideshow() {
    const imgEl = document.getElementById("heroFeaturedImg");
    const tagTitleEl = document.getElementById("heroTagTitle");
    const tagPriceEl = document.getElementById("heroTagPrice");
    const tagEl = document.getElementById("heroProductTag");
    const wrapperEl = document.getElementById("heroFeaturedWrapper");

    if (!imgEl || !tagTitleEl || PRODUCTS.length === 0) return;

    if (wrapperEl) {
        wrapperEl.addEventListener("click", () => {
            const currentProduct = PRODUCTS[currentHeroIndex];
            if (currentProduct) openProductModal(currentProduct.id);
        });
    }

    setInterval(() => {
        imgEl.classList.add("fade-out");
        if (tagEl) tagEl.classList.add("fade-out");

        setTimeout(() => {
            currentHeroIndex = (currentHeroIndex + 1) % PRODUCTS.length;
            const nextProduct = PRODUCTS[currentHeroIndex];

            if (nextProduct) {
                imgEl.src = nextProduct.frontImg;
                imgEl.alt = nextProduct.name;
                tagTitleEl.textContent = nextProduct.name;
                if (tagPriceEl) {
                    tagPriceEl.innerHTML = `₹${nextProduct.price} <s class="old-price">₹${nextProduct.mrp}</s>`;
                }
            }

            imgEl.classList.remove("fade-out");
            if (tagEl) tagEl.classList.remove("fade-out");
        }, 400);
    }, 3200);
}

// 6. Product Grid Renderer
function renderProducts() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    const filtered = PRODUCTS.filter(product => {
        const matchesCategory = (activeFilter === "all") || 
                                (activeFilter === "star" && product.category === "star") ||
                                (activeFilter === "national" && product.category === "national");
        
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
                              product.name.toLowerCase().includes(q) ||
                              product.team.toLowerCase().includes(q) ||
                              product.player.toLowerCase().includes(q);

        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
                <i class="fa-solid fa-shirt" style="font-size: 3rem; color: #4B5563; margin-bottom: 1rem;"></i>
                <h3 style="color: #FFF; font-size: 1.3rem;">No jerseys found</h3>
                <p style="color: #9CA3AF;">Try searching for a different country or player name (e.g. Messi, Ronaldo, Mbappé).</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="card-badge-container">
                <span class="offer-badge">57% OFF</span>
            </div>

            <!-- Front/Back Hover Image Container -->
            <div class="card-image-wrapper" onclick="openProductModal('${product.id}')">
                <img src="${product.frontImg}" alt="${product.name} Front" class="card-img-front" loading="lazy">
                <img src="${product.backImg}" alt="${product.name} Back" class="card-img-back" loading="lazy">
                <button class="quick-view-btn" aria-label="Quick View"><i class="fa-solid fa-eye"></i></button>
            </div>

            <div class="card-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price-row">
                    <span class="current-price">₹${product.price}</span>
                    <span class="mrp-price">₹${product.mrp}</span>
                </div>

                <!-- Size Selection Pills & Add to Cart -->
                <div class="size-action-wrapper">
                    <div class="size-selector" data-product-id="${product.id}">
                        <span class="size-pill" onclick="selectCardSize(event, '${product.id}', 'M')">M</span>
                        <span class="size-pill active" onclick="selectCardSize(event, '${product.id}', 'L')">L</span>
                        <span class="size-pill" onclick="selectCardSize(event, '${product.id}', 'XL')">XL</span>
                        <span class="size-pill" onclick="selectCardSize(event, '${product.id}', 'XXL')">XXL</span>
                    </div>
                    <button class="btn-card-cart" onclick="event.stopPropagation(); addToCart('${product.id}', getSelectedSize('${product.id}'))">
                        <i class="fa-solid fa-bag-shopping"></i> ADD TO CART
                    </button>
                </div>

                <button class="btn-card-wa" onclick="orderProductWhatsApp('${product.id}')">
                    <i class="fa-brands fa-whatsapp"></i> ORDER ON WHATSAPP
                </button>
            </div>
        </div>
    `).join("");
}

// 7. Size Selection Logic
const selectedCardSizes = {};

function selectCardSize(event, productId, size) {
    event.stopPropagation();
    selectedCardSizes[productId] = size;
    
    // Update active pill UI
    const container = event.target.closest(".size-selector");
    if (container) {
        container.querySelectorAll(".size-pill").forEach(pill => pill.classList.remove("active"));
        event.target.classList.add("active");
    }
}

function getSelectedSize(productId) {
    return selectedCardSizes[productId] || "L";
}

// 8. Direct WhatsApp Order Generator
function orderProductWhatsApp(productId, sizeOverride = null) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const size = sizeOverride || getSelectedSize(productId);
    const message = `Hi ZYRO Wear! 👋 I want to order:\n- ${product.name}\n- Size: ${size}\n- Price: ₹${product.price}\n\nPlease confirm availability and payment details!`;
    
    const waUrl = `https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
}

// 9. Shopping Cart Management
function addToCart(productId, selectedSize = "L") {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.id === productId && item.size === selectedSize);
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            frontImg: product.frontImg,
            size: selectedSize,
            qty: 1
        });
    }

    updateCartUI();
    openCartDrawer();
}

function updateCartQty(index, change) {
    if (cart[index]) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
    }
    updateCartUI();
}

function removeCartItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById("cartBadge");
    const container = document.getElementById("cartItemsContainer");
    const subtotalEl = document.getElementById("cartSubtotal");
    const totalEl = document.getElementById("cartTotal");

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (badge) badge.textContent = totalQty;
    if (subtotalEl) subtotalEl.textContent = `₹${totalAmount}`;
    if (totalEl) totalEl.textContent = `₹${totalAmount}`;

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: #9CA3AF;">
                <i class="fa-solid fa-bag-shopping" style="font-size: 3rem; margin-bottom: 1rem; color: #4B5563;"></i>
                <p style="font-size: 1rem; color: #FFF; font-weight: 700;">Your cart is empty</p>
                <p style="font-size: 0.85rem; margin-top: 0.4rem;">Browse our collection and add your favorite jerseys!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <img src="${item.frontImg}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-meta">Size: <strong>${item.size}</strong></div>
                <div class="cart-item-price">₹${item.price}</div>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="updateCartQty(${i}, -1)"><i class="fa-solid fa-minus"></i></button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn" onclick="updateCartQty(${i}, 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
            <button class="remove-item-btn" onclick="removeCartItem(${i})" aria-label="Remove item">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join("");
}

// 10. WhatsApp Cart Checkout Dispatcher
function dispatchCartWhatsAppCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty! Add a jersey first.");
        return;
    }

    let itemsText = cart.map(item => `- ${item.name} (Size: ${item.size}, Qty: ${item.qty}) = ₹${item.price * item.qty}`).join("\n");
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const message = `Hi ZYRO Wear! 👋 I would like to place an order for the following jerseys:\n\n${itemsText}\n\nTotal Order Amount: ₹${totalAmount}\nFree Shipping Included ⚡\n\nPlease send payment details to confirm!`;

    const waUrl = `https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
}

// 11. Customer Reviews Infinite Slider Renderer
function renderReviews() {
    const track = document.getElementById("reviewsTrack");
    if (!track) return;

    // Double the array for seamless infinite looping animation
    const doubledReviews = [...REVIEW_IMAGES, ...REVIEW_IMAGES];

    track.innerHTML = doubledReviews.map((imgSrc, idx) => `
        <div class="review-card" onclick="openLightbox('${imgSrc}')">
            <div class="review-card-frame">
                <img src="${imgSrc}" alt="Verified Customer Review ${idx + 1}" class="review-img" loading="lazy">
            </div>
            <div class="review-card-footer">
                <span><i class="fa-solid fa-circle-check"></i> VERIFIED CUSTOMER</span>
                <i class="fa-solid fa-magnifying-glass-plus"></i>
            </div>
        </div>
    `).join("");
}

// 12. Product Detail Modal Handler
let activeModalSize = "L";

function openProductModal(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    activeModalSize = getSelectedSize(productId);

    const modal = document.getElementById("productModal");
    const backdrop = document.getElementById("modalBackdrop");
    const content = document.getElementById("productModalContent");

    content.innerHTML = `
        <button class="modal-close-btn" onclick="closeProductModal()"><i class="fa-solid fa-xmark"></i></button>

        <div class="modal-gallery">
            <img src="${product.frontImg}" alt="${product.name}" id="modalMainImg" class="modal-main-img">
            <div class="gallery-thumbs">
                <div class="thumb-btn active" onclick="switchModalImg(this, '${product.frontImg}')">
                    <img src="${product.frontImg}" alt="Front View">
                </div>
                <div class="thumb-btn" onclick="switchModalImg(this, '${product.backImg}')">
                    <img src="${product.backImg}" alt="Back View">
                </div>
            </div>
        </div>

        <div class="modal-info">
            <h2 class="modal-title">${product.name}</h2>
            <div class="modal-price">₹${product.price} <s class="old-price">₹${product.mrp}</s></div>
            <p class="modal-desc">${product.description}</p>

            <div class="modal-size-title">SELECT SIZE:</div>
            <div class="size-selector mb-4">
                <span class="size-pill ${activeModalSize === 'M' ? 'active' : ''}" onclick="setModalSize(this, 'M')">M</span>
                <span class="size-pill ${activeModalSize === 'L' ? 'active' : ''}" onclick="setModalSize(this, 'L')">L</span>
                <span class="size-pill ${activeModalSize === 'XL' ? 'active' : ''}" onclick="setModalSize(this, 'XL')">XL</span>
                <span class="size-pill ${activeModalSize === 'XXL' ? 'active' : ''}" onclick="setModalSize(this, 'XXL')">XXL</span>
            </div>

            <div class="modal-actions">
                <button class="btn-add-cart" onclick="addToCart('${product.id}', activeModalSize); closeProductModal();">
                    <i class="fa-solid fa-bag-shopping"></i> ADD TO CART
                </button>
                <button class="btn-gold" onclick="orderProductWhatsApp('${product.id}', activeModalSize); closeProductModal();">
                    <i class="fa-brands fa-whatsapp"></i> ORDER ON WHATSAPP
                </button>
            </div>
        </div>
    `;

    modal.classList.add("active");
    backdrop.classList.add("active");
}

function switchModalImg(thumbElement, imgSrc) {
    document.querySelectorAll(".thumb-btn").forEach(t => t.classList.remove("active"));
    thumbElement.classList.add("active");
    document.getElementById("modalMainImg").src = imgSrc;
}

function setModalSize(pillElement, size) {
    pillElement.parentElement.querySelectorAll(".size-pill").forEach(p => p.classList.remove("active"));
    pillElement.classList.add("active");
    activeModalSize = size;
}

function closeProductModal() {
    document.getElementById("productModal").classList.remove("active");
    document.getElementById("modalBackdrop").classList.remove("active");
}

// 13. Lightbox Handler for Customer Reviews
function openLightbox(imgSrc) {
    const lightbox = document.getElementById("imageLightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    lightboxImg.src = imgSrc;
    lightbox.classList.add("active");
}

function closeLightbox() {
    document.getElementById("imageLightbox").classList.remove("active");
}

// 14. Global Event Listeners (Drawer, Search, Filter Tabs)
function setupEventListeners() {
    // Cart Drawer Controls
    const cartBtn = document.getElementById("cartToggleBtn");
    const closeCartBtn = document.getElementById("closeCartBtn");
    const cartBackdrop = document.getElementById("cartBackdrop");
    const checkoutBtn = document.getElementById("whatsappCheckoutBtn");

    if (cartBtn) cartBtn.addEventListener("click", openCartDrawer);
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartDrawer);
    if (cartBackdrop) cartBackdrop.addEventListener("click", closeCartDrawer);
    if (checkoutBtn) checkoutBtn.addEventListener("click", dispatchCartWhatsAppCheckout);

    // Mobile Navigation Controls
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const closeMobileNavBtn = document.getElementById("closeMobileNavBtn");
    const navBackdrop = document.getElementById("navBackdrop");

    if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openMobileNav);
    if (closeMobileNavBtn) closeMobileNavBtn.addEventListener("click", closeMobileNav);
    if (navBackdrop) navBackdrop.addEventListener("click", closeMobileNav);

    // Search Toggle Controls
    const searchToggleBtn = document.getElementById("searchToggleBtn");
    const closeSearchBtn = document.getElementById("closeSearchBtn");
    const searchOverlay = document.getElementById("searchOverlay");
    const globalSearchInput = document.getElementById("globalSearchInput");
    const catalogSearchInput = document.getElementById("catalogSearchInput");

    if (searchToggleBtn) {
        searchToggleBtn.addEventListener("click", () => {
            searchOverlay.classList.toggle("active");
            if (searchOverlay.classList.contains("active")) {
                globalSearchInput.focus();
            }
        });
    }
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener("click", () => {
            searchOverlay.classList.remove("active");
        });
    }

    if (globalSearchInput) {
        globalSearchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            if (catalogSearchInput) catalogSearchInput.value = searchQuery;
            renderProducts();
            document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
        });
    }

    if (catalogSearchInput) {
        catalogSearchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    // Category Filter Tabs
    const filterTabs = document.getElementById("filterTabs");
    if (filterTabs) {
        filterTabs.addEventListener("click", (e) => {
            if (e.target.classList.contains("tab-btn")) {
                filterTabs.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
                e.target.classList.add("active");
                activeFilter = e.target.getAttribute("data-filter");
                renderProducts();
            }
        });
    }

    // Lightbox Close Control
    const lightboxCloseBtn = document.getElementById("lightboxCloseBtn");
    const lightbox = document.getElementById("imageLightbox");
    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener("click", closeLightbox);
    if (lightbox) {
        lightbox.addEventListener("click", (e) => {
            if (e.target === lightbox) closeLightbox();
        });
    }

    // Backdrop Click for Modals
    const modalBackdrop = document.getElementById("modalBackdrop");
    if (modalBackdrop) modalBackdrop.addEventListener("click", closeProductModal);
}

function openCartDrawer() {
    document.getElementById("cartDrawer").classList.add("active");
    document.getElementById("cartBackdrop").classList.add("active");
}

function closeCartDrawer() {
    document.getElementById("cartDrawer").classList.remove("active");
    document.getElementById("cartBackdrop").classList.remove("active");
}

function openMobileNav() {
    document.getElementById("mobileNavDrawer").classList.add("active");
    document.getElementById("navBackdrop").classList.add("active");
}

function closeMobileNav() {
    document.getElementById("mobileNavDrawer").classList.remove("active");
    document.getElementById("navBackdrop").classList.remove("active");
}
