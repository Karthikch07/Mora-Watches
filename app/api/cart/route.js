import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

const products = {
  "atlas-chrono": { name: "Atlas Chronograph", finish: "Brushed steel", priceInr: 3400 },
  "nocturne-dress": { name: "Nocturne Dress", finish: "Black leather", priceInr: 2700 },
  "auric-automatic": { name: "Auric Automatic", finish: "Warm gold", priceInr: 4600 },
  "field-green": { name: "Field Meridian", finish: "Olive canvas", priceInr: 2050 },
  "ceramic-diver": { name: "Ceramic Diver", finish: "Black ceramic", priceInr: 3800 },
  "rose-mesh": { name: "Rose Mesh", finish: "Rose gold mesh", priceInr: 2950 },
  "blush-chain": { name: "Rose Pink", finish: "Pink chain strap", priceInr: 3150 },
  "azure-chain": { name: "Blue Leather", finish: "Blue leather", priceInr: 3250 },
};

const PLATFORM_FEE_INR = 23;

function formatIndiaTimestamp(date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function cleanCart(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([productId, quantity]) => products[productId] && Number.isInteger(quantity))
      .map(([productId, quantity]) => [productId, Math.max(0, Math.min(quantity, 99))])
      .filter(([, quantity]) => quantity > 0),
  );
}

function createCartDocument(sessionId, cart, now) {
  const items = Object.entries(cart).map(([productId, quantity]) => {
    const product = products[productId];
    return {
      productId,
      productName: product.name,
      finish: product.finish,
      unitPriceInr: product.priceInr,
      quantity,
      lineTotalInr: product.priceInr * quantity,
    };
  });
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalInr = items.reduce((sum, item) => sum + item.lineTotalInr, 0);

  return {
    cartReference: `MORA-${sessionId.slice(0, 8).toUpperCase()}`,
    sessionId,
    store: "MORA Watches",
    cartStatus: items.length ? "active" : "empty",
    currency: "INR",
    currencySymbol: "₹",
    timezone: "Asia/Kolkata",
    items,
    totals: {
      itemCount,
      subtotalInr,
      shippingInr: 0,
      platformFeeInr: PLATFORM_FEE_INR,
      pricesIncludeGst: true,
      grandTotalInr: subtotalInr + PLATFORM_FEE_INR,
    },
    updatedAt: formatIndiaTimestamp(now),
  };
}

function getSessionId(request, body = {}) {
  return body.sessionId || new URL(request.url).searchParams.get("sessionId");
}

export async function GET(request) {
  const sessionId = getSessionId(request);

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  if (!clientPromise) {
    return NextResponse.json({ error: "MONGODB_URI is not configured" }, { status: 503 });
  }

  try {
    const client = await clientPromise;
    const carts = client.db("mora_store").collection("carts");
    const cartDocument =
      (await carts.findOne(
        { sessionId },
        { projection: { _id: 0, items: 1, cart: 1 } },
      )) ||
      (await carts.findOne(
        { _id: sessionId },
        { projection: { _id: 0, items: 1, cart: 1 } },
      ));
    const savedCart = cartDocument?.items
      ? Object.fromEntries(cartDocument.items.map((item) => [item.productId, item.quantity]))
      : cleanCart(cartDocument?.cart);
    const hasOldPrices = cartDocument?.items?.some(
      (item) => products[item.productId]?.priceInr !== item.unitPriceInr,
    );
    if (cartDocument?.cart || hasOldPrices) {
      const now = new Date();
      await carts.updateOne(
        { sessionId },
        {
          $set: createCartDocument(sessionId, savedCart, now),
          $setOnInsert: { createdAt: formatIndiaTimestamp(now) },
          $unset: { createdAtIndia: "" },
        },
        { upsert: true },
      );
    }
    const cart = Object.fromEntries(
      Object.entries(savedCart),
    );

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("MongoDB cart read failed", error);
    return NextResponse.json({ error: "Cart storage is unavailable" }, { status: 503 });
  }
}

export async function PUT(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = getSessionId(request, body);
  const cart = cleanCart(body.cart);

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  if (!clientPromise) {
    return NextResponse.json({ error: "MONGODB_URI is not configured" }, { status: 503 });
  }

  try {
    const client = await clientPromise;
    const now = new Date();
    const cartDocument = createCartDocument(sessionId, cart, now);
    await client.db("mora_store").collection("carts").updateOne(
      { sessionId },
      {
        $set: cartDocument,
        $setOnInsert: { createdAt: formatIndiaTimestamp(now) },
        $unset: { createdAtIndia: "" },
      },
      { upsert: true },
    );

    return NextResponse.json({ cart });
  } catch (error) {
    console.error("MongoDB cart write failed", error);
    return NextResponse.json({ error: "Cart storage is unavailable" }, { status: 503 });
  }
}
