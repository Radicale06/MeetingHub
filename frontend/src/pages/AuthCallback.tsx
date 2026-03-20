import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../store/features/authSlice";
import { supabase } from "../lib/supabase";
import { apiClient } from "../api";
import { Spin } from "antd";
import { useTranslation } from "react-i18next";

export default function AuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError(t("auth.callbackError"));
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        const response: any = await apiClient.auth.authControllerOauthCallback({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        });

        if (response?.data) {
          dispatch(login(response.data));
          navigate("/dashboard");
        } else {
          setError(t("auth.callbackError"));
          setTimeout(() => navigate("/login"), 3000);
        }
      } catch (err) {
        setError(t("auth.callbackError"));
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [dispatch, navigate, t]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 16,
      }}
    >
      {error ? (
        <div style={{ color: "#ef4444", fontSize: 16 }}>{error}</div>
      ) : (
        <>
          <Spin size="large" />
          <div style={{ color: "#64748b" }}>{t("auth.callbackProcessing")}</div>
        </>
      )}
    </div>
  );
}
