"use client";

import { useEffect, useMemo, useState } from "react";

const products = [
  {
    id: "atlas-chrono",
    name: "Atlas Chronograph",
    type: "Watch",
    price: 3400,
    finish: "Brushed steel",
    detail: "Tachymeter bezel, sapphire crystal, 42 mm case",
    image: "/watches/atlas-chrono.png",
  },
  {
    id: "nocturne-dress",
    name: "Nocturne Dress",
    type: "Watch",
    price: 2700,
    finish: "Black leather",
    detail: "Slim matte dial, polished baton indices, 38 mm case",
    image: "/watches/nocturne-dress.png",
  },
  {
    id: "auric-automatic",
    name: "Auric Automatic",
    type: "Watch",
    price: 4600,
    finish: "Warm gold",
    detail: "Open caseback, exhibition rotor, 40 mm case",
    image: "/watches/auric-automatic.png",
  },
  {
    id: "field-green",
    name: "Field Meridian",
    type: "Watch",
    price: 2050,
    finish: "Olive canvas",
    detail: "Luminous numerals, screw-down crown, 39 mm case",
    image: "/watches/field-green.png",
  },
  {
    id: "ceramic-diver",
    name: "Ceramic Diver",
    type: "Watch",
    price: 3800,
    finish: "Black ceramic",
    detail: "Unidirectional bezel, 200 m rating, 41 mm case",
    image: "/watches/ceramic-diver.png",
  },
  {
    id: "rose-mesh",
    name: "Rose Mesh",
    type: "Watch",
    price: 2950,
    finish: "Rose gold mesh",
    detail: "Moonphase-inspired dial, quick-release bracelet, 36 mm case",
    image: "/watches/rose-mesh.png",
  },
  {
    id: "blush-chain",
    name: "Rose Pink",
    type: "Watch",
    price: 3150,
    finish: "Pink chain strap",
    detail: "Soft pink dial, polished case, and linked chain bracelet, 36 mm case",
    image: "/watches/rose-pink.webp",
    imageTone: "blend",
  },
  {
    id: "azure-chain",
    name: "Blue Leather",
    type: "Watch",
    price: 3250,
    finish: "Blue leather",
    detail: "Matte blue dial, bright case, and leather strap, 36 mm case",
    image: "/watches/royal-blue.webp",
    imageTone: "blend",
  },
];

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const [cart, setCart] = useState({});
  const [message, setMessage] = useState("");
  const [cartSessionId, setCartSessionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlist, setWishlist] = useState({});
  const [offersOpen, setOffersOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  const visibleProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.finish, product.detail].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [searchQuery]);

  const cartItems = useMemo(
    () =>
      products
        .map((product) => ({
          ...product,
          quantity: cart[product.id] || 0,
        }))
        .filter((product) => product.quantity > 0),
    [cart],
  );

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const platformFee = itemCount > 0 ? 23 : 0;
  const couponDiscount = couponCode.trim().toUpperCase() === "MORA10"
    ? Math.min(Math.round(subtotal * 0.1), 1500)
    : 0;
  const total = subtotal + platformFee - couponDiscount;

  function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (code === "MORA10") {
      setCouponCode(code);
      setCouponMessage("MORA10 applied: 10% off, up to ₹1,500.");
    } else {
      setCouponMessage("Enter a valid coupon code.");
    }
  }

  function toggleWishlist(productId) {
    setWishlist((current) => ({ ...current, [productId]: !current[productId] }));
  }

  useEffect(() => {
    const storedSessionId = window.localStorage.getItem("mora-cart-session");
    const sessionId = storedSessionId || crypto.randomUUID();

    if (!storedSessionId) {
      window.localStorage.setItem("mora-cart-session", sessionId);
    }

    setCartSessionId(sessionId);
    fetch(`/api/cart?sessionId=${encodeURIComponent(sessionId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.cart) {
          setCart(data.cart);
        }
      })
      .catch(() => setMessage("Cart sync is unavailable. Your local selection is still active."));
  }, []);

  function persistCart(nextCart) {
    if (!cartSessionId) {
      return;
    }

    fetch("/api/cart", {
      body: JSON.stringify({ cart: nextCart, sessionId: cartSessionId }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    }).catch(() => setMessage("Cart sync is unavailable. Your local selection is still active."));
  }

  function addToCart(productId) {
    setCart((current) => {
      const nextCart = { ...current, [productId]: (current[productId] || 0) + 1 };
      persistCart(nextCart);
      return nextCart;
    });
    setMessage("");
  }

  function updateQuantity(productId, delta) {
    setCart((current) => {
      const nextQuantity = Math.max((current[productId] || 0) + delta, 0);
      const nextCart = { ...current };

      if (nextQuantity === 0) {
        delete nextCart[productId];
      } else {
        nextCart[productId] = nextQuantity;
      }

      persistCart(nextCart);
      return nextCart;
    });
    setMessage("");
  }

  function removeItem(productId) {
    setCart((current) => {
      const nextCart = { ...current };
      delete nextCart[productId];
      persistCart(nextCart);
      return nextCart;
    });
    setMessage("");
  }

  function submitPayment() {
    if (itemCount === 0) {
      setMessage("Select a watch before submitting.");
      return;
    }

    setMessage("Payment request submitted. Your MORA selection is reserved.");
  }

  return (
    <main>
      <header className="siteHeader" aria-label="MORA navigation">
        <a className="brand" href="#top" aria-label="MORA home">
          <span className="brandMark" aria-hidden="true" />
          MORA
        </a>
        <nav className="navLinks" aria-label="Main navigation">
          <a href="#store">Store</a>
          <a href="#cart">Cart</a>
        </nav>
        <label className="searchBar">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search watches"
            aria-label="Search watches"
          />
        </label>
        <a className="cartLink" href="#cart" aria-label={`Cart with ${itemCount} items`}>
          Cart
          <span>{itemCount}</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="heroShade" />
        <div className="heroContent">
          <p className="eyebrow">Independent Swiss-inspired watchmaking</p>
          <h1>MORA</h1>
          <p className="heroCopy">
            Mechanical presence, everyday precision, and collectible finishes
            made for people who notice the seconds.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="#store">
              Shop watches
            </a>
            <a className="secondaryButton" href="#cart">
              View cart
            </a>
          </div>
          <div className="heroStats" aria-label="MORA highlights">
            <span>8 references</span>
            <span>Free insured shipping</span>
            <span>2-year service plan</span>
          </div>
        </div>
      </section>

      <section className="storeSection" id="store" aria-labelledby="store-title">
        <div className="sectionHeader">
          <p className="eyebrow">Store</p>
          <h2 id="store-title">Select your next watch</h2>
          <p className="sectionCopy">
            Every watch is shown on its own so the image sits cleanly inside the box.
          </p>
        </div>

        <div className={`productGrid ${searchQuery.trim() ? "isFiltered" : ""}`}>
          {visibleProducts.length ? visibleProducts.map((product) => (
            <article className="productCard" key={product.id}>
              <div
                className={`productImage ${product.imageTone === "blend" ? "isBlend" : ""}`}
                aria-hidden="true"
              >
                <img src={product.image} alt="" loading="lazy" />
              </div>
              <div className="productBody">
                <div>
                  <div className="productMeta">
                    <span>Watch</span>
                    <div className="productActions">
                      <strong>{formatMoney(product.price)}</strong>
                      <button
                        className={`wishlistButton ${wishlist[product.id] ? "isSaved" : ""}`}
                        type="button"
                        onClick={() => toggleWishlist(product.id)}
                        aria-label={`${wishlist[product.id] ? "Remove" : "Add"} ${product.name} ${wishlist[product.id] ? "from" : "to"} wishlist`}
                        aria-pressed={Boolean(wishlist[product.id])}
                      >
                        {wishlist[product.id] ? "♥" : "♡"}
                      </button>
                    </div>
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.detail}</p>
                </div>
                <div className="productFooter">
                  <span>{product.finish}</span>
                  {cart[product.id] ? (
                    <div className="quantityControl storeQuantity" aria-label={`${product.name} quantity`}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, -1)}
                        aria-label={`Decrease ${product.name} quantity`}
                      >
                        -
                      </button>
                      <strong>{cart[product.id]}</strong>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, 1)}
                        aria-label={`Increase ${product.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(product.id)}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <span aria-hidden="true">+</span>
                      Add
                    </button>
                  )}
                </div>
              </div>
            </article>
          )) : <p className="noResults">No watches match &quot;{searchQuery}&quot;.</p>}
        </div>
      </section>

      <section className="cartSection" id="cart" aria-labelledby="cart-title">
        <div className="cartIntro">
          <p className="eyebrow">Cart</p>
          <h2 id="cart-title">Your selection</h2>
          <p>
            Review the watches you want and submit the payment request when the
            set feels right.
          </p>
        </div>

        <div className="cartShell">
          <div className="cartItems" aria-live="polite">
            {cartItems.length === 0 ? (
              <div className="emptyCart">
                <h3>No watches selected yet</h3>
                <p>The collection is ready when you are.</p>
                <a className="secondaryButton" href="#store">
                  Browse store
                </a>
              </div>
            ) : (
              cartItems.map((item) => (
                <article className="cartItem" key={item.id}>
                  <div
                    className={`cartThumb ${item.imageTone === "blend" ? "isBlend" : ""}`}
                    aria-hidden="true"
                  >
                    <img src={item.image} alt="" loading="lazy" />
                  </div>
                  <div className="cartItemCopy">
                    <span>Watch</span>
                    <h3>{item.name}</h3>
                    <p>{formatMoney(item.price)} each</p>
                  </div>
                  <div className="quantityControl" aria-label={`${item.name} quantity`}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      -
                    </button>
                    <strong>{item.quantity}</strong>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      +
                    </button>
                  </div>
                  <strong className="lineTotal">
                    {formatMoney(item.price * item.quantity)}
                  </strong>
                  <button
                    className="removeButton"
                    type="button"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </article>
              ))
            )}
          </div>

          <aside className="summaryPanel" aria-label="Order summary">
            <div className="summaryRow">
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <div className="summaryRow">
              <span>Shipping</span>
              <strong>{itemCount > 0 ? "Included" : formatMoney(0)}</strong>
            </div>
            <div className="summaryRow">
              <span>Platform fee</span>
              <strong>{formatMoney(platformFee)}</strong>
            </div>
            <button
              className="offersToggle"
              type="button"
              onClick={() => setOffersOpen((open) => !open)}
              aria-expanded={offersOpen}
            >
              Coupons &amp; offers <span aria-hidden="true">{offersOpen ? "⌃" : "⌄"}</span>
            </button>
            {offersOpen ? (
              <div className="offersPanel">
                <div className="offerCard">
                  <strong>Flat 10% cashback up to ₹1,500</strong>
                  <span>Use coupon MORA10</span>
                </div>
                <div className="couponEntry">
                  <input
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="Enter coupon code"
                    aria-label="Coupon code"
                  />
                  <button type="button" onClick={applyCoupon}>Apply</button>
                </div>
                {couponMessage ? <p className="couponMessage">{couponMessage}</p> : null}
              </div>
            ) : null}
            {couponDiscount > 0 ? (
              <div className="summaryRow discountRow">
                <span>Coupon discount</span>
                <strong>-{formatMoney(couponDiscount)}</strong>
              </div>
            ) : null}
            <div className="summaryTotal">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </div>
            <button className="checkoutButton" type="button" onClick={submitPayment}>
              Submit payment
            </button>
            {message ? <p className="checkoutMessage">{message}</p> : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
