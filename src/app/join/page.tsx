'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf, User, Users, ChevronRight, ShieldCheck, Zap } from 'lucide-react';

export default function JoinSelectionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
      <div className="mb-12 text-center space-y-4">
        <Link href="/" className="inline-flex items-center gap-3 mb-4">
          <div className="bg-primary text-white p-2.5 rounded-2xl shadow-xl shadow-primary/20 rotate-3">
            <Leaf className="w-8 h-8" />
          </div>
          <span className="font-headline font-bold text-2xl text-primary tracking-tight uppercase">Ayurvedic Kendra</span>
        </Link>
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-foreground">Choose Your Path</h1>
          <p className="text-muted-foreground text-lg font-medium">Join our global community of natural health practitioners.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Referral Path */}
        <Card className="group border-2 border-transparent hover:border-primary transition-all duration-500 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
          <CardHeader className="p-10 pb-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-all">
              <Users className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-headline font-bold">I have a Referral Code</CardTitle>
            <CardDescription className="text-base pt-2">Join an existing team and grow under an experienced mentor.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-8">
            <ul className="space-y-4 text-sm font-medium text-muted-foreground">
              <li className="flex items-center gap-3"><Zap className="w-4 h-4 text-secondary" /> Mentorship and team support</li>
              <li className="flex items-center gap-3"><Zap className="w-4 h-4 text-secondary" /> Part of an established binary tree</li>
              <li className="flex items-center gap-3"><Zap className="w-4 h-4 text-secondary" /> Immediate placement into a network</li>
            </ul>
            <Button 
              onClick={() => router.push('/register')}
              className="w-full h-14 rounded-2xl font-bold text-lg gap-2 shadow-xl shadow-primary/10"
            >
              Start with Code <ChevronRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Individual Path */}
        <Card className="group border-2 border-transparent hover:border-secondary transition-all duration-500 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
          <CardHeader className="p-10 pb-6 text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mx-auto mb-6 group-hover:bg-secondary group-hover:text-white transition-all">
              <User className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-headline font-bold">Register as Individual</CardTitle>
            <CardDescription className="text-base pt-2">Start your own independent tree and build your own legacy.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-0 space-y-8">
            <ul className="space-y-4 text-sm font-medium text-muted-foreground">
              <li className="flex items-center gap-3"><Zap className="w-4 h-4 text-primary" /> Root of your own organization</li>
              <li className="flex items-center gap-3"><Zap className="w-4 h-4 text-primary" /> KYC verified directly by Admin</li>
              <li className="flex items-center gap-3"><Zap className="w-4 h-4 text-primary" /> Independent business management</li>
            </ul>
            <Button 
              variant="outline"
              onClick={() => router.push('/register?type=individual')}
              className="w-full h-14 rounded-2xl font-bold text-lg gap-2 border-secondary text-secondary hover:bg-secondary/5"
            >
              Start Independent <ChevronRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <p className="text-muted-foreground font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> All members must undergo KYC verification
        </p>
        <p className="text-sm">
          Already a member? <Link href="/login" className="text-primary font-bold hover:underline">Login to Dashboard</Link>
        </p>
      </div>
    </div>
  );
}
