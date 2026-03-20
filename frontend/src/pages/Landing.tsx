import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "antd";
import {
  VideoCameraOutlined,
  AudioOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Routes } from "../utils/routes_name";
import LanguageSwitcher from "../components/LanguageSwitcher";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    { icon: <VideoCameraOutlined />, title: t("landing.featureHd"), desc: t("landing.featureHdDesc") },
    { icon: <AudioOutlined />, title: t("landing.featureCaptions"), desc: t("landing.featureCaptionsDesc") },
    { icon: <GlobalOutlined />, title: t("landing.featureMultiLang"), desc: t("landing.featureMultiLangDesc") },
    { icon: <FileTextOutlined />, title: t("landing.featureReports"), desc: t("landing.featureReportsDesc") },
    { icon: <CloudServerOutlined />, title: t("landing.featureRecording"), desc: t("landing.featureRecordingDesc") },
    { icon: <SafetyCertificateOutlined />, title: t("landing.featureSelfHosted"), desc: t("landing.featureSelfHostedDesc") },
    { icon: <TeamOutlined />, title: t("landing.featureTeam"), desc: t("landing.featureTeamDesc") },
    { icon: <ThunderboltOutlined />, title: t("landing.featureLowLatency"), desc: t("landing.featureLowLatencyDesc") },
  ];

  return (
    <div style={{ background: "#0f0f23", minHeight: "100vh", color: "#fff" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 48px", borderBottom: "1px solid #1e1e3a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <VideoCameraOutlined style={{ fontSize: 24, color: "#3b82f6" }} />
          <span style={{ fontSize: 20, fontWeight: 700 }}>{t("common.appName")}</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <LanguageSwitcher />
          <Button type="text" style={{ color: "#94a3b8" }} onClick={() => navigate(Routes.login)}>
            {t("common.signIn")}
          </Button>
          <Button type="primary" onClick={() => navigate(Routes.register)} style={{ borderRadius: 8 }}>
            {t("common.getStarted")}
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: "center", padding: "100px 24px 80px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "inline-block", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 20, padding: "4px 16px", fontSize: 13, color: "#3b82f6", marginBottom: 24 }}>
          {t("landing.badge")}
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: "0 0 20px", background: "linear-gradient(135deg, #fff 0%, #94a3b8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {t("landing.heroTitle")}
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.6, margin: "0 auto 40px", maxWidth: 600 }}>
          {t("landing.heroDesc")}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Button type="primary" size="large" onClick={() => navigate(Routes.register)} style={{ height: 52, paddingInline: 32, fontSize: 16, fontWeight: 600, borderRadius: 10 }}>
            {t("landing.startFree")}
          </Button>
          <Button size="large" onClick={() => navigate(Routes.login)} style={{ height: 52, paddingInline: 32, fontSize: 16, borderRadius: 10, color: "#e2e8f0", borderColor: "#334155", background: "transparent" }}>
            {t("common.signIn")}
          </Button>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "80px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 36, fontWeight: 700, marginBottom: 12 }}>
          {t("landing.featuresTitle")}
        </h2>
        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 16, marginBottom: 60 }}>
          {t("landing.featuresDesc")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {features.map((feature, i) => (
            <div key={i} style={{ background: "#16162a", border: "1px solid #1e1e3a", borderRadius: 12, padding: 24 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#3b82f6", marginBottom: 16 }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{feature.title}</h3>
              <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "80px 24px", borderTop: "1px solid #1e1e3a" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>{t("landing.ctaTitle")}</h2>
        <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 32 }}>{t("landing.ctaDesc")}</p>
        <Button type="primary" size="large" onClick={() => navigate(Routes.register)} style={{ height: 52, paddingInline: 40, fontSize: 16, fontWeight: 600, borderRadius: 10 }}>
          {t("landing.ctaButton")}
        </Button>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "24px 48px", borderTop: "1px solid #1e1e3a", color: "#475569", fontSize: 13 }}>
        {t("landing.footer")}
      </footer>
    </div>
  );
};

export default Landing;
