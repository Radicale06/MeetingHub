import { Select } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { supportedLanguages } from "../i18n";

interface Props {
  style?: React.CSSProperties;
  dark?: boolean;
}

const LanguageSwitcher: React.FC<Props> = ({ style, dark = true }) => {
  const { i18n } = useTranslation();

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = supportedLanguages.find((l) => l.code === lang)?.dir || "ltr";
  };

  return (
    <Select
      value={i18n.language?.split("-")[0] || "en"}
      onChange={handleChange}
      style={{ width: 130, ...style }}
      suffixIcon={<GlobalOutlined style={{ color: dark ? "#94a3b8" : undefined }} />}
      popupMatchSelectWidth={false}
      variant="borderless"
      options={supportedLanguages.map((lang) => ({
        value: lang.code,
        label: lang.label,
      }))}
    />
  );
};

export default LanguageSwitcher;
