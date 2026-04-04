// src/middleware.ts
// Initialises Clerk session headers on every request.
// Route protection is handled in (app)/layout.tsx (Server Component) per Next.js 16 guidance:
// proxy/middleware is for optimistic checks only, not full auth enforcement.
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
