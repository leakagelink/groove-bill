import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, KeyRound, Loader2, Shield } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  const [creating, setCreating] = useState(false);

  // Reset password
  const [resetUserId, setResetUserId] = useState('');
  const [resetPw, setResetPw] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const invoke = async (body: any) => {
    const res = await supabase.functions.invoke('manage-users', { body });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await invoke({ action: 'list_users' });
      setUsers(data.users || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: 'Error', description: 'Email aur password required hai', variant: 'destructive' });
      return;
    }
    try {
      setCreating(true);
      await invoke({ action: 'create_user', email: newEmail, password: newPassword, full_name: newName, role: newRole });
      toast({ title: 'Success', description: 'User create ho gaya!' });
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewRole('viewer');
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await invoke({ action: 'update_role', user_id: userId, role });
      toast({ title: 'Success', description: 'Role update ho gaya!' });
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Kya aap sure hain ki is user ko delete karna hai?')) return;
    try {
      await invoke({ action: 'delete_user', user_id: userId });
      toast({ title: 'Success', description: 'User delete ho gaya!' });
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPw) {
      toast({ title: 'Error', description: 'Naya password enter karein', variant: 'destructive' });
      return;
    }
    try {
      setResetting(true);
      await invoke({ action: 'reset_password', user_id: resetUserId, password: resetPw });
      toast({ title: 'Success', description: 'Password reset ho gaya!' });
      setResetPw(''); setResetUserId(''); setResetDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive';
      case 'editor': return 'bg-primary/10 text-primary';
      case 'viewer': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">User Management</h1>

      {/* Create New User */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus size={20} />
            Naya User Create Karein
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="User ka naam" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="Email address" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="mt-4" onClick={handleCreateUser} disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            User Create Karein
          </Button>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield size={20} />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select value={user.role} onValueChange={(val) => handleUpdateRole(user.id, val)}>
                          <SelectTrigger className="w-[120px]">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setResetUserId(user.id); setResetDialogOpen(true); }}
                          >
                            <KeyRound size={14} className="mr-1" /> Password
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naya Password</Label>
              <Input type="password" placeholder="Naya password enter karein" value={resetPw} onChange={e => setResetPw(e.target.value)} />
            </div>
            <Button onClick={handleResetPassword} disabled={resetting}>
              {resetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Password Reset Karein
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
