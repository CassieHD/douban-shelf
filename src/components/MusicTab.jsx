import { useState, useMemo } from 'react'
import MusicCard from './MusicCard'
import FilterBar from './FilterBar'

export default function MusicTab({ music }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')
  const [ratingFilter, setRatingFilter] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 48

  const filtered = useMemo(() => {
    let list = music
    if (ratingFilter) list = list.filter(m => String(m.rating) === ratingFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        (m.title || '').toLowerCase().includes(q) ||
        (m.intro || '').toLowerCase().includes(q) ||
        (m.comment || '').toLowerCase().includes(q)
      )
    }
    list = [...list].sort((a, b) => {
      const da = a.date || ''
      const db = b.date || ''
      const ra = parseInt(a.rating) || 0
      const rb = parseInt(b.rating) || 0
      if (sortBy === 'date_desc') return db.localeCompare(da)
      if (sortBy === 'date_asc') return da.localeCompare(db)
      if (sortBy === 'rating_desc') return rb - ra
      if (sortBy === 'rating_asc') return ra - rb
      return 0
    })
    return list
  }, [music, search, sortBy, ratingFilter])

  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = paginated.length < filtered.length

  const handleSearch = (val) => { setSearch(val); setPage(1) }
  const handleSort = (val) => { setSortBy(val); setPage(1) }
  const handleRating = (val) => { setRatingFilter(val); setPage(1) }

  return (
    <div>
      <FilterBar
        search={search} onSearch={handleSearch}
        sortBy={sortBy} onSortBy={handleSort}
        ratingFilter={ratingFilter} onRatingFilter={handleRating}
      />
      <p className="text-xs text-[#555] mb-4">共 {filtered.length} 张</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {paginated.map((m, i) => (
          <MusicCard key={m.douban_id || i} item={m} />
        ))}
      </div>
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#888] hover:text-white hover:border-[#e8c97e]/50 transition-colors"
          >
            加载更多（还有 {filtered.length - paginated.length} 张）
          </button>
        </div>
      )}
    </div>
  )
}
