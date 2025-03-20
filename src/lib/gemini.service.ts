import { ArraySchema, GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Question, userProfile as questionUserProfile } from '../types/question';
import { JobDetails } from '../types/cover-letter';
import { userProfile } from '../misc/userProfile';

require('dotenv').config();

const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);


const questionSystemInstructions = `You are assisting the job application automation system in answering questionnaires for job applications based on user information and resume data. You will be provided with questions, each containing an elementId, where your response should be placed. Your answers must always be in JSON format and follow the structured response guidelines below.

Response Format: Always respond in JSON format. Each response must include the elementId where the answer should be placed. Keep responses concise and never exceed 145 characters in length. Even for detailed questions, ensure answers stay within this character limit.

Answering Guidelines:
- Text Responses: Provide a direct and relevant answer based on the given user information and resume data. Ensure the response is placed under the correct elementId.
- Radio Button Selections: The question may include an options array, where each option has a label, value, and inputId. Your response must include the correct value and its corresponding inputId.
- Availability Dates: If a question asks for availability, provide a date that is a few days after the current date provided in the prompt.

Handling Insufficient Information:
- If the available data is insufficient to answer truthfully, set 'wasAvailable': false
- If answering based on provided user information, set 'wasAvailable': true
- Even when data is missing, answer using your best judgment, assuming that the user exceeds the qualifications.`;

const responseSchema: ArraySchema = {
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            id: {
                type: SchemaType.STRING,
                description: "The unique identifier of the question"
            },
            question: {
                type: SchemaType.STRING,
                description: "It is the exact same question that was asked."
            },
            answer: {
                type: SchemaType.STRING
            },
            inputElmType: {
                type: SchemaType.STRING,
                format: "enum",
                enum: ["text", "textarea", "number", "radio", "select", "tel"],
                description: "The type of input element as provided to you in the question object"
            },
            answerElmId: {
                type: SchemaType.STRING,
                description: "The id of the element where the answer should be inserted. for text and number input elements, this is the id of the input element. for radio and select input elements, this is the id of the correct option input element's id."
            },
            wasAvailable: {
                type: SchemaType.BOOLEAN,
                description: "This is a boolean value that indicates whether the answer was answered using the available data of the person in the system or not."
            }
        },
        required: ["id", "question", "answer", "inputElmType", "answerElmId", "wasAvailable"]
    }
};

const model = googleAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite"
});

const coverLetterInstructions = `You are an expert cover letter writer. Your task is to create a compelling, professional cover letter based on the provided user profile and job details. Follow these guidelines:

1. Format: Standard business letter format with clear paragraphs
2. Length: Keep it concise, typically 3-4 paragraphs
3. Style: Professional but engaging tone
4. Content:
   - Opening: Strong introduction referencing the specific position and company
   - Body: Highlight relevant experience and skills that match job requirements
   - Closing: Express interest in an interview and provide contact information
5. Personalization: Incorporate specific company and job details
6. Focus: Emphasize achievements and value proposition
7. Output: Do not use any placeholder values - must follow this instruction. in case something is missing, do not use it, no matter how important it is.
8. Length: If user input includes a specific character count requirement, strictly adhere to that limit. Otherwise, maintain a concise, professional length of 3-4 paragraphs.

Remember to be confident but not arrogant, specific but concise, and enthusiastic but professional. Ensure all content is concrete and based on the provided information without using any placeholder text.`;

export async function processQuestions(questions: Question[]) {
    const currentDate = new Date().toISOString();
    
    const prompt = JSON.stringify({
        currentDate,
        userProfile: questionUserProfile,
        userPrompt: "",
        questions
    });

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }]}],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            },
            systemInstruction: questionSystemInstructions
        });
        const response = result.response.text();
        return JSON.parse(response);
    } catch (error) {
        console.error("Error generating content:", error);
        throw new Error("Failed to process questions with AI");
    }
}

export async function generateCoverLetter(jobDetails: JobDetails, userInput?: string) {
    try {
        const prompt = JSON.stringify({
            userProfile: userProfile.toString(),
            jobDetails,
            userInput: userInput || "",
            currentDate: new Date().toISOString()
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }]}],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024
            },
            systemInstruction: coverLetterInstructions
        });

        return result.response.text();
    } catch (error) {
        console.error("Error generating cover letter:", error);
        throw new Error("Failed to generate cover letter");
    }
}
