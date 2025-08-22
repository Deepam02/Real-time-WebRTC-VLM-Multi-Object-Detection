import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Object Detection Stream | Real-time WebRTC VLM',
  description: 'Real-time video streaming with AI-powered multi-object detection using WebRTC and Vision Language Models',
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
