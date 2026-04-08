import i18n from "i18next";
import detector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enAdmin from "./locales/en/admin.json";
import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import enLayout from "./locales/en/layout.json";
import enTenantDashboard from "./locales/en/tenant/dashboard.json";
import enTenantErrors from "./locales/en/tenant/errors.json";
import enTenantFinance from "./locales/en/tenant/finance.json";
import enTenantInvitations from "./locales/en/tenant/invitations.json";
import enTenantMaster from "./locales/en/tenant/master.json";
import enTenantMembers from "./locales/en/tenant/members.json";
import enTenantRoles from "./locales/en/tenant/roles.json";
import enTenantSettings from "./locales/en/tenant/settings.json";
import enTenantShared from "./locales/en/tenant/shared.json";
import enTenantWallet from "./locales/en/tenant/wallet.json";
import enTenantWhatsapp from "./locales/en/tenant/whatsapp.json";
import idAdmin from "./locales/id/admin.json";
import idAuth from "./locales/id/auth.json";
import idCommon from "./locales/id/common.json";
import idLayout from "./locales/id/layout.json";
import idTenantDashboard from "./locales/id/tenant/dashboard.json";
import idTenantErrors from "./locales/id/tenant/errors.json";
import idTenantFinance from "./locales/id/tenant/finance.json";
import idTenantInvitations from "./locales/id/tenant/invitations.json";
import idTenantMaster from "./locales/id/tenant/master.json";
import idTenantMembers from "./locales/id/tenant/members.json";
import idTenantRoles from "./locales/id/tenant/roles.json";
import idTenantSettings from "./locales/id/tenant/settings.json";
import idTenantShared from "./locales/id/tenant/shared.json";
import idTenantWallet from "./locales/id/tenant/wallet.json";
import idTenantWhatsapp from "./locales/id/tenant/whatsapp.json";

const resources = {
  en: {
    translation: {
      ...enCommon,
      ...enLayout,
      ...enAuth,
      ...enAdmin,
      ...enTenantShared,
      ...enTenantMembers,
      ...enTenantRoles,
      ...enTenantInvitations,
      ...enTenantDashboard,
      ...enTenantErrors,
      ...enTenantSettings,
      ...enTenantWhatsapp,
      ...enTenantFinance,
      ...enTenantWallet,
      ...enTenantMaster,
    },
  },
  id: {
    translation: {
      ...idCommon,
      ...idLayout,
      ...idAuth,
      ...idAdmin,
      ...idTenantShared,
      ...idTenantMembers,
      ...idTenantRoles,
      ...idTenantInvitations,
      ...idTenantDashboard,
      ...idTenantErrors,
      ...idTenantSettings,
      ...idTenantWhatsapp,
      ...idTenantFinance,
      ...idTenantWallet,
      ...idTenantMaster,
    },
  },
};

const language = localStorage.getItem("I18N_LANGUAGE");
if (!language || !["en", "id"].includes(language)) {
  localStorage.setItem("I18N_LANGUAGE", "en");
}

i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("I18N_LANGUAGE") || "en",
    fallbackLng: "en",

    keySeparator: false,

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
