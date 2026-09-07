import "./globals.css";

export const metadata = {
  title: "MORA Watches",
  description: "A refined watch storefront with a landing page, store, and cart.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
