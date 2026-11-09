# 云娘音乐 — 开发约定（所有页面必须遵守）

## 技术栈
Electron 33 + React 18 + TypeScript + Vite + zustand + react-router-dom(HashRouter)
CSS：单一全局样式表 `src/styles/global.css`，**不要引入 CSS 框架/图标库**，图标从 `src/components/Icons.tsx` 导入。

## 已有基础设施（先读这些文件再动手）
- `src/types.ts` — Song / Playlist / UserProfile / QualityLevel 等类型
- `src/api/ncm.ts` — 全部网易云接口封装 + 工具函数
- `src/api/bridge.ts` — `window.yun.*`、`QUALITIES`、`levelToLabel`
- `src/store/player.ts` — `usePlayer()` 播放器状态机
- `src/store/auth.ts` — `useAuth()` 登录态
- `src/store/library.ts` — `useLibrary()` 喜欢的音乐
- `src/components/SongRow.tsx` — 导出 `SongRow` 与 `SongList`
- `src/components/Icons.tsx` — 所有图标
- `src/components/SongContextMenu.tsx` — `useSongMenu().show(x, y, song)` 右键菜单

## 页面编写规范

### 1. 结构
```tsx
import React, { useEffect, useState } from 'react'
import * as ncm from '@/api/ncm'
import { usePlayer } from '@/store/player'

export function XxxPage() {
  const [songs, setSongs] = useState<ncm.Song[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true); setError(null)
    try { /* ... */ } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  if (loading) return <div className="content-scroll"><div className="loading-wrap"><div className="spinner" /><div>加载中…</div></div></div>
  if (error) return <div className="content-scroll"><div className="error-box">{error}</div><button className="btn" onClick={load}>重试</button></div>
  // ...
}
```

### 2. 页面外壳
每个页面必须返回 `<div className="content-scroll">` 作为最外层（它负责滚动与内边距），**不要**自己写 padding。

头部统一用：
```tsx
<div className="page-header">
  <h1 className="page-title">标题</h1>
  <span className="page-sub">副标题说明</span>
</div>
```

### 3. 播放歌曲
```tsx
const { playSong, playQueue, addToQueue, addNext } = usePlayer()
const { likedIds, toggleLike } = useLibrary()
const { user } = useAuth()

// 列表播放（推荐，带整个列表做队列）
<SongList
  songs={songs}
  currentId={queue[currentIndex]?.id}
  likedIds={likedIds}
  onPlay={(song, i) => playQueue(songs, i)}
  onLike={(song) => toggleLike(song.id).catch(() => {})}
  onAddQueue={addToQueue}
  onContextMenu={(e, song) => useSongMenu.getState().show(e.clientX, e.clientY, song)}
/>
```

### 4. 卡片网格
```tsx
<div className="grid-cards">
  {list.map(p => (
    <div className="card" key={p.id} onClick={() => navigate(`/playlist/${p.id}`)}>
      <div className="card-cover-wrap">
        <img className="card-cover" src={ncm.coverUrl(p.coverImgUrl || p.picUrl, 300)} alt="" />
        <button className="card-play" onClick={(e) => { e.stopPropagation(); /* 播放 */ }}>
          <IconPlay size={15} />
        </button>
      </div>
      <div className="card-title">{p.name}</div>
      <div className="card-sub">...</div>
    </div>
  ))}
</div>
```

### 5. 可选标签筛选
```tsx
<div className="tabs">
  {cats.map(c => <button key={c} className={`chip ${active===c?'active':''}`} onClick={() => setActive(c)}>{c}</button>)}
</div>
```

### 6. 关键接口速查（`src/api/ncm.ts`）
| 函数 | 用途 |
|---|---|
| `search(kw, type, limit, offset)` | type: 1单曲 1000歌单 100歌手 10专辑 1002用户 1009电台 1004MV |
| `searchSuggest(kw)` / `hotSearch()` | 搜索建议 / 热搜 |
| `recommendSongs()` | 每日推荐歌曲（需登录）|
| `recommendResource()` | 每日推荐歌单 |
| `privateRadar()` | 私人雷达歌单 |
| `heartMode(songId, playlistId, count)` | 心动模式 |
| `personalFm()` / `personalFmMode(mode, limit)` | 私人漫游 / FM（mode: aidj\|DEFAULT\|FAMILIAR\|EXPLORE\|SCENE_RCMD）|
| `fmTrash(id)` | 漫游"不感兴趣" |
| `playlistCatlist()` | 歌单广场分类 |
| `topPlaylist(cat, order, limit, offset)` | 歌单广场列表（order: hot\|new）|
| `highqualityPlaylist(cat, limit)` | 精品歌单 |
| `playlistDetail(id)` / `playlistTrackAll(id)` | 歌单详情 / 全部歌曲 |
| `subscribePlaylist(id, subscribe)` | 收藏/取消收藏歌单 |
| `toplist()` / `toplistDetail(id)` | 排行榜列表 / 详情 |
| `likeList(uid)` / `songDetail(ids)` / `likeSong(id, like)` | 我喜欢 |
| `userSubscribedPlaylists(uid)` | 收藏的歌单（含自建）|
| `userCreatedPlaylists(uid)` | 自建歌单 |
| `cloudList(limit, offset)` | 音乐网盘列表 |
| `cloudDelete(id)` / `cloudSearch(kw)` | 网盘删除 / 搜索 |
| `lyric(id)` | 歌词（已解析成 lines，含 trans 翻译）|
| `coverUrl(url, size)` / `formatDuration(ms)` / `formatCount(n)` | 工具 |

**网盘注意**：`cloudList()` 返回 `{ data, count, size }`，其中 `data` 每项形如
`{ songId, songName, artist, album, fileName, fileSize, bitrate, simpleSong: {...} }`。
播放网盘歌曲用 `simpleSong`（或构造 `{ id: songId, name: songName, ar: [{name: artist, id:0}], al: {name: album, id:0}, dt: simpleSong.dt }`）。

### 7. 交互细节
- 所有"需要登录"的页面：`useAuth()` 拿 `user`，未登录时渲染提示（App 层已兜底，但页面内也应有防御）。
- 错误提示用 `<div className="error-box">`，警告用 `<div className="notice-box">`。
- 空状态用 `<div className="empty"><div className="empty-icon">♪</div>文案</div>`。
- 数字用 `formatCount()`，时长用 `formatDuration()`。
- 不要使用 `any` 之外的未导入符号；所有图标必须从 `@/components/Icons` 导入。
- 不要新增全局 CSS 类；如需少量样式用内联 `style={{}}`。
- **不要修改** `src/api/`、`src/store/`、`src/components/` 下已有文件（由 Lead 负责），只在 `src/pages/` 下创建你负责的文件。

## 质量要求
- 必须能通过 `npx tsc --noEmit`（无类型错误）。
- 必须处理 loading / error / empty 三态。
- 中文文案，风格干净克制，对齐现有深色主题。
