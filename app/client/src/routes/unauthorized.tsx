import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <ShieldAlert className="w-24 h-24 mb-8 text-destructive animate-pulse" />
      <h1 className="text-4xl font-bold mb-4 text-center">403 - Accès refusé</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="hover:scale-105 transition-transform duration-300"
        >
          Retour
        </Button>
        <Button 
          asChild 
          className="hover:scale-105 transition-transform duration-300"
        >
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  )
}
