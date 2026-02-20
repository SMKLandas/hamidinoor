
import { Student, Event, Participation, Schedule, Result } from './types';

const STORAGE_KEYS = {
  STUDENTS: 'smk_landas_students',
  EVENTS: 'smk_landas_events',
  PARTICIPATIONS: 'smk_landas_participations',
  SCHEDULES: 'smk_landas_schedules',
  RESULTS: 'smk_landas_results'
};

export const dataSdk = {
  getData: <T>(key: string): T[] => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  saveData: <T>(key: string, data: T[]): void => {
    localStorage.setItem(key, JSON.stringify(data));
  },

  getStudents: () => dataSdk.getData<Student>(STORAGE_KEYS.STUDENTS),
  saveStudents: (data: Student[]) => dataSdk.saveData(STORAGE_KEYS.STUDENTS, data),

  getEvents: () => dataSdk.getData<Event>(STORAGE_KEYS.EVENTS),
  saveEvents: (data: Event[]) => dataSdk.saveData(STORAGE_KEYS.EVENTS, data),

  getParticipations: () => dataSdk.getData<Participation>(STORAGE_KEYS.PARTICIPATIONS),
  saveParticipations: (data: Participation[]) => dataSdk.saveData(STORAGE_KEYS.PARTICIPATIONS, data),

  getSchedules: () => dataSdk.getData<Schedule>(STORAGE_KEYS.SCHEDULES),
  saveSchedules: (data: Schedule[]) => dataSdk.saveData(STORAGE_KEYS.SCHEDULES, data),

  getResults: () => dataSdk.getData<Result>(STORAGE_KEYS.RESULTS),
  saveResults: (data: Result[]) => dataSdk.saveData(STORAGE_KEYS.RESULTS, data),
};
