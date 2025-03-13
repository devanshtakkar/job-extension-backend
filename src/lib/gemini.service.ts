import { ArraySchema, GoogleGenerativeAI, ObjectSchema, SchemaType } from '@google/generative-ai';
import { Question, userProfile } from '../types/question';
require('dotenv').config();

const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const systemInstructions = `You are assisting the job application automation system in answering questionnaires for job applications based on user information and resume data. You will be provided with questions, each containing an elementId, where your response should be placed. Your answers must always be in JSON format and follow the structured response guidelines below.

Response Format: Always respond in JSON format. Each response must include the elementId where the answer should be placed. Keep responses concise—a few words or one sentence. If the question explicitly asks for a detailed answer, do not exceed three lines.

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
                enum: ["text", "textarea", "number", "radio", "select"],
                description: "The type of input element as provided to you in the question object"
            },
            answerElmId: {
                type: SchemaType.STRING,
                description: "The id of the element where the answer should be inserted. for text and number input elements, this is the id of the input element. for radio input elements, this is the id of the correct option input element's id."
            },
            wasAvailable: {
                type: SchemaType.BOOLEAN,
                description: "This is a boolean value that indicates whether the answer was answered using the available data of the person in the system or not."
            }
        },
        required: ["question", "answer", "inputElmType", "answerElmId", "wasAvailable"]
    }
};

const model = googleAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
    },
    systemInstruction: systemInstructions
});

export async function processQuestions(questions: Question[]) {
    const currentDate = new Date().toISOString();
    
    const prompt = JSON.stringify({
        currentDate,
        userProfile,
        userPrompt: "",
        questions
    });

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        return JSON.parse(response);
    } catch (error) {
        console.error("Error generating content:", error);
        throw new Error("Failed to process questions with AI");
    }
}
