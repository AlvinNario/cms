import "./styles/globals.css"; // Ensure correct path to your CSS file

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
