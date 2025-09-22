import { IoMdClose } from 'react-icons/io';
import ScrollToBottom from 'react-scroll-to-bottom';


export default function ChatBox({ open, onClose, children, setName, name, message, setMessage, handleSendMessage }) {
    return (
      
        <div className={`absolute top-0 left-0 right-0 bottom-0 z-[100000] bg-black/5 ${open ? '' : 'hidden'}`}>
            <div className="max-w-[40rem] mx-auto mt-32 min-h-[35rem] bg-white shadow-md p-3 px-3 rounded-md flex flex-col">
                <div class="modal-dialog modal-lg modal-dialog-scrollable" style={{ display: "block", margin: 0 }}>
                    <div class="modal-content" >
                        <div class="modal-header pb-2 mb-4" style={{ margin: "1rem 0", margin: 0, marginBottom: ".5rem", borderBottom: "1px solid gray", }}>
                            <h5 class="modal-title text-dark" id="chatModalLabel">Chat with Radio Broadcaster</h5>
                            <button type="button" class="btn-close text-dark" onClick={onClose}>X</button>
                        </div>
                        <div className="body py-4 flex-1 overflow-auto relative" style={{ flex: 'none', height: '28rem', overflowY: 'auto' }}>
                            <ScrollToBottom className='w-full h-full'>
                                {children}
                               
                            </ScrollToBottom>
                        </div>
                        <div class="modal-footer pt-2 mt-2 border-t border-gray-600" style={{borderTop: "1px solid gray"}}>
                            <div class="input-group input-group-custom">
                                <input type="text" class="form-control bg-secondary bordered text-white fs-5" placeholder="Type your message" style={{height: "2.5rem", }} id='name' name='name' value={message} onChange={(e) => setMessage(e.target.value)}/>
                                <button type="button" class="btn btn-primary btn-sm bg-primary" onClick={handleSendMessage}>Send</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}