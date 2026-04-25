import { create } from 'zustand'
import type { SkillsProfile, MatchResult, OnboardingData, UserType } from '../types'

interface AppState {
  userType: UserType | null
  onboardingData: Partial<OnboardingData>
  skillsProfile: SkillsProfile | null
  matchResult: MatchResult | null
  step: number

  setUserType: (t: UserType) => void
  setOnboardingData: (data: Partial<OnboardingData>) => void
  setSkillsProfile: (p: SkillsProfile) => void
  setMatchResult: (r: MatchResult) => void
  setStep: (s: number) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  userType: null,
  onboardingData: {},
  skillsProfile: null,
  matchResult: null,
  step: 0,

  setUserType: (userType) => set({ userType }),
  setOnboardingData: (data) => set((s) => ({ onboardingData: { ...s.onboardingData, ...data } })),
  setSkillsProfile: (skillsProfile) => set({ skillsProfile }),
  setMatchResult: (matchResult) => set({ matchResult }),
  setStep: (step) => set({ step }),
  reset: () => set({ userType: null, onboardingData: {}, skillsProfile: null, matchResult: null, step: 0 }),
}))
