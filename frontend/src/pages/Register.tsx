import { useState } from "react";
import { useDispatch } from "react-redux";
import { login } from "../store/features/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { Button, Input, Form, Divider } from "antd";
import { useTranslation } from "react-i18next";
import { apiClient } from "../api";
import { supabase } from "../lib/supabase";
import AlertDialog from "../components/AlertDialog";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();

      const response: any = await apiClient.auth.authControllerRegister({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });

      if (response?.data) {
        dispatch(login(response.data));
        navigate("/dashboard");
      }
    } catch (error) {
      setErrorMessage("Registration failed. Please try again.");
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "azure") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMessage(error.message);
        setErrorVisible(true);
      }
    } catch (error) {
      setErrorMessage("OAuth registration failed. Please try again.");
      setErrorVisible(true);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Left panel — branding */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 700 }}>{t("common.appName")}</div>
        <div
          style={{
            background: "rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 32,
            backdropFilter: "blur(10px)",
          }}
        >
          <p style={{ fontSize: 16, lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
            "{t("auth.testimonial")}"
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
              }}
            >
              SC
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{t("auth.testimonialAuthor")}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>{t("auth.testimonialRole")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{t("auth.registerTitle")}</h1>
            <LanguageSwitcher dark={false} />
          </div>
          <p style={{ color: "#64748b", marginBottom: 32 }}>
            {t("auth.registerSubtitle")}
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            <Button
              size="large"
              block
              onClick={() => handleOAuth("google")}
              style={{ height: 44 }}
            >
              {t("auth.continueWithGoogle")}
            </Button>
            <Button
              size="large"
              block
              onClick={() => handleOAuth("azure")}
              style={{ height: 44 }}
            >
              {t("auth.continueWithMicrosoft")}
            </Button>
          </div>

          <Divider style={{ color: "#94a3b8", fontSize: 13 }}>{t("auth.orContinueWith")}</Divider>

          <Form form={form} layout="vertical" onFinish={handleRegister} autoComplete="off">
            <div style={{ display: "flex", gap: 12 }}>
              <Form.Item
                name="firstName"
                style={{ flex: 1 }}
                rules={[{ required: true, message: t("auth.firstName") }]}
              >
                <Input size="large" placeholder={t("auth.firstName")} style={{ height: 44 }} />
              </Form.Item>
              <Form.Item
                name="lastName"
                style={{ flex: 1 }}
                rules={[{ required: true, message: t("auth.lastName") }]}
              >
                <Input size="large" placeholder={t("auth.lastName")} style={{ height: 44 }} />
              </Form.Item>
            </div>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: t("auth.email") },
                { type: "email", message: t("auth.email") },
              ]}
            >
              <Input size="large" placeholder={t("auth.email")} style={{ height: 44 }} />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: t("auth.password") },
                { min: 8, message: t("auth.password") },
              ]}
            >
              <Input.Password size="large" placeholder={t("auth.password")} style={{ height: 44 }} />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              style={{ height: 44, background: "#3b82f6" }}
            >
              {t("common.signUp")}
            </Button>
          </Form>

          <p style={{ textAlign: "center", marginTop: 24, color: "#64748b" }}>
            {t("auth.hasAccount")}{" "}
            <Link to="/login" style={{ color: "#3b82f6", fontWeight: 600 }}>
              {t("common.signIn")}
            </Link>
          </p>
        </div>
      </div>

      <AlertDialog
        visible={errorVisible}
        title="Registration Error"
        content={errorMessage}
        onClose={() => setErrorVisible(false)}
      />
    </div>
  );
}
