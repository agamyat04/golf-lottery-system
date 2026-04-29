import Link from 'next/link'
import { Check, Zap, Trophy, Heart, BarChart2, ArrowRight, Ticket} from 'lucide-react'


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">GolfDraw</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Trophy className="h-4 w-4" />
            Monthly draws with real prizes
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Golf scores meet
            <span className="text-indigo-600"> lottery draws</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Track your last 5 golf scores, participate in monthly draws, and give back to charity — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-lg">
              Start for £9.99/mo
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/login" className="text-gray-600 font-medium hover:text-gray-900 transition-colors">
              Already a member? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything you need</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart2, title: 'Score Tracking', desc: 'Track your last 5 golf scores. New scores automatically replace the oldest.' },
              { icon: Ticket, title: 'Monthly Draws', desc: 'Auto-enrolled in every monthly draw. Match 3, 4, or 5 numbers to win.' },
              { icon: Heart, title: 'Charity First', desc: 'At least 10% of your contribution goes to your chosen charity.' },
              { icon: Trophy, title: 'Real Prizes', desc: 'Jackpot, 4-match, and 3-match prizes every month. Rollovers build the pool.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Simple pricing</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { name: 'Monthly', price: '£9.99', period: '/month', desc: 'Billed monthly. Cancel anytime.' },
              { name: 'Yearly', price: '£99.99', period: '/year', desc: 'Save over 2 months. Best value.', popular: true },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl border-2 p-8 text-left ${plan.popular ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                {plan.popular && (
                  <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">BEST VALUE</span>
                )}
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {plan.price}<span className="text-base font-normal text-gray-500">{plan.period}</span>
                </div>
                <div className="font-semibold text-gray-900 mb-1">{plan.name}</div>
                <div className="text-sm text-gray-500 mb-6">{plan.desc}</div>
                {['Monthly lottery entries', 'Score tracking', 'Charity contribution', 'Winner dashboard'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                    <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    {f}
                  </div>
                ))}
                <Link
                  href="/signup"
                  className={`mt-6 block text-center py-3 rounded-lg font-semibold transition-colors ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        © 2024 GolfDraw. All rights reserved.
      </footer>
    </div>
  )
}
