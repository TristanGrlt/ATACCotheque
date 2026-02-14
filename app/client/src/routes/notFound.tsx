import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <img src="/atacc_logo.png" alt="Logo ATACC" className="w-32 mb-8 animate-bounce" />
        <h1 className="text-4xl font-bold mb-4 text-center">404 - Page non trouvée</h1>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
          La page que vous recherchez n'existe pas. Retournez à la page d'accueil.
        </p>
        <Button asChild className="hover:scale-105 transition-transform duration-300">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </>
  )
}
