import { useState } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/vite.svg'

export function LandingPage() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-secondary to-accent/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header avec les logos */}
        <div className='flex w-full justify-center gap-8 md:gap-20 mb-16 animate-fade-in'>
          <a 
            href="https://vite.dev" 
            target="_blank"
            className="group transition-all duration-300 hover:scale-110"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-chart-1/20 blur-2xl rounded-full group-hover:bg-chart-1/40 transition-all duration-300"></div>
              <img 
                src={viteLogo} 
                className="relative w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl" 
                alt="Vite logo"
              />
            </div>
          </a>
          <a 
            href="https://react.dev" 
            target="_blank"
            className="group transition-all duration-300 hover:scale-110"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-chart-2/20 blur-2xl rounded-full group-hover:bg-chart-2/40 transition-all duration-300"></div>
              <img 
                src={reactLogo} 
                className="relative w-24 h-24 md:w-32 md:h-32 drop-shadow-2xl animate-spin [animation-duration:20s]" 
                alt="React logo" 
              />
            </div>
          </a>
        </div>

        {/* Titre principal avec gradient */}
        <h1 className='text-5xl md:text-7xl font-bold text-center mb-8 bg-linear-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent animate-fade-in'>
          Vite + React
        </h1>

        <p className='text-center text-muted-foreground text-lg md:text-xl mb-12 animate-fade-in [animation-delay:200ms]'>
          Démo de Tailwind CSS v4 avec thème personnalisé
        </p>

        {/* Card avec le compteur */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm animate-fade-in [animation-delay:400ms]">
            <div className="flex flex-col items-center gap-8">
              {/* Compteur stylisé */}
              <div className="relative group">
                <div className="absolute inset-0 bg-linear-to-r from-chart-1 via-chart-3 to-chart-4 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <button 
                  onClick={() => setCount((count) => count + 1)} 
                  className='relative bg-primary text-primary-foreground font-bold text-2xl px-12 py-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200 hover:bg-primary/90'
                >
                  <span className="flex items-center gap-3">
                    <span className="text-4xl">🎯</span>
                    <span>count is {count}</span>
                  </span>
                </button>
              </div>

              <p className='text-muted-foreground text-center'>
                Edit <code className='bg-muted px-3 py-1 rounded-lg text-accent-foreground font-mono text-sm'>src/App.tsx</code> and save to test HMR
              </p>
            </div>
          </div>
        </div>

        {/* Grille de features avec les couleurs du thème */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-6xl mx-auto animate-fade-in [animation-delay:600ms]">
          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-chart-1 rounded-xl flex items-center justify-center mb-4 text-2xl">
              ⚡
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Vite rapide</h3>
            <p className="text-muted-foreground">HMR instantané et build ultra-rapide</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-chart-2 rounded-xl flex items-center justify-center mb-4 text-2xl">
              🎨
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Tailwind v4</h3>
            <p className="text-muted-foreground">Thème personnalisé avec variables CSS</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-chart-3 rounded-xl flex items-center justify-center mb-4 text-2xl">
              ⚛️
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">React 19</h3>
            <p className="text-muted-foreground">Les dernières fonctionnalités React</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground mt-16 text-sm animate-fade-in [animation-delay:800ms]">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </div>
  )
}