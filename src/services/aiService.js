const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const handleApiError = (e) => {
  const msg = e.message || "";
  if (msg.includes("401")) {
    return "Invalid Groq API key. Please check your .env file.";
  }
  if (msg.includes("429")) {
    return "Groq API rate limit exceeded or quota exhausted. Please try again later.";
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch")) {
    return "Network error connecting to Groq API. Please check your connection.";
  }
  return "AI generation failed: " + msg;
};

const generateWithFallback = async (prompt) => {
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "Groq API key is not configured. Please add VITE_GROQ_API_KEY to your .env file.",
    );
  }
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (e) {
    throw new Error(handleApiError(e));
  }
};

export const AIService = {
  isConfigured: () => !!apiKey,

  generateText: async (prompt) => {
    try {
      const result = await generateWithFallback(prompt);
      return result.trim();
    } catch (e) {
      console.error("AI generateText error:", e);
      throw new Error(e.message);
    }
  },

  generateCourseTitle: async (topic, categoryName = "General", level = "Beginner") => {
    try {
      const prompt = `Generate a catchy, professional, and marketable course title for a ${level}-level course in the "${categoryName}" category about: ${topic}. Respond with ONLY the title itself, no quotes, no extra text.`;
      const result = await generateWithFallback(prompt);
      return result.trim();
    } catch (e) {
      console.error("AI generateCourseTitle error:", e);
      throw new Error(e.message);
    }
  },

  generateBriefDescription: async (title, categoryName = "General", level = "Beginner") => {
    try {
      const prompt = `Write a short, engaging 1-2 sentence brief description for a ${level}-level professional course titled "${title}" in the "${categoryName}" category. Respond with ONLY the text, no extra characters or quotes.`;
      const result = await generateWithFallback(prompt);
      return result.trim();
    } catch (e) {
      console.error("AI generateBriefDescription error:", e);
      throw new Error(e.message);
    }
  },

  generateFullDescription: async (title, categoryName = "General", level = "Beginner") => {
    try {
      const prompt = `Write a comprehensive, professional, and engaging course description for a ${level}-level course titled "${title}" in the "${categoryName}" category. Make it around 3-4 paragraphs. Highlight what the student will learn and why it matters. Do not include a title or introduction header, just the description text.`;
      const result = await generateWithFallback(prompt);
      return result.trim();
    } catch (e) {
      console.error("AI generateFullDescription error:", e);
      throw new Error(e.message);
    }
  },

  generateLearningOutcomes: async (title, categoryName = "General", level = "Beginner") => {
    try {
      const prompt = `List 3 to 5 clear, actionable learning outcomes for a ${level}-level course titled "${title}" in the "${categoryName}" category. Return the result strictly as a valid JSON array of strings, with no markdown formatting or extra text. Example format: ["Understand the basics", "Build a project"]`;
      let text = await generateWithFallback(prompt);
      text = text.trim();
      if (text.startsWith("```json")) text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      if (text.startsWith("```")) text = text.replace(/```/g, "").trim();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("AI did not return an array");
      return parsed;
    } catch (e) {
      console.error("AI generateLearningOutcomes error:", e);
      throw new Error(e.message);
    }
  },

  generatePrerequisites: async (title, categoryName = "General", level = "Beginner") => {
    try {
      const prompt = `List 2 to 4 prerequisites for taking a ${level}-level course titled "${title}" in the "${categoryName}" category. If it's a beginner course with no prerequisites, just return an array like ["No prior experience required"]. Return the result strictly as a valid JSON array of strings, with no markdown formatting or extra text.`;
      let text = await generateWithFallback(prompt);
      text = text.trim();
      if (text.startsWith("```json")) text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      if (text.startsWith("```")) text = text.replace(/```/g, "").trim();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("AI did not return an array");
      return parsed;
    } catch (e) {
      console.error("AI generatePrerequisites error:", e);
      throw new Error(e.message);
    }
  },

  generateTargetAudience: async (title, categoryName = "General", level = "Beginner") => {
    try {
      const prompt = `List 2 to 4 types of people or professionals who would benefit from a ${level}-level course titled "${title}" in the "${categoryName}" category. Return the result strictly as a valid JSON array of strings, with no markdown formatting or extra text.`;
      let text = await generateWithFallback(prompt);
      text = text.trim();
      if (text.startsWith("```json")) text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      if (text.startsWith("```")) text = text.replace(/```/g, "").trim();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("AI did not return an array");
      return parsed;
    } catch (e) {
      console.error("AI generateTargetAudience error:", e);
      throw new Error(e.message);
    }
  },

  generateCourseHighlights: async (title, categoryName = "General", level = "Beginner") => {
    try {
      const prompt = `List 3 to 5 key course highlights for a ${level}-level course titled "${title}" in the "${categoryName}" category. Return the result strictly as a valid JSON array of strings.`;
      let text = await generateWithFallback(prompt);
      text = text.trim();
      if (text.startsWith("```json")) text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      if (text.startsWith("```")) text = text.replace(/```/g, "").trim();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("AI did not return an array");
      return parsed;
    } catch (e) {
      console.error("AI generateCourseHighlights error:", e);
      throw new Error(e.message);
    }
  },

  generateCareerOpportunities: async (title, categoryName = "General", level = "Beginner") => {
    try {
      const prompt = `List 2 to 4 potential career opportunities for a ${level}-level course titled "${title}" in the "${categoryName}" category. Return the result strictly as a valid JSON array of strings.`;
      let text = await generateWithFallback(prompt);
      text = text.trim();
      if (text.startsWith("```json")) text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      if (text.startsWith("```")) text = text.replace(/```/g, "").trim();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("AI did not return an array");
      return parsed;
    } catch (e) {
      console.error("AI generateCareerOpportunities error:", e);
      throw new Error(e.message);
    }
  },

  generateCategoryDescription: async (name) => {
    try {
      const prompt = `Write a comprehensive, professional, and engaging 2-3 sentence description for a learning category named "${name}". Respond with ONLY the text, no extra characters or quotes.`;
      const result = await generateWithFallback(prompt);
      return result.trim();
    } catch (e) {
      console.error("AI generateCategoryDescription error:", e);
      throw new Error(e.message);
    }
  },

  generateEventDescription: async (title, location, isOnline) => {
    try {
      const venue = isOnline ? "an online/virtual" : "an in-person";
      const prompt = "Write a professional, engaging 2-3 sentence event description for a " + venue + " event titled \"" + title + "\"" + (location ? " at \"" + location + "\"" : "") + ". Make it sound inviting and informative. Respond with ONLY the text, no extra characters or quotes.";
      const result = await generateWithFallback(prompt);
      return result.trim();
    } catch (e) {
      console.error("AI generateEventDescription error:", e);
      throw new Error(e.message);
    }
  },
};