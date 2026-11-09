import React, { useEffect, useState } from 'react'
import * as ncm from '@/api/ncm'
import type { Song } from '@/types'
import { useAuth } from '@/store/auth'
import { usePlayer } from '@/store/player'
import { useLibrary } from '@/store/library'
import { SongList } from '@/components/SongRow'
import { useSongMenu } from '@/components/SongContextMenu'
import { IconPlay, IconHeart } from '@/components/Icons'

const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function dateText(): string {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function DailyPage() {
  const { user } = useAuth()
  const { playQueue, addToQueue, queue, currentIndex } = usePlayer()
  const { likedIds, toggleLike } = useLibrary()

  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needLogin, setNeedLogin] = useState(false)

  useEffect(() => {
    load()
    // 重新进入页面时如果登录态变化，重新拉取
    // （user 变化时刷新，避免登录后仍是空的）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId])

  async function load() {
    setLoading(true)
    setError(null)
    setNeedLogin(false)

    if (!user) {
      setSongs([])
      setNeedLogin(true)
      setLoading(false)
      return
    }

    try {
      const list = await ncm.recommendSongs()
      setSongs(list || [])
    } catch (e: any) {
      setSongs([])
      if (e && e.needLogin) setNeedLogin(true)
      else setError((e && e.message) || '每日推荐加载失败')
    } finally {
      setLoading(false)
    }
  }

  const showMenu = (e: React.MouseEvent, song: Song) =>
    useSongMenu.getState().show(e.clientX, e.clientY, song)

  const currentId = queue[currentIndex]?.id

  if (loading) {
    return (
      <div className="content-scroll">
        <div className="loading-wrap">
          <div className="spinner" />
          <div>正在加载每日推荐…</div>
        </div>
      </div>
    )
  }

  // 未登录 / 需要登录
  if (needLogin) {
    return (
      <div className="content-scroll">
        <div className="page-header">
          <h1 className="page-title">每日推荐</h1>
          <span className="page-sub">{dateText()} · {WEEK[new Date().getDay()]}</span>
        </div>
        <div className="notice-box" style={{ marginBottom: 18 }}>
          每日推荐需要登录网易云账号后才能生成。请先在「设置」中登录。
        </div>
        <div className="empty">
          <div className="empty-icon">
            <IconHeart size={34} filled={false} />
          </div>
          <div>登录后即可看到为你量身定制的 30 首每日推荐</div>
          <button className="btn primary" style={{ marginTop: 6 }} onClick={load}>
            我已登录，重新获取
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content-scroll">
        <div className="page-header">
          <h1 className="page-title">每日推荐</h1>
          <span className="page-sub">{dateText()} · {WEEK[new Date().getDay()]}</span>
        </div>
        <div className="error-box">{error}</div>
        <button className="btn" onClick={load}>重试</button>
      </div>
    )
  }

  return (
    <div className="content-scroll">
      <div className="page-header">
        <h1 className="page-title">每日推荐</h1>
        <span className="page-sub">{dateText()} · {WEEK[new Date().getDay()]}</span>
      </div>

      <div
        style={{
          fontSize: 12.5,
          color: 'var(--text-2)',
          marginBottom: 18,
          lineHeight: 1.7,
        }}
      >
        根据你的听歌口味每天更新，共 {songs.length} 首。喜欢就点个红心，推荐会越来越准。
      </div>

      {songs.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">♪</div>
          今天还没有推荐歌曲，先去听几首歌吧
        </div>
      ) : (
        <>
          <div className="toolbar">
            <button className="btn primary" onClick={() => playQueue(songs, 0)}>
              <IconPlay size={14} />
              <span style={{ marginLeft: 6 }}>播放全部</span>
            </button>
            <span className="small muted">共 {songs.length} 首</span>
          </div>

          <SongList
            songs={songs}
            currentId={currentId}
            likedIds={likedIds}
            onPlay={(_song, i) => playQueue(songs, i)}
            onLike={(song) => toggleLike(song.id).catch(() => {})}
            onAddQueue={addToQueue}
            onContextMenu={showMenu}
            emptyText="今天还没有推荐歌曲"
          />
        </>
      )}
    </div>
  )
}
