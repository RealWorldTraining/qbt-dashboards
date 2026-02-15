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
  const [minStars, setMinStars] = useState<number>(0)
  const [minWeight, setMinWeight] = useState<number>(0)
  const [searchTerm, setSearchTerm] = useState<string>("")

  // Stats
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgStars: 0,
    avgWeight: 0,
    fiveStarPct: 0,
  })

  useEffect(() => {
    fetchReviews()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [reviews, selectedService, selectedInstructor, minStars, minWeight, searchTerm])

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

    if (minStars > 0) {
      filtered = filtered.filter(r => r.stars >= minStars)
    }

    if (minWeight > 0) {
      filtered = filtered.filter(r => 
        typeof r.finalWeight === 'number' && r.finalWeight >= minWeight
      )
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r => 
        r.review.toLowerCase().includes(term) ||
        r.firstName.toLowerCase().includes(term) ||
        r.lastName.toLowerCase().includes(term)
      )
    }

    setFilteredReviews(filtered)
    calculateStats(filtered)
  }

  function calculateStats(reviewList: Review[]) {
    if (reviewList.length === 0) {
      setStats({ totalReviews: 0, avgStars: 0, avgWeight: 0, fiveStarPct: 0 })
      return
    }

    const totalStars = reviewList.reduce((sum, r) => sum + r.stars, 0)
    const weights = reviewList.filter(r => typeof r.finalWeight === 'number')
    const totalWeight = weights.reduce((sum, r) => sum + (r.finalWeight as number), 0)
    const fiveStarCount = reviewList.filter(r => r.stars === 5).length

    setStats({
      totalReviews: reviewList.length,
      avgStars: totalStars / reviewList.length,
      avgWeight: weights.length > 0 ? totalWeight / weights.length : 0,
      fiveStarPct: (fiveStarCount / reviewList.length) * 100,
    })
  }

  function resetFilters() {
    setSelectedService("")
    setSelectedInstructor("")
    setMinStars(0)
    setMinWeight(0)
    setSearchTerm("")
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
          <div className="grid gap-4 md:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Customer Reviews Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze and filter customer reviews with quality weighting
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgStars.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {stats.fiveStarPct.toFixed(1)}% are 5-star
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Weight</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgWeight.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">
                Quality score
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <button
                onClick={fetchReviews}
                className="w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Refresh Data
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter size={20} />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Service Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
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
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="">All Instructors</option>
                  {instructors.map((instructor) => (
                    <option key={instructor} value={instructor}>
                      {instructor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Stars Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Min Stars</label>
                <select
                  value={minStars}
                  onChange={(e) => setMinStars(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="0">Any</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5 only</option>
                </select>
              </div>

              {/* Min Weight Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Min Weight</label>
                <input
                  type="number"
                  value={minWeight}
                  onChange={(e) => setMinWeight(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                />
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
                    className="w-full pl-10 pr-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Reset Filters
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
            <CardDescription>
              Sorted by weight (highest quality first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                      <div className="flex flex-col items-end gap-2">
                        {renderStars(review.stars)}
                        <div className="text-xs font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          Weight: {typeof review.finalWeight === 'number' ? review.finalWeight.toFixed(1) : review.finalWeight}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {review.review}
                    </p>
                    <div className="mt-2 flex gap-4 text-xs text-gray-500">
                      <span>Context: {review.context}</span>
                      <span>Specificity: {review.specificity}</span>
                      <span>Actionability: {review.actionability}</span>
                      <span>Words: {review.wordCount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
