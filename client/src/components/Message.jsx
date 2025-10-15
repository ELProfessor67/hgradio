import React from 'react'
import { MdStarRate } from "react-icons/md";

const Message = ({ message, name, isOwner }) => {
  return (
    <div class="other flex items-center gap-2 justify-start mt-2 mb-2">
      <div class="avatar">{name?.slice(0,2)?.toUpperCase()}</div>
      <div class="w-100">
        <div class="d-flex align-items-center flex items-center gap-2 justify-start">
          <div class="fw-bold text-gray-900/80 flex items-center gap-1">{isOwner && <span className='text-yellow-500'>⭐</span>} {name}</div>
          <div class="message-info text-gray-400 text-xs flex items-center gap-1">June 1 2024, 10:30 AM</div>
        </div>
        <div class="w-full">
          <div class="message-content text-black/90">{message}</div>
        </div>
      </div>
    </div>
    // <div className={`flex flex-col gap-0 my-2 bg-gray-100 mx-2 rounded-md px-3 py-1`}>
    //     <h2 className='text-lg text-gray-900 flex items-center gap-1'>
    //       {isOwner && <MdStarRate size={20} color='yellow'/>}
    //       {name}
    //     </h2>
    //     <p className='para text-sm'>{message}</p>
    // </div>
  )
}

export default Message