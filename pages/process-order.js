"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../lib/supabase"
import Layout from "../components/Layout"
import { AlertCircle, Check, Search } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ProcessOrder = () => {
  const [otp, setOtp] = useState("")
  const [order, setOrder] = useState(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [tableId, setTableId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [tables, setTables] = useState([])
  const [successMessage, setSuccessMessage] = useState("")

  const fetchTables = async () => {
    const { data, error } = await supabase.from("tables").select("*")
    if (error) {
      console.error("Error fetching tables:", error)
    } else {
      setTables(data)
    }
  }

  const fetchOrder = async (otpValue = otp) => {
    setIsLoading(true)
    setError("")
    try {
      const { data, error } = await supabase
        .from("digital_menu_orders")
        .select(`
          id, 
          otp,
          order_items,
          total_price, 
          created_at,
          status
        `)
        .eq("otp", otpValue)
        .single()

      if (error) throw error

      if (!data) {
        setError("No order found with this OTP.")
        setOrder(null)
      } else {
        setOrder(data)
      }
    } catch (err) {
      console.error("Error fetching order:", err)
      setError("Failed to fetch order. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessOrder = async () => {
    setIsLoading(true)
    setError("")
    try {
      if (!customerName || !tableId || !paymentMethod) {
        throw new Error("Please fill in all required fields.")
      }

      // First, create a new order in the orders table
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: customerName,
          table_id: tableId,
          payment_method: paymentMethod,
          status: "preparing",
          total_price: order.total_price,
          digital_menu_order_id: order.id,
        })
        .select()

      if (orderError) throw orderError

      // Then, insert order items
      const orderItems = order.order_items.map((item) => ({
        order_id: orderData[0].id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Finally, update the digital_menu_orders status
      const { error: updateError } = await supabase
        .from("digital_menu_orders")
        .update({ status: "processed" })
        .eq("id", order.id)

      if (updateError) throw updateError

      setSuccessMessage(`Order with OTP ${order.otp} has been processed successfully.`)
      setOrder(null)
      setOtp("")
      toast.success("Order processed successfully!")
    } catch (err) {
      console.error("Error processing order:", err)
      setError(err.message || "Failed to process order. Please try again.")
      toast.error(err.message || "Failed to process order. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Toaster position="top-center" reverseOrder={false} />
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-900">Process Order</h1>

        <Card>
          <CardHeader>
            <CardTitle>Enter Order OTP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
              <Button onClick={() => fetchOrder()} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Fetch Order
              </Button>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence>
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tableId">Table</Label>
                      <Select value={tableId} onValueChange={setTableId}>
                        <SelectTrigger id="tableId">
                          <SelectValue placeholder="Select a table" />
                        </SelectTrigger>
                        <SelectContent>
                          {tables.map((table) => (
                            <SelectItem key={table.id} value={table.id}>
                              {table.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger id="paymentMethod">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="mobile">Mobile Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.order_items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>৳{item.price.toFixed(2)}</TableCell>
                          <TableCell>৳{(item.quantity * item.price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 text-right">
                    <p className="text-lg font-semibold">Total: ৳{order.total_price.toFixed(2)}</p>
                  </div>

                  <Button onClick={handleProcessOrder} className="w-full mt-4" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Process Order
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="mt-4"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="mt-4"
            >
              <Alert variant="success">
                <Check className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}

export default ProcessOrder

