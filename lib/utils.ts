import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateLotteryNumbers(): number[] {
  const numbers: number[] = []
  while (numbers.length < 5) {
    const n = Math.floor(Math.random() * 49) + 1
    if (!numbers.includes(n)) numbers.push(n)
  }
  return numbers.sort((a, b) => a - b)
}

export function countMatches(userNumbers: number[], drawnNumbers: number[]): number {
  return userNumbers.filter(n => drawnNumbers.includes(n)).length
}

export function getMatchType(matches: number): string {
  if (matches === 5) return 'Jackpot (5 Match)'
  if (matches === 4) return '4 Match'
  if (matches === 3) return '3 Match'
  return 'No Match'
}

export function getPrizeDistribution(prizePool: number, rollover: number = 0) {
  const total = prizePool + rollover
  return {
    jackpot: total * 0.40,
    fourMatch: total * 0.35,
    threeMatch: total * 0.25,
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
    trialing: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    running: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    verified: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    proof_uploaded: 'bg-purple-100 text-purple-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
