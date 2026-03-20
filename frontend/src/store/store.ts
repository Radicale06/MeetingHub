import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Defaults to localStorage for web
import counterReducer from "./features/counterSlice";
import authReducer from "./features/authSlice"; // Import your authReducer

// Combine reducers into a single root reducer
const rootReducer = combineReducers({
  counter: counterReducer,
  authState: authReducer,
});

// Persist configuration
const persistConfig = {
  key: "root",
  storage,
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

// Create the persistor
export const persistor = persistStore(store);

// Define the RootState type
export type RootState = ReturnType<typeof store.getState>;
