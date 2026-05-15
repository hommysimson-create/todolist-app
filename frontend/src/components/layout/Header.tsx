import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { useUpdateMe } from "../../hooks/users/useUpdateMe";
import { LanguageSwitcher } from "../common/LanguageSwitcher";
import { queryClient } from "../../config/queryClient";
import "./Header.css";

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clearAuth, isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { mutate: updateMe } = useUpdateMe();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    navigate("/login");
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    toggleTheme();

    // Only sync to server if authenticated
    if (isAuthenticated()) {
      updateMe({ theme: nextTheme });
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/todos" className="header__logo" aria-label={t("nav.home")}>
          {t("header.logo")}
        </Link>
        <nav className="header__nav" aria-label={t("header.logo")}>
          <NavLink to="/todos" className={({ isActive }) => (isActive ? "header__nav-link header__nav-link--active" : "header__nav-link")}>
            {t("nav.todos")}
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) => (isActive ? "header__nav-link header__nav-link--active" : "header__nav-link")}
          >
            {t("nav.categories")}
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? "header__nav-link header__nav-link--active" : "header__nav-link")}
          >
            {t("nav.profile")}
          </NavLink>
          <LanguageSwitcher />
          <button
            className="header__theme-toggle"
            onClick={handleThemeToggle}
            aria-label={t("nav.theme.toggle", { mode: theme === "light" ? t("nav.theme.dark") : t("nav.theme.light") })}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button className="header__logout" onClick={handleLogout}>
            {t("nav.logout")}
          </button>
        </nav>
        <button
          className="header__hamburger"
          aria-label={t("nav.menu.open")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div className="header__drawer" role="navigation" aria-label={t("nav.mobile.menu")}>
          <NavLink to="/todos" className="header__drawer-link" onClick={closeMenu}>
            {t("nav.todos")}
          </NavLink>
          <NavLink to="/categories" className="header__drawer-link" onClick={closeMenu}>
            {t("nav.categories")}
          </NavLink>
          <NavLink to="/profile" className="header__drawer-link" onClick={closeMenu}>
            {t("nav.profile")}
          </NavLink>
          <LanguageSwitcher />
          <button className="header__drawer-link header__drawer-theme" onClick={handleThemeToggle}>
            {t("nav.theme.change", { theme: theme === "light" ? "🌙 " + t("nav.theme.dark") : "☀️ " + t("nav.theme.light") })}
          </button>
          <button className="header__drawer-logout" onClick={handleLogout}>
            {t("nav.logout")}
          </button>
        </div>
      )}
    </header>
  );
}
