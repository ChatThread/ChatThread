import { create } from "zustand";
import { DarkStoreType } from "../types/zustand/dark";

const getDefaultTheme = () => {
  try {
    // 优先从localStorage获取
    // const savedTheme = window.localStorage.getItem("isDark");
    // if (savedTheme !== null) {
    //   return JSON.parse(savedTheme);
    // }
    // 如果没有保存的主题，则使用系统主题
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (error) {
    // 在无痕模式或localStorage不可用时，使用系统主题
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
};

export const useDarkStore = create<DarkStoreType>((set, get) => ({
  dark: getDefaultTheme(),
  version: "",
  setDark: (dark) => {
    set(() => ({ dark: dark }));
    try {
      window.localStorage.setItem("isDark", dark.toString());
    } catch (error) {
      // 忽略在无痕模式下localStorage的错误
      console.warn("无法保存主题设置到localStorage");
    }
  }
}));
