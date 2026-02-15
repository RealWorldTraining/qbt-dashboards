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
  const [sortBy, setSortBy] = useState<string>("weight-desc")

  // Stats
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgStars: 0,
    fiveStarPct: 0,
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
      setStats({ totalReviews: 0, avgStars: 0, fiveStarPct: 0 })
      return
    }

    const totalStars = reviewList.reduce((sum, r) => sum + r.stars, 0)
    const fiveStarCount = reviewList.filter(r => r.stars === 5).length

    setStats({
      totalReviews: reviewList.length,
      avgStars: totalStars / reviewList.length,
      fiveStarPct: (fiveStarCount / reviewList.length) * 100,
    })
  }

  function resetFilters() {
    setSelectedService("")
    setSelectedInstructor("")
    setSelectedStars("")
    setSearchTerm("")
    setSortBy("weight-desc")
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
                <div className="space-y-3 pb-6 border-b">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</div>
                    <div className="text-2xl font-bold">{stats.totalReviews.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      {stats.avgStars.toFixed(2)}
                      <Star className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="text-xs text-gray-500">
                      {stats.fiveStarPct.toFixed(1)}% are 5-star
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-4">
                  {/* Service Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Service</label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="">All Services</option>
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

                  {/* Stars Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Stars</label>
                    <select
                      value={selectedStars}
                      onChange={(e) => setSelectedStars(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
                    >
                      <option value="">All Ratings</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
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
                      <option value="weight-desc">Quality (High to Low)</option>
                      <option value="weight-asc">Quality (Low to High)</option>
                      <option value="date-desc">Date (Newest First)</option>
                      <option value="date-asc">Date (Oldest First)</option>
                      <option value="stars-desc">Rating (High to Low)</option>
                      <option value="stars-asc">Rating (Low to High)</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Search</label>
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
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t">
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={fetchReviews}
                    className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Refresh Data
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Reviews (70% width, scrollable) */}
          <div className="w-[70%]">
            <Card>
              <CardHeader>
                <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="space-y-4 overflow-y-auto pr-2"
                  style={{ maxHeight: 'calc(100vh - 250px)' }}
                >
                  {filteredReviews.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No reviews match your filters
                    </p>
                  ) : (
                    filteredReviews.map((review, idx) => (
                      <div
                        key={idx}
                        className="border-b pb-4 last:border-b-0"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold">
                              {review.firstName} {review.lastName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {review.service}
                              {review.instructor && ` • ${review.instructor}`}
                              {' • '}
                              {new Date(review.entryDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
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
          </div>
        </div>
      </main>
    </div>
  )
}
