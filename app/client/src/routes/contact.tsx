import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Mail, 
  Instagram, 
  ExternalLink, 
  Users, 
  Target, 
  MapPinned
} from "lucide-react";

export function Contact() {
  return (
    <div className="min-h-screen bg-animated-gradient flex flex-col items-center sm:pt-15 pt-10 px-4 sm:px-6 md:px-10 pb-32 font-sans text-foreground selection:bg-primary/20">
      
      {/* --- En-tête (Hero) --- */}
      <div className="text-center pt-8 sm:pt-12 pb-8 w-full max-w-4xl">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 mx-auto border border-primary/20">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-foreground tracking-tight">
           <span className="text-primary">À propos</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Découvrez notre association étudiante et n'hésitez pas à nous écrire pour toute question ou suggestion.
        </p>
     </div>

      <div className="w-full max-w-4xl space-y-12">


       {/*SECTION À PROPOS*/}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground px-2">Notre Association</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Carte Mission (Prend maintenant 1 seule colonne) */}
            <Card className="p-2 sm:p-4 rounded-3xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Notre Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Bienvenue sur le site de L'ATACCothèque, votre plateforme dédiée au stockage et à la consultation des annales universitaires. Notre association s'engage à collecter, organiser et rendre accessibles les anciens contrôles de fac afin de soutenir les étudiants dans leur préparation académique.
                </p>
              </CardContent>
            </Card>

            {/* Carte Emplacement (Prend maintenant 2 colonnes) */}
            <Card className="md:col-span-2 p-2 sm:p-4 rounded-3xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                  <MapPinned className="w-5 h-5 text-primary"/>
                </div>
                <CardTitle className="text-lg">Où nous trouver ?</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="w-full h-40 sm:h-56 rounded-xl overflow-hidden border border-border/50 relative">
                  <iframe 
                    title="Carte Université de Rouen"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=1.0665160417556765%2C49.38643763030652%2C1.0718160867691042%2C49.38821152867903&amp;layer=mapnik&amp;marker=49.38732444781748%2C1.0691660642623901"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 grayscale-20 contrast-90 dark:invert dark:contrast-80 dark:hue-rotate-180"
                  ></iframe>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center border border-border/30">
                  <p className="text-xs font-bold text-foreground">Salle U2.2.1</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Campus Saint Etienne du Rouvray</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </section>

        {/* SECTION CONTACT*/}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground px-2">Nous Contacter</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Adresse */}
            <Card className="p-2 sm:p-4 rounded-3xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-4 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground mb-1">Adresse</h3>
                  <p className="text-xs text-muted-foreground">Salle U2.2.1<br/>À côté de la salle d'examen</p>
                </div>
              </CardContent>
            </Card>

            {/* Email */}
            <Card className="p-2 sm:p-4 rounded-3xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-4 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground mb-1">Email</h3>
                  <a href="mailto:association.atacc@gmail.com" className="text-xs text-primary hover:underline">
                    association.atacc@gmail.com
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Réseaux sociaux */}
            <Card className="p-2 sm:p-4 rounded-3xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-4 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col gap-2 w-full mt-1">
                  <h3 className="font-bold text-sm text-foreground mb-1">Réseaux & Liens</h3>
                  <a href="https://www.instagram.com/instatacc/" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Instagram className="w-4 h-4" /> Instagram ATACC
                  </a>
                  <a href="https://universitice.univ-rouen.fr/course/view.php?id=10545" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="w-4 h-4" /> Universitice
                  </a>
                </div>
              </CardContent>
            </Card>

          </div>
        </section>

      </div>
    </div>
  );
}