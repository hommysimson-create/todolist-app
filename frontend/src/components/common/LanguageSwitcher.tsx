import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <select
      className="header__lang-select"
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label={i18n.language === 'ko' ? '언어 선택' : 'Language selection'}
    >
      <option value="ko">KO</option>
      <option value="en">EN</option>
    </select>
  )
}
