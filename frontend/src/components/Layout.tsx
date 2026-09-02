import Navbar from './Navbar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="layout-container">
      <Navbar />
      {children}
      <style>{`
        .layout-container { min-height: 100vh; background-color: var(--secondary-color); }
      `}</style>
    </div>
  )
}
