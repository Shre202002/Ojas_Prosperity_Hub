
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf, User, Mail, Phone, Lock, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function JoinPage() {
  const searchParams = useSearchParams();
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setSponsorId(ref);
      localStorage.setItem('sponsorId', ref);
    } else {
      setSponsorId(localStorage.getItem('sponsorId'));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
      <div className="mb-8 text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="bg-primary text-white p-2 rounded-full">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-2xl text-primary tracking-tight">OJAS CARE</span>
        </Link>
        <h1 className="text-3xl font-headline font-bold text-primary">Join the Prosperity Hub</h1>
        {sponsorId && (
          <div className="inline-flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full text-secondary-foreground font-medium text-sm border border-secondary/20">
            <User className="w-4 h-4" /> You were referred by: <span className="font-bold">Member #{sponsorId.slice(0, 6)}</span>
          </div>
        )}
      </div>

      <Card className="w-full max-w-xl shadow-2xl border-none">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 3 && <div className={`h-1 w-12 rounded ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>
          <CardTitle className="text-2xl font-headline">
            {step === 1 && "Personal Details"}
            {step === 2 && "Choose Your Package"}
            {step === 3 && "Binary Placement"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Start your journey by providing your information."}
            {step === 2 && "Select a starter kit that fits your goals."}
            {step === 3 && "Decide your position in the binary structure."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input id="firstName" className="pl-10" placeholder="John" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-10" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" type="tel" className="pl-10" placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type="password" className="pl-10" />
                </div>
              </div>
              <Button onClick={() => setStep(2)} className="w-full h-12 font-bold gap-2">
                Next Step <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
              <RadioGroup defaultValue="1400" className="space-y-4">
                {[
                  { id: "1400", title: "Basic Starter", price: "1,400", bv: "2 BV", benefits: "8% Matching Bonus" },
                  { id: "2800", title: "Executive Kit", price: "2,800", bv: "4 BV", benefits: "9% Matching Bonus" },
                  { id: "7000", title: "Business Builder", price: "7,000", bv: "10 BV", benefits: "10% Matching Bonus" },
                ].map((item) => (
                  <div key={item.id} className="relative">
                    <RadioGroupItem value={item.id} id={item.id} className="peer sr-only" />
                    <Label
                      htmlFor={item.id}
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-muted bg-popover hover:bg-accent cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-lg">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.benefits}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-headline font-bold text-primary">₹{item.price}</div>
                        <div className="text-xs font-bold text-secondary uppercase tracking-wider">{item.bv}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 font-bold">Back</Button>
                <Button onClick={() => setStep(3)} className="flex-[2] h-12 font-bold gap-2">Next Step <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <Label>Select Your Leg</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input type="radio" name="leg" id="left" className="peer sr-only" defaultChecked />
                    <Label 
                      htmlFor="left" 
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-muted bg-popover hover:bg-accent cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary font-bold">L</div>
                      <span className="font-bold">Left Team</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <input type="radio" name="leg" id="right" className="peer sr-only" />
                    <Label 
                      htmlFor="right" 
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-muted bg-popover hover:bg-accent cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary font-bold">R</div>
                      <span className="font-bold">Right Team</span>
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  *If your chosen leg is full, our smart spillover system will place you in the next available slot to support your sponsor's team growth.
                </p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 font-bold">Back</Button>
                <Link href="/dashboard" className="flex-[2]">
                   <Button className="w-full h-12 font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/20">Complete Registration</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Login here</Link>
      </p>
    </div>
  );
}
