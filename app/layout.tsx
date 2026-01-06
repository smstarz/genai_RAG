import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Gemini RAG Chat',
    description: 'AI Chat powered by Gemini File Search',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ko" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {children}
            </body>
        </html>
    )
}
