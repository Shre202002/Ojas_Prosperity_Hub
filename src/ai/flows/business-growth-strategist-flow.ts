'use server';
/**
 * @fileOverview An AI assistant that provides tailored strategies and tips for Ojas Care members
 * to grow their downline, improve sales, and advance their rank.
 *
 * - businessGrowthStrategist - A function that handles the business growth strategy generation process.
 * - BusinessGrowthStrategistInput - The input type for the businessGrowthStrategist function.
 * - BusinessGrowthStrategistOutput - The return type for the businessGrowthStrategist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BusinessGrowthStrategistInputSchema = z.object({
  userName: z.string().describe('The name of the Ojas Care member.'),
  currentRank: z.string().describe('The current rank of the member (e.g., "Star", "Bronze").'),
  currentLeftTeamCount: z.number().describe('The current number of members in the left team.'),
  currentRightTeamCount: z.number().describe('The current number of members in the right team.'),
  currentLeftBV: z.number().describe('The current Business Volume (BV) in the left leg.'),
  currentRightBV: z.number().describe('The current Business Volume (BV) in the right leg.'),
  packageType: z.enum(["1400", "2800", "7000"]).describe('The package type the member enrolled with.'),
  specificGoal: z.string().optional().describe('A specific goal the member wants to achieve (e.g., "reach Silver rank next month", "increase sales by 20%").'),
});
export type BusinessGrowthStrategistInput = z.infer<typeof BusinessGrowthStrategistInputSchema>;

const BusinessGrowthStrategistOutputSchema = z.object({
  overallStrategy: z.string().describe('A high-level strategic overview for business growth.'),
  downlineGrowthTips: z.array(z.string()).describe('Actionable tips and methods to grow the downline team.'),
  salesImprovementTips: z.array(z.string()).describe('Actionable tips and methods to improve product sales.'),
  rankAdvancementTips: z.array(z.string()).describe('Actionable tips and methods specifically for advancing to the next rank.'),
  productRecommendation: z.string().optional().describe('A suggestion for an Ojas Care health product relevant to the strategy or member needs.'),
  nextSteps: z.string().describe('A concise summary of immediate, actionable next steps.'),
});
export type BusinessGrowthStrategistOutput = z.infer<typeof BusinessGrowthStrategistOutputSchema>;

export async function businessGrowthStrategist(input: BusinessGrowthStrategistInput): Promise<BusinessGrowthStrategistOutput> {
  return businessGrowthStrategistFlow(input);
}

const businessGrowthStrategistPrompt = ai.definePrompt({
  name: 'businessGrowthStrategistPrompt',
  input: {schema: BusinessGrowthStrategistInputSchema},
  output: {schema: BusinessGrowthStrategistOutputSchema},
  prompt: `You are an expert MLM coach and business growth strategist for "Ojas Care Private Limited", an Ayurvedic health products company with the tagline "सेहत से समृद्धि" (Health to Prosperity). Your goal is to provide tailored strategies and actionable tips to Ojas Care members to help them maximize their earnings and success.\n\nThe member's current details are:\n- Name: {{{userName}}}\n- Current Rank: {{{currentRank}}}\n- Package Type: ₹{{{packageType}}}\n- Left Team Count: {{{currentLeftTeamCount}}}\n- Right Team Count: {{{currentRightTeamCount}}}\n- Left Business Volume (BV): {{{currentLeftBV}}}\n- Right Business Volume (BV): {{{currentRightBV}}}\n\n{{#if specificGoal}}\nThe member has a specific goal: "{{{specificGoal}}}"\n{{/if}}\n\nBased on this information and the principles of successful MLM business with Ojas Care, provide a comprehensive strategy focusing on downline growth, sales improvement, and rank advancement.\n\nEnsure your advice is:\n- Actionable and practical.\n- Specific to MLM and Ojas Care's product focus (Ayurvedic health products).\n- Structured clearly into the requested output fields.\n\nConsider the interplay between BV, team counts, and rank progression. Guide the user on how to leverage their current position and package type.\n\nYour response MUST be in the JSON format as defined by the output schema, explaining how to grow their downline, improve sales, and advance their rank.\n`
});

const businessGrowthStrategistFlow = ai.defineFlow(
  {
    name: 'businessGrowthStrategistFlow',
    inputSchema: BusinessGrowthStrategistInputSchema,
    outputSchema: BusinessGrowthStrategistOutputSchema,
  },
  async (input) => {
    const {output} = await businessGrowthStrategistPrompt(input);
    if (!output) {
      throw new Error('Failed to get output from businessGrowthStrategistPrompt');
    }
    return output;
  }
);
