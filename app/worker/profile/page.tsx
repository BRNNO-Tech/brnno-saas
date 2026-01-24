import { getWorkerProfile } from '@/lib/actions/worker-auth'
import { redirect } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, Mail, Phone, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function WorkerProfilePage() {
  const worker = await getWorkerProfile()

  if (!worker) {
    redirect('/login')
  }

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={worker.avatar_url || ''} />
            <AvatarFallback>{worker.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{worker.name}</CardTitle>
            <p className="text-sm text-muted-foreground capitalize">{worker.role}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{worker.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{worker.phone || 'No phone number'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>Started {new Date(worker.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <form action={signOut}>
          <Button variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  )
}
