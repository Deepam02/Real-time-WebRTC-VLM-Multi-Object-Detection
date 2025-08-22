import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WebRTC Camera Stream',
  description: 'Stream camera from phone to laptop using WebRTC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  )
}
