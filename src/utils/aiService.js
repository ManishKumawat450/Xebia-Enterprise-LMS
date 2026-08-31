const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const callGroqApi = async (messages, responseFormat = "text") => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: messages,
        temperature: 0.7,
        response_format: responseFormat === "json" ? { type: "json_object" } : { type: "text" },
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API Error:", error);
    throw error;
  }
};

export const generateAssessmentDescription = async (title, subject, difficulty) => {
  const prompt = `Write a professional, concise description for an assessment. 
Title: ${title || "Untitled Assessment"}
Subject: ${subject || "General"}
Difficulty: ${difficulty || "Medium"}

The description should be 2-3 sentences long and suitable for an enterprise Learning Management System.`;

  try {
    return await callGroqApi([
      { role: "system", content: "You are an expert assessment designer for an enterprise LMS." },
      { role: "user", content: prompt },
    ]);
  } catch (error) {
    console.warn("API Error, falling back to dummy description.");
    return `This is a comprehensive assessment covering key concepts in ${subject || "this topic"}. Designed for ${difficulty || "all"} proficiency levels, it evaluates your understanding and application of core principles effectively.`;
  }
};

export const generateQuestions = async (topic, count, taxonomy, type) => {
  const typeInstruction =
    type === "Mixed Types (All)"
      ? 'The questions MUST be of randomly selected types from: "mcq", "true_false", "multiple_select", "short_answer", "paragraph", "file_upload", "coding". Ensure a good mix of different types.'
      : `The questions MUST be of type "${type}".`;

  const prompt = `Generate ${count} questions about "${topic}" at the "${taxonomy}" level of Bloom's Taxonomy.
${typeInstruction}

Return ONLY a JSON object with a "questions" array containing the questions.
Each question object MUST have the following structure based on the type:
If type is "mcq": { "id": "q_timestamp_index", "type": "mcq", "question": "Question text", "options": ["opt1", "opt2", "opt3", "opt4"], "correctAnswer": "opt2", "marks": 2 }
If type is "true_false": { "id": "q_timestamp_index", "type": "true_false", "question": "Question text", "options": ["True", "False"], "correctAnswer": "True", "marks": 2 }
If type is "multiple_select": { "id": "q_timestamp_index", "type": "multiple_select", "question": "Question text", "options": ["opt1", "opt2", "opt3", "opt4"], "correctAnswers": ["opt1", "opt3"], "marks": 3 }
If type is "short_answer": { "id": "q_timestamp_index", "type": "short_answer", "question": "Question text", "correctAnswer": "Expected answer concept", "marks": 5 }
If type is "paragraph": { "id": "q_timestamp_index", "type": "paragraph", "question": "Question text", "marks": 10 }
If type is "file_upload": { "id": "q_timestamp_index", "type": "file_upload", "question": "Upload instructions text", "marks": 10 }
If type is "coding": { "id": "q_timestamp_index", "type": "coding", "question": "Problem description", "starterCode": "function solve() {\\n\\n}", "testCases": [{"input": "args", "output": "expected"}], "marks": 15 }

Output MUST be strictly valid JSON.`;

  try {
    const responseContent = await callGroqApi(
      [
        {
          role: "system",
          content:
            "You are an expert curriculum designer. You only respond with strictly valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      "json",
    );
    const parsed = JSON.parse(responseContent);
    return parsed.questions || [];
  } catch (err) {
    console.warn("API Error, falling back to dummy questions.");
    const dummyQuestions = Array.from({ length: count }).map((_, i) => ({
      id: `q_dummy_${Date.now()}_${i}`,
      type: type === "Mixed Types (All)" ? "mcq" : type,
      question: `Mock AI Question ${i + 1} about ${topic} (${taxonomy})`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option B",
      marks: 2,
    }));
    return dummyQuestions;
  }
};

export const evaluateSubmission = async (
  questionText,
  answerText,
  maxMarks,
  questionType,
  correctAnswer,
) => {
  if (!answerText || answerText.trim() === "") {
    return { suggestedMarks: 0, remarks: "No answer provided." };
  }

  const prompt = `You are evaluating a student's answer for an assessment.
Question Type: ${questionType}
Question: ${questionText}
Correct Answer (Rubric): ${correctAnswer || "Not provided"}
Student's Answer: ${answerText}
Maximum Marks: ${maxMarks}

Provide a suggested score (a number from 0 to ${maxMarks}) and a brief 1-sentence remark explaining the score.
Return ONLY a valid JSON object with exactly these two keys:
- "suggestedMarks" (number)
- "remarks" (string)`;

  try {
    const responseContent = await callGroqApi(
      [
        {
          role: "system",
          content:
            "You are a strict but fair AI grader for an enterprise LMS. You only respond with strictly valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      "json",
    );
    const parsed = JSON.parse(responseContent);
    return {
      suggestedMarks:
        typeof parsed.suggestedMarks === "number"
          ? parsed.suggestedMarks
          : Math.round(maxMarks * 0.5),
      remarks: parsed.remarks || "Evaluated by AI.",
    };
  } catch (err) {
    console.warn("API Error, falling back to dummy evaluation.");
    return {
      suggestedMarks: Math.round(maxMarks * 0.8),
      remarks: "Good effort, but could be improved (Mock AI Evaluation).",
    };
  }
};

export const evaluateCodeExecution = async (
  code,
  language,
  problemStatement,
  testCases,
  isCustomInput = false,
) => {
  const prompt = `You are a strict code execution engine simulator (like HackerRank).
  
Problem: ${problemStatement}
Language: ${language}
Code:
\`\`\`
${code}
\`\`\`

Test Cases to execute against:
${JSON.stringify(testCases, null, 2)}

Your task is to simulate the execution of this code. If the code has syntax errors or would fail to compile, output compilation errors. If the logic is correct, generate the standard output as expected. Be strict: if the output doesn't match the expected format exactly, the test case fails.

Return ONLY a valid JSON object with the following structure:
{
  "status": "Compilation Error" | "Time Limit Exceeded" | "Accepted" | "Wrong Answer",
  "executionTime": 0.045,
  "memoryUsage": 23.4,
  "compileMessage": "<error message if any, else empty string>",
  "results": [
    {
      "id": "<test case id>",
      "input": "<input used>",
      "expected": "<expected output>",
      "actual": "<simulated actual output generated by the code>",
      "passed": true
    }
  ]
}

DO NOT wrap the JSON in markdown blocks. Return raw JSON.`;

  try {
    const responseContent = await callGroqApi(
      [
        {
          role: "system",
          content: "You are a code execution engine that outputs strictly valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      "json",
    );
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("AI Execution error:", error);
    throw new Error("Execution simulation failed.");
  }
};

export const evaluateFinalSubmission = async (
  code,
  language,
  problemStatement,
  testCases,
  maxMarks,
) => {
  const prompt = `You are an automated grading system.
  
Problem: ${problemStatement}
Language: ${language}
Max Marks: ${maxMarks}
Code:
\`\`\`
${code}
\`\`\`

Test Cases (Public and Hidden):
${JSON.stringify(testCases, null, 2)}

Analyze the code. Does it solve the problem efficiently? Does it pass all test cases (including edge cases)?
If it fails hidden edge cases, deduct marks accordingly based on the weight of the test cases.

Return ONLY a valid JSON object with the following structure:
{
  "finalStatus": "Accepted" | "Partially Accepted" | "Wrong Answer" | "Compilation Error",
  "marksEarned": 10,
  "executionTime": 0.045,
  "memoryUsage": 23.4,
  "testResults": [
    {
      "id": "<test case id>",
      "passed": true,
      "actual": "<simulated output>",
      "visibility": "<public|hidden>",
      "weight": 2
    }
  ]
}
`;

  try {
    const responseContent = await callGroqApi(
      [
        {
          role: "system",
          content: "You are a strict grading engine that outputs strictly valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      "json",
    );
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("AI Evaluation error:", error);
    throw new Error("Final evaluation failed.");
  }
};

export const debugCodeWithAI = async (code, language, problemStatement, consoleLogs) => {
  const prompt = `You are a helpful AI Coding Tutor. A student is trying to solve a problem and their code is failing.

Problem: ${problemStatement}
Language: ${language}
Student Code:
\`\`\`
${code}
\`\`\`
Execution Logs/Errors:
${consoleLogs}

Identify the bug or logical flaw in the student's code. 
Provide a clear, brief explanation of what is going wrong and a HINT on how to fix it. 
DO NOT give the full correct code solution. Your goal is to guide the student to the answer.
Return the response as plain text/markdown.`;

  try {
    return await callGroqApi(
      [
        { role: "system", content: "You are a helpful coding tutor." },
        { role: "user", content: prompt },
      ],
      "text",
    );
  } catch (error) {
    console.error("AI Debug error:", error);
    return "The AI Tutor is currently unavailable. Please check your syntax and logic carefully.";
  }
};

export const parseExcelToQuestions = async (rawJsonData) => {
  const prompt = `You are a helpful AI assistant that converts raw Excel data into a standard quiz question format.
The user uploaded an Excel file containing questions. We parsed it into the following raw JSON array:
${JSON.stringify(rawJsonData, null, 2)}

Your task is to extract all questions and map them to our system schema. Use your best judgment to determine what column means "Question Text", "Correct Answer", etc.
Ensure every question has a "type" (mcq, true_false, multiple_select, short_answer, paragraph, file_upload, coding).
If a question has multiple options (e.g. Option A, B, C), it is likely "mcq" or "multiple_select". If the question provides starter code and test cases, it is "coding".
For MCQs, ensure the "options" array contains the possible choices, and "correctAnswer" matches one of them. For coding, include "starterCode" and "testCases" array.

Return ONLY a valid JSON object containing a "questions" array.
Example Output Format:
{
  "questions": [
    {
      "id": "q_ai_123",
      "type": "mcq",
      "question": "What is 2+2?",
      "options": ["2", "3", "4", "5"],
      "correctAnswer": "4",
      "marks": 2
    }
  ]
}
`;

  try {
    const responseContent = await callGroqApi(
      [
        {
          role: "system",
          content: "You are an intelligent data parser that outputs strictly valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      "json",
    );
    const parsed = JSON.parse(responseContent);

    // Inject a unique ID for each question
    const questions = (parsed.questions || []).map((q, idx) => ({
      ...q,
      id: `q_ai_excel_${Date.now()}_${idx}`,
    }));
    return questions;
  } catch (err) {
    console.error("AI Excel Parse Error:", err);
    throw new Error("Failed to parse Excel data using AI.");
  }
};
