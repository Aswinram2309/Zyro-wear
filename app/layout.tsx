import type { Metadata } from 'next';
import '@/styles.css';

export const metadata: Metadata = {
  title: 'ZYRO WEAR — Wear Your Energy | Premium Football Jerseys & Streetwear',
  description:
    'Shop official premium international football jerseys at ZYRO Wear. High quality, comfortable fit, bold designs. Only ₹299.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link rel="icon" type="image/jpeg" href="/Logo/Zyro wears logo.jpeg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
