<?php

namespace Database\Seeders;

use App\Models\AppNotification;
use App\Models\ClassModel;
use App\Models\ExamLog;
use App\Models\Question;
use App\Models\QuestionBankItem;
use App\Models\Quiz;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─────────────────────────────────────────────
        // USERS
        // ─────────────────────────────────────────────
        $admin = User::create([
            'first_name'        => 'Alex',
            'last_name'         => 'Admin',
            'id_number'         => 'ADM000001',
            'email'             => 'admin@quizai.com',
            'password'          => Hash::make('password'),
            'role'              => 'admin',
            'email_verified_at' => now(),
        ]);

        $teacher1 = User::create([
            'first_name'        => 'Maria',
            'last_name'         => 'Santos',
            'id_number'         => 'TCH100001',
            'email'             => 'teacher@quizai.com',
            'password'          => Hash::make('password'),
            'role'              => 'teacher',
            'email_verified_at' => now(),
        ]);

        $teacher2 = User::create([
            'first_name'        => 'Jose',
            'last_name'         => 'Reyes',
            'id_number'         => 'TCH100002',
            'email'             => 'teacher2@quizai.com',
            'password'          => Hash::make('password'),
            'role'              => 'teacher',
            'email_verified_at' => now(),
        ]);

        $s1 = User::create([
            'first_name'        => 'Ana',
            'last_name'         => 'Cruz',
            'id_number'         => 'STU200001',
            'email'             => 'student1@quizai.com',
            'password'          => Hash::make('password'),
            'role'              => 'student',
            'email_verified_at' => now(),
        ]);

        $s2 = User::create([
            'first_name'        => 'Ben',
            'last_name'         => 'Torres',
            'id_number'         => 'STU200002',
            'email'             => 'student2@quizai.com',
            'password'          => Hash::make('password'),
            'role'              => 'student',
            'email_verified_at' => now(),
        ]);

        $s3 = User::create([
            'first_name'        => 'Carla',
            'last_name'         => 'Lim',
            'id_number'         => 'STU200003',
            'email'             => 'student3@quizai.com',
            'password'          => Hash::make('password'),
            'role'              => 'student',
            'email_verified_at' => now(),
        ]);

        $s4 = User::create([
            'first_name'        => 'David',
            'last_name'         => 'Tan',
            'id_number'         => 'STU200004',
            'email'             => 'student4@quizai.com',
            'password'          => Hash::make('password'),
            'role'              => 'student',
            'email_verified_at' => now(),
        ]);

        $s5 = User::create([
            'first_name'        => 'Eva',
            'last_name'         => 'Diaz',
            'id_number'         => 'STU200005',
            'email'             => 'student5@quizai.com',
            'password'          => Hash::make('password'),
            'role'              => 'student',
            'email_verified_at' => now(),
        ]);

        $s6 = User::create([
            'first_name'        => 'Frank',
            'last_name'         => 'Go',
            'id_number'         => 'STU200006',
            'email'             => 'student6@quizai.com',
            'password'          => Hash::make('password'),
            'role'              => 'student',
            'email_verified_at' => now(),
        ]);

        // ─────────────────────────────────────────────
        // CLASSES
        // ─────────────────────────────────────────────
        $cs101 = ClassModel::create([
            'user_id'     => $teacher1->id,
            'name'        => 'CS101 — Intro to JavaScript',
            'description' => 'Fundamentals of JavaScript programming for beginners.',
            'invite_code' => 'CS101ABC',
        ]);

        $cs201 = ClassModel::create([
            'user_id'     => $teacher1->id,
            'name'        => 'CS201 — Data Structures',
            'description' => 'Arrays, linked lists, trees, and graphs in JavaScript.',
            'invite_code' => 'CS201DEF',
        ]);

        $math101 = ClassModel::create([
            'user_id'     => $teacher2->id,
            'name'        => 'MATH101 — Calculus Fundamentals',
            'description' => 'Limits, derivatives, and integrals.',
            'invite_code' => 'MATH101G',
        ]);

        // Enroll students
        $cs101->students()->attach([$s1->id, $s2->id, $s3->id, $s4->id]);
        $cs201->students()->attach([$s1->id, $s3->id, $s5->id]);
        $math101->students()->attach([$s2->id, $s4->id, $s6->id]);

        // ─────────────────────────────────────────────
        // QUIZ 1 — JavaScript Basics Quiz (CS101, published)
        // 5 MC + 3 True/False = 8 pts
        // ─────────────────────────────────────────────
        $quiz1 = Quiz::create([
            'class_id'    => $cs101->id,
            'title'       => 'JavaScript Basics Quiz',
            'description' => 'Tests your understanding of fundamental JavaScript concepts including variables, data types, and built-in methods.',
            'time_limit'  => 30,
            'status'      => 'published',
        ]);

        $q1 = Question::create(['quiz_id' => $quiz1->id, 'type' => 'multiple_choice', 'order' => 1, 'points' => 1, 'content' => [
            'question'       => 'What keyword declares a variable in JavaScript that cannot be reassigned?',
            'options'        => ['var', 'let', 'const', 'function'],
            'correct_answer' => 'const',
        ]]);
        $q2 = Question::create(['quiz_id' => $quiz1->id, 'type' => 'multiple_choice', 'order' => 2, 'points' => 1, 'content' => [
            'question'       => 'Which array method adds an element to the end of an array?',
            'options'        => ['push()', 'pop()', 'shift()', 'unshift()'],
            'correct_answer' => 'push()',
        ]]);
        $q3 = Question::create(['quiz_id' => $quiz1->id, 'type' => 'multiple_choice', 'order' => 3, 'points' => 1, 'content' => [
            'question'       => 'What does `typeof null` return in JavaScript?',
            'options'        => ['null', 'undefined', 'object', 'string'],
            'correct_answer' => 'object',
        ]]);
        $q4 = Question::create(['quiz_id' => $quiz1->id, 'type' => 'multiple_choice', 'order' => 4, 'points' => 1, 'content' => [
            'question'       => 'Which method converts a JSON string to a JavaScript object?',
            'options'        => ['JSON.parse()', 'JSON.stringify()', 'JSON.convert()', 'JSON.toObject()'],
            'correct_answer' => 'JSON.parse()',
        ]]);
        $q5 = Question::create(['quiz_id' => $quiz1->id, 'type' => 'multiple_choice', 'order' => 5, 'points' => 1, 'content' => [
            'question'       => 'What is the output of `console.log(2 + \'2\')` in JavaScript?',
            'options'        => ['4', '22', 'NaN', 'Error'],
            'correct_answer' => '22',
        ]]);
        $q6 = Question::create(['quiz_id' => $quiz1->id, 'type' => 'true_false', 'order' => 6, 'points' => 1, 'content' => [
            'question'       => 'JavaScript is a statically typed programming language.',
            'correct_answer' => false,
        ]]);
        $q7 = Question::create(['quiz_id' => $quiz1->id, 'type' => 'true_false', 'order' => 7, 'points' => 1, 'content' => [
            'question'       => 'Arrow functions have their own `this` binding.',
            'correct_answer' => false,
        ]]);
        $q8 = Question::create(['quiz_id' => $quiz1->id, 'type' => 'true_false', 'order' => 8, 'points' => 1, 'content' => [
            'question'       => 'The `===` operator checks both value and type in JavaScript.',
            'correct_answer' => true,
        ]]);

        // Student 1 (Ana) — 8/8 = 100%
        $sub1q1 = Submission::create([
            'quiz_id'      => $quiz1->id,
            'user_id'      => $s1->id,
            'answers'      => [
                $q1->id => 'const',
                $q2->id => 'push()',
                $q3->id => 'object',
                $q4->id => 'JSON.parse()',
                $q5->id => '22',
                $q6->id => 'false',
                $q7->id => 'false',
                $q8->id => 'true',
            ],
            'earned_points' => 8,
            'total_points'  => 8,
            'score'         => 100.00,
            'submitted_at'  => now()->subDays(3),
        ]);

        // Student 2 (Ben) — 6/8 = 75% (wrong q6 and q7)
        Submission::create([
            'quiz_id'      => $quiz1->id,
            'user_id'      => $s2->id,
            'answers'      => [
                $q1->id => 'const',
                $q2->id => 'push()',
                $q3->id => 'object',
                $q4->id => 'JSON.parse()',
                $q5->id => '22',
                $q6->id => 'true',
                $q7->id => 'true',
                $q8->id => 'true',
            ],
            'earned_points' => 6,
            'total_points'  => 8,
            'score'         => 75.00,
            'submitted_at'  => now()->subDays(2),
        ]);

        // Student 3 (Carla) — 5/8 = 62.5% (wrong q5, q6, q7)
        Submission::create([
            'quiz_id'      => $quiz1->id,
            'user_id'      => $s3->id,
            'answers'      => [
                $q1->id => 'const',
                $q2->id => 'push()',
                $q3->id => 'object',
                $q4->id => 'JSON.parse()',
                $q5->id => '4',
                $q6->id => 'true',
                $q7->id => 'true',
                $q8->id => 'true',
            ],
            'earned_points' => 5,
            'total_points'  => 8,
            'score'         => 62.50,
            'submitted_at'  => now()->subDays(2),
        ]);

        // Student 4 (David) — 3/8 = 37.5% (correct only q1, q2, q8) + anti-cheat logs
        $sub4q1 = Submission::create([
            'quiz_id'      => $quiz1->id,
            'user_id'      => $s4->id,
            'answers'      => [
                $q1->id => 'const',
                $q2->id => 'push()',
                $q3->id => 'null',
                $q4->id => 'JSON.stringify()',
                $q5->id => '4',
                $q6->id => 'true',
                $q7->id => 'true',
                $q8->id => 'true',
            ],
            'earned_points' => 3,
            'total_points'  => 8,
            'score'         => 37.50,
            'submitted_at'  => now()->subDays(1),
        ]);

        // Anti-cheat logs for David's submission
        ExamLog::create(['submission_id' => $sub4q1->id, 'event_type' => 'tab_switch', 'metadata' => ['count' => 1], 'created_at' => now()->subDays(1)->addMinutes(5)]);
        ExamLog::create(['submission_id' => $sub4q1->id, 'event_type' => 'tab_switch', 'metadata' => ['count' => 2], 'created_at' => now()->subDays(1)->addMinutes(12)]);
        ExamLog::create(['submission_id' => $sub4q1->id, 'event_type' => 'copy', 'metadata' => ['element' => 'question'], 'created_at' => now()->subDays(1)->addMinutes(18)]);

        // ─────────────────────────────────────────────
        // QUIZ 2 — ES6 Features Draft (CS101, draft)
        // 3 identification questions — no submissions
        // ─────────────────────────────────────────────
        $quiz2 = Quiz::create([
            'class_id'    => $cs101->id,
            'title'       => 'ES6 Features',
            'description' => 'Modern JavaScript syntax: destructuring, arrow functions, template literals.',
            'time_limit'  => 20,
            'status'      => 'draft',
        ]);

        Question::create(['quiz_id' => $quiz2->id, 'type' => 'identification', 'order' => 1, 'points' => 1, 'content' => [
            'question'        => 'What ES6 feature allows you to extract values from arrays or objects into distinct variables?',
            'correct_answers' => ['destructuring', 'destructuring assignment'],
        ]]);
        Question::create(['quiz_id' => $quiz2->id, 'type' => 'identification', 'order' => 2, 'points' => 1, 'content' => [
            'question'        => 'What is the ES6 shorthand for writing anonymous functions using the `=>` syntax?',
            'correct_answers' => ['arrow function', 'arrow functions'],
        ]]);
        Question::create(['quiz_id' => $quiz2->id, 'type' => 'identification', 'order' => 3, 'points' => 1, 'content' => [
            'question'        => 'What is the name of the ES6 string syntax that uses backticks and allows embedded expressions with ${} ?',
            'correct_answers' => ['template literal', 'template literals', 'template string'],
        ]]);

        // ─────────────────────────────────────────────
        // QUIZ 3 — Essay & Coding Quiz (CS101, published)
        // 1 essay (5 pts) + 1 coding (10 pts) = 15 pts
        // ─────────────────────────────────────────────
        $quiz3 = Quiz::create([
            'class_id'           => $cs101->id,
            'title'              => 'Essay & Coding Quiz',
            'description'        => 'Tests your ability to explain concepts and write functional JavaScript code.',
            'time_limit'         => 60,
            'status'             => 'published',
            'allow_partial_credit' => true,
        ]);

        $q3e = Question::create(['quiz_id' => $quiz3->id, 'type' => 'essay', 'order' => 1, 'points' => 5, 'content' => [
            'question'       => 'Explain the difference between synchronous and asynchronous programming in JavaScript. Provide at least one example of each.',
            'grading_rubric' => 'Award up to 2 pts for synchronous explanation, 2 pts for async explanation, 1 pt for correct examples.',
        ]]);
        $q3c = Question::create(['quiz_id' => $quiz3->id, 'type' => 'coding', 'order' => 2, 'points' => 10, 'content' => [
            'question' => 'Write a JavaScript function called `sumEven` that takes an array of numbers and returns the sum of all even numbers in the array.',
            'language' => 'JavaScript',
        ]]);

        // Student 1 (Ana) — submitted, awaiting manual grading
        Submission::create([
            'quiz_id'       => $quiz3->id,
            'user_id'       => $s1->id,
            'answers'       => [
                $q3e->id => "Synchronous programming executes code line by line, waiting for each operation to complete before moving to the next. For example:\nconsole.log('one');\nconsole.log('two'); // always prints after 'one'\n\nAsynchronous programming allows operations to run in the background without blocking. For example, setTimeout(() => console.log('async'), 1000) schedules a callback while the rest of the code continues running.",
                $q3c->id => "function sumEven(arr) {\n  return arr.filter(n => n % 2 === 0).reduce((sum, n) => sum + n, 0);\n}",
            ],
            'manual_grades'  => null,
            'earned_points'  => 0,
            'total_points'   => 15,
            'score'          => 0.00,
            'submitted_at'   => now()->subDays(2),
        ]);

        // Student 2 (Ben) — submitted and graded (essay 4/5, coding 8/10) = 12/15 = 80%
        Submission::create([
            'quiz_id'       => $quiz3->id,
            'user_id'       => $s2->id,
            'answers'       => [
                $q3e->id => "Synchronous code runs in order and blocks until done. Async code doesn't block — it uses callbacks, promises, or async/await.\n\nSync example: let x = 1 + 1;\nAsync example: fetch('/api/data').then(res => res.json()).then(data => console.log(data));",
                $q3c->id => "function sumEven(arr) {\n  let total = 0;\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] % 2 === 0) {\n      total += arr[i];\n    }\n  }\n  return total;\n}",
            ],
            'manual_grades'  => [
                $q3e->id => 4,
                $q3c->id => 8,
            ],
            'earned_points'  => 12,
            'total_points'   => 15,
            'score'          => 80.00,
            'submitted_at'   => now()->subDays(1),
        ]);

        // ─────────────────────────────────────────────
        // QUIZ 4 — Arrays & Linked Lists (CS201, published)
        // section_header + 4 MC + 2 ID = 6 scored pts
        // ─────────────────────────────────────────────
        $quiz4 = Quiz::create([
            'class_id'    => $cs201->id,
            'title'       => 'Arrays & Linked Lists',
            'description' => 'Covers array operations, time complexity, and singly linked list basics.',
            'time_limit'  => 25,
            'status'      => 'published',
        ]);

        Question::create(['quiz_id' => $quiz4->id, 'type' => 'section_header', 'order' => 1, 'points' => 0, 'content' => [
            'title'       => 'Part 1: Arrays',
            'description' => 'Questions about array operations and complexity.',
        ]]);
        $q4a = Question::create(['quiz_id' => $quiz4->id, 'type' => 'multiple_choice', 'order' => 2, 'points' => 1, 'content' => [
            'question'       => 'What is the time complexity of accessing an element by index in an array?',
            'options'        => ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
            'correct_answer' => 'O(1)',
        ]]);
        $q4b = Question::create(['quiz_id' => $quiz4->id, 'type' => 'multiple_choice', 'order' => 3, 'points' => 1, 'content' => [
            'question'       => 'Which data structure follows LIFO (Last In, First Out) ordering?',
            'options'        => ['Queue', 'Stack', 'Array', 'Linked List'],
            'correct_answer' => 'Stack',
        ]]);
        $q4c = Question::create(['quiz_id' => $quiz4->id, 'type' => 'multiple_choice', 'order' => 4, 'points' => 1, 'content' => [
            'question'       => 'Which JavaScript array method removes and returns the last element?',
            'options'        => ['shift()', 'pop()', 'splice()', 'slice()'],
            'correct_answer' => 'pop()',
        ]]);
        $q4d = Question::create(['quiz_id' => $quiz4->id, 'type' => 'multiple_choice', 'order' => 5, 'points' => 1, 'content' => [
            'question'       => 'In a singly linked list, each node contains data and a reference to the:',
            'options'        => ['previous node', 'next node', 'both nodes', 'head node'],
            'correct_answer' => 'next node',
        ]]);
        $q4e = Question::create(['quiz_id' => $quiz4->id, 'type' => 'identification', 'order' => 6, 'points' => 1, 'content' => [
            'question'        => 'What is the name of the property in a linked list node that points to the following node?',
            'correct_answers' => ['next', 'next pointer', 'next node'],
        ]]);
        $q4f = Question::create(['quiz_id' => $quiz4->id, 'type' => 'identification', 'order' => 7, 'points' => 1, 'content' => [
            'question'        => 'What is the term for the first node in a linked list?',
            'correct_answers' => ['head', 'head node', 'first node', 'the first node'],
        ]]);

        // Student 1 (Ana) — 5/6 = 83.33% (wrong q4f)
        Submission::create([
            'quiz_id'       => $quiz4->id,
            'user_id'       => $s1->id,
            'answers'       => [
                $q4a->id => 'O(1)',
                $q4b->id => 'Stack',
                $q4c->id => 'pop()',
                $q4d->id => 'next node',
                $q4e->id => 'next',
                $q4f->id => 'last node',
            ],
            'earned_points'  => 5,
            'total_points'   => 6,
            'score'          => 83.33,
            'submitted_at'   => now()->subDays(3),
        ]);

        // Student 3 (Carla) — 3/6 = 50% (correct q4a, q4b, q4e; wrong q4c, q4d, q4f)
        Submission::create([
            'quiz_id'       => $quiz4->id,
            'user_id'       => $s3->id,
            'answers'       => [
                $q4a->id => 'O(1)',
                $q4b->id => 'Stack',
                $q4c->id => 'shift()',
                $q4d->id => 'previous node',
                $q4e->id => 'next',
                $q4f->id => 'tail',
            ],
            'earned_points'  => 3,
            'total_points'   => 6,
            'score'          => 50.00,
            'submitted_at'   => now()->subDays(2),
        ]);

        // ─────────────────────────────────────────────
        // QUIZ 5 — Trees & Graphs Draft (CS201, draft)
        // 3 questions — no submissions (useful for testing editor)
        // ─────────────────────────────────────────────
        $quiz5 = Quiz::create([
            'class_id'    => $cs201->id,
            'title'       => 'Trees & Graphs',
            'description' => 'Binary trees, traversal algorithms, and graph representations.',
            'time_limit'  => 30,
            'status'      => 'draft',
        ]);

        Question::create(['quiz_id' => $quiz5->id, 'type' => 'multiple_choice', 'order' => 1, 'points' => 1, 'content' => [
            'question'       => 'In a binary tree, each node can have at most how many children?',
            'options'        => ['1', '2', '3', 'unlimited'],
            'correct_answer' => '2',
        ]]);
        Question::create(['quiz_id' => $quiz5->id, 'type' => 'true_false', 'order' => 2, 'points' => 1, 'content' => [
            'question'       => 'Depth-First Search (DFS) uses a queue data structure internally.',
            'correct_answer' => false,
        ]]);
        Question::create(['quiz_id' => $quiz5->id, 'type' => 'identification', 'order' => 3, 'points' => 1, 'content' => [
            'question'        => 'What traversal method visits the root node, then the left subtree, then the right subtree?',
            'correct_answers' => ['pre-order', 'preorder', 'pre order traversal', 'preorder traversal'],
        ]]);

        // ─────────────────────────────────────────────
        // QUIZ 6 — Limits & Continuity (MATH101, published)
        // 5 MC + 2 TF = 7 pts
        // ─────────────────────────────────────────────
        $quiz6 = Quiz::create([
            'class_id'    => $math101->id,
            'title'       => 'Limits & Continuity',
            'description' => 'Evaluating limits, types of discontinuity, and the definition of continuity.',
            'time_limit'  => 35,
            'status'      => 'published',
        ]);

        $q6a = Question::create(['quiz_id' => $quiz6->id, 'type' => 'multiple_choice', 'order' => 1, 'points' => 1, 'content' => [
            'question'       => 'What is the value of lim(x→0) of (sin x)/x?',
            'options'        => ['0', '1', '∞', 'undefined'],
            'correct_answer' => '1',
        ]]);
        $q6b = Question::create(['quiz_id' => $quiz6->id, 'type' => 'multiple_choice', 'order' => 2, 'points' => 1, 'content' => [
            'question'       => 'A function f is continuous at x = a if it is defined at x = a, the limit exists, and:',
            'options'        => ['f(a) = 0', 'f(a) equals the limit', 'the limit is infinite', 'f(a) is positive'],
            'correct_answer' => 'f(a) equals the limit',
        ]]);
        $q6c = Question::create(['quiz_id' => $quiz6->id, 'type' => 'multiple_choice', 'order' => 3, 'points' => 1, 'content' => [
            'question'       => 'What is lim(x→∞) of 1/x?',
            'options'        => ['1', '∞', '0', '-1'],
            'correct_answer' => '0',
        ]]);
        $q6d = Question::create(['quiz_id' => $quiz6->id, 'type' => 'multiple_choice', 'order' => 4, 'points' => 1, 'content' => [
            'question'       => 'Which of the following is NOT a type of discontinuity?',
            'options'        => ['Jump', 'Removable', 'Continuous', 'Infinite'],
            'correct_answer' => 'Continuous',
        ]]);
        $q6e = Question::create(['quiz_id' => $quiz6->id, 'type' => 'multiple_choice', 'order' => 5, 'points' => 1, 'content' => [
            'question'       => 'The derivative of a function at a point represents:',
            'options'        => ['the area under the curve', 'the slope of the tangent line', 'the y-intercept', 'the average value over an interval'],
            'correct_answer' => 'the slope of the tangent line',
        ]]);
        $q6f = Question::create(['quiz_id' => $quiz6->id, 'type' => 'true_false', 'order' => 6, 'points' => 1, 'content' => [
            'question'       => 'If a function has a limit at x = a, then it must be continuous at x = a.',
            'correct_answer' => false,
        ]]);
        $q6g = Question::create(['quiz_id' => $quiz6->id, 'type' => 'true_false', 'order' => 7, 'points' => 1, 'content' => [
            'question'       => 'Every polynomial function is continuous everywhere on the real number line.',
            'correct_answer' => true,
        ]]);

        // Student 2 (Ben) — 7/7 = 100%
        Submission::create([
            'quiz_id'       => $quiz6->id,
            'user_id'       => $s2->id,
            'answers'       => [
                $q6a->id => '1',
                $q6b->id => 'f(a) equals the limit',
                $q6c->id => '0',
                $q6d->id => 'Continuous',
                $q6e->id => 'the slope of the tangent line',
                $q6f->id => 'false',
                $q6g->id => 'true',
            ],
            'earned_points'  => 7,
            'total_points'   => 7,
            'score'          => 100.00,
            'submitted_at'   => now()->subDays(4),
        ]);

        // Student 4 (David) — 4/7 = 57.14% (wrong q6c, q6d, q6f)
        Submission::create([
            'quiz_id'       => $quiz6->id,
            'user_id'       => $s4->id,
            'answers'       => [
                $q6a->id => '1',
                $q6b->id => 'f(a) equals the limit',
                $q6c->id => '1',
                $q6d->id => 'Jump',
                $q6e->id => 'the slope of the tangent line',
                $q6f->id => 'true',
                $q6g->id => 'true',
            ],
            'earned_points'  => 4,
            'total_points'   => 7,
            'score'          => 57.14,
            'submitted_at'   => now()->subDays(3),
        ]);

        // Student 6 (Frank) — 2/7 = 28.57% (correct only q6a, q6g)
        Submission::create([
            'quiz_id'       => $quiz6->id,
            'user_id'       => $s6->id,
            'answers'       => [
                $q6a->id => '1',
                $q6b->id => 'f(a) = 0',
                $q6c->id => '1',
                $q6d->id => 'Jump',
                $q6e->id => 'the area under the curve',
                $q6f->id => 'true',
                $q6g->id => 'true',
            ],
            'earned_points'  => 2,
            'total_points'   => 7,
            'score'          => 28.57,
            'submitted_at'   => now()->subDays(3),
        ]);

        // ─────────────────────────────────────────────
        // QUIZ 7 — Derivatives (MATH101, published but available tomorrow)
        // 4 questions — no submissions yet (upcoming on dashboard)
        // ─────────────────────────────────────────────
        Quiz::create([
            'class_id'      => $math101->id,
            'title'         => 'Derivatives',
            'description'   => 'Power rule, product rule, chain rule, and applications of differentiation.',
            'time_limit'    => 40,
            'status'        => 'published',
            'available_from' => now()->addDay(),
        ]);

        // Note: Questions are intentionally minimal for this quiz (it's upcoming/not yet available)
        $quiz7 = Quiz::where('title', 'Derivatives')->first();
        Question::create(['quiz_id' => $quiz7->id, 'type' => 'multiple_choice', 'order' => 1, 'points' => 2, 'content' => [
            'question'       => 'What is the derivative of x^n with respect to x?',
            'options'        => ['nx^(n-1)', 'x^(n-1)', 'n*x^n', '(n-1)x^n'],
            'correct_answer' => 'nx^(n-1)',
        ]]);
        Question::create(['quiz_id' => $quiz7->id, 'type' => 'true_false', 'order' => 2, 'points' => 1, 'content' => [
            'question'       => 'The derivative of any constant is 0.',
            'correct_answer' => true,
        ]]);
        Question::create(['quiz_id' => $quiz7->id, 'type' => 'multiple_choice', 'order' => 3, 'points' => 2, 'content' => [
            'question'       => 'Which rule is used to differentiate a product of two functions f(x)·g(x)?',
            'options'        => ['Chain Rule', 'Quotient Rule', 'Product Rule', 'Power Rule'],
            'correct_answer' => 'Product Rule',
        ]]);
        Question::create(['quiz_id' => $quiz7->id, 'type' => 'identification', 'order' => 4, 'points' => 1, 'content' => [
            'question'        => 'What is the name of the notation dy/dx for derivatives?',
            'correct_answers' => ['leibniz notation', "leibniz's notation", 'leibniz'],
        ]]);

        // ─────────────────────────────────────────────
        // QUESTION BANK (teacher1 — Maria Santos)
        // ─────────────────────────────────────────────
        QuestionBankItem::create([
            'user_id'    => $teacher1->id,
            'type'       => 'multiple_choice',
            'subject'    => 'JavaScript',
            'difficulty' => 'easy',
            'points'     => 1,
            'content'    => [
                'question'       => 'Which of the following is a valid JavaScript variable declaration?',
                'options'        => ['let count = 0;', 'variable count = 0;', 'int count = 0;', 'declare count = 0;'],
                'correct_answer' => 'let count = 0;',
            ],
        ]);

        QuestionBankItem::create([
            'user_id'    => $teacher1->id,
            'type'       => 'true_false',
            'subject'    => 'JavaScript',
            'difficulty' => 'medium',
            'points'     => 1,
            'content'    => [
                'question'       => 'Arrow functions do not have their own `this` context and inherit it from the surrounding scope.',
                'correct_answer' => true,
            ],
        ]);

        QuestionBankItem::create([
            'user_id'    => $teacher1->id,
            'type'       => 'identification',
            'subject'    => 'JavaScript',
            'difficulty' => 'medium',
            'points'     => 1,
            'content'    => [
                'question'        => 'What JavaScript array method returns a new array with each element transformed by a callback function?',
                'correct_answers' => ['map', 'map()', 'Array.map'],
            ],
        ]);

        // ─────────────────────────────────────────────
        // NOTIFICATIONS (for student1 — Ana Cruz)
        // ─────────────────────────────────────────────
        AppNotification::create([
            'user_id'    => $s1->id,
            'type'       => 'quiz_opened',
            'title'      => 'JavaScript Basics Quiz is now open!',
            'body'       => 'JavaScript Basics Quiz is now available for you to take in CS101 — Intro to JavaScript. Good luck!',
            'data'       => ['quiz_id' => $quiz1->id, 'class_name' => 'CS101 — Intro to JavaScript'],
            'read_at'    => null,
            'created_at' => now()->subDays(3),
            'updated_at' => now()->subDays(3),
        ]);

        AppNotification::create([
            'user_id'    => $s1->id,
            'type'       => 'quiz_missed',
            'title'      => 'You missed: Trees & Graphs',
            'body'       => 'The submission window for Trees & Graphs in CS201 — Data Structures has closed. Please contact your instructor if you need an extension.',
            'data'       => ['quiz_id' => $quiz5->id, 'class_name' => 'CS201 — Data Structures'],
            'read_at'    => now()->subDays(1),
            'created_at' => now()->subDays(1),
            'updated_at' => now()->subDays(1),
        ]);

        AppNotification::create([
            'user_id'    => $s1->id,
            'type'       => 'study_tip',
            'title'      => 'Study Tip: Array Traversal Patterns',
            'body'       => 'Before your next Data Structures quiz, review common array traversal patterns: for loops, forEach, map, and filter. Understanding time complexity will help you ace the upcoming exam!',
            'data'       => ['quiz_id' => $quiz4->id, 'score' => 83.33],
            'read_at'    => null,
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);
    }
}
