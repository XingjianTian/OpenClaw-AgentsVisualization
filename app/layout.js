import './globals.css'

export const metadata = {
  title: 'OpenClaw Office',
  description: 'OpenClaw Office Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen cyber-grid relative">
        <div className="cyber-rain" />
        <div className="pt-12">
          {children}
        </div>
      </body>
    </html>
  )
}
