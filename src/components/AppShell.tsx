"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import InsightsIcon from "@mui/icons-material/Insights";
import HistoryIcon from "@mui/icons-material/History";
import InfoOutlineIcon from "@mui/icons-material/InfoOutlined";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useColorMode } from "@/theme/ThemeRegistry";

const NAV_ITEMS = [
  { href: "/", label: "Пошук", icon: SearchIcon },
  { href: "/compare", label: "Порівняння", icon: CompareArrowsIcon },
  { href: "/analytics", label: "Аналітика", icon: InsightsIcon },
  { href: "/changelog", label: "Журнал оновлень", icon: HistoryIcon },
  { href: "/methodology", label: "Методологія", icon: InfoOutlineIcon },
  { href: "/admin", label: "Адміністрування", icon: AdminPanelSettingsIcon },
];

const DRAWER_WIDTH = 264;

export function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const { mode, toggle } = useColorMode();

  const navList = (
    <List sx={{ pt: 2 }} aria-label="Основна навігація">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={active}
            aria-current={active ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
            sx={{ mx: 1, borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon color={active ? "primary" : undefined} />
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <a
        href="#main-content"
        style={{
          position: "absolute",
          left: -9999,
          top: "auto",
          zIndex: 2000,
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = "8px";
          e.currentTarget.style.top = "8px";
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.padding = "8px 12px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = "-9999px";
        }}
      >
        Перейти до основного вмісту
      </a>

      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.default",
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton
              edge="start"
              aria-label="Відкрити меню навігації"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component={Link} href="/" sx={{ flexGrow: 1, textDecoration: "none", color: "text.primary" }}>
            Статус території
          </Typography>
          <IconButton
            aria-label={mode === "light" ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
            onClick={toggle}
          >
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {isDesktop ? (
        <Box
          component="nav"
          aria-label="Бічна навігація"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            borderRight: "1px solid",
            borderColor: "divider",
            pt: "64px",
          }}
        >
          {navList}
        </Box>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
        >
          <Toolbar />
          {navList}
        </Drawer>
      )}

      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{ flexGrow: 1, pt: "80px", pb: 6, px: { xs: 2, sm: 3, md: 4 }, maxWidth: "1200px" }}
      >
        {children}
      </Box>
    </Box>
  );
}
