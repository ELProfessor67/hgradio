'use client';
import React from 'react'

const RendeDate = ({ index }: { index: number }) => {
  return (
    <div>
      {new Date(new Date().getTime() - ((index + 1) * 5 * 60 * 1000)).toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </div>
  )
}
export default RendeDate;