import './globals.css'

export const metadata = {
  title: 'PHIS v5 — Adam Waldman',
  description: 'Personal History & Interview System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
