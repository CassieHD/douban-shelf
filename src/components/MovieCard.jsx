import StarRating from './StarRating'

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="180" viewBox="0 0 120 180"%3E%3Crect width="120" height="180" fill="%23222"/%3E%3Ctext x="60" y="95" text-anchor="middle" fill="%23555" font-size="14"%3E🎬%3C/text%3E%3C/svg%3E'

export default function MovieCard({ item }) {
  // 兼容豆瓣直接爬取（cover）和 TMDB（poster_path）两种格式
  const poster = item.cover
    || (item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : '')
    || PLACEHOLDER

  const title = item.title_cn || item.title || ''
  const year = item.year || (item.date || '').slice(0, 4)
  const rating = item.rating || ''
  const comment = item.comment || ''
  const genres = item.genres || ''
  const director = item.director || ''
  const doubanUrl = item.douban_url
    || (item.douban_id ? `https://movie.douban.com/subject/${item.douban_id}/` : '#')

  return (
    <a
      href={doubanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-[#222] transition-colors duration-200 hover:ring-1 hover:ring-[#e8c97e]/30"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-[#111]">
        <img
          src={poster}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = PLACEHOLDER }}
        />
        {rating && (
          <div className="absolute top-2 right-2 bg-black/70 rounded px-1.5 py-0.5 text-xs text-[#e8c97e] font-medium">
            ★ {rating}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-white leading-tight mb-1">{title}</h3>
        <div className="flex items-center gap-2 mb-1.5">
          {year && <span className="text-xs text-[#888]">{year}</span>}
          {rating && <StarRating rating={rating} />}
        </div>
        {director && <p className="text-xs text-[#666] mb-1 truncate">{director}</p>}
        {genres && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {genres.split(',').slice(0, 3).map(g => (
              <span key={g} className="text-[10px] bg-[#2a2a2a] text-[#888] px-1.5 py-0.5 rounded">{g.trim()}</span>
            ))}
          </div>
        )}
        {comment && (
          <p className="text-xs text-[#666] leading-relaxed">{comment}</p>
        )}
      </div>
    </a>
  )
}
