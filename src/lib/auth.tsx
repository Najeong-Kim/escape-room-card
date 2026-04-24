import { type ReactNode, useEffect } from 'react'
import { ClerkProvider, useAuth as useClerkAuth, useClerk, useUser } from '@clerk/react'
import { setSupabaseAccessTokenGetter } from './supabaseClient'

const clerkPublishableKey =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)
  || (import.meta.env.VITE_PUBLIC_CLERK_PUBLISHABLE_KEY as string | undefined)

type AuthSnapshot = {
  isLoaded: boolean
  isSignedIn: boolean
  userId: string | null
  userEmail: string | null
}

type AuthStore = AuthSnapshot & {
  signOut: () => Promise<void>
  openSignIn: () => void
  openUserProfile: () => void
}

let authSnapshot: AuthSnapshot = {
  isLoaded: false,
  isSignedIn: false,
  userId: null,
  userEmail: null,
}

function setAuthSnapshot(next: AuthSnapshot) {
  authSnapshot = next
}

export function isClerkEnabled() {
  return Boolean(clerkPublishableKey)
}

export async function waitForAuthReady(timeoutMs = 1500) {
  if (authSnapshot.isLoaded) return authSnapshot

  await new Promise<void>(resolve => window.setTimeout(resolve, timeoutMs))
  return authSnapshot
}

export async function getCurrentUserId() {
  const ready = await waitForAuthReady()
  return ready.userId
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  if (!clerkPublishableKey) {
    return <MissingClerkProvider>{children}</MissingClerkProvider>
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ClerkAuthSync>{children}</ClerkAuthSync>
    </ClerkProvider>
  )
}

function MissingClerkProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    setAuthSnapshot({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      userEmail: null,
    })
    setSupabaseAccessTokenGetter(null)
  }, [])

  return <>{children}</>
}

function ClerkAuthSync({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useClerkAuth()
  const { user } = useUser()

  useEffect(() => {
    setAuthSnapshot({
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      userId: userId ?? null,
      userEmail: user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null,
    })

    if (!isLoaded) {
      setSupabaseAccessTokenGetter(null)
      return
    }

    setSupabaseAccessTokenGetter(async () => {
      const token = await getToken()
      return token ?? null
    })
  }, [getToken, isLoaded, isSignedIn, user?.emailAddresses, user?.primaryEmailAddress?.emailAddress, userId])

  return <>{children}</>
}

export function useAppAuth(): AuthStore {
  if (!clerkPublishableKey) {
    return {
      ...authSnapshot,
      signOut: async () => {},
      openSignIn: () => {},
      openUserProfile: () => {},
    }
  }

  const { isLoaded, isSignedIn, userId, signOut } = useClerkAuth()
  const { user } = useUser()
  const clerk = useClerk()

  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    userId: userId ?? null,
    userEmail: user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress ?? null,
    signOut,
    openSignIn: () => clerk.openSignIn({}),
    openUserProfile: () => clerk.openUserProfile(),
  }
}
