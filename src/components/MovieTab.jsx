import { useState, useMemo } from 'react'
import MovieCard from './MovieCard'
import FilterBar from './FilterBar'

export default function MovieTab({ movies }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')
  const [ratingFilter, setRatingFilter] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 48

  const filtered = useMemo(() => {
    let list = movies
    if (ratingFilter) list = list.filter(m => String(m.rating) === ratingFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m =>
        (m.title_cn || m.title || m.Title || '').toLowerCase().includes(q) ||
        (m.director || '').toLowerCase().includes(q) ||
        (m.genres || '').toLowerCase().includes(q) ||
        (m.comment || m.Review || '').toLowerCase().includes(q)
      )
    }
    list = [...list].sort((a, b) => {
      const da = a.date || a.WatchedDate || ''
      const db = b.date || b.WatchedDate || ''
      const ra = parseInt(a.rating || a.Rating) || 0
      const rb = parseInt(b.rating || b.Rating) || 0
      if (sortBy === 'date_desc') return db.localeCompare(da)
      if (sortBy === 'date_asc') return da.localeCompare(db)
      if (sortBy === 'rating_desc') return rb - ra
      if (sortBy === 'rating_asc') return ra - rb
      return 0
    })
    return list
  }, [movies, search, sortBy, ratingFilter])

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
      <p className="text-xs text-[#555] mb-4">{filtered.length} films</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {paginated.map((m, i) => (
          <MovieCard key={m.douban_id || m.imdbID || i} item={m} />
        ))}
      </div>
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#888] hover:text-white hover:border-[#e8c97e]/50 transition-colors"
          >
            Load more ({filtered.length - paginated.length} remaining)
          </button>
        </div>
      )}
    </div>
  )
}
