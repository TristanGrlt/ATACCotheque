export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <img src="/atacc_logo.png" alt="Logo ATACC" className="w-32 mb-8 animate-bounce" />
        <h1 className="text-4xl font-bold mb-4 text-center">
          Bienvenue sur le tableau de bord de l'ATACCothèque
        </h1>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-xl">
          Utilisez le menu de navigation pour accéder aux différentes sections d'administration.
        </p>
    </div>
  )
}