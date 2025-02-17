"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { motion, AnimatePresence } from "framer-motion"
import { Home, ShoppingCart, Clipboard, Settings, Menu, X, User, List, ChefHat } from 'lucide-react'
import { Toaster } from "@/components/ui/toaster"
const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/order", icon: ShoppingCart, label: "New Order" },
  { href: "/menu", icon: Clipboard, label: "Menu" },
  { href: "/list", icon: List, label: "Order List" },
  { href: "/kitchen", icon: ChefHat, label: "Kitchen" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const Layout = ({ children }) => {
  const router = useRouter()
  const [isNavOpen, setIsNavOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      {/* Floating action button for navigation */}
      <button
        onClick={() => setIsNavOpen(!isNavOpen)}
        className="fixed z-50 bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
      >
        {isNavOpen ? <X /> : <Menu />}
      </button>

      {/* Radial navigation menu */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setIsNavOpen(false)}
          >
            <motion.div className="relative w-72 h-72" onClick={(e) => e.stopPropagation()}>
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="absolute"
                  style={{
                    top: `${50 - 40 * Math.cos((index * Math.PI) / 3)}%`,
                    left: `${50 + 40 * Math.sin((index * Math.PI) / 3)}%`,
                  }}
                >
                  <Link href={item.href}
                      className={`flex items-center justify-center w-16 h-16 rounded-full ${
                        router.pathname === item.href ? "bg-indigo-600 text-white" : "bg-white text-indigo-600"
                      } shadow-lg hover:bg-indigo-500 hover:text-white transition-colors`}
                    >
                      <item.icon size={24} />
                      <span className="sr-only">{item.label}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>

      {/* User profile button */}
      <button className="fixed top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors">
        <User className="w-6 h-6 text-indigo-600" />
      </button>
    </div>
  )
}

export default Layout