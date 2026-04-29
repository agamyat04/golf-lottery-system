import { NextResponse, type NextRequest } from 'next/server'

// Minimal middleware — auth handled in layouts
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
