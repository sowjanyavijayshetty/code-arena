
const { v4: uuidv4 } = require('uuid');

const store = {
  config: {
    timerMinutes: 30,
    adminPassword: 'arena2024',
  },

  questions: [
    {
      id: 'q1',
      title: 'Sum of Two Numbers',
      description: 'Read two integers from input (one per line) and print their sum.',
      difficulty: 'Easy',
      starterCode: {
        javascript: '// Read two numbers and print their sum\nconst a = parseInt(readline());\nconst b = parseInt(readline());\nconsole.log(a + b);',
        python: 'a = int(input())\nb = int(input())\nprint(a + b)',
        java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt(), b = sc.nextInt();\n        System.out.println(a + b);\n    }\n}',
        cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << endl;\n    return 0;\n}',
      },
      testCases: [
        { input: '3\n5', expected: '8' },
        { input: '10\n20', expected: '30' },
        { input: '-1\n1', expected: '0' },
        { input: '100\n200', expected: '300' },
        { input: '0\n0', expected: '0' },
      ],
    },
    {
      id: 'q2',
      title: 'Reverse a String',
      description: 'Read a string from input and print it reversed.',
      difficulty: 'Easy',
      starterCode: {
        javascript: 'const s = readline();\nconsole.log(s.split("").reverse().join(""));',
        python: 's = input()\nprint(s[::-1])',
        java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        System.out.println(new StringBuilder(s).reverse());\n    }\n}',
        cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    string s;\n    cin >> s;\n    reverse(s.begin(), s.end());\n    cout << s << endl;\n    return 0;\n}',
      },
      testCases: [
        { input: 'hello', expected: 'olleh' },
        { input: 'abcd', expected: 'dcba' },
        { input: 'racecar', expected: 'racecar' },
        { input: 'OpenAI', expected: 'IAnepO' },
        { input: 'a', expected: 'a' },
      ],
    },
    {
      id: 'q3',
      title: 'Count Vowels',
      description: 'Read a string and print the count of vowels (a, e, i, o, u) — case-insensitive.',
      difficulty: 'Easy',
      starterCode: {
        javascript: 'const s = readline().toLowerCase();\nconsole.log(s.split("").filter(c => "aeiou".includes(c)).length);',
        python: 's = input().lower()\nprint(sum(1 for c in s if c in "aeiou"))',
        java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().toLowerCase();\n        int count = 0;\n        for (char c : s.toCharArray())\n            if ("aeiou".indexOf(c) >= 0) count++;\n        System.out.println(count);\n    }\n}',
        cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    string s;\n    getline(cin, s);\n    int count = 0;\n    for (char c : s) if (string("aeiouAEIOU").find(c) != string::npos) count++;\n    cout << count << endl;\n    return 0;\n}',
      },
      testCases: [
        { input: 'hello', expected: '2' },
        { input: 'beautiful', expected: '5' },
        { input: 'rhythm', expected: '0' },
        { input: 'AEIOU', expected: '5' },
        { input: 'Code Arena', expected: '5' },
      ],
    },
  ],

  sessions: [
    { id: 'S01', pairedWith: 'S02', questionIndex: 0, status: 'waiting', submission: null, timedOut: false, loggedIn: false, loginTime: null, createdAt: new Date().toISOString() },
    { id: 'S02', pairedWith: 'S01', questionIndex: 0, status: 'waiting', submission: null, timedOut: false, loggedIn: false, loginTime: null, createdAt: new Date().toISOString() },
    { id: 'S03', pairedWith: 'S04', questionIndex: 1, status: 'waiting', submission: null, timedOut: false, loggedIn: false, loginTime: null, createdAt: new Date().toISOString() },
    { id: 'S04', pairedWith: 'S03', questionIndex: 1, status: 'waiting', submission: null, timedOut: false, loggedIn: false, loginTime: null, createdAt: new Date().toISOString() },
    { id: 'S05', pairedWith: 'S06', questionIndex: 2, status: 'waiting', submission: null, timedOut: false, loggedIn: false, loginTime: null, createdAt: new Date().toISOString() },
    { id: 'S06', pairedWith: 'S05', questionIndex: 2, status: 'waiting', submission: null, timedOut: false, loggedIn: false, loginTime: null, createdAt: new Date().toISOString() },
  ],
};

module.exports = store;
