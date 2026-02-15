"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DashboardNav } from "@/components/DashboardNav"
import { CardSkeleton } from "@/components/ui/skeleton"
import { Star, TrendingUp, Filter, Search, RefreshCw } from "lucide-react"

interface Review {
  entryDate: string
  firstName: string
  lastName: string
  service: string
  instructor: string
  stars: number
  review: string
  finalWeight: number | string
  context: number
  specificity: number
  actionability: number
  wordCount: number
  lengthBonus: number
  baseScore: number
}

interface ReviewsResponse {
  success: boolean
  count: number
  reviews: Review[]
  filters: {
    services: string[]
    instructors: string[]
  }
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [services, setServices] = useState<string[]>([])
  const [instructors, setInstructors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [selectedService, setSelectedService] = useState<string>("")
  const [selectedInstructor, setSelectedInstructor] = useState<string>("")
  const [selectedStars, setSelectedStars] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("date-desc")

  // Stats
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgStars: 0,
    fiveStarPct: 0,
    starBreakdown: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    }
  })

  useEffect(() => {
    fetchReviews()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [reviews, selectedService, selectedInstructor, selectedStars, searchTerm, sortBy])

  async function fetchReviews() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews')
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data: ReviewsResponse = await response.json()

      if (data.success) {
        setReviews(data.reviews)
        setFilteredReviews(data.reviews)
        setServices(data.filters.services)
        setInstructors(data.filters.instructors)
        calculateStats(data.reviews)
      } else {
        throw new Error('API returned failure')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...reviews]

    if (selectedService) {
      filtered = filtered.filter(r => r.service === selectedService)
    }

    if (selectedInstructor) {
      filtered = filtered.filter(r => r.instructor === selectedInstructor)
    }

    if (selectedStars) {
      const starsNum = parseInt(selectedStars)
      filtered = filtered.filter(r => r.stars === starsNum)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r => 
        r.review.toLowerCase().includes(term) ||
        r.firstName.toLowerCase().includes(term) ||
        r.lastName.toLowerCase().includes(term)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'weight-desc':
          const aWeight = typeof a.finalWeight === 'number' ? a.finalWeight : 0
          const bWeight = typeof b.finalWeight === 'number' ? b.finalWeight : 0
          return bWeight - aWeight
        case 'weight-asc':
          const aWeightAsc = typeof a.finalWeight === 'number' ? a.finalWeight : 0
          const bWeightAsc = typeof b.finalWeight === 'number' ? b.finalWeight : 0
          return aWeightAsc - bWeightAsc
        case 'date-desc':
          return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
        case 'date-asc':
          return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
        case 'stars-desc':
          return b.stars - a.stars
        case 'stars-asc':
          return a.stars - b.stars
        default:
          return 0
      }
    })

    setFilteredReviews(filtered)
    calculateStats(filtered)
  }

  function calculateStats(reviewList: Review[]) {
    if (reviewList.length === 0) {
      setStats({ 
        totalReviews: 0, 
        avgStars: 0, 
        fiveStarPct: 0,
        starBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      })
      return
    }

    const totalStars = reviewList.reduce((sum, r) => sum + r.stars, 0)
    const fiveStarCount = reviewList.filter(r => r.stars === 5).length

    // Calculate breakdown by star level
    const breakdown = {
      5: reviewList.filter(r => r.stars === 5).length,
      4: reviewList.filter(r => r.stars === 4).length,
      3: reviewList.filter(r => r.stars === 3).length,
      2: reviewList.filter(r => r.stars === 2).length,
      1: reviewList.filter(r => r.stars === 1).length,
    }

    setStats({
      totalReviews: reviewList.length,
      avgStars: totalStars / reviewList.length,
      fiveStarPct: (fiveStarCount / reviewList.length) * 100,
      starBreakdown: breakdown,
    })
  }

  function resetFilters() {
    setSelectedService("")
    setSelectedInstructor("")
    setSelectedStars("")
    setSearchTerm("")
    setSortBy("date-desc")
  }

  function renderStars(count: number) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= count ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <CardSkeleton />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
              <button
                onClick={fetchReviews}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Customer Reviews
          </h1>
        </div>

        {/* Sidebar + Reviews Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters (30% width, fixed) */}
          <div className="w-[30%] flex-shrink-0">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter size={20} />
                  Filters & Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats at top */}
                <div className="pb-6 border-b">
                  <div className="flex gap-6">
                    {/* Left Side - Stats */}
                    <div className="flex-shrink-0 space-y-3">
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Total Reviews</div>
                        <div className="text-2xl font-bold">{stats.totalReviews.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Avg Rating</div>
                        <div className="text-2xl font-bold flex items-center gap-1">
                          {stats.avgStars.toFixed(1)}
                          <Star className="h-4 w-4 text-yellow-400" />
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Star Breakdown Bar Chart */}
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((starLevel) => {
                        const count = stats.starBreakdown[starLevel as keyof typeof stats.starBreakdown]
                        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
                        
                        return (
                          <button
                            key={starLevel}
                            onClick={() => {
                              // Toggle: if already selected, clear filter
                              if (selectedStars === String(starLevel)) {
                                setSelectedStars("")
                              } else {
                                setSelectedStars(String(starLevel))
                              }
                            }}
                            className={`w-full flex items-center gap-2 text-sm transition-opacity ${
                              selectedStars === String(starLevel) ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                            }`}
                          >
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-12">
                              {starLevel} star
                            </span>
                            <div className="flex-1 h-5 bg-gray-200 dark:bg-gray-700 rounded-sm overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  starLevel === 5 ? 'bg-orange-500' :
                                  starLevel === 4 ? 'bg-orange-400' :
                                  starLevel === 3 ? 'bg-orange-300' :
                                  starLevel === 2 ? 'bg-orange-200' :
                                  'bg-orange-100'
                                } ${
                                  selectedStars === String(starLevel) ? 'ring-2 ring-blue-500 ring-inset' : ''
                                }`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-10 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-4">
                  {/* Training Type Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Training Type</label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="">All Types</option>
                      {services.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Instructor Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Instructor</label>
                    <select
                      value={selectedInstructor}
                      onChange={(e) => setSelectedInstructor(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="">All Instructors</option>
                      {instructors.map((instructor) => (
                        <option key={instructor} value={instructor}>
                          {instructor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="date-desc">Date (Newest First)</option>
                      <option value="date-asc">Date (Oldest First)</option>
                      <option value="weight-desc">Quality (High to Low)</option>
                      <option value="weight-asc">Quality (Low to High)</option>
                      <option value="stars-desc">Rating (High to Low)</option>
                      <option value="stars-asc">Rating (Low to High)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Reviews (70% width, scrollable) */}
          <div className="w-[70%] flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardContent className="px-6 pt-2 pb-0 flex-1 flex flex-col">
                <div 
                  className="space-y-2 overflow-y-auto pr-2 flex-1"
                  style={{ maxHeight: 'calc(100vh - 240px)' }}
                >
                  {filteredReviews.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No reviews match your filters
                    </p>
                  ) : (
                    filteredReviews.map((review, idx) => (
                      <div
                        key={idx}
                        className="border-b pb-2 last:border-b-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold">
                              {review.firstName} {review.lastName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {review.service}
                              {review.instructor && review.instructor.trim() && review.instructor !== 'Not Sure' && (
                                <>
                                  {' • '}
                                  <span className="font-medium">{review.instructor}</span>
                                </>
                              )}
                              {' • '}
                              {new Date(review.entryDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            {renderStars(review.stars)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {review.review}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Buttons and Search - Below reviews, aligned with Sort By */}
            <div className="mt-4 flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search reviews..."
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Reset Filters
              </button>
              <button
                onClick={fetchReviews}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
