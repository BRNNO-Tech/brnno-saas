import { Suspense } from 'react'
import SignInForm from './sign-in-form'

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <div className="text-zinc-500">Loading...</div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}
