import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#020238' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#FFD331', color: '#020238' }}>
            PJ
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">Partido Justicialista</p>
            <p className="text-xs mt-0.5" style={{ color: '#00B7E2' }}>Saladillo · Buenos Aires</p>
          </div>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
          style={{ backgroundColor: '#FFD331', color: '#020238' }}
        >
          Ingresar
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Franja decorativa */}
        <div className="w-24 h-1 rounded-full mb-8" style={{ backgroundColor: '#FFD331' }} />

        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          Padrón de Afiliados
        </h1>
        <p className="text-lg mb-2" style={{ color: '#00B7E2' }}>
          Partido Justicialista · Saladillo
        </p>
        <p className="text-sm mb-10 max-w-md" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Sistema de gestión y registro de presencia de afiliados del distrito Saladillo.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-colors w-full sm:w-auto"
            style={{ backgroundColor: '#FFD331', color: '#020238' }}
          >
            Acceder al sistema
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>

        {/* Stats decorativas */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">2583</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Afiliados</p>
          </div>
          <div className="text-center">
            <div className="w-px h-full mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#00B7E2' }}>Saladillo</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Distrito</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs border-t" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
        Partido Justicialista — Saladillo, Buenos Aires
      </footer>
    </div>
  )
}
