export type Business = {
  id: string
  name: string
  slug: string
  sector: string
  city: string
  google_review_url: string | null
  plan: string
  plan_status: string
}

export type Category = {
  id: string
  label_fr: string
  label_ar: string
  label_en?: string
}

export type FeedbackForm = {
  id: string
  business_id: string
  name: string
  categories: Category[]
}

export type RatingMap = {
  [categoryId: string]: number
}

export type Submission = {
  id: string
  form_id: string
  business_id: string
  ratings: RatingMap
  average_score: number
  comment: string | null
  created_at: string
}
