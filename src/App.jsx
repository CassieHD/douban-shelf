import { useState } from 'react'
import { useData } from './hooks/useData'
import StatsBar from './components/StatsBar'
import MovieTab from './components/MovieTab'
import BookTab from './components/BookTab'
import MusicTab from './components/MusicTab'

const TABS = [
  { id: 'movie', label: '🎬 电影' },
  { id: 'book', label: '📚 书籍' },
  { id: 'music', label: '🎵 音乐' },
]

export default function App() {
  const { movies, books, music, loading, stats } = useData()
  const [activeTab, setActiveTab] = useState('movie')

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="border-b border-[#1e1e1e] sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">Cassie's shelf</h1>
            <p className="text-xs text-[#555] mt-0.5">Explore the diversity</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[#555] text-sm">加载中...</div>
          </div>
        ) : (
          <>
            {/* 统计 */}
            <StatsBar stats={stats} />

            {/* Tab 切换 */}
            <div className="flex gap-1 mb-8 border-b border-[#1e1e1e]">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-[#666] hover:text-[#aaa]'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e8c97e] rounded-t" />
                  )}
                </button>
              ))}
            </div>

            {/* 内容 */}
            {activeTab === 'movie' && <MovieTab movies={movies} />}
            {activeTab === 'book' && <BookTab books={books} />}
            {activeTab === 'music' && <MusicTab music={music} />}
          </>
        )}
      </main>

      <footer className="border-t border-[#1e1e1e] mt-16 py-6 text-center text-xs text-[#444]">
        数据来自豆瓣 · 电影元数据来自 TMDB · 仅供个人使用
      </footer>
    </div>
  )
}
