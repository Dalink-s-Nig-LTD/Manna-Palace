import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import {
  UserPlus,
  Shield,
  Trash2,
  Edit,
  Crown,
  Users as UsersIcon,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export function UserManagement() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Id<"adminUsers"> | null>(
    null,
  );

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<
    "superadmin" | "manager" | "vc" | "supervisor"
  >("manager");
  const [editRole, setEditRole] = useState<
    "superadmin" | "manager" | "vc" | "supervisor"
  >("manager");

  // Fetch all admin users
  const users = useQuery(api.adminAuth.getAllAdmins);

  // Mutations
  const createAdmin = useMutation(api.adminAuth.createAdmin);
  const updateRole = useMutation(api.adminAuth.updateAdminRole);
  const deleteAdmin = useMutation(api.adminAuth.deleteAdmin);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Session expired. Please login again.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAdmin({
        email,
        password,
        name,
        role,
        sessionId: sessionId as Id<"sessions">,
      });

      toast({
        title: "Success",
        description: `Admin user created successfully.`,
      });

      setCreateDialogOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("manager");
    } catch (error) {
      let errorMsg = "Failed to create admin. Please try again.";
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("[convex") || msg.includes("server error")) {
          errorMsg = "Unable to save. Please check your connection.";
        } else if (msg.includes("email already")) {
          errorMsg = "This email is already registered";
        } else if (msg.includes("invalid email")) {
          errorMsg = "Please enter a valid email address";
        } else if (msg.includes("password must")) {
          errorMsg = error.message;
        } else if (!msg.includes("[convex")) {
          errorMsg = error.message;
        }
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUserId) return;

    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Session expired. Please login again.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateRole({
        adminId: selectedUserId,
        role: editRole,
        sessionId: sessionId as Id<"sessions">,
      });

      toast({
        title: "Success",
        description: "Role updated successfully.",
      });

      setEditDialogOpen(false);
      setSelectedUserId(null);
    } catch (error) {
      let errorMsg = "Failed to update role. Please try again.";
      if (
        error instanceof Error &&
        !error.message.toLowerCase().includes("[convex") &&
        !error.message.toLowerCase().includes("server error")
      ) {
        errorMsg = error.message;
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAdmin = async (adminId: Id<"adminUsers">) => {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Session expired. Please login again.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteAdmin({
        adminId,
        sessionId: sessionId as Id<"sessions">,
      });

      toast({
        title: "Success",
        description: "Admin user deleted successfully.",
      });
    } catch (error) {
      let errorMsg = "Failed to delete admin. Please try again.";
      if (
        error instanceof Error &&
        !error.message.toLowerCase().includes("[convex") &&
        !error.message.toLowerCase().includes("server error")
      ) {
        errorMsg = error.message;
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (userRole: string) => {
    switch (userRole) {
      case "superadmin":
        return <Crown className="w-3 h-3" />;
      case "manager":
        return <Shield className="w-3 h-3" />;
      case "vc":
        return <Eye className="w-3 h-3" />;
      case "supervisor":
        return <Eye className="w-3 h-3" />;
      default:
        return <UsersIcon className="w-3 h-3" />;
    }
  };

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case "superadmin":
        return "destructive";
      case "manager":
        return "default";
      case "vc":
        return "secondary";
      case "supervisor":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <CardTitle className="flex items-center gap-2 font-display text-sm sm:text-base">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Admins
          </CardTitle>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base">
                  Create Admin
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Add a new admin user with role permissions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAdmin}>
                <div className="space-y-3 py-3 sm:py-4">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs sm:text-sm">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs sm:text-sm">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-xs sm:text-sm">
                      Password
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="password"
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="flex-1 text-xs sm:text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 sm:h-10 w-8 sm:w-10"
                        onClick={() => setPassword(generatePassword())}
                        title="Generate Password"
                      >
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                    <p className="text-[9px] sm:text-xs text-muted-foreground">
                      Click refresh to generate random password
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="role" className="text-xs sm:text-sm">
                      Role
                    </Label>
                    <Select
                      value={role}
                      onValueChange={(val) =>
                        setRole(
                          val as "superadmin" | "manager" | "vc" | "supervisor",
                        )
                      }
                    >
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="superadmin">Superadmin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="vc">VC</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    className="text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="text-xs sm:text-sm">
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {users === undefined ? (
          <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-xs sm:text-sm text-muted-foreground">
            No users found.
          </div>
        ) : (
          <>
            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden sm:block rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                    <TableHead className="text-right text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium text-xs">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-xs">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getRoleBadgeVariant(user.role)}
                          className="gap-1 text-[10px]"
                        >
                          {getRoleIcon(user.role)}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDistanceToNow(user.createdAt, {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              setSelectedUserId(user._id);
                              setEditRole(user.role);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Role
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="text-xs h-7"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[95vw]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-sm">
                                  Delete Admin?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs">
                                  Delete {user.name}? Cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                                <AlertDialogCancel className="text-xs">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAdmin(user._id)}
                                  className="text-xs"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards - Visible only on mobile */}
            <div className="sm:hidden space-y-2">
              {users.map((user) => (
                <Card key={user._id} className="p-3 bg-muted/50">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-xs">{user.name}</div>
                        <div className="text-[10px] text-muted-foreground break-words">
                          {user.email}
                        </div>
                      </div>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="gap-0.5 text-[9px] flex-shrink-0"
                      >
                        {getRoleIcon(user.role)}
                      </Badge>
                    </div>
                    <div className="text-[9px] text-muted-foreground pt-1 border-t">
                      Added{" "}
                      {formatDistanceToNow(user.createdAt, { addSuffix: true })}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-7"
                        onClick={() => {
                          setSelectedUserId(user._id);
                          setEditRole(user.role);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Role
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs h-7"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95vw]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm">
                              Delete Admin?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs">
                              Delete {user.name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                            <AlertDialogCancel className="text-xs">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAdmin(user._id)}
                              className="text-xs"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Edit Role Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base">
                Update Role
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Change the role and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 sm:py-4">
              <div className="space-y-1">
                <Label htmlFor="editRole" className="text-xs sm:text-sm">
                  Role
                </Label>
                <Select
                  value={editRole}
                  onValueChange={(val) =>
                    setEditRole(
                      val as "superadmin" | "manager" | "vc" | "supervisor",
                    )
                  }
                >
                  <SelectTrigger className="text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="vc">VC</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRole} className="text-xs sm:text-sm">
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
