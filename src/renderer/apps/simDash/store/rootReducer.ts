import { combineReducers } from '@reduxjs/toolkit';
// import authReducer from '../../../store/slices/authSlice';
import profilesReducer from './slices/profilesSlice';
import leagueReducer from './slices/leagueSlice';
import tabReducer from './slices/tabSlice';
import scheduleReducer from './slices/scheduleSlice';
import simInputsReducer from './slices/simInputsSlice';
import simulationStatusReducer from './slices/simulationStatusSlice';
import bettingBoundsReducer from './slices/bettingBoundsSlice';

const simDashReducer = combineReducers({
  // auth: authReducer,
  profiles: profilesReducer,
  leagues: leagueReducer,
  tabs: tabReducer,
  schedule: scheduleReducer,
  simInputs: simInputsReducer,
  simulationStatus: simulationStatusReducer,
  bettingBounds: bettingBoundsReducer,
});

export type SimDashState = ReturnType<typeof simDashReducer>;
export default simDashReducer; 