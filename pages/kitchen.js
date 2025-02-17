"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const audioRef = useRef(null);

  // Function to fetch orders
  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, 
        customer_name, 
        status, 
        token,
        order_time,
        order_items(id, menu_item_id, quantity, custom_request, menu_items(id, name))
      `)
      .in("status", ["pending", "preparing"])
      .order("order_time", { ascending: true });

    if (error) console.error("Error fetching orders:", error);
    else setOrders(data);
  }, []);

  // Polling function to fetch orders every 5 seconds
  useEffect(() => {
    fetchOrders(); // Initial fetch

    // Set interval for polling every 5 seconds
    const intervalId = setInterval(fetchOrders, 5000);

    // Subscribe to order changes
    const ordersSubscription = supabase
      .channel("orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();

    const orderItemsSubscription = supabase
      .channel("order_items")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, fetchOrders)
      .subscribe();

    // Cleanup: stop the interval and unsubscribe from the channels
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(orderItemsSubscription);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);

    if (error) {
      console.error("Error updating status:", error);
    } else {
      if (newStatus === "complete") {
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
      } else {
        setOrders((prevOrders) =>
          prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
        );
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "preparing":
        return "bg-blue-500 hover:bg-blue-600";
      case "complete":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-gray-300";
    }
  };

  const playNotificationSound = () => {
    audioRef.current.play();
  };

  useEffect(() => {
    if (orders.some((order) => order.status === "pending")) {
      playNotificationSound();
    }
  }, [orders]);

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-5xl font-extrabold text-indigo-700 mb-8 tracking-tight">👨‍🍳 Kitchen Display</h1>
        <audio ref={audioRef} src="/notification-sound.mp3" />
        {orders.length === 0 ? (
          <Card className="bg-gray-50 shadow-lg rounded-lg border-2 border-gray-200">
            <CardContent className="flex items-center justify-center h-64">
              <p className="text-2xl text-gray-500">🚀 No active orders</p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`overflow-hidden border-l-8 ${getStatusColor(order.status)} shadow-lg rounded-lg`}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex justify-between items-center text-lg text-gray-900">
                          <span>Order #{order.id}</span>
                          <Badge variant="outline" className="text-lg font-bold text-indigo-600">
                            🎟️ {order.token}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-500 mb-2">
                          <Clock className="inline-block w-4 h-4 mr-1" />
                          {new Date(order.order_time).toLocaleString()}
                        </p>
                        <p className="font-semibold text-xl mb-2">👤 {order.customer_name}</p>
                        <Badge className={`${getStatusColor(order.status)} text-white text-sm mb-4 py-1 px-2 rounded`}>
                          {order.status}
                        </Badge>
                        <ScrollArea className="h-48 mb-4">
                          <ul className="space-y-2">
                            {order.order_items.map((item) => (
                              <li key={item.id} className="bg-gray-200 hover:bg-gray-300 transition rounded p-2">
                                <span className="font-semibold">{item.menu_items?.name || "Unknown Item"}</span>
                                <span className="ml-2 text-sm text-gray-600">x{item.quantity}</span>
                                {item.custom_request && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <AlertCircle className="inline-block w-4 h-4 mr-1" />
                                    {item.custom_request}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </ScrollArea>
                        {order.status === "pending" && (
                          <Button
                            className="w-full bg-blue-600 text-white hover:bg-blue-700 transition rounded-lg py-2"
                            onClick={() => updateOrderStatus(order.id, "preparing")}
                          >
                            ✅ Start Preparing
                          </Button>
                        )}
                        {order.status === "preparing" && (
                          <Button
                            className="w-full bg-green-600 text-white hover:bg-green-700 transition rounded-lg py-2"
                            onClick={() => updateOrderStatus(order.id, "complete")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Complete
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </div>
    </Layout>
  );
};

export default KitchenDisplay;
