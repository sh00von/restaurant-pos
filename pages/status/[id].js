"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { supabase } from "../../lib/supabase"
import Layout from "../../components/Layout"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

const OrderStatus = () => {
  const router = useRouter()
  const { id } = router.query
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchOrderStatus()
      const interval = setInterval(fetchOrderStatus, 5000) // Auto-refresh every 5s
      return () => clearInterval(interval)
    }
  }, [id])

  const fetchOrderStatus = async () => {
    if (!id) return // Ensure ID is available before fetching

    console.log("Fetching order for ID:", id) // Debugging

    const { data, error } = await supabase
      .from("orders")
      .select(
        `id, customer_name, status, token, total_price, order_time,
         order_items(quantity, menu_items(name))`,
      )
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching order:", error)
    } else {
      console.log("Order Data:", data) // Debugging response
      setOrder(data)
    }
    setLoading(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "preparing":
        return "bg-blue-500"
      case "complete":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    )
  }

  if (!order) {
    return (
      <Layout>
        <Card className="max-w-lg mx-auto mt-8">
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Order not found.</p>
          </CardContent>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-10"
      >
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-indigo-900">Order Status</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">
                Order #{order.id} | Token: {order.token}
              </h2>
              <Badge className={`${getStatusColor(order.status)} text-white text-lg px-4 py-1`}>
                {order.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-600">Customer</p>
                <p className="font-semibold">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Order Time</p>
                <p className="font-semibold">{new Date(order.order_time).toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Order Items</h3>
              <ul className="space-y-2">
                {order.order_items.map((item, index) => (
                  <li key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                    <span>{item.menu_items.name}</span>
                    <span className="font-semibold">Qty: {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-right">
              <p className="text-gray-600">Total Price</p>
              <p className="text-2xl font-bold text-indigo-900">৳{order.total_price.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  )
}

export default OrderStatus

