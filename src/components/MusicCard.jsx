import StarRating from './StarRating'

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"%3E%3Crect width="120" height="120" fill="%23222"/%3E%3Ctext x="60" y="65" text-anchor="middle" fill="%23555" font-size="12"%3E🎵%3C/text%3E%3C/svg%3E'

export default function MusicCard({ item }) {
  const cover = item.cover || PLACEHOLDER
  const title = item.title || ''
  const intro = item.intro || ''
  const rating = item.rating || ''
  const date = (item.date || '').slice(0, 7)
  const comment = item.comment || ''
  const statusLabel = item.status_label || ''
  const doubanUrl = item.douban_url || `https://music.douban.com/subject/${item.douban_id}/`

  // 从 intro 提取艺人名（格式通常是 "艺人 / 年份 / 类型"）
  const artist = intro ? intro.split('/')[0].trim() : ''

  return (
    <a
      href={doubanUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-[#1a1a1a] rounded-lg overflow-hidden hover:bg-[#222] transition-colors duration-200 hover:ring-1 hover:ring-[#e8c97e]/30"
    >
      <div className="relative aspect-square overflow-hidden bg-[#111]">
        <img
          src={cover}
          alt={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = PLACEHOLDER }}
        />
        {statusLabel && statusLabel !== '听过' && (
          <div className="absolute top-2 left-2 bg-black/70 rounded px-1.5 py-0.5 text-[10px] text-[#e8c97e]">
            {statusLabel}
          </div>
        )}
        {rating && (
          <div className="absolute top-2 right-2 bg-black/70 rounded px-1.5 py-0.5 text-xs text-[#e8c97e] font-medium">
            ★ {rating}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-white leading-tight mb-1">{title}</h3>
        {artist && <p className="text-xs text-[#888] mb-1 truncate">{artist}</p>}
        <div className="flex items-center gap-2 mb-1.5">
          {date && <span className="text-xs text-[#666]">{date}</span>}
          {rating && <StarRating rating={rating} />}
        </div>
        {comment && (
          <p className="text-xs text-[#666] leading-relaxed">{comment}</p>
        )}
      </div>
    </a>
  )
}
