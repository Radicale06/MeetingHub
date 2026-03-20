import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { ConfigProvider } from "antd";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "./store/store.ts";
import { customTheme } from "./theme/theme.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider theme={customTheme}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </ConfigProvider>
  </StrictMode>
);
