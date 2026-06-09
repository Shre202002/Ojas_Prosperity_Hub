'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Mail, Calendar, Shield, Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const { toast } = useToast();

  const userRef = user && db ? doc(db, 'users', user.uid) : null;
  const { data: profileData, loading } = useDoc(userRef);

  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [updating, setUpdating] = useState(false);

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
            <CardTitle className="text-2xl font-headline">{profileData?.name || 'Ojas Member'}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Shield className="w-3 h-3" /> {profileData?.role?.toUpperCase() || 'USER'}
            </CardDescription>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Calendar className="w-3 h-3" /> Joined {profileData?.createdAt ? new Date(profileData.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
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

      <Card className="border-none shadow-lg bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Account Security</CardTitle>
          <CardDescription>Manage your password and security settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            For security reasons, to change your password or delete your account, please contact our support team.
          </p>
          <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10">
            Request Security Action
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}