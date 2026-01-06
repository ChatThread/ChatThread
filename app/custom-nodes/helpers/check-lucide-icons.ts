import { categoryIcons } from "@/utils/style-utils";
import * as lucideIcons from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

export const checkLucideIcons = (iconName: string): boolean => {
  return (
    lucideIcons[iconName] ||
    dynamicIconImports[iconName] ||
    categoryIcons[iconName]
  );
};
