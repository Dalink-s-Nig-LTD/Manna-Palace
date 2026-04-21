import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UtensilsCrossed, Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditItemDialog } from "./EditItemDialog";

export function MenuManagement() {
  const items = useQuery(api.menuItems.getAllMenuItems);
  const categories = useQuery(api.menuItems.getCategories);
  const addItem = useMutation(api.menuItems.addMenuItem);
  const updateItem = useMutation(api.menuItems.updateMenuItem);
  const toggleAvailabilityMutation = useMutation(
    api.menuItems.toggleMenuItemAvailability,
  );
  const deleteItem = useMutation(api.menuItems.deleteMenuItem);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "",
  });
  const { toast } = useToast();

  if (!items || !categories) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
            Menu Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-pulse text-muted-foreground">
              Loading...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleAvailability = async (id: Id<"menuItems">) => {
    try {
      await toggleAvailabilityMutation({ id });
      toast({
        title: "Item Updated",
        description: "Availability status has been changed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addItem({
        name: newItem.name,
        price: parseInt(newItem.price),
        category: newItem.category,
      });

      setNewItem({ name: "", price: "", category: "" });
      setIsAddDialogOpen(false);

      toast({
        title: "Item Added",
        description: `${newItem.name} has been added to the menu.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedItem: any) => {
    try {
      await updateItem({
        id: updatedItem._id,
        name: updatedItem.name,
        price: updatedItem.price,
        category: updatedItem.category,
        available: updatedItem.available,
      });

      toast({
        title: "Item Updated",
        description: `${updatedItem.name} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: Id<"menuItems">, name: string) => {
    try {
      await deleteItem({ id });
      toast({
        title: "Item Deleted",
        description: `${name} has been removed from the menu.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <CardTitle className="flex items-center gap-2 font-display text-sm sm:text-base">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Menu
            </CardTitle>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle className="text-sm sm:text-base">
                    Add New Menu Item
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Item Name</Label>
                    <Input
                      placeholder="e.g., Jollof Rice"
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem({ ...newItem, name: e.target.value })
                      }
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Price (₦)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 800"
                      value={newItem.price}
                      onChange={(e) =>
                        setNewItem({ ...newItem, price: e.target.value })
                      }
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm">Category</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) =>
                        setNewItem({ ...newItem, category: value })
                      }
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c !== "All")
                          .map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full text-xs sm:text-sm"
                    onClick={handleAddItem}
                  >
                    Add Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs sm:text-sm"
            />
          </div>

          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-right text-xs">Price</TableHead>
                  <TableHead className="text-center text-xs">
                    Available
                  </TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-xs">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium text-xs">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-normal text-[10px]"
                        >
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary text-xs">
                        ₦{item.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={item.available}
                          onCheckedChange={() => toggleAvailability(item._id)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() =>
                              handleDeleteItem(item._id, item.name)
                            }
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards - Visible only on mobile */}
          <div className="sm:hidden space-y-2">
            {filteredItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No items found
              </div>
            ) : (
              filteredItems.map((item) => (
                <Card key={item._id} className="p-3 bg-muted/50">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-xs">{item.name}</div>
                        <Badge variant="secondary" className="text-[9px] mt-1">
                          {item.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary text-xs">
                          ₦{item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2 pt-1 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          Available:
                        </span>
                        <Switch
                          checked={item.available}
                          onCheckedChange={() => toggleAvailability(item._id)}
                          className="scale-75"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditItem(item)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteItem(item._id, item.name)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <EditItemDialog
        item={editingItem}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEdit}
      />
    </>
  );
}
