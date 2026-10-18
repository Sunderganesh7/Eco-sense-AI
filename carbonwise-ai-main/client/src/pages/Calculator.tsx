import { useState, useCallback, useMemo } from 'react';
import type { CarbonInput, CarbonResult } from '../types';
import { TransportForm } from '../components/calculator/TransportForm';
import { EnergyForm } from '../components/calculator/EnergyForm';
import { FoodForm } from '../components/calculator/FoodForm';
import { LifestyleForm } from '../components/calculator/LifestyleForm';
import { CalculatorResults } from '../components/calculator/Results';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageLayout } from '../components/layout/PageLayout';
import { FeatureHero } from '../components/ui/FeatureHero';
import { calculateCarbonFootprint } from '../utils/calculations';
import { useCarbonData } from '../hooks/useCarbonData';

const initialInput: CarbonInput = {
  transportation: { carDistance: 0, bikeDistance: 0, busDistance: 0, trainDistance: 0 },
  energy: { electricityUsage: 0, acUsage: 0 },
  food: { vegetarianMeals: 0, nonVegetarianMeals: 0 },
  lifestyle: { onlineShoppingFrequency: 0, wasteGeneration: 0 },
};

type FormStep = 'transport' | 'energy' | 'food' | 'lifestyle' | 'results';

export function Calculator() {
  const [input, setInput] = useState<CarbonInput>(initialInput);
  const [step, setStep] = useState<FormStep>('transport');
  const [showResults, setShowResults] = useState(false);
  const { addEntry } = useCarbonData();

  const result = useMemo((): CarbonResult => calculateCarbonFootprint(input), [input]);

  const updateField = useCallback(
    <K extends keyof CarbonInput>(
      category: K,
      field: keyof CarbonInput[K],
      value: number,
    ) => {
      setInput((prev) => ({
        ...prev,
        [category]: { ...prev[category], [field]: value },
      }));
    },
    [],
  );

  const handleCalculate = () => {
    addEntry(input);
    setShowResults(true);
    setStep('results');
  };

  const steps: { key: FormStep; label: string }[] = [
    { key: 'transport', label: 'Transportation' },
    { key: 'energy', label: 'Energy' },
    { key: 'food', label: 'Food' },
    { key: 'lifestyle', label: 'Lifestyle' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <PageLayout>
      <FeatureHero
        label="Measure Impact"
        title="Understand Your Carbon Footprint"
        description="Analyze your daily habits across transportation, energy, and food to discover your true environmental impact."
        imageUrl="/carbon_footprint_hero.jpg"
        layout="split"
      />

      {!showResults && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <div className="mb-6 flex flex-col gap-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Step {currentStepIndex + 1} of {steps.length}
              </div>
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-slate-800">{steps[currentStepIndex].label}</h2>
                <div className="flex items-center gap-1.5 pt-1">
                  {steps.map((s, idx) => (
                    <div
                      key={s.key}
                      className={`h-1.5 rounded-full transition-all ${idx === currentStepIndex ? 'w-10 bg-emerald-500' :
                        idx < currentStepIndex ? 'w-4 bg-emerald-500' : 'w-4 bg-slate-200'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Card className="border-0 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
              {step === 'transport' && (
                <TransportForm
                  data={input.transportation}
                  onChange={(field, value) =>
                    updateField('transportation', field, value)
                  }
                />
              )}
              {step === 'energy' && (
                <EnergyForm
                  data={input.energy}
                  onChange={(field, value) =>
                    updateField('energy', field, value)
                  }
                />
              )}
              {step === 'food' && (
                <FoodForm
                  data={input.food}
                  onChange={(field, value) =>
                    updateField('food', field, value)
                  }
                />
              )}
              {step === 'lifestyle' && (
                <LifestyleForm
                  data={input.lifestyle}
                  onChange={(field, value) =>
                    updateField('lifestyle', field, value)
                  }
                />
              )}

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    const idx = currentStepIndex - 1;
                    if (idx >= 0) setStep(steps[idx].key);
                  }}
                  disabled={currentStepIndex === 0}
                >
                  Previous
                </Button>

                {currentStepIndex < steps.length - 1 ? (
                  <Button
                    onClick={() => setStep(steps[currentStepIndex + 1].key)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={handleCalculate} className="bg-emerald-600 hover:bg-emerald-700">
                    Calculate Footprint
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 sticky top-6">
            <Card className="bg-slate-50 border-emerald-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Why calculate?</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Measuring your carbon footprint is the first step towards a sustainable lifestyle. By understanding where your emissions come from, you can make targeted, effective choices to reduce them.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Identify your biggest emission sources
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Get personalized reduction tips
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Track progress over time
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {showResults && (
        <div className="space-y-6">
          <CalculatorResults result={result} />

          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="/dashboard"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              View Dashboard
            </a>
            <a
              href="/ai-coach"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-emerald-500 bg-transparent px-4 py-2 text-sm font-medium text-emerald-600 transition-all duration-200 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Get AI Recommendations
            </a>
            <Button
              variant="ghost"
              onClick={() => {
                setShowResults(false);
                setStep('transport');
                setInput(initialInput);
              }}
            >
              Calculate Again
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
