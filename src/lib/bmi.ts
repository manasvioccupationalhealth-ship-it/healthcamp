export interface BmiResult {
  bmi: number;
  category: "Underweight" | "Normal" | "Overweight" | "Obese";
  colorClass: string;
  badgeBg: string;
}

export function calculateBmi(heightCm: number, weightKg: number): BmiResult {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return {
      bmi: 0,
      category: "Normal",
      colorClass: "text-slate-500",
      badgeBg: "bg-slate-100 text-slate-700",
    };
  }

  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 10) / 10;

  if (bmi < 18.5) {
    return {
      bmi,
      category: "Underweight",
      colorClass: "text-amber-600 dark:text-amber-400",
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    };
  } else if (bmi < 25.0) {
    return {
      bmi,
      category: "Normal",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    };
  } else if (bmi < 30.0) {
    return {
      bmi,
      category: "Overweight",
      colorClass: "text-orange-600 dark:text-orange-400",
      badgeBg: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    };
  } else {
    return {
      bmi,
      category: "Obese",
      colorClass: "text-rose-600 dark:text-rose-400",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    };
  }
}

export function calculateAge(dob: string | Date): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}
