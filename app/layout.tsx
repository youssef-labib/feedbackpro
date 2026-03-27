import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FeedbackPro',
  description: 'Feedback workflows for Moroccan businesses',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('feedbackpro-theme');
                  var theme = stored === 'light' || stored === 'dark'
                    ? stored
                    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.dataset.theme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  )
}
