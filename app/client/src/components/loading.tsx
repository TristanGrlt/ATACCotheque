import { Card, CardContent, CardHeader } from "./ui/card"
import { Spinner } from "./ui/spinner"

export const Loading = () => {
  return (
      <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader>
            <div className='flex flex-col items-center pt-6'>
              <div className='bg-muted inset-0 rounded-full animate-pulse p-4 border'>
                <Spinner className='size-8' />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col items-center gap-4'>
            <h1 className='text-lg font-semibold tracking-tight text-center'>
              Chargement en cour
            </h1>
            <p className='text-sm text-muted-foreground'>
              Veuillez patienter quelques instants...
            </p>

            </div>
          </CardContent>

        </Card>
      </div>
    )
}