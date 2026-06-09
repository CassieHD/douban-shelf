export default function StatsBar({ stats }) {
  const items = [
    { icon: '🎬', label: 'Films', total: stats.movies.total },
    { icon: '📚', label: 'Books', total: stats.books.total },
    { icon: '🎵', label: 'Music', total: stats.music.total },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {items.map(item => (
        <div key={item.label} className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{item.icon}</span>
            <span className="text-2xl font-bold text-white">{item.total}</span>
          </div>
          <div className="text-sm text-[#888]">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
