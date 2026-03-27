# Project Kickoff: AI Quiz Generator (Ground-Up Build)

## The Mission

Build a modern, sleek, and highly functional web application from scratch. This platform will allow educators to generate, manage, and auto-grade quizzes using AI. The application must feature a seamless light/dark mode UI and provide robust anti-cheat mechanisms for students taking exams.

**CRITICAL ARCHITECTURE NOTE:** The system relies on a "Template Component Map" for the quiz UI. The AI backend must output strict question types, which the React frontend will automatically map to reusable UI components.

## Tech Stack

- **Backend & Routing:** Laravel 11
- **Frontend Architecture:** React (via Inertia.js utilizing Laravel Breeze)
- **Styling & Components:** Tailwind CSS + **shadcn/ui** (Dark mode enabled)
- **Database:** MySQL

---

## Execution Phases & Agent Routing

### **Phase 1: Foundation & Backend**

\*Assigned to: **Software Architect** and **Backend Architect\***

1. **Initialize:** Generate the Laravel 13 project with Breeze (React/Inertia stack). Set up the MySQL database connection.
2. **Migrations:** Design and build database migrations for `Users`, `Classes`, `Quizzes`, `Questions`, `Submissions`, and `Exam_Logs`.
3. **Constraint:** The `Questions` table must have a `type` column (enum: 'multiple_choice', 'true_false', 'identification', 'coding', 'essay') and a JSON column for `content` (to hold options, rubrics, etc.).

### **Phase 2: The AI Engine (Strict Formatting)**

\*Assigned to: **AI Engineer\***

1. **Integration:** Build the Laravel Service class responsible for communicating with the LLM API.
2. **Prompt Engineering:** Implement the following strict System Prompt to guarantee the React frontend component map works flawlessly:

   > "You are an expert educational assessment generator. Your task is to generate an exam based on the provided topic.
   > CRITICAL INSTRUCTION: Respond ONLY with a valid JSON array. Do not include markdown formatting or explanations. Every object must include a 'type' key matching one of these exact strings:
   >
   > 1. 'multiple_choice' (Requires: question, options array, correct_answer string, points)
   > 2. 'true_false' (Requires: question, correct_answer boolean, points)
   > 3. 'identification' (Requires: question, correct_answers array of acceptable strings, points)
   > 4. 'coding' (Requires: question, language, grading_rubric_keywords array, points)
   > 5. 'essay' (Requires: question, grading_rubric string, points)"

### **Phase 3: Frontend Component Mapping & Anti-Cheat**

\*Assigned to: **Frontend Developer\***

1. **UI Initialization:** Initialize `shadcn/ui` within the React/Inertia environment. Install necessary base components (Buttons, Cards, Forms, Dialogs) to ensure a highly accessible and sleek interface.
2. **Teacher Dashboard:** Build interfaces to manage classes, trigger the AI generation, and review draft quizzes before publishing using shadcn data tables and forms.
3. **Student Exam View (Component Map):** Implement a `<QuestionRenderer />` component that dynamically selects reusable UI templates (`<MultipleChoice />`, `<CodingEditor />`, etc.) based on the `type` string provided by the backend.
4. **Anti-Cheat System:** Implement the Page Visibility API and Window Blur events in React to log tab-switching behavior, sending debounced logs to the Laravel backend.
