import React, { Suspense } from 'react'
import PageContent from "./Content"
import { PageLoading } from '@/utils/Loading'

const page = () => {
  return (
    <Suspense fallback={<PageLoading />}>
      <PageContent />
    </Suspense>
  )
}

export default page