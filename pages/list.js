"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "../lib/supabase"
import Layout from "../components/Layout"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, RefreshCcw, ChevronDown, ChevronUp, Search, Eye, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const OrderListPage = () => {
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" })
  const [error, setError] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, 
          customer_name, 
          status, 
          total_price, 
          token, 
          order_time,
          table_id,
          tables(name),
          order_items(
            id,
            quantity,
            custom_request,
            menu_items(id, name, price)
          )
        `)
        .order("id", { ascending: false })

      if (error) {
        throw error
      }

      setOrders(data || [])
      setError("") // Clear any previous errors
    } catch (err) {
      console.error("Error fetching orders:", err.message)
      setError("Failed to fetch orders. Please try again later.")
    }
  }

  const handleDeleteOrder = async (orderId) => {
    // Delete order items first
    await supabase.from("order_items").delete().eq("order_id", orderId)

    // Delete the order
    const { error } = await supabase.from("orders").delete().eq("id", orderId)

    if (error) {
      console.error("Error deleting order:", error)
      setError("Failed to delete order. Please try again.")
    } else {
      setOrders(orders.filter((order) => order.id !== orderId))
      setError("")
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)

    if (error) {
      console.error("Error updating status:", error)
      setError("Failed to update order status. Please try again.")
    } else {
      setOrders(
        orders.map((order) => {
          if (order.id === orderId) {
            return { ...order, status: newStatus }
          }
          return order
        }),
      )
      setError("")
    }
  }

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "asc" ? "desc" : "asc",
    }))
  }

  const filteredAndSortedOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.token.toString().includes(searchTerm)
        const matchesStatus = statusFilter === "all" || order.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
  }, [orders, searchTerm, statusFilter, sortConfig])

  const statusColors = {
    pending: "bg-yellow-200 text-yellow-800",
    preparing: "bg-blue-200 text-blue-800",
    complete: "bg-green-200 text-green-800",
  }

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Order List</CardTitle>
            <div className="flex items-center space-x-4">
              <Button onClick={fetchOrders} variant="outline">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Input
                placeholder="Search by name or token"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                icon={<Search className="w-4 h-4 text-gray-400" />}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <ScrollArea className="h-[calc(100vh-200px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("id")}>
                      Order ID
                      {sortConfig.key === "id" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="inline ml-1" />
                        ) : (
                          <ChevronDown className="inline ml-1" />
                        ))}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("customer_name")}>
                      Customer Name
                      {sortConfig.key === "customer_name" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="inline ml-1" />
                        ) : (
                          <ChevronDown className="inline ml-1" />
                        ))}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("token")}>
                      Token
                      {sortConfig.key === "token" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="inline ml-1" />
                        ) : (
                          <ChevronDown className="inline ml-1" />
                        ))}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("total_price")}>
                      Total Price
                      {sortConfig.key === "total_price" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="inline ml-1" />
                        ) : (
                          <ChevronDown className="inline ml-1" />
                        ))}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("order_time")}>
                      Date
                      {sortConfig.key === "order_time" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="inline ml-1" />
                        ) : (
                          <ChevronDown className="inline ml-1" />
                        ))}
                    </TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredAndSortedOrders.map((order) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50"
                      >
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status]}>{order.status}</Badge>
                        </TableCell>
                        <TableCell>{order.token}</TableCell>
                        <TableCell>৳{order.total_price ? order.total_price.toFixed(2) : "0.00"}</TableCell>
                        <TableCell>{new Date(order.order_time).toLocaleString()}</TableCell>
                        <TableCell>{order.tables ? order.tables.name : "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Order Details</DialogTitle>
                                  <DialogDescription>
                                    Order #{order.id} - {order.customer_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                  <h3 className="font-semibold mb-2">Order Items:</h3>
                                  <ul className="list-disc list-inside">
                                    {order.order_items.map((item, index) => (
                                      <li key={index} className="mb-2">
                                        {item.menu_items?.name || "Unknown Item"} - Qty: {item.quantity} - ৳
                                        {((item.menu_items?.price || 0) * item.quantity).toFixed(2)}
                                        {item.custom_request && (
                                          <Badge variant="outline" className="ml-2">
                                            Custom: {item.custom_request}
                                          </Badge>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                  <div className="mt-4 font-semibold">Total: ৳{order.total_price.toFixed(2)}</div>
                                  <div className="mt-2">Table: {order.tables ? order.tables.name : "N/A"}</div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the order and remove the
                                    data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default OrderListPage

