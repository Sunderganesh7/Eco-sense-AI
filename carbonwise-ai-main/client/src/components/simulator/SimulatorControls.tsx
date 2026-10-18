import { memo } from 'react';
import { Slider } from '../ui/Slider';
import type { CarbonInput } from '../../types';

interface SimulatorControlsProps {
  input: CarbonInput;
  onFieldChange: (
    category: keyof CarbonInput,
    field: string,
    value: number,
  ) => void;
}

const TransportIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7a4 4 0 108 0M8 7v1m8-1v1M8 15a4 4 0 108 0M8 15v1m8-1v1M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
);
const EnergyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
);
const FoodIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
);
const LifestyleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
);

export const SimulatorControls = memo(function SimulatorControls({
  input,
  onFieldChange,
}: SimulatorControlsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-md">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <TransportIcon />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
              Transportation
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Adjust your daily travel habits
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <Slider
            label="Car Travel"
            min={0}
            max={50}
            value={input.transportation.carDistance}
            onChange={(e) =>
              onFieldChange('transportation', 'carDistance', Number(e.target.value))
            }
            unit=" km/day"
          />
          <Slider
            label="Bus Travel"
            min={0}
            max={50}
            value={input.transportation.busDistance}
            onChange={(e) =>
              onFieldChange('transportation', 'busDistance', Number(e.target.value))
            }
            unit=" km/day"
          />
          <Slider
            label="Train Travel"
            min={0}
            max={50}
            value={input.transportation.trainDistance}
            onChange={(e) =>
              onFieldChange('transportation', 'trainDistance', Number(e.target.value))
            }
            unit=" km/day"
          />
          <Slider
            label="Bike Travel"
            min={0}
            max={50}
            value={input.transportation.bikeDistance}
            onChange={(e) =>
              onFieldChange('transportation', 'bikeDistance', Number(e.target.value))
            }
            unit=" km/day"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-md">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
            <EnergyIcon />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
              Energy
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Control your home energy usage
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <Slider
            label="Electricity Usage"
            min={0}
            max={2000}
            value={input.energy.electricityUsage}
            onChange={(e) =>
              onFieldChange('energy', 'electricityUsage', Number(e.target.value))
            }
            unit=" kWh/month"
          />
          <Slider
            label="AC Usage"
            min={0}
            max={100}
            value={input.energy.acUsage}
            onChange={(e) =>
              onFieldChange('energy', 'acUsage', Number(e.target.value))
            }
            unit=" hrs/month"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-md">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <FoodIcon />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
              Food
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Dietary choices and consumption
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <Slider
            label="Vegetarian Meals"
            min={0}
            max={21}
            value={input.food.vegetarianMeals}
            onChange={(e) =>
              onFieldChange('food', 'vegetarianMeals', Number(e.target.value))
            }
            unit=" /week"
          />
          <Slider
            label="Non-Vegetarian Meals"
            min={0}
            max={21}
            value={input.food.nonVegetarianMeals}
            onChange={(e) =>
              onFieldChange('food', 'nonVegetarianMeals', Number(e.target.value))
            }
            unit=" /week"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-[0_2px_12px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-md">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
            <LifestyleIcon />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">
              Lifestyle
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Shopping and waste generation
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <Slider
            label="Online Shopping"
            min={0}
            max={20}
            value={input.lifestyle.onlineShoppingFrequency}
            onChange={(e) =>
              onFieldChange(
                'lifestyle',
                'onlineShoppingFrequency',
                Number(e.target.value),
              )
            }
            unit=" /month"
          />
          <Slider
            label="Waste Generation"
            min={0}
            max={10}
            value={input.lifestyle.wasteGeneration}
            onChange={(e) =>
              onFieldChange('lifestyle', 'wasteGeneration', Number(e.target.value))
            }
            unit=" bags/week"
          />
        </div>
      </div>
    </div>
  );
});
