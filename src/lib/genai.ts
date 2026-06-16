import { GoogleGenAI } from '@google/genai';

export interface LearningGapInput {
  attendance: number;
  quiz_score: number;
  assignment_score: number;
  study_time: number;
  weak_topics: string[];
}

export async function generateLearningGapAnalysis(student_data: LearningGapInput): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    // Elegant fallback when GEMINI_API_KEY is not configured yet
    return `### ⚠️ API Key Notice
Your GEMINI_API_KEY is currently not configured in the AI Studio Secrets panel. Below is an offline expert learning gap analysis generated based on pedagogical rules.

---

### pedagogical Gap Analysis Summary
The student performs reasonably well in assignments (${student_data.assignment_score}%) and has decent attendance (${student_data.attendance}%), but exhibits some performance friction in quiz evaluations (${student_data.quiz_score}%). Short weekly study hours (${student_data.study_time} hours/week) are likely insufficient to master complex technical abstractions.

### Identified Weak Areas:
${student_data.weak_topics.map(topic => `* **${topic}**: Core theoretical understanding or rapid assessment recall needs reinforcement.`).join('\n')}

### Strategic Action Plan & Recommendations:
1. **Targeted Concept Deep-Dive**: Spend at least 2 structured hours per week on each weak area: ${student_data.weak_topics.join(', ')}.
2. **Interactive Coding Practice**: 
   * Review array structures, layout, and traversal routines.
   * Draw memory allocation diagrams to understand recursion stack frames physically.
   * Program at least 15 basic algorithms related to stacks, queues, or binary trees.
3. **Structured Study Time**: Increase weekly study time from ${student_data.study_time} hours to **8-10 hours**.
4. **Mock Assessment Drills**: Take practice quizzes under a 15-minute timer twice a week.

*Configure your actual **GEMINI_API_KEY** under **Settings > Secrets** to unlock live custom AI analysis powered by Google Gemini 3.5 Flash.*`;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const prompt = `You are an expert AI Tutor and Pedagogical Gap Analyst, helping a student in a Learning Management Science course.
Analyze the following student performance metrics and identify learning gaps, topic deficiencies, and a detailed step-by-step personalized study plan.

Student Input Profile:
- Attendance Rate: ${student_data.attendance}%
- Average Quiz Score: ${student_data.quiz_score}%
- Average Assignment Score: ${student_data.assignment_score}%
- Weekly Self Study Time: ${student_data.study_time} hours/week
- User-reported or Quiz-identified Weak Topics: ${JSON.stringify(student_data.weak_topics)}

Format the breakdown with an elegant markdown style. Be highly specific, empathetic but objective, and offer concrete coding problems, study duration goals, and conceptual review exercises. Include:
1. Analysis Summary (Observations of scores, attendance correlation)
2. Detailed Weak Area Explanations
3. Strategic Pedagogical Recommendations (Specific problems, daily timelines, resource guides)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    return response.text || "No feedback generated from Gemini.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `### ❌ Gemini API Error
An error occurred while calling the Google Gemini API:
\`\`\`
${error.message || error}
\`\`\`

Here is an offline pedagogical fallback dashboard:
- **Attendance**: ${student_data.attendance}%
- **Quiz Score**: ${student_data.quiz_score}%
- **Assignment Score**: ${student_data.assignment_score}%
- **Weekly Study**: ${student_data.study_time} hours
- **Topics Struggling**: ${student_data.weak_topics.join(', ')}`;
  }
}
