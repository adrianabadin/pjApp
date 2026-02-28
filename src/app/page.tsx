import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "#020238" }}
    >
      {/* Diagonal stripe texture — right side */}
      <div
        className="fixed top-0 right-0 w-1/2 h-full pointer-events-none z-0"
        style={{
          opacity: 0.04,
          background:
            "repeating-linear-gradient(-55deg, #FFD331 0px, #FFD331 1px, transparent 1px, transparent 28px)",
        }}
      />

      {/* Header */}
      <header
        className="relative z-20 px-5 sm:px-8 h-20 flex items-center justify-between border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <Image
          src="/logo.svg"
          alt="Partido Justicialista Saladillo"
          width={140}
          height={44}
          className="h-10 w-auto"
          priority
        />
        <Link
          href="/login"
          className="text-sm font-semibold px-5 py-2 rounded-full transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#FFD331", color: "#020238" }}
        >
          Ingresar
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex overflow-hidden">
        {/* Mobile: img3 as blurred background */}
        <div className="absolute inset-0 lg:hidden">
          <Image
            src="/img3.jpg"
            alt=""
            fill
            className="object-cover object-top"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, #020238 35%, rgba(2,2,56,0.45) 100%)",
            }}
          />
        </div>

        {/* ── Left: Content ── */}
        <div className="relative z-10 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16 w-full lg:w-[48%]">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-px" style={{ backgroundColor: "#FFD331" }} />
            <span
              className="text-[10px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: "#00B7E2" }}
            >
              Buenos Aires · Argentina
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-bold leading-[0.9] tracking-tight text-white mb-4">
            <span className="block text-6xl sm:text-7xl">Partido</span>
            <span
              className="block text-6xl sm:text-7xl"
              style={{ color: "#FFD331" }}
            >
              Justi&shy;cialista
            </span>
            <span
              className="block text-3xl sm:text-4xl mt-2 font-light tracking-widest"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Saladillo
            </span>
          </h1>

          {/* Divider */}
          <div
            className="w-full max-w-xs h-px my-7"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          />

          {/* <p
            className="text-sm leading-relaxed mb-10 max-w-xs"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Sistema de gestión y registro del padrón de afiliados del distrito
            Saladillo.
          </p> */}

          <Link
            href="/login"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full font-bold text-sm w-fit transition-opacity hover:opacity-85"
            style={{ backgroundColor: "#FFD331", color: "#020238" }}
          >
            Acceder al sistema
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>

          {/* Polaroid photos */}
          <div className="mt-14 hidden sm:flex items-end gap-4">
            {/* img1 — Perón y Evita */}
            <div
              className="relative flex-shrink-0"
              style={{ transform: "rotate(-3deg)" }}
            >
              <div className="p-2 pb-7 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="relative w-36 h-32 overflow-hidden">
                  <Image
                    src="/img1.jpg"
                    alt="Perón y Evita"
                    fill
                    className="object-cover grayscale contrast-110"
                  />
                </div>
              </div>
              <p className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-gray-400 font-medium tracking-wide">
                1952
              </p>
            </div>

            {/* img2 — Kicillof */}
            <div
              className="relative flex-shrink-0"
              style={{ transform: "rotate(2deg)" }}
            >
              <div className="p-2 pb-7 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <div className="relative w-36 h-32 overflow-hidden">
                  <Image
                    src="/img2.jpg"
                    alt="Axel Kicillof"
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>
              <p className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-gray-400 font-medium tracking-wide">
                2003–2015
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: HERO IMAGE 3 (lg+) ── */}
        <div className="hidden lg:block flex-1 relative">
          {/* Fade left */}
          <div
            className="absolute inset-y-0 left-0 w-40 z-10"
            style={{
              background: "linear-gradient(to right, #020238, transparent)",
            }}
          />
          {/* Fade bottom */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 z-10"
            style={{
              background: "linear-gradient(to top, #020238, transparent)",
            }}
          />

          <Image
            src="/img3.jpg"
            alt="Cristina Fernández de Kirchner y Néstor Kirchner"
            fill
            className="object-cover object-center"
            priority
          />

          {/* "El Futuro" label */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
            <p
              className="text-4xl font-bold italic tracking-tight"
              style={{
                color: "#FFD331",
                textShadow: "0 2px 24px rgba(0,0,0,0.8)",
              }}
            >
              El Futuro
            </p>
          </div>

          {/* Boleta electoral — menor jerarquía */}
          <div
            className="absolute bottom-6 right-6 z-20"
            style={{ transform: "rotate(1.5deg)" }}
          >
            <div
              className="shadow-[0_8px_40px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden"
              style={{ width: 250 }}
            >
              <Image
                src="/img4.jpg"
                alt="Boleta Peronismo Derecho al Futuro"
                width={250}
                height={353}
                className="object-cover block"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-20 px-6 py-4 flex items-center justify-between border-t"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.25)",
        }}
      >
        <p className="text-xs">
          Partido Justicialista — Saladillo, Buenos Aires
        </p>
        <p className="text-xs" style={{ color: "#FFD331", opacity: 0.4 }}>
          2583 afiliados
        </p>
      </footer>
    </div>
  );
}
