import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WeeklyHobbies {
    storyWriting: boolean;
    guitar: boolean;
    poetry: boolean;
}
export interface DailyEntry {
    sensoryGuardingRating: number;
    speechPracticeCycles: bigint;
    physicalEnergyRating: number;
    eyeRelaxationRating: number;
    outsideFood: boolean;
    screenTimeMinutes: number;
    baselinePurityRating: number;
    fantasyRuminationRating: number;
    procrastinationRating: number;
    sleepRecharge: number;
    pranayamaMinutes: number;
    nadiShodhanSessions: number;
    deepWorkHours: number;
    microRestRating: number;
    mentalHealthRating: number;
    daySatisfactionRating: number;
    passivePhoneRating: number;
    uTurnEfficiencyRating: number;
    shutdownRitual: boolean;
    pmoOccurrence: boolean;
    guruPranamMinutes: number;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllDailyEntryDates(): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyEntriesByDates(dates: Array<string>): Promise<Array<[string, DailyEntry]>>;
    getDailyEntry(dateKey: string): Promise<DailyEntry | null>;
    getEntriesForWeek(weekKey: string, weekDates: Array<string>): Promise<Array<[string, DailyEntry]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeeklyHobbies(weekKey: string): Promise<WeeklyHobbies | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveDailyEntry(dateKey: string, entry: DailyEntry): Promise<void>;
    saveWeeklyHobbies(weekKey: string, hobbies: WeeklyHobbies): Promise<void>;
}
