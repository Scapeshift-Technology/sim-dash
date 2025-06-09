import { combineReducers } from '@reduxjs/toolkit';
import profilesReducer from './slices/profilesSlice';
import leagueReducer from './slices/leagueSlice';
import tabReducer from './slices/tabSlice';
import scheduleReducer from './slices/scheduleSlice';
import simInputsReducer from './slices/simInputsSlice';
import simulationStatusReducer from './slices/simulationStatusSlice';
import bettingBoundsReducer from './slices/bettingBoundsSlice';
import statCaptureSettingsReducer from './slices/statCaptureSettingsSlice';

const simDashReducer = combineReducers({
  // auth: authReducer,
  profiles: profilesReducer,
  leagues: leagueReducer,
  tabs: tabReducer,
  schedule: scheduleReducer,
  simInputs: simInputsReducer,
  simulationStatus: simulationStatusReducer,
  bettingBounds: bettingBoundsReducer,
  settings: statCaptureSettingsReducer
});

export type SimDashState = ReturnType<typeof simDashReducer>;
export default simDashReducer; 