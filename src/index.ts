import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
var cors = require('cors');
require('dotenv').config();

const app = express();


app.use(cors());
const port = process.env.PORT || 3000;

// Types
interface QuestionItem {
  question: string;
  inputElm: string;
  elementId: string;
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage path
const STORAGE_PATH = path.join(__dirname, 'questions.json');

// Utility function to read questions
async function readQuestions(): Promise<QuestionItem[]> {
  try {
    const data = await fs.readFile(STORAGE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty array if file doesn't exist or has invalid JSON
    return [];
  }
}

// Utility function to write questions
async function writeQuestions(questions: QuestionItem[]): Promise<void> {
  await fs.writeFile(STORAGE_PATH, JSON.stringify(questions, null, 2));
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
