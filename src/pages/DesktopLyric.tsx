import React, { useEffect, useState } from 'react'

interface LyricPayload {
  current?: string
  trans?: string
  next?: string
}

/**
 * 桌面歌词：独立透明置顶窗口（#/desktop-lyric）
 * 主进程通过 lyric:update 事件推送当前行
 */
export function DesktopLyric() {
  const [data, setData] = useState<LyricPayload>({ current: '云娘音乐', trans: '', next: '' })

  useEffect(() => {
    // 首次入参
    window.yun.lyricShow({ current: '云娘音乐', trans: '', next: '' })
    const off = window.yun.onLyricUpdate((d: LyricPayload) => {
      setData((prev) => ({ ...prev, ...d }))
    })
    return () => { off?.() }
  }, [])

  return (
    <div className="desktop-lyric">
      <div className="dl-current">{data.current || '♪'}</div>
      {data.trans && <div className="dl-trans">{data.trans}</div>}
      {data.next && <div className="dl-next">{data.next}</div>}
    </div>
  )
}
