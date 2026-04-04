// src/proxy.ts
// Next.js 16: uses proxy.ts (not middleware.ts). Export function named `proxy`.
// Clerk v7 works with Node.js runtime (no edge runtime in proxy.ts).
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
])

export const proxy = clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
