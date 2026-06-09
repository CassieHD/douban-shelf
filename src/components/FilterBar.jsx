export default function FilterBar({ search, onSearch, statusFilter, onStatusFilter, sortBy, onSortBy, statusOptions, ratingFilter, onRatingFilter }) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {/* 搜索框 */}
      <div className="relative flex-1 min-w-[200px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="搜索..."
          value={search}
          onChange={e => onSearch(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#e8c97e]/50 transition-colors"
        />
      </div>

      {/* 状态筛选（仅在传入 statusOptions 时显示） */}
      {statusOptions && statusOptions.length > 0 && (
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => onStatusFilter(opt.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-[#e8c97e] text-black'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* 评分筛选 */}
      <select
        value={ratingFilter}
        onChange={e => onRatingFilter(e.target.value)}
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#888] focus:outline-none focus:border-[#e8c97e]/50 cursor-pointer"
      >
        <option value="">全部评分</option>
        <option value="5">★★★★★ 力荐</option>
        <option value="4">★★★★ 推荐</option>
        <option value="3">★★★ 还行</option>
        <option value="2">★★ 较差</option>
        <option value="1">★ 很差</option>
      </select>

      {/* 排序 */}
      <select
        value={sortBy}
        onChange={e => onSortBy(e.target.value)}
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#888] focus:outline-none focus:border-[#e8c97e]/50 cursor-pointer"
      >
        <option value="date_desc">最近标记</option>
        <option value="date_asc">最早标记</option>
        <option value="rating_desc">评分最高</option>
        <option value="rating_asc">评分最低</option>
      </select>
    </div>
  )
}
