"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from "../lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus, ShoppingCart, Search, AlertCircle } from "lucide-react"
import Layout from "../components/Layout"
import { jsPDF } from "jspdf"
import QRCode from "qrcode"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const OrderPage = () => {
  const [menuItems, setMenuItems] = useState([])
  const [order, setOrder] = useState({
    customerName: "",
    items: [],
    tableId: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [categories, setCategories] = useState([{ id: "all", name: "All" }])
  const [tables, setTables] = useState([])
  const [error, setError] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("") // Added payment method state
  const searchInputRef = useRef(null)

  useEffect(() => {
    fetchMenuItems()
    fetchTables()
  }, [])

  const fetchMenuItems = async () => {
    const { data: menuData, error: menuError } = await supabase.from("menu_items").select("*")
    const { data: categoryData, error: categoryError } = await supabase.from("food_categories").select("id, name")

    if (menuError || categoryError) {
      console.error(menuError || categoryError)
      setError("Failed to fetch menu items or categories. Please try again.")
    } else {
      setMenuItems(menuData)
      const categoriesWithAll = [{ id: "all", name: "All" }, ...categoryData]
      setCategories(categoriesWithAll)
      setActiveCategory("all")
    }
  }

  const fetchTables = async () => {
    const { data, error } = await supabase.from("tables").select("*").order("name")
    if (error) {
      console.error("Error fetching tables:", error)
      setError("Failed to fetch tables. Please try again.")
    } else {
      setTables(data)
    }
  }

  const handleAddItemToOrder = (item) => {
    const existingItem = order.items.find((orderItem) => orderItem.id === item.id)

    if (existingItem) {
      setOrder({
        ...order,
        items: order.items.map((orderItem) =>
          orderItem.id === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem,
        ),
      })
    } else {
      setOrder({
        ...order,
        items: [...order.items, { ...item, quantity: 1, customRequest: "" }],
      })
    }
  }

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      setOrder({
        ...order,
        items: order.items.filter((item) => item.id !== itemId),
      })
    } else {
      setOrder({
        ...order,
        items: order.items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)),
      })
    }
  }

  const handleCustomRequestChange = (itemId, customRequest) => {
    setOrder({
      ...order,
      items: order.items.map((item) => (item.id === itemId ? { ...item, customRequest } : item)),
    })
  }

  const calculateTotal = () => {
    const totalPrice = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const vat = totalPrice * 0.15 // 15% VAT in Bangladesh
    return { totalPrice, vat, totalWithVat: totalPrice + vat }
  }

  const generateReceiptPDF = async (orderData) => {
    const { totalPrice, vat, totalWithVat } = calculateTotal()

    const doc = new jsPDF({
      unit: "mm",
      format: [80, 297], // Standard thermal paper roll width (80mm)
    })

    doc.setFont("courier", "normal")
    doc.setFontSize(10)

    const lineHeight = 5
    let yPos = 10

    // Header
    doc.setFontSize(12)
    doc.text("Restaurant Name", 40, yPos, { align: "center" })
    yPos += lineHeight * 2
    doc.setFontSize(10)
    doc.text("123 Restaurant St, City, Country", 40, yPos, { align: "center" })
    yPos += lineHeight
    doc.text("Tel: (123) 456-7890", 40, yPos, { align: "center" })
    yPos += lineHeight * 2

    // Order details
    doc.text(`Order ID: ${orderData.id}`, 5, yPos)
    yPos += lineHeight
    doc.text(`Date: ${new Date().toLocaleString()}`, 5, yPos)
    yPos += lineHeight
    doc.text(`Customer: ${order.customerName}`, 5, yPos)
    yPos += lineHeight
    doc.text(`Token: ${orderData.token}`, 5, yPos)
    yPos += lineHeight
    doc.text(`Table: ${tables.find((t) => t.id === order.tableId)?.name || "N/A"}`, 5, yPos)
    yPos += lineHeight * 2

    // Items
    doc.text("Qty  Item                  Price", 5, yPos)
    yPos += lineHeight
    doc.text("-".repeat(32), 5, yPos)
    yPos += lineHeight

    order.items.forEach((item) => {
      const itemText = `${item.quantity.toString().padEnd(4)}${item.name.slice(0, 18).padEnd(20)}৳${(item.price * item.quantity).toFixed(2).padStart(6)}`
      doc.text(itemText, 5, yPos)
      yPos += lineHeight

      if (item.customRequest && item.customRequest.trim() !== "") {
        doc.text(`  - ${item.customRequest}`, 5, yPos)
        yPos += lineHeight
      }
    })

    // Totals
    yPos += lineHeight
    doc.text("-".repeat(32), 5, yPos)
    yPos += lineHeight
    doc.text(`Subtotal: ৳${totalPrice.toFixed(2).padStart(22)}`, 5, yPos)
    yPos += lineHeight
    doc.text(`VAT (15%): ৳${vat.toFixed(2).padStart(22)}`, 5, yPos)
    yPos += lineHeight
    doc.setFontSize(12)
    doc.text(`Total: ৳${totalWithVat.toFixed(2).padStart(25)}`, 5, yPos)
    yPos += lineHeight * 2

    // Footer
    doc.setFontSize(10)
    doc.text("Thank you for your order!", 40, yPos, { align: "center" })
    yPos += lineHeight * 2

    // QR Code
    const statusUrl = `${window.location.origin}/status/${orderData.id}`
    const qrCodeDataUrl = await QRCode.toDataURL(statusUrl)
    doc.addImage(qrCodeDataUrl, "PNG", 25, yPos, 30, 30)
    yPos += 32
    doc.text("Scan to check order status", 40, yPos, { align: "center" })

    // Save the PDF
    doc.save(`receipt_${orderData.id}.pdf`)
  }

  const handlePlaceOrder = async () => {
    if (order.customerName.trim() === "") {
      setError("Please enter a customer name.")
      return
    }

    if (order.items.length === 0) {
      setError("Please add at least one item to the order.")
      return
    }

    if (!order.tableId) {
      setError("Please select a table.")
      return
    }

    if (!paymentMethod) {
      setError("Please select a payment method.")
      return
    }

    // Fetch the latest order to calculate the next token
    const { data: latestOrder, error: latestOrderError } = await supabase
      .from("orders")
      .select("token")
      .order("token", { ascending: false })
      .limit(1)
      .single()

    if (latestOrderError && latestOrderError.code !== "PGRST116") {
      // This error code is returned when there is no data
      console.error("Error fetching latest order token:", latestOrderError)
      setError("There was an issue fetching the latest order. Please try again.")
      return
    }

    // If there's no existing order, set token to 1
    const nextToken = latestOrder ? (latestOrder.token % 100) + 1 : 1

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: order.customerName,
          status: "pending",
          token: nextToken,
          total_price: calculateTotal().totalWithVat,
          table_id: order.tableId,
          payment_method: paymentMethod, // Added payment method to the order
        },
      ])
      .select("id, token")
      .single()

    if (orderError) {
      console.error("Error inserting order:", orderError)
      setError("There was an issue placing your order. Please try again.")
      return
    }

    if (orderData) {
      const orderId = orderData.id
      const orderItems = order.items.map((item) => ({
        order_id: orderId,
        menu_item_id: item.id,
        quantity: item.quantity,
        custom_request: item.customRequest,
      }))

      const { error: orderItemError } = await supabase.from("order_items").insert(orderItems)

      if (orderItemError) {
        console.error("Error inserting order items:", orderItemError)
        setError("There was an issue adding the items to the order. Please try again.")
      } else {
        setError("")
        alert(`Order placed successfully! Token: ${orderData.token}`)
        generateReceiptPDF(orderData)
        setOrder({ customerName: "", items: [], tableId: "" })
        setPaymentMethod("") // Reset payment method
      }
    }
  }

  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (activeCategory === "all" || item.category_id === activeCategory),
  )

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "/") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
        {/* Category Sidebar */}
        <Card className="w-full lg:w-56 overflow-hidden shadow-md rounded-xl">
          <CardContent className="p-4">
            <h2 className="font-bold mb-4 text-xl text-gray-900">Categories</h2>
            <ScrollArea className="h-[calc(100vh-14rem)] pr-2">
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Button
                      variant={activeCategory === category.id ? "default" : "ghost"}
                      className={`w-full justify-start text-left px-3 py-2 h-auto rounded-lg transition-all 
                        ${activeCategory === category.id ? "bg-indigo-600 text-white" : "hover:bg-gray-100 text-gray-700"}`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      {category.name}
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="flex-1 overflow-hidden mx-0 lg:mx-4 mb-4 lg:mb-0">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search menu items... (Press '/' to focus)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  ref={searchInputRef}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredMenuItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Card className="h-full border rounded-2xl shadow-md hover:shadow-lg transition">
                        <CardContent className="p-5 flex flex-col justify-between h-full">
                          <div className="space-y-2">
                            <h3 className="font-bold text-xl text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          </div>
                          <div className="flex justify-between items-center mt-5">
                            <Badge variant="outline" className="text-lg font-medium px-3 py-1">
                              ৳{item.price.toFixed(2)}
                            </Badge>
                            <Button
                              onClick={() => handleAddItemToOrder(item)}
                              size="icon"
                              className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
                            >
                              <Plus className="w-5 h-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="w-full lg:w-96 shadow-lg rounded-xl border">
          <CardContent className="p-5 h-full flex flex-col">
            {/* Header */}
            <h2 className="text-xl font-bold mb-4 text-gray-900">Order Summary</h2>

            {/* Customer Name Input */}
            <div className="mb-4">
              <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                Customer Name
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder="Enter customer name"
                value={order.customerName}
                onChange={(e) => setOrder({ ...order, customerName: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Table Selection */}
            <div className="mb-4">
              <Label htmlFor="tableSelect" className="text-sm font-medium text-gray-700">
                Select Table
              </Label>
              <Select value={order.tableId} onValueChange={(value) => setOrder({ ...order, tableId: value })}>
                <SelectTrigger id="tableSelect" className="mt-1">
                  <SelectValue placeholder="Choose a table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.name} (Capacity: {table.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-4">
              {" "}
              {/* Added Payment Method Selection */}
              <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">
                Payment Method
              </Label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value)}>
                <SelectTrigger id="paymentMethod" className="mt-1">
                  <SelectValue placeholder="Choose a payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bkash">bKash</SelectItem>
                  <SelectItem value="bankAttachment">Bank Attachment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Items List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {order.items.length > 0 ? (
                <AnimatePresence>
                  {order.items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className="border border-gray-200 rounded-lg">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-sm font-semibold">৳{(item.price * item.quantity).toFixed(2)}</span>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Special Instructions */}
                          <Input
                            type="text"
                            placeholder="Special instructions"
                            value={item.customRequest}
                            onChange={(e) => handleCustomRequestChange(item.id, e.target.value)}
                            className="mt-2 text-sm"
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <p className="text-gray-500 text-center">Your order is empty. Add items from the menu.</p>
              )}
            </div>

            {/* Order Summary & Actions */}
            <div className="mt-auto">
              <Separator className="my-4" />
              <div className="space-y-2 text-right text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>৳{calculateTotal().totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%):</span>
                  <span>৳{calculateTotal().vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total:</span>
                  <span>৳{calculateTotal().totalWithVat.toFixed(2)}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setOrder({ customerName: "", items: [], tableId: "" })}
                  className="w-1/2"
                  variant="outline"
                >
                  Clear
                </Button>
                <Button onClick={handlePlaceOrder} className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Place Order
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Layout>
  )
}

export default OrderPage

