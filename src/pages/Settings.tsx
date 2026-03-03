import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Mail, Loader2 } from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Email update
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast({ title: 'Error', description: 'Naya password enter karein', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password kam se kam 6 characters ka hona chahiye', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Dono passwords match nahi kar rahe', variant: 'destructive' });
      return;
    }

    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Password successfully change ho gaya!' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleEmailUpdate = async () => {
    if (!newEmail) {
      toast({ title: 'Error', description: 'Nayi email enter karein', variant: 'destructive' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({ title: 'Error', description: 'Valid email address enter karein', variant: 'destructive' });
      return;
    }

    setEmailLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('update-user-email', {
        body: { email: newEmail },
      });
      if (res.error) {
        toast({ title: 'Error', description: res.error.message, variant: 'destructive' });
      } else if (res.data?.error) {
        toast({ title: 'Error', description: res.data.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Email successfully update ho gayi! Ab nayi email se login karein.' });
        setNewEmail('');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setEmailLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound size={20} />
            Password Change
          </CardTitle>
          <CardDescription>Apna password yahan se change karein</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Naya password enter karein"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Password dobara enter karein"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={pwLoading}>
            {pwLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Password Change Karein
          </Button>
        </CardContent>
      </Card>

      {/* Email Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail size={20} />
            Email Update
          </CardTitle>
          <CardDescription>Apni email address yahan se update karein</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">New Email</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="Nayi email enter karein"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
          </div>
          <Button onClick={handleEmailUpdate} disabled={emailLoading}>
            {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Email Update Karein
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
