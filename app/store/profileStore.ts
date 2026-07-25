import { create } from "zustand";
import type { Profile } from "../lib/types";
import { getProfile } from "../services/profileService";

type ProfileState = {
  profile: Profile | null;
  isLoading: boolean;
  fetchProfile: (userId: string) => Promise<void>;
  setProfile: (profile: Profile) => void;
  clear: () => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  fetchProfile: async (userId: string) => {
    set({ isLoading: true });
    const profile = await getProfile(userId);
    set({ profile, isLoading: false });
  },
  setProfile: (profile: Profile) => set({ profile }),
  clear: () => set({ profile: null, isLoading: false }),
}));
