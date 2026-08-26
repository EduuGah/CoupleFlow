import { NavLink, Outlet } from 'react-router-dom';
import { Home, ListTodo, User, Dices } from 'lucide-react';
import { motion } from 'motion/react';

export function Layout() {
  const navItems = [
    { to: '/', icon: <Home size={24} />, label: 'Início' },
    { to: '/plans', icon: <ListTodo size={24} />, label: 'Planos' },
    { to: '/random', icon: <Dices size={24} />, label: 'Sorteio' },
    { to: '/profile', icon: <User size={24} />, label: 'Nós' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans pb-20 md:pb-0 md:pl-64 flex flex-col">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 left-0 h-screen border-r border-stone-200 bg-white/50 backdrop-blur-md px-4 py-8">
        <div className="mb-10 px-4">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">CoupleFlow</h1>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-orange-100/50 text-orange-700 font-medium' 
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 md:pt-12">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t border-stone-200 pb-safe z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 h-full relative ${
                  isActive ? 'text-orange-600' : 'text-stone-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute top-0 w-8 h-1 bg-orange-600 rounded-b-full"
                    />
                  )}
                  {item.icon}
                  <span className="text-[10px] font-medium mt-1">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
