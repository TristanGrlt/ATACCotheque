import { useNavigate } from 'react-router-dom';
import { useState } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/vite.svg'
import { Atom, FlaskConical, Info, LayoutGrid, Library, Moon, Plus, Search, Sigma, Sun, Target, Terminal } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-28 font-sans text-gray-900 selection:bg-blue-200">
      

      <div className="text-center mb-8 pt-10 px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight leading-tight">
          Vos annales <span className="text-blue-600">partout !</span>
        </h1>
        <p className="text-base text-gray-500 mb-8 max-w-xl mx-auto">
          La plateforme collaborative de l'ATACC. <br className="sm:hidden"/>Annales et corrigés gratuits.
        </p>
      </div>

      {/* --- Barre de recherche --- */}
      <div className="w-full max-w-xl mx-auto px-4 mt-2 relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400 w-5 h-5" />
          </div>
          <input 
            type="text"
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base placeholder:text-gray-400 transition-all shadow-sm"
            placeholder="Chercher un cours..."
          />
        </div>
      </div>

      {/* --- Grille des Matières --- */}
      <div className="max-w-xl mx-auto px-4 mt-10">
        <h2 className="text-lg font-bold mb-4 text-gray-900">Matières</h2>
        
        {/* Grille : 2 colonnes sur téléphone, 4 sur tablette/PC */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Informatique */}
          <div className="bg-white border border-gray-200 p-4 rounded-2xl cursor-pointer text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-blue-50 text-blue-500">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Info</h3>
            <p className="text-xs text-gray-500">128 fichiers</p>
          </div>

          {/* Mathématiques */}
          <div className="bg-white border border-gray-200 p-4 rounded-2xl cursor-pointer text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-amber-50 text-amber-500">
              <Sigma className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Maths</h3>
            <p className="text-xs text-gray-500">84 fichiers</p>
          </div>

          {/* Physique */}
          <div className="bg-white border border-gray-200 p-4 rounded-2xl cursor-pointer text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-rose-50 text-rose-500">
              <Atom className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Physique</h3>
            <p className="text-xs text-gray-500">65 fichiers</p>
          </div>

          {/* Chimie */}
          <div className="bg-white border border-gray-200 p-4 rounded-2xl cursor-pointer text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-emerald-50 text-emerald-500">
              <FlaskConical className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Chimie</h3>
            <p className="text-xs text-gray-500">42 fichiers</p>
          </div>

        </div>
      </div>


      <nav className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 rounded-2xl p-2 flex justify-around sm:gap-2 items-center bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl">
        
        {/* Bouton Accueil - État Actif */}
        <button onClick={() => navigate('/')} className="flex-1 sm:flex-none h-12 rounded-xl sm:w-12 sm:rounded-full flex items-center justify-center transition-all bg-blue-600 text-white shadow-md">
          <LayoutGrid className="w-6 h-6" />
        </button>
        
        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>
        
        {/* Bouton Bibliothèque - État Inactif */}
        <button onClick={() => navigate('/search')} className ="flex-1 sm:flex-none h-12 sm:w-12 rounded-xl sm:rounded-full flex items-center justify-center transition-all text-gray-400 hover:bg-gray-100 hover:text-gray-900">
          <Library className="w-6 h-6" />
        </button>
        
        {/* Bouton Manquants - État Inactif */}
        <button className="flex-1 sm:flex-none h-12 sm:w-12 rounded-xl sm:rounded-full flex items-center justify-center transition-all text-gray-400 hover:bg-gray-100 hover:text-gray-900">
          <Target className="w-6 h-6" />
        </button>
        
        {/* Bouton Upload - État Inactif */}
        <button onClick={() => navigate('/upload')} className="flex-1 sm:flex-none h-12 sm:w-12 rounded-xl sm:rounded-full flex items-center justify-center transition-all text-gray-400 hover:bg-gray-100 hover:text-gray-900">
          <Plus className="w-6 h-6" />
        </button>

      </nav>
    </div>
    </>
  )
}