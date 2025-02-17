"use client"

import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, Search, Plus, Minus, Copy, Clock, Home, Menu, User } from "lucide-react"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

const DigitalMenu = () => {
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [otp, setOtp] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [selectedItem, setSelectedItem] = useState(null)
  const [previousOrders, setPreviousOrders] = useState([])
  const [activeTab, setActiveTab] = useState("menu")
  const [showToast, setShowToast] = useState(false)
  const [toastItem, setToastItem] = useState(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchMenuItems()
    loadPreviousOrders()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("food_categories").select("*")
      if (error) throw error
      setCategories([{ id: "all", name: "All" }, ...data])
    } catch (err) {
      console.error(err)
      setError("Failed to fetch categories. Please try again.")
    }
  }

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase.from("menu_items").select("*").order("category_id", { ascending: true })
      if (error) throw error
      setMenuItems(data)
    } catch (err) {
      console.error(err)
      setError("Failed to fetch menu items. Please try again.")
    }
  }

  const loadPreviousOrders = () => {
    const storedOrders = localStorage.getItem("previousOrders")
    if (storedOrders) {
      const parsedOrders = JSON.parse(storedOrders)
      const currentTime = new Date().getTime()
      const validOrders = parsedOrders.filter((order) => currentTime - order.timestamp < 3600000) // 1 hour in milliseconds
      setPreviousOrders(validOrders)
    }
  }

  const savePreviousOrder = (order) => {
    const currentTime = new Date().getTime()
    const newOrder = { ...order, timestamp: currentTime }
    const updatedOrders = [newOrder, ...previousOrders].slice(0, 5) // Keep only the 5 most recent orders
    localStorage.setItem("previousOrders", JSON.stringify(updatedOrders))
    setPreviousOrders(updatedOrders)
  }

  const handleAddItem = (item) => {
    const existingItem = selectedItems.find((i) => i.id === item.id)
    if (existingItem) {
      setSelectedItems(selectedItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)))
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }])
    }
    setToastItem(item)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleRemoveItem = (item) => {
    const existingItem = selectedItems.find((i) => i.id === item.id)
    if (existingItem.quantity === 1) {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id))
    } else {
      setSelectedItems(selectedItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)))
    }
  }

  const calculateTotal = () => {
    const subtotal = selectedItems.reduce((total, item) => total + item.price * item.quantity, 0)
    const vat = subtotal * 0.05 // 5% VAT
    return { subtotal, vat, total: subtotal + vat }
  }

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleConfirmOrder = async () => {
    if (selectedItems.length === 0) {
      setError("Please add items to your order.")
      return
    }

    const newOtp = generateOtp()
    const orderSummary = selectedItems.map((item) => ({
      menu_item_id: item.id,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
    }))

    try {
      const { data, error } = await supabase
        .from("digital_menu_orders")
        .insert([
          {
            otp: newOtp,
            order_items: orderSummary,
            total_price: calculateTotal().total,
            status: "pending",
          },
        ])
        .select()

      if (error) throw error

      setOtp(newOtp)
      const newOrder = {
        otp: newOtp,
        order_items: orderSummary,
        total_price: calculateTotal().total,
        status: "pending",
        created_at: new Date().toISOString(),
      }
      savePreviousOrder(newOrder)
      setSelectedItems([])
      toast.success(`Order Placed Successfully! Your OTP is: ${newOtp}`)
      setIsCartOpen(false)
    } catch (err) {
      console.error(err)
      setError("Failed to place order. Please try again.")
    }
  }

  const copyOtp = () => {
    navigator.clipboard.writeText(otp)
    toast.success("OTP copied to clipboard")
  }

  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (activeCategory === "all" || item.category_id === activeCategory),
  )

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8F8]">
      <Toaster position="top-center" reverseOrder={false} />
      {/* Header */}
      <header className="bg-white p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center text-[#FFA500]">
            <span className="mr-2">🐝</span> Y Restaurant
          </h1>
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#333333] hover:bg-[#F8F8F8]">
                  <Search className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white">
                <DialogHeader>
                  <DialogTitle className="text-[#333333]">Search Menu</DialogTitle>
                </DialogHeader>
                <Input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-4 bg-white text-[#333333]"
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              className="text-[#333333] hover:bg-[#F8F8F8]"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {selectedItems.length > 0 && (
                <span className="absolute top-0 right-0 bg-[#FFA500] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex justify-start mb-6 bg-white p-1 rounded-lg">
            <TabsTrigger
              value="menu"
              className="flex-1 py-2 text-sm font-medium transition-all data-[state=active]:bg-[#FFA500] data-[state=active]:text-white rounded-md"
            >
              Menu
            </TabsTrigger>
            <TabsTrigger
              value="previous"
              className="flex-1 py-2 text-sm font-medium transition-all data-[state=active]:bg-[#FFA500] data-[state=active]:text-white rounded-md"
            >
              Previous Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-6">
            {/* Category Tabs */}
            <ScrollArea className="w-full">
              <div className="flex space-x-2 pb-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    onClick={() => setActiveCategory(category.id)}
                    className={`px-3 py-1 text-sm whitespace-nowrap ${
                      activeCategory === category.id
                        ? "bg-[#FFA500] text-white"
                        : "bg-white text-[#333333] hover:bg-[#FFE082]"
                    }`}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Menu Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredMenuItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white border-none">
                      <CardContent className="p-0">
                        <img
                          src={`/placeholder.svg?height=200&width=200`}
                          alt={item.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-1 truncate text-[#333333]">{item.name}</h3>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                            {item.description || "No description available."}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-[#FFA500]">৳{item.price.toFixed(2)}</span>
                            <Button
                              onClick={() => handleAddItem(item)}
                              className="bg-[#FFA500] hover:bg-[#FF8F00] text-white"
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="previous" className="space-y-4">
            {previousOrders.length > 0 ? (
              previousOrders.map((order, index) => (
                <Card
                  key={index}
                  className="bg-white border-none shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg text-[#333333]">Order OTP: {order.otp}</h3>
                      <Badge
                        variant={order.status === "pending" ? "secondary" : "success"}
                        className="bg-[#FFA500] text-white"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2 flex items-center">
                      <Clock className="inline-block mr-1 h-4 w-4" />
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    <p className="font-medium mb-2 text-[#333333]">Total: ৳{order.total_price.toFixed(2)}</p>
                    <div className="mt-2">
                      <h4 className="font-medium mb-1 text-[#333333]">Items:</h4>
                      <ul className="list-disc list-inside">
                        {order.order_items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-sm text-gray-500">
                            {item.name} x {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500">No previous orders found.</p>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="bg-white">
          <SheetHeader>
            <SheetTitle className="text-[#333333]">Your Cart</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-grow mt-4 h-[calc(100%-10rem)]">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <p className="font-semibold text-[#333333]">{item.name}</p>
                  <p className="text-sm text-gray-500">৳{item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveItem(item)}
                    className="text-[#333333]"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-[#333333]">{item.quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => handleAddItem(item)} className="text-[#333333]">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[#333333]">
              <span>Subtotal:</span>
              <span>৳{calculateTotal().subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#333333]">
              <span>VAT (5%):</span>
              <span>৳{calculateTotal().vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#333333]">
              <span>Total:</span>
              <span>৳{calculateTotal().total.toFixed(2)}</span>
            </div>
          </div>
          <Button className="w-full mt-4 bg-[#FFA500] hover:bg-[#FF8F00] text-white" onClick={handleConfirmOrder}>
            Confirm Order
          </Button>
          {otp && (
            <Alert className="mt-4 bg-[#FFE082] border-[#FFA500]">
              <AlertTitle className="text-[#333333]">Order Placed Successfully</AlertTitle>
              <AlertDescription className="flex items-center justify-between text-[#333333]">
                <span>Your OTP: {otp}</span>
                <Button variant="outline" size="icon" onClick={copyOtp} className="text-[#333333]">
                  <Copy className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full">
        <div className="container mx-auto px-4">
          <ul className="flex justify-around py-2">
            <li>
              <Button variant="ghost" className="flex flex-col items-center text-[#333333]">
                <Home className="h-6 w-6" />
                <span className="text-xs mt-1">Home</span>
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="flex flex-col items-center text-[#333333]">
                <Menu className="h-6 w-6" />
                <span className="text-xs mt-1">Menu</span>
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className="flex flex-col items-center text-[#333333]"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingBag className="h-6 w-6" />
                <span className="text-xs mt-1">Cart</span>
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="flex flex-col items-center text-[#333333]">
                <User className="h-6 w-6" />
                <span className="text-xs mt-1">Profile</span>
              </Button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && toastItem && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.3 }}
            className="fixed bottom-20 right-4 bg-[#FFA500] text-white p-4 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center">
              <ShoppingBag className="w-6 h-6 mr-2" />
              <p>Added to cart: {toastItem.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DigitalMenu

