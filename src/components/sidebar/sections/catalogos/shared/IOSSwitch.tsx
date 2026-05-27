import React from 'react'
import './IOSSwitch.css'

type IOSSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  disabled?: boolean
  ariaLabel?: string
}

const IOSSwitch: React.FC<IOSSwitchProps> = ({ checked, onChange, id, disabled, ariaLabel }) => {
  return (
    <label className={`ios-switch ${disabled ? 'ios-switch--disabled' : ''}`}>
      <input
        id={id}
        type='checkbox'
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className='ios-switch__track' aria-hidden />
    </label>
  )
}

export default IOSSwitch
