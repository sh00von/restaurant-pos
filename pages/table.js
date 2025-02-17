"use client"

import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import Layout from "../components/Layout"
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const TableManagement = () => {
  const [tables, setTables] = useState([])
  const [newTable, setNewTable] = useState({ name: "", capacity: "" })
  const [editingTable, setEditingTable] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    const { data, error } = await supabase.from("tables").select("*").order("name")
    if (error) {
      console.error("Error fetching tables:", error)
      setError("Failed to fetch tables. Please try again.")
    } else {
      setTables(data)
      setError("")
    }
  }

  const handleCreateTable = async () => {
    if (!newTable.name || !newTable.capacity) {
      setError("Please enter both table name and capacity.")
      return
    }

    const { data, error } = await supabase
      .from("tables")
      .insert([{ name: newTable.name, capacity: Number.parseInt(newTable.capacity) }])

    if (error) {
      console.error("Error creating table:", error)
      setError("Failed to create table. Please try again.")
    } else {
      fetchTables()
      setNewTable({ name: "", capacity: "" })
      setError("")
    }
  }

  const handleUpdateTable = async () => {
    if (!editingTable.name || !editingTable.capacity) {
      setError("Please enter both table name and capacity.")
      return
    }

    const { data, error } = await supabase
      .from("tables")
      .update({ name: editingTable.name, capacity: Number.parseInt(editingTable.capacity) })
      .eq("id", editingTable.id)

    if (error) {
      console.error("Error updating table:", error)
      setError("Failed to update table. Please try again.")
    } else {
      fetchTables()
      setEditingTable(null)
      setError("")
    }
  }

  const handleDeleteTable = async (id) => {
    const { data, error } = await supabase.from("tables").delete().eq("id", id)

    if (error) {
      console.error("Error deleting table:", error)
      setError("Failed to delete table. Please try again.")
    } else {
      fetchTables()
      setError("")
    }
  }

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-bold mb-8 text-indigo-900">Table Management</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <Label htmlFor="tableName">Table Name</Label>
                <Input
                  id="tableName"
                  value={newTable.name}
                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                  placeholder="e.g., Table 1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="tableCapacity">Capacity</Label>
                <Input
                  id="tableCapacity"
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                  placeholder="e.g., 4"
                />
              </div>
              <Button onClick={handleCreateTable}>
                <Plus className="w-4 h-4 mr-2" />
                Create Table
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <motion.div key={table.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{table.name}</h3>
                    <Badge variant="secondary">Capacity: {table.capacity}</Badge>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingTable(table)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Table</DialogTitle>
                          <DialogDescription>Make changes to the table details here.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editTableName" className="text-right">
                              Name
                            </Label>
                            <Input
                              id="editTableName"
                              value={editingTable?.name || ""}
                              onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editTableCapacity" className="text-right">
                              Capacity
                            </Label>
                            <Input
                              id="editTableCapacity"
                              type="number"
                              value={editingTable?.capacity || ""}
                              onChange={(e) => setEditingTable({ ...editingTable, capacity: e.target.value })}
                              className="col-span-3"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleUpdateTable}>Save changes</Button>
                        </DialogFooter>
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
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the table.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTable(table.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default TableManagement

