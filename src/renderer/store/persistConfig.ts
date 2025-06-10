import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // localStorage for web

export const persistConfig = {
  key: 'simdash',
  storage,
  whitelist: [],
  version: 1
}

// Auth-specific persist config
export const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: [
    'isAuthenticated',
    'username',
    'currentParty',
    'userDefaultParty'
  ],
  version: 1
}

export { persistReducer } 