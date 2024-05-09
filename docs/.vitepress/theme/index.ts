// https://vitepress.dev/docs/extending-default-theme

import { h } from "vue";
import DefaultTheme, { DefaultTheme as DefaultThemeNs } from "vitepress/theme";
import HomeFeaturesBefore from "./components/home-features-before.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "home-features-before": () => h(HomeFeaturesBefore),
    });
  },
};

export interface ThemeConfig extends Omit<DefaultThemeNs.Config, "footer"> {
  footer: {
    links: FooterLink[];
    disclaimer: string;
  };
}

export interface FooterLink {
  text: string;
  link: string;
}
