import { create } from 'zustand'
import * as ncm from '@/api/ncm'

interface LibraryState {
  likedIds: Set<number>
  loading: boolean
  loadLikes: (uid: number) => Promise<void>
  toggleLike: (songId: number) => Promise<boolean>
  isLiked: (songId: number) => boolean
}

export const useLibrary = create<LibraryState>((set, get) => ({
  likedIds: new Set<number>(),
  loading: false,

  loadLikes: async (uid: number) => {
    set({ loading: true })
    try {
      const ids = await ncm.likeList(uid)
      set({ likedIds: new Set(ids), loading: false })
    } catch (e) {
      set({ loading: false })
    }
  },

  toggleLike: async (songId: number) => {
    const set0 = new Set(get().likedIds)
    const wasLiked = set0.has(songId)
    // 乐观更新
    wasLiked ? set0.delete(songId) : set0.add(songId)
    set({ likedIds: set0 })
    try {
      await ncm.likeSong(songId, !wasLiked)
      return !wasLiked
    } catch (e) {
      // 回滚
      const rb = new Set(get().likedIds)
      wasLiked ? rb.add(songId) : rb.delete(songId)
      set({ likedIds: rb })
      throw e
    }
  },

  isLiked: (songId: number) => get().likedIds.has(songId),
}))
