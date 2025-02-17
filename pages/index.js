"use client"

import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import Layout from "../components/Layout"
import { motion } from "framer-motion"
import { ShoppingBag, Clock, Coffee, TrendingUp, DollarSign, Loader, Users, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const DashboardPage = () => {
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    revenue: 0,
    averageOrderValue: 0,
  })

  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrderStats()
    fetchTables()

    const ordersSubscription = supabase
      .channel("orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrderStats)
      .subscribe()

    return () => {
      supabase.removeChannel(ordersSubscription)
    }
  }, [])

  const fetchOrderStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, customer_name, status,token, total_price, order_time, table_id")
        .order("order_time", { ascending: false })
        .not("status", "eq", "completed")

      if (error) throw error

      setOrders(data)

      const stats = {
        totalOrders: data.length,
        pendingOrders: data.filter((order) => order.status === "pending").length,
        preparingOrders: data.filter((order) => order.status === "preparing").length,
        revenue: data.reduce((sum, order) => sum + (order.total_price || 0), 0),
        averageOrderValue:
          data.length > 0 ? data.reduce((sum, order) => sum + (order.total_price || 0), 0) / data.length : 0,
      }

      setOrderStats(stats)
    } catch (error) {
      console.error("Error fetching orders:", error)
      setError("Failed to fetch order data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase.from("tables").select("*").order("name", { ascending: true })

      if (error) throw error

      setTables(data)
    } catch (error) {
      console.error("Error fetching tables:", error)
      setError("Failed to fetch table data. Please try again later.")
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

      if (error) throw error

      // Update the local state
      setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))

      // Refresh order stats
      await fetchOrderStats()
    } catch (error) {
      console.error("Error updating order status:", error)
      setError("Failed to update order status. Please try again.")
    }
  }

  const statCards = [
    { label: "Total Active Orders", value: orderStats.totalOrders, icon: ShoppingBag, color: "bg-blue-500" },
    { label: "Pending Orders", value: orderStats.pendingOrders, icon: Clock, color: "bg-yellow-500" },
    { label: "Preparing Orders", value: orderStats.preparingOrders, icon: Coffee, color: "bg-orange-500" },
    { label: "Total Revenue", value: `৳${orderStats.revenue.toFixed(2)}`, icon: DollarSign, color: "bg-purple-500" },
    {
      label: "Avg. Order Value",
      value: `৳${orderStats.averageOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-pink-500",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-400"
      case "preparing":
        return "bg-orange-400"
      default:
        return "bg-gray-400"
    }
  }

  const getTableStatus = (tableId) => {
    const tableOrders = orders.filter((order) => order.table_id === tableId)
    if (tableOrders.length === 0) return "available"
    return tableOrders[0].status
  }

  const getTableStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-200 border-yellow-400"
      case "preparing":
        return "bg-orange-200 border-orange-400"
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    )
  }

  return (
    <Layout>
      <h1 className="text-4xl font-bold mb-8 text-indigo-900">Dashboard</h1>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${stat.color} text-white`}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{stat.label}</p>
                  <h2 className="text-3xl font-bold mt-2">{stat.value}</h2>
                </div>
                <stat.icon className="w-12 h-12 opacity-75" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Active Orders by Table */}
      <Card className="mb-12">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Active Orders by Table</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => {
              const status = getTableStatus(table.id)
              return (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`${getTableStatusColor(status)} border-2`}>
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold mb-2">{table.name}</h3>
                      <Users className="w-6 h-6 mx-auto mb-2" />
                      <p className="text-sm">Capacity: {table.capacity}</p>
                      <Badge className={`mt-2 ${getStatusColor(status)}`}>
                        {status === "available" ? "Available" : status}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* List of Active Orders */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Active Orders</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.token}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{tables.find((t) => t.id === order.table_id)?.name || "N/A"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>৳{order.total_price?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell>{new Date(order.order_time).toLocaleString()}</TableCell>
                  <TableCell>
                    <Select value={order.status} onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  )
}

export default DashboardPage

