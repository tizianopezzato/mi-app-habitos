import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'System Habits - Dashboard Personal',
  description: 'Dashboard personal de alto rendimiento, hábitos y estudio universitario',
  manifest: '/manifest.json',
  themeColor: '#0a0a0a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className="bg-neutral-950 text-neutral-100 antialiased selection:bg-emerald-500 selection:text-neutral-950">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registrado con éxito:', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker fallo al registrarse:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}