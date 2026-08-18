"use client";

import { Chip } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { statusColorTokens } from "@/theme/tokens";
import { useColorMode } from "@/theme/ThemeRegistry";

const ICON_BY_CODE: Record<string, React.ElementType> = {
  POSSIBLE_HOSTILITIES: WarningAmberIcon,
  ACTIVE_HOSTILITIES: ErrorOutlineIcon,
  ACTIVE_HOSTILITIES_STATE_RESOURCES: ElectricBoltIcon,
  TEMPORARILY_OCCUPIED: GppMaybeIcon,
};

/**
 * Статус ніколи не передається лише кольором: завжди супроводжується
 * текстом офіційної/короткої назви та власною іконкою для кожної категорії.
 */
export function StatusChip({
  categoryCode,
  label,
  size = "medium",
}: {
  categoryCode: string;
  label: string;
  size?: "small" | "medium";
}) {
  const { mode } = useColorMode();
  const colorToken = `status-${categoryCode.toLowerCase().replace(/_/g, "-")}`;
  const colors = statusColorTokens[colorToken];
  const color = colors ? (mode === "light" ? colors.light : colors.dark) : undefined;
  const Icon = ICON_BY_CODE[categoryCode] ?? HelpOutlineIcon;

  return (
    <Chip
      icon={<Icon fontSize={size === "small" ? "small" : "medium"} />}
      label={label}
      size={size}
      sx={{
        fontWeight: 600,
        color: color,
        borderColor: color,
        backgroundColor: color ? `${color}1A` : undefined,
      }}
      variant="outlined"
    />
  );
}
