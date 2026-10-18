import { useState, useEffect, useCallback } from 'react';
import type { Challenge } from '../types';
import { ChallengeCard } from '../components/challenges/ChallengeCard';
import { ChallengeProgress } from '../components/challenges/ChallengeProgress';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageLayout } from '../components/layout/PageLayout';
import { FeatureHero } from '../components/ui/FeatureHero';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { getChallenges, updateChallenge, resetChallenges } from '../services/api';

export function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      const data = await getChallenges();
      setChallenges(data.challenges);
      setError(null);
    } catch {
      setError('Failed to load challenges. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = useCallback(
    async (id: string, completed: boolean, progress: number) => {
      try {
        const { challenge } = await updateChallenge(id, completed, progress);
        setChallenges((prev) =>
          prev.map((c) => (c.id === id ? challenge : c)),
        );
      } catch {
        setError('Failed to update challenge.');
      }
    },
    [],
  );

  const handleReset = async () => {
    try {
      const data = await resetChallenges();
      setChallenges(data.challenges);
    } catch {
      setError('Failed to reset challenges.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <PageLayout>
      <FeatureHero
        label="Take Action"
        title="Turn Sustainable Actions Into Progress"
        description="Take on gamified challenges to build long-lasting sustainable habits, earn points, and make a real difference."
        imageUrl="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1200&auto=format&fit=crop"
        layout="split"
        actions={
          <Button variant="outline" className="bg-white" onClick={handleReset}>
            Reset Challenges
          </Button>
        }
      />

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <ChallengeProgress challenges={challenges} />
        </div>

        <div className="lg:col-span-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
