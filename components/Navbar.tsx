'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const linkClasses = (href: string) =>
    `relative px-3 lg:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
    ${
      pathname === href
        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20'
        : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20'
    }`;

  return (
    <nav className='sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-600/50 shadow-lg shadow-gray-900/5 dark:shadow-black/30'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-14 sm:h-16'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link
              href='/'
              className='flex items-center gap-2 sm:gap-3 flex-shrink-0 group transition-all duration-300 hover:scale-105'
              onClick={closeMobileMenu}
            >
              <div className='w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3'>
                <span className='text-white text-xs sm:text-sm md:text-lg font-bold'>✦︎</span>
              </div>
              <span className='text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 bg-clip-text text-transparent'>
                Evalune
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className='hidden md:flex items-center space-x-1'>
            <Link href='/' className={linkClasses('/')}>
              Home
            </Link>
            <Link href='/about' className={linkClasses('/about')}>
              About
            </Link>
            <Link href='/contact' className={linkClasses('/contact')}>
              Contact
            </Link>
            <SignedIn>
              <Link href='/dashboard' className={linkClasses('/dashboard')}>
                Dashboard
              </Link>
            </SignedIn>
          </div>

          {/* Right Section */}
          <div className='flex items-center space-x-1 sm:space-x-2'>
            <div className='p-0.5 sm:p-1'>
              <ThemeToggle />
            </div>
            <div className='hidden sm:block'>
              <SignedOut>
                <SignInButton>
                  <button className='bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95'>
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className='p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-100/50 to-green-100/50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/30 dark:border-emerald-700/30'>
                  <UserButton />
                </div>
              </SignedIn>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className='md:hidden p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all duration-200 active:scale-95'
            >
              <svg
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                  isMobileMenuOpen ? 'rotate-90' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                ) : (
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-96 opacity-100 pb-3 sm:pb-4' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className='px-2 pt-2 pb-3 space-y-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-600/50 mt-2 shadow-lg'>
            <Link href='/' onClick={closeMobileMenu} className={linkClasses('/')}>
              🏠 Home
            </Link>
            <Link href='/about' onClick={closeMobileMenu} className={linkClasses('/about')}>
              ℹ️ About
            </Link>
            <Link href='/contact' onClick={closeMobileMenu} className={linkClasses('/contact')}>
              📞 Contact
            </Link>
            <SignedIn>
              <Link href='/dashboard' onClick={closeMobileMenu} className={linkClasses('/dashboard')}>
                📊 Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
