import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { simDashPersistConfig } from '@/store/persistConfig';
import profilesReducer from './slices/profilesSlice';
import leagueReducer from './slices/leagueSlice';
import tabReducer from './slices/tabSlice';
import scheduleReducer from './slices/scheduleSlice';
import simInputsReducer from './slices/simInputsSlice';
import simulationStatusReducer from './slices/simulationStatusSlice';
import bettingBoundsReducer from './slices/bettingBoundsSlice';
import statCaptureSettingsReducer from './slices/statCaptureSettingsSlice';
import userPreferencesReducer from './slices/userPreferencesSlice';

const baseSimDashReducer = combineReducers({
  // auth: authReducer,
  profiles: profilesReducer,
  leagues: leagueReducer,
  tabs: tabReducer,
  schedule: scheduleReducer,
  simInputs: simInputsReducer,
  simulationStatus: simulationStatusReducer,
  bettingBounds: bettingBoundsReducer,
  settings: statCaptureSettingsReducer,
  userPreferences: userPreferencesReducer
});

const simDashReducer = persistReducer(simDashPersistConfig, baseSimDashReducer);

export type SimDashState = ReturnType<typeof baseSimDashReducer>;
export default simDashReducer; 