
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Leaf, TrendingUp, Send, Loader2, HeartPulse, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ayurvedicProductRecommender, AyurvedicProductRecommenderOutput } from '@/ai/flows/ayurvedic-product-recommender-flow';
import { businessGrowthStrategist, BusinessGrowthStrategistOutput } from '@/ai/flows/business-growth-strategist-flow';

export default function AIAssistantPage() {
  const [loading, setLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<AyurvedicProductRecommenderOutput | null>(null);
  const [businessResult, setBusinessResult] = useState<BusinessGrowthStrategistOutput | null>(null);

  const [healthConcern, setHealthConcern] = useState("");
  const [memberInquiry, setMemberInquiry] = useState("");

  const handleHealthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await ayurvedicProductRecommender({ healthConcern, memberInquiry });
      setHealthResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mocked input for the growth flow
      const res = await businessGrowthStrategist({
        userName: "Rajesh Kumar",
        currentRank: "Silver",
        currentLeftTeamCount: 458,
        currentRightTeamCount: 512,
        currentLeftBV: 1240,
        currentRightBV: 890,
        packageType: "2800",
        specificGoal: "Advance to Gold rank by next month"
      });
      setBusinessResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="bg-primary p-3 rounded-2xl text-white shadow-lg">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Ojas AI Assistant</h1>
          <p className="text-muted-foreground">Personalized Ayurvedic advice and business growth strategies powered by AI.</p>
        </div>
      </div>

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm h-14">
          <TabsTrigger value="health" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg font-bold">
            <HeartPulse className="w-4 h-4 mr-2" /> Ayurvedic Protocols
          </TabsTrigger>
          <TabsTrigger value="business" className="rounded-xl px-8 h-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:shadow-lg font-bold">
            <TrendingUp className="w-4 h-4 mr-2" /> Growth Strategy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-6 animate-in fade-in duration-500">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-primary" /> Health & Product Advisor
                </CardTitle>
                <CardDescription>Describe a health concern to get expert Ayurvedic recommendations.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleHealthSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="concern">What is the health concern?</Label>
                    <Textarea 
                      id="concern"
                      value={healthConcern}
                      onChange={(e) => setHealthConcern(e.target.value)}
                      placeholder="e.g. I have frequent indigestion and want to boost my immunity naturally." 
                      className="min-h-[120px] rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry">Specific Member Inquiry (Optional)</Label>
                    <Textarea 
                      id="inquiry"
                      value={memberInquiry}
                      onChange={(e) => setMemberInquiry(e.target.value)}
                      placeholder="e.g. How can I explain these benefits to a new prospect?" 
                      className="min-h-[80px] rounded-2xl"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 font-bold gap-2" disabled={loading || !healthConcern}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Get Recommendations</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {!healthResult && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-dashed opacity-50">
                  <Leaf className="w-16 h-16 text-primary/20 mb-4" />
                  <p className="text-muted-foreground italic font-medium">Your personalized Ayurvedic protocol will appear here.</p>
                </div>
              )}

              {loading && (
                <Card className="border-none shadow-xl bg-primary/5 animate-pulse">
                  <CardContent className="p-12 text-center space-y-4">
                    <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                    <p className="font-bold text-primary">Ojas AI is analyzing traditional texts...</p>
                  </CardContent>
                </Card>
              )}

              {healthResult && (
                <Card className="border-none shadow-2xl bg-white animate-in zoom-in-95 duration-500">
                  <CardHeader className="bg-primary/5 rounded-t-3xl border-b border-primary/10">
                    <CardTitle className="text-primary flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" /> Your Personalized Protocol
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-headline font-bold text-lg flex items-center gap-2">Recommended Products</h4>
                      <div className="grid gap-3">
                        {healthResult.productRecommendations.map((prod, i) => (
                          <div key={i} className="flex gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                            <div className="bg-white p-2 rounded-full h-fit shadow-sm">
                              <Leaf className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-bold text-primary">{prod.name}</div>
                              <div className="text-sm text-muted-foreground">{prod.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-headline font-bold text-lg">Ayurvedic Protocol</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{healthResult.protocolDescription}</p>
                    </div>

                    <div className="p-4 bg-secondary/10 rounded-2xl border border-secondary/20">
                      <h4 className="font-headline font-bold text-secondary-foreground flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4" /> Business Growth Tip
                      </h4>
                      <p className="text-sm text-secondary-foreground/80 italic">{healthResult.businessGrowthTips}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="business" className="animate-in fade-in duration-500">
          <div className="max-w-4xl mx-auto space-y-8">
             <Card className="border-none shadow-xl bg-secondary text-secondary-foreground relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <CardContent className="p-8 space-y-6 relative">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-headline font-bold">Level Up Your Business</h2>
                    <p className="opacity-80 text-lg">Our AI analyzes your downline performance and rank status to provide custom growth path.</p>
                  </div>
                  <Button onClick={handleBusinessSubmit} variant="outline" className="h-14 px-8 font-bold border-white/20 bg-white/10 hover:bg-white/20 text-white" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate Growth Strategy"}
                  </Button>
                </CardContent>
             </Card>

             {businessResult && (
               <div className="grid md:grid-cols-2 gap-6">
                 <Card className="md:col-span-2 border-none shadow-xl bg-white">
                   <CardHeader>
                    <CardTitle className="text-2xl font-headline font-bold text-primary">Strategic Overview</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                    <p className="text-lg text-muted-foreground leading-relaxed italic border-l-4 border-secondary pl-6">{businessResult.overallStrategy}</p>
                   </CardContent>
                 </Card>

                 <Card className="border-none shadow-lg">
                   <CardHeader>
                     <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Team Growth Tips</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <ul className="space-y-3">
                       {businessResult.downlineGrowthTips.map((tip, i) => (
                         <li key={i} className="flex gap-3 text-sm">
                           <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" /> {tip}
                         </li>
                       ))}
                     </ul>
                   </CardContent>
                 </Card>

                 <Card className="border-none shadow-lg">
                   <CardHeader>
                     <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Rank Advancement</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <ul className="space-y-3">
                       {businessResult.rankAdvancementTips.map((tip, i) => (
                         <li key={i} className="flex gap-3 text-sm">
                           <Award className="w-4 h-4 text-primary shrink-0" /> {tip}
                         </li>
                       ))}
                     </ul>
                   </CardContent>
                 </Card>

                 <Card className="md:col-span-2 border-none shadow-xl bg-primary text-white">
                   <CardContent className="p-8 flex items-center justify-between gap-8">
                     <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-widest opacity-60">Immediate Next Step</div>
                        <div className="text-xl font-headline font-bold">{businessResult.nextSteps}</div>
                     </div>
                     <Button variant="secondary" className="h-12 font-bold px-6 shadow-xl">Get Started</Button>
                   </CardContent>
                 </Card>
               </div>
             )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
