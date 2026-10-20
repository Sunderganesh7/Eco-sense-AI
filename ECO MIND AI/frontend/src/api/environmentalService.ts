import { fetchApi } from './client';
import type {
  EnvironmentalObservation,
  BaselineProfileResponse,
  RelationshipProfileResponse,
  RiskProfileResponse,
  GuardedRecommendationProfileResponse,
} from '../types';

export const EnvironmentalService = {
  getProfile: (id: number) => 
    fetchApi<EnvironmentalObservation>(`/profiles/${id}`),

  getBaseline: (id: number) => 
    fetchApi<BaselineProfileResponse>(`/profiles/${id}/baseline`, { method: 'POST' }),

  getRelationships: (id: number) => 
    fetchApi<RelationshipProfileResponse>(`/profiles/${id}/relationships`, { method: 'POST' }),

  getRisks: (id: number) => 
    fetchApi<RiskProfileResponse>(`/profiles/${id}/risks`, { method: 'POST' }),

  getRecommendations: (id: number) => 
    fetchApi<GuardedRecommendationProfileResponse>(`/profiles/${id}/recommendations`, { method: 'POST' }),

  updateProfile: async (id: number, data: any) => {
    try {
      return await fetchApi<EnvironmentalObservation>(`/profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.message && (err.message.includes('404') || err.message.includes('Not Found'))) {
        return await fetchApi<EnvironmentalObservation>(`/profiles`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
      throw err;
    }
  },

  createProfile: (data: any) =>
    fetchApi<EnvironmentalObservation>(`/profiles`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
