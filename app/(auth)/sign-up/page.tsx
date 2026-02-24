import { Suspense } from 'react'
import SignUpForm from './sign-up-form'

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <div className="text-zinc-500">Loading...</div>
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  )
}
