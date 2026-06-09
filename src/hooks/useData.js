import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'

const BASE = import.meta.env.BASE_URL

// 本地封面路径（/covers/...）需要加上 BASE_URL 前缀才能正确访问
function fixCover(cover) {
  if (!cover) return cover
  if (cover.startsWith('/covers/')) return BASE + cover.slice(1)
  return cover
}

async function loadCSV(path) {
  try {
    const res = await fetch(path)
    if (!res.ok) return []
    const text = await res.text()
    const result = Papa.parse(text, { header: true, skipEmptyLines: true })
    return result.data
  } catch {
    return []
  }
}

async function loadJSON(path) {
  try {
    const res = await fetch(path)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export function useData() {
  const [movies, setMovies] = useState([])
  const [books, setBooks] = useState([])
  const [music, setMusic] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      loadJSON(`${BASE}data/movies.json`),
      loadCSV(`${BASE}data/books.csv`),
      loadCSV(`${BASE}data/music.csv`),
    ]).then(([moviesData, booksData, musicData]) => {
      // 只保留看过/读过/听过（status === 'collect'）
      setMovies(moviesData.filter(m => m.status === 'collect').map(m => ({ ...m, cover: fixCover(m.cover) })))
      setBooks(booksData.filter(b => b.status === 'collect').map(b => ({ ...b, cover: fixCover(b.cover) })))
      setMusic(musicData.filter(m => m.status === 'collect').map(m => ({ ...m, cover: fixCover(m.cover) })))
      setLoading(false)
    })
  }, [])

  const stats = useMemo(() => ({
    movies: { total: movies.length },
    books:  { total: books.length },
    music:  { total: music.length },
  }), [movies, books, music])

  return { movies, books, music, loading, stats }
}
