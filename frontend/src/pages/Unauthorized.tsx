import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Routes } from "../utils/routes_name";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>{t("unauthorized.title")}</h1>
      <p>{t("unauthorized.message")}</p>
      <Button
        type="primary"
        size="large"
        onClick={() => navigate(Routes.login)}
      >
        {t("common.signIn")}
      </Button>
    </div>
  );
};

export default Unauthorized;
