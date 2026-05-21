import React, { useEffect, useState } from 'react'
import { useLocale } from '../../i18n'
import {
  getButtonsByPosition,
  executeButtonAction,
  type ThemeButton,
} from '../../themeEngine'

interface Props {
  position: 'toolbar' | 'sidebar' | 'todoItem'
}

const CustomButtons: React.FC<Props> = ({ position }) => {
  const { locale } = useLocale()
  const [buttons, setButtons] = useState<ThemeButton[]>(getButtonsByPosition(position))

  useEffect(() => {
    const handler = () => setButtons(getButtonsByPosition(position))
    window.addEventListener('theme:changed', handler)
    return () => window.removeEventListener('theme:changed', handler)
  }, [position])

  if (buttons.length === 0) return null

  return (
    <>
      {buttons.map((btn) => (
        <button
          key={btn.id}
          className={`custom-btn custom-btn-${position}`}
          onClick={() => executeButtonAction(btn)}
          title={btn.label[locale] || btn.label['en'] || btn.label['zh'] || ''}
        >
          {btn.icon && <span className="custom-btn-icon">{btn.icon}</span>}
          <span className="custom-btn-label">
            {btn.label[locale] || btn.label['en'] || btn.label['zh']}
          </span>
        </button>
      ))}
    </>
  )
}

export default CustomButtons
