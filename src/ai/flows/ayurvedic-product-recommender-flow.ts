'use server';
/**
 * @fileOverview An AI assistant that provides personalized Ojas Care Ayurvedic product recommendations, protocols, and business growth tips based on user health inquiries.
 *
 * - ayurvedicProductRecommender - A function that handles the Ayurvedic product recommendation process.
 * - AyurvedicProductRecommenderInput - The input type for the ayurvedicProductRecommender function.
 * - AyurvedicProductRecommenderOutput - The return type for the ayurvedicProductRecommender function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AyurvedicProductRecommenderInputSchema = z.object({
  healthConcern: z
    .string()
    .describe(
      'A detailed description of the user\'s health concern or inquiry. For example, "I have frequent indigestion and bloating after meals" or "How can I boost my energy naturally?"
    '),
  memberInquiry: z
    .string()
    .optional()
    .describe(
      'Optional: Any specific business growth inquiry from the distributor, e.g., "How can I use this recommendation to enroll new members?"
    '),
});
export type AyurvedicProductRecommenderInput = z.infer<
  typeof AyurvedicProductRecommenderInputSchema
>;

const AyurvedicProductRecommenderOutputSchema = z.object({
  productRecommendations: z
    .array(
      z.object({
        name: z.string().describe('The name of the recommended Ojas Care product.'),
        description: z
          .string()
          .describe('A brief description of the product and its benefits.'),
      })
    )
    .describe('A list of recommended Ojas Care Ayurvedic products.'),
  protocolDescription: z
    .string()
    .describe(
      'A detailed Ayurvedic protocol including how to use the recommended products, dietary advice, and lifestyle changes.'
    '),
  businessGrowthTips: z
    .string()
    .describe(
      'Practical tips for the Ojas Care distributor on how to leverage these recommendations for customer sales and team growth.'
    '),
});
export type AyurvedicProductRecommenderOutput = z.infer<
  typeof AyurvedicProductRecommenderOutputSchema
>;

export async function ayurvedicProductRecommender(
  input: AyurvedicProductRecommenderInput
): Promise<AyurvedicProductRecommenderOutput> {
  return ayurvedicProductRecommenderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ayurvedicProductRecommenderPrompt',
  input: { schema: AyurvedicProductRecommenderInputSchema },
  output: { schema: AyurvedicProductRecommenderOutputSchema },
  prompt: `You are an expert Ayurvedic practitioner and a knowledgeable Ojas Care Private Limited distributor. Your goal is to provide comprehensive advice for a customer's health concern, suggest relevant Ojas Care Ayurvedic products (use plausible placeholder names if specific product names are unknown, focusing on the type of product), outline a detailed protocol, and provide business growth tips for the distributor.

Ojas Care Tagline: "सेहत से समृद्धि" (Health to Prosperity)

--- User Inquiry ---
Health Concern: {{{healthConcern}}}
{{#if memberInquiry}}
Distributor's Business Inquiry: {{{memberInquiry}}}
{{/if}}

--- Instructions ---
1.  **Product Recommendations**: Suggest 1-3 specific Ojas Care Ayurvedic products that address the health concern. For each product, provide a plausible name and a brief description of its Ayurvedic benefits. Focus on holistic wellness.
2.  **Ayurvedic Protocol**: Detail a comprehensive protocol. This should include:
    *   How and when to use the recommended products.
    *   General Ayurvedic dietary advice relevant to the health concern (e.g., types of foods to favor or avoid).
    *   Lifestyle recommendations (e.g., daily routines, exercise, stress management techniques) based on Ayurvedic principles.
3.  **Business Growth Tips**: Provide actionable advice for the Ojas Care distributor on how to present these recommendations to a customer, leverage them for sales, and potentially recruit new members. Connect the health solution to the Ojas Care mission of "सेहत से समृद्धि".

Ensure your response is structured as a JSON object matching the provided schema, with clear, concise, and helpful information for both the customer's well-being and the distributor's business.`,
});

const ayurvedicProductRecommenderFlow = ai.defineFlow(
  {
    name: 'ayurvedicProductRecommenderFlow',
    inputSchema: AyurvedicProductRecommenderInputSchema,
    outputSchema: AyurvedicProductRecommenderOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
