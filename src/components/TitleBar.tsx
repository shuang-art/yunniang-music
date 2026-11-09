import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconBack, IconForward, IconMin, IconMax, IconRestore, IconClose } from './Icons'

export function TitleBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [maxed, setMaxed] = useState(false)

  useEffect(() => {
    window.yun.winIsMaximized().then(setMaxed).catch(() => {})
    const off = window.yun.onMaximized?.(setMaxed)
    return () => { off?.() }
  }, [])

  return (
    <div className="titlebar">
      <div className="titlebar-left">
        <div className="titlebar-nav">
          <button className="nav-btn" onClick={() => navigate(-1)} title="后退">
            <IconBack size={15} />
          </button>
          <button className="nav-btn" onClick={() => navigate(1)} title="前进">
            <IconForward size={15} />
          </button>
        </div>
        <span className="titlebar-title">云娘音乐</span>
      </div>

      <div className="titlebar-right">
        <button className="win-btn" onClick={() => window.yun.winMinimize()} title="最小化">
          <IconMin size={15} />
        </button>
        <button className="win-btn" onClick={() => window.yun.winMaximize()} title={maxed ? '还原' : '最大化'}>
          {maxed ? <IconRestore size={13} /> : <IconMax size={13} />}
        </button>
        <button className="win-btn close" onClick={() => window.yun.winClose()} title="关闭">
          <IconClose size={15} />
        </button>
      </div>
    </div>
  )
}
