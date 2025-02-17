"use client"

import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import Layout from "../components/Layout"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
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
import { AlertCircle, Plus, Trash2, Edit, Search } from "lucide-react"
import { Label } from "@/components/ui/label" // Import Label component

const Menu = () => {
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [newCategory, setNewCategory] = useState("")
  const [newMenuItem, setNewMenuItem] = useState({ name: "", price: "", category: "", isAvailable: true })
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCategories()
    fetchMenuItems()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("food_categories").select("*")
      if (error) throw error
      setCategories(data)
      setError("")
    } catch (err) {
      console.error(err)
      setError("Failed to fetch categories. Please try again.")
    }
  }

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("is_available", { ascending: false })
        .order("category_id", { ascending: true })
      if (error) throw error
      setMenuItems(data)
      setError("")
    } catch (err) {
      console.error(err)
      setError("Failed to fetch menu items. Please try again.")
    }
  }

  const handleAddCategory = async () => {
    if (newCategory) {
      try {
        const { error } = await supabase.from("food_categories").insert([{ name: newCategory }])
        if (error) throw error
        fetchCategories()
        setNewCategory("")
        setError("")
      } catch (err) {
        console.error(err)
        setError("Failed to add category. Please try again.")
      }
    }
  }

  const handleAddMenuItem = async () => {
    if (newMenuItem.name && newMenuItem.price && newMenuItem.category) {
      try {
        const { error } = await supabase.from("menu_items").insert([
          {
            name: newMenuItem.name,
            price: newMenuItem.price,
            category_id: newMenuItem.category,
            is_available: newMenuItem.isAvailable,
          },
        ])
        if (error) throw error
        fetchMenuItems()
        setNewMenuItem({ name: "", price: "", category: "", isAvailable: true })
        setError("")
      } catch (err) {
        console.error(err)
        setError("Failed to add menu item. Please try again.")
      }
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    try {
      const { error } = await supabase.from("food_categories").delete().eq("id", categoryId)
      if (error) throw error
      fetchCategories()
      fetchMenuItems() // Refresh menu items as some might have been deleted due to cascading delete
      setError("")
    } catch (err) {
      console.error(err)
      setError("Failed to delete category. Please try again.")
    }
  }

  const handleDeleteMenuItem = async (menuItemId) => {
    try {
      // Step 1: Update or delete references in the order_items table
      await supabase.from("order_items").update({ menu_item_id: null }).eq("menu_item_id", menuItemId)

      // Step 2: Proceed to delete the menu item
      const { error } = await supabase.from("menu_items").delete().eq("id", menuItemId)
      if (error) throw error

      fetchMenuItems()
      setError("")
    } catch (err) {
      console.error(err)
      setError("Failed to delete menu item. Please try again.")
    }
  }

  const handleToggleAvailability = async (menuItemId, currentAvailability) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !currentAvailability })
        .eq("id", menuItemId)
      if (error) throw error
      fetchMenuItems()
      setError("")
    } catch (err) {
      console.error(err)
      setError("Failed to update item availability. Please try again.")
    }
  }

  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categories
        .find((cat) => cat.id === item.category_id)
        ?.name.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  )

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-bold mb-8 text-indigo-900">Menu Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="lg:col-span-1 bg-blue-500 text-white">
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-4">
                  <Input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New Category Name"
                    className="bg-white text-black"
                  />
                  <Button onClick={handleAddCategory} variant="secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
                <ScrollArea className="h-[300px]">
                  {categories.map((category) => (
                    <div key={category.id} className="flex justify-between items-center mb-2">
                      <span>{category.name}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the category and all associated menu items.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="bg-yellow-500 text-white">
              <CardHeader>
                <CardTitle>Add Menu Item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    type="text"
                    placeholder="Item Name"
                    value={newMenuItem.name}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                    className="bg-white text-black"
                  />
                  <Input
                    type="number"
                    placeholder="Price (in Taka)"
                    value={newMenuItem.price}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                    className="bg-white text-black"
                  />
                  <Select
                    value={newMenuItem.category}
                    onValueChange={(value) => setNewMenuItem({ ...newMenuItem, category: value })}
                  >
                    <SelectTrigger className="bg-white text-black">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="item-available"
                      checked={newMenuItem.isAvailable}
                      onCheckedChange={(checked) => setNewMenuItem({ ...newMenuItem, isAvailable: checked })}
                    />
                    <Label htmlFor="item-available">Available</Label> {/* Label is now used correctly */}
                  </div>
                  <Button onClick={handleAddMenuItem} className="w-full" variant="secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Menu Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search menu items or categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMenuItems.map((item) => (
                    <Card
                      key={item.id}
                      className={`${
                        item.is_available
                          ? "bg-gradient-to-br from-purple-500 to-indigo-600"
                          : "bg-gradient-to-br from-gray-500 to-gray-600"
                      } text-white`}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <Badge variant="secondary" className="mt-1">
                              {categories.find((cat) => cat.id === item.category_id)?.name}
                            </Badge>
                          </div>
                          <span className="font-bold">৳{item.price}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`item-available-${item.id}`}
                              checked={item.is_available}
                              onCheckedChange={() => handleToggleAvailability(item.id, item.is_available)}
                            />
                            <Label htmlFor={`item-available-${item.id}`}>
                              {item.is_available ? "Available" : "Unavailable"}
                            </Label>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="secondary" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the menu item.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteMenuItem(item.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </Layout>
  )
}

export default Menu

