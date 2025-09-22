import React from 'react'
import { MdStarRate } from "react-icons/md";

const Message = ({ message, name, isOwner }) => {
  return (
    <div class="chat-message other">
      <div class="avatar">{name?.slice(0,2)?.toUpperCase()}</div>
      <div class="w-100">
        <div class="d-flex align-items-center">
          <div class="fw-bold text-gray-900">{isOwner && <MdStarRate size={20} color='yellow'/>} {name}</div>
          <div class="message-info">June 1 2024, 10:30 AM</div>
        </div>
        <div class="message-bubble">
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