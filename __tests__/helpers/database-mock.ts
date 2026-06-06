export const mockGetTodayLogs = jest.fn().mockResolvedValue({
  meals: [],
  symptoms: [],
  notes: [],
});

export const mockGetLogsForDateRange = jest.fn().mockResolvedValue({
  meals: [],
  symptoms: [],
});

export const mockGetLogsForDate = jest.fn().mockResolvedValue({
  meals: [],
  symptoms: [],
  notes: [],
});

export const mockGetUserProfile = jest.fn().mockResolvedValue(null);
export const mockCreateUserProfile = jest.fn().mockResolvedValue(null);
export const mockCreateMealLog = jest.fn().mockResolvedValue({ id: 'new-meal-id' });
export const mockUpdateMealLog = jest.fn().mockResolvedValue({ id: 'updated-meal-id' });
export const mockDeleteMealLog = jest.fn().mockResolvedValue(true);
export const mockCreateSymptomLog = jest.fn().mockResolvedValue({ id: 'new-symptom-id' });
export const mockUpdateSymptomLog = jest.fn().mockResolvedValue({ id: 'updated-symptom-id' });
export const mockDeleteSymptomLog = jest.fn().mockResolvedValue(true);
export const mockCreateNoteLog = jest.fn().mockResolvedValue({ id: 'new-note-id' });
export const mockUpdateNoteLog = jest.fn().mockResolvedValue({ id: 'updated-note-id' });
export const mockDeleteNoteLog = jest.fn().mockResolvedValue(true);
export const mockGetHypotheses = jest.fn().mockResolvedValue([]);
export const mockUpsertHypothesis = jest.fn().mockResolvedValue(null);

export function getDatabaseMockModule() {
  return {
    getTodayLogs: mockGetTodayLogs,
    getLogsForDateRange: mockGetLogsForDateRange,
    getLogsForDate: mockGetLogsForDate,
    getUserProfile: mockGetUserProfile,
    createUserProfile: mockCreateUserProfile,
    createMealLog: mockCreateMealLog,
    updateMealLog: mockUpdateMealLog,
    deleteMealLog: mockDeleteMealLog,
    createSymptomLog: mockCreateSymptomLog,
    updateSymptomLog: mockUpdateSymptomLog,
    deleteSymptomLog: mockDeleteSymptomLog,
    createNoteLog: mockCreateNoteLog,
    updateNoteLog: mockUpdateNoteLog,
    deleteNoteLog: mockDeleteNoteLog,
    getHypotheses: mockGetHypotheses,
    upsertHypothesis: mockUpsertHypothesis,
  };
}

export function resetAllDatabaseMocks() {
  mockGetTodayLogs.mockReset().mockResolvedValue({ meals: [], symptoms: [], notes: [] });
  mockGetLogsForDateRange.mockReset().mockResolvedValue({ meals: [], symptoms: [] });
  mockGetLogsForDate.mockReset().mockResolvedValue({ meals: [], symptoms: [], notes: [] });
  mockGetUserProfile.mockReset().mockResolvedValue(null);
  mockCreateUserProfile.mockReset().mockResolvedValue(null);
  mockCreateMealLog.mockReset().mockResolvedValue({ id: 'new-meal-id' });
  mockUpdateMealLog.mockReset().mockResolvedValue({ id: 'updated-meal-id' });
  mockDeleteMealLog.mockReset().mockResolvedValue(true);
  mockCreateSymptomLog.mockReset().mockResolvedValue({ id: 'new-symptom-id' });
  mockUpdateSymptomLog.mockReset().mockResolvedValue({ id: 'updated-symptom-id' });
  mockDeleteSymptomLog.mockReset().mockResolvedValue(true);
  mockCreateNoteLog.mockReset().mockResolvedValue({ id: 'new-note-id' });
  mockUpdateNoteLog.mockReset().mockResolvedValue({ id: 'updated-note-id' });
  mockDeleteNoteLog.mockReset().mockResolvedValue(true);
  mockGetHypotheses.mockReset().mockResolvedValue([]);
  mockUpsertHypothesis.mockReset().mockResolvedValue(null);
}
