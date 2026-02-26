// import { BsSend, BsSendFill } from 'react-icons/bs';
// import { IoMdClose } from 'react-icons/io';
// import ScrollToBottom from 'react-scroll-to-bottom';


// export default function ChatBox({ open, onClose, children, setName, name, message, setMessage, handleSendMessage }) {
//     return (

//         <div className={`top-0 left-0 right-0 bottom-0 z-[100000] bg-black/5 fixed ${open ? '' : 'hidden'}`}>
//             <div className="max-w-[40rem] mx-auto mt-20 min-h-[35rem] bg-white shadow-md p-3 px-3 rounded-md flex flex-col !text-black">
//                 <div class="modal-dialog modal-lg modal-dialog-scrollable" style={{ display: "block", margin: 0 }}>
//                     <div class="modal-content" >
//                         <div class="modal-header pb-2 mb-4 flex justify-between items-center" style={{ margin: "1rem 0", margin: 0, marginBottom: ".5rem", borderBottom: "1px solid gray", }}>
//                             <h5 class="modal-title text-dark !text-black" id="chatModalLabel">Chat with Radio Broadcaster</h5>
//                             <button type="button" class="btn-close text-dark !text-black" onClick={onClose}>X</button>
//                         </div>
//                         <div className="body py-4 flex-1 overflow-auto relative  scrollbar-hide" style={{ flex: 'none', height: '28rem', overflowY: 'auto' }}>
//                             <ScrollToBottom className='w-full h-full space-y-2'>
//                                 {children}

//                             </ScrollToBottom>
//                         </div>
//                         <div class="modal-footer pt-2 mt-2 border-t border-gray-600 w-full" style={{borderTop: "1px solid gray"}}>
//                             <div class="input-group input-group-custom flex items-center gap-2 p-0">
//                                 <input type="text" class="form-control border border-gray-400 bordered focus:border-gray-400 outline-none  fs-5 !text-black flex-1 p-2" placeholder="Type your message" style={{height: "2.5rem", }} id='name' name='name' value={message} onChange={(e) => setMessage(e.target.value)}/>
//                                 <button type="button" class="btn btn-primary btn-sm bg-primary !text-black bg-red-600 rounded-full p-2 h-8 w-8 flex items-center justify-center text-2xl" onClick={handleSendMessage}><BsSendFill/></button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

import { BsSendFill } from 'react-icons/bs'
import ScrollToBottom from 'react-scroll-to-bottom'
import { useEffect, useState } from 'react'

export default function ChatBox({
    open,
    onClose,
    children,
    message,
    setMessage,
    handleSendMessage,
    setName,
    name
}) {
    const [tempName, setTempName] = useState("")

    // ✅ Load name from localStorage (only once)
    useEffect(() => {
        const savedName = localStorage.getItem("chat_name")
        if (savedName) setName(savedName)
    }, [])

    // ✅ Save name
    const handleSaveName = () => {
        if (!tempName.trim()) return
        setName(tempName)
        localStorage.setItem("chat_name", tempName)
    }

    if (!open) return null

    return (
        <div className="top-0 left-0 right-0 bottom-0 z-[100000] bg-black/5 fixed">
            <div className="max-w-[40rem] mx-auto mt-20 min-h-[35rem] bg-white shadow-md p-3 rounded-md flex flex-col text-black">

                {/* HEADER */}
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                    <h5 className="text-lg font-semibold">Chat with Radio Broadcaster</h5>
                    <button onClick={onClose}>X</button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-auto h-[28rem]">
                    <ScrollToBottom className="w-full h-full space-y-2">
                        {children}
                    </ScrollToBottom>
                </div>

                {/* FOOTER */}
                <div className="border-t pt-2">

                    {/* 👉 Ask Name Only Once */}
                    {!name ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter your name"
                                className="flex-1 border p-2 outline-none text-black"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                            />
                            <button
                                className="bg-green-600 text-white px-3 rounded"
                                onClick={handleSaveName}
                            >
                                Continue
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2 items-center">

                            <input
                                type="text"
                                placeholder="Type your message"
                                className="flex-1 border p-2 outline-none text-black"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(name)}
                            />

                            <button
                                className="bg-red-600 text-white rounded-full p-2 h-9 w-9 flex items-center justify-center"
                                onClick={() => handleSendMessage(name)}
                            >
                                <BsSendFill />
                            </button>

                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}