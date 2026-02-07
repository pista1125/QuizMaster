// Dinamikus kvíz kérdés generátor

export interface GeneratedQuestion {
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateAdditionSingle(): GeneratedQuestion {
  const a = getRandomInt(1, 9);
  const b = getRandomInt(1, 9);
  const correct = a + b;

  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const offset = getRandomInt(-3, 3);
    const wrong = correct + offset;
    if (wrong !== correct && wrong > 0 && wrong <= 20) {
      wrongSet.add(wrong);
    }
  }

  return {
    question: `${a} + ${b} = ?`,
    correctAnswer: correct.toString(),
    wrongAnswers: Array.from(wrongSet).map(String),
  };
}

export function generateAdditionDouble(): GeneratedQuestion {
  const a = getRandomInt(10, 99);
  const b = getRandomInt(10, 99);
  const correct = a + b;

  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const offset = getRandomInt(-10, 10);
    const wrong = correct + offset;
    if (wrong !== correct && wrong > 0) {
      wrongSet.add(wrong);
    }
  }

  return {
    question: `${a} + ${b} = ?`,
    correctAnswer: correct.toString(),
    wrongAnswers: Array.from(wrongSet).map(String),
  };
}

export function generateQuestions(
  subtype: 'addition_single' | 'addition_double' | 'fractions' | 'angles',
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  
  for (let i = 0; i < count; i++) {
    switch (subtype) {
      case 'addition_single':
        questions.push(generateAdditionSingle());
        break;
      case 'addition_double':
        questions.push(generateAdditionDouble());
        break;
      default:
        // Statikus kvízekhez nem generálunk
        break;
    }
  }

  return questions;
}

export function shuffleAnswers(correct: string, wrong: string[]): string[] {
  return shuffleArray([correct, ...wrong]);
}

export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
