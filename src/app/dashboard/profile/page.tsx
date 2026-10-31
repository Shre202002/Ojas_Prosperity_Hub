'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, doc, updateDoc, serverTimestamp, updateProfile, sendPasswordResetEmail } from '@/lib/app-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Mail, Calendar, Shield, Save, Upload, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage, getPasswordResetActionSettings } from '@/lib/password-reset';

export default function ProfilePage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => (
    user && db ? doc(db, 'users', user.uid) : null
  ), [db, user?.uid]);
  
  const { data: profileData, loading } = useDoc(userRef);

  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [updating, setUpdating] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (profileData) {
      setName(profileData.name || '');
      setPhotoURL(profileData.photoURL || '');
    }
  }, [profileData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userRef) return;

    setUpdating(true);
    try {
      await updateProfile(user, { displayName: name, photoURL: photoURL });
      
      await updateDoc(userRef, {
        name,
        photoURL,
        lastLogin: serverTimestamp(),
      });

      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update profile.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth || !user?.email) return;
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, user.email, getPasswordResetActionSettings());
      toast({
        title: 'Reset Link Sent',
        description: `A password reset email has been sent to ${user.email}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: getAuthErrorMessage(error, 'Could not trigger password reset.'),
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Your Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and account settings.</p>
      </div>

      <Card className="border-none shadow-xl">
        <CardHeader className="flex flex-row items-center gap-6 pb-8 border-b">
          <Avatar className="h-24 w-24 border-4 border-primary/10">
            <AvatarImage src={photoURL || user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200`} />
            <AvatarFallback className="text-3xl">{(name || user?.displayName || 'U')[0]}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-headline">{profileData?.name || 'SJAPL Member'}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Shield className="w-3 h-3" /> {profileData?.role?.toUpperCase() || 'USER'}
            </CardDescription>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Calendar className="w-3 h-3" /> Joined {profileData?.createdAt ? (profileData.createdAt.seconds ? new Date(profileData.createdAt.seconds * 1000).toLocaleDateString() : 'Recently') : 'Recently'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    className="pl-10" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    className="pl-10 bg-muted/50 cursor-not-allowed" 
                    value={user?.email || ''} 
                    disabled 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground px-1">Email cannot be changed.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Profile Photo URL</Label>
              <div className="relative">
                <Upload className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="photo" 
                  className="pl-10" 
                  placeholder="https://example.com/photo.jpg" 
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Provider: <span className="font-bold text-primary">{profileData?.provider?.toUpperCase() || 'PASSWORD'}</span>
              </div>
              <Button type="submit" className="gap-2 font-bold px-8 h-12" disabled={updating}>
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg text-primary flex items-center gap-2">
            <Key className="w-5 h-5" /> Account Security
          </CardTitle>
          <CardDescription>Update your password or request account recovery.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To change your password, we will send a secure link to your registered email address.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              className="flex-1 h-12 font-bold gap-2 border-primary/20 hover:bg-primary/10 text-primary"
              onClick={handlePasswordReset}
              disabled={resetting}
            >
              {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Password Reset Email
            </Button>
            <Button variant="ghost" className="flex-1 h-12 font-bold text-destructive hover:bg-destructive/5 border border-destructive/10">
              Request Account Deletion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
