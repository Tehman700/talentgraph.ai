import { create } from 'zustand'
import type {
  SkillsProfile, MatchResult, OnboardingData, UserType, AuthUser,
  ExtractedProfile, JobPosting, LocationInfo, RoleType,
} from '../types'
import { supabase } from '../lib/supabase'

interface AppState {
  // Auth
  authUser: AuthUser | null
  authToken: string | null
  authLoading: boolean

  // Legacy flow
  userType: UserType | null
  onboardingData: Partial<OnboardingData>
  skillsProfile: SkillsProfile | null
  matchResult: MatchResult | null
  step: number

  // Talent platform
  extractedProfile: ExtractedProfile | null
  talentRoleType: RoleType | null
  talentNiche: string | null
  location: LocationInfo | null
  savedTalentId: string | null
  jobPosting: JobPosting | null

  // Auth actions
  setAuth: (user: AuthUser | null, token: string | null) => void
  initAuth: () => Promise<void>

  // Legacy actions
  setUserType: (t: UserType) => void
  setOnboardingData: (data: Partial<OnboardingData>) => void
  setSkillsProfile: (p: SkillsProfile) => void
  setMatchResult: (r: MatchResult) => void
  setStep: (s: number) => void

  // Talent platform actions
  setExtractedProfile: (p: ExtractedProfile | null) => void
  setTalentRoleType: (t: RoleType | null) => void
  setTalentNiche: (n: string | null) => void
  setLocation: (l: LocationInfo | null) => void
  setSavedTalentId: (id: string | null) => void
  setJobPosting: (j: JobPosting | null) => void

  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  authUser: null,
  authToken: null,
  authLoading: true,

  userType: null,
  onboardingData: {},
  skillsProfile: null,
  matchResult: null,
  step: 0,

  extractedProfile: null,
  talentRoleType: null,
  talentNiche: null,
  location: null,
  savedTalentId: null,
  jobPosting: null,

  setAuth: (authUser, authToken) => set({ authUser, authToken }),

  initAuth: async () => {
    const { data } = await supabase.auth.getSession()
    const session = data.session
    if (session?.user) {
      set({
        authUser: { id: session.user.id, email: session.user.email },
        authToken: session.access_token,
        authLoading: false,
      })
    } else {
      set({ authUser: null, authToken: null, authLoading: false })
    }
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          authUser: { id: session.user.id, email: session.user.email },
          authToken: session.access_token,
        })
      } else {
        set({ authUser: null, authToken: null })
      }
    })
  },

  setUserType: (userType) => set({ userType }),
  setOnboardingData: (data) => set((s) => ({ onboardingData: { ...s.onboardingData, ...data } })),
  setSkillsProfile: (skillsProfile) => set({ skillsProfile }),
  setMatchResult: (matchResult) => set({ matchResult }),
  setStep: (step) => set({ step }),

  setExtractedProfile: (extractedProfile) => set({ extractedProfile }),
  setTalentRoleType: (talentRoleType) => set({ talentRoleType }),
  setTalentNiche: (talentNiche) => set({ talentNiche }),
  setLocation: (location) => set({ location }),
  setSavedTalentId: (savedTalentId) => set({ savedTalentId }),
  setJobPosting: (jobPosting) => set({ jobPosting }),

  reset: () =>
    set({
      userType: null, onboardingData: {}, skillsProfile: null, matchResult: null, step: 0,
      extractedProfile: null, talentRoleType: null, talentNiche: null,
      location: null, savedTalentId: null, jobPosting: null,
    }),
}))
