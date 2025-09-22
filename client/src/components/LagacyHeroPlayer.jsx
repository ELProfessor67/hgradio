import { useSocketUser } from '@/hooks'
import { useRef } from 'react'
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2'
import { useState, useEffect } from 'react';
import axios from 'axios';
import Dialog from '@/components/Dialog';
import NewDialog from '@/components/NewDialog';
import ChatBox from '@/components/ChatBox';
import Message from '@/components/Message';
import { MdCall } from "react-icons/md";
import CallComponents from '@/components/CallComponents';
import { FaUser } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { REACT_PUBLIC_RADIO_URL, REACT_PUBLIC_SOCKET_URL } from '@/constants';
import { IoPlayOutline } from "react-icons/io5";
import { IoPauseOutline } from "react-icons/io5";
import { IoChatboxEllipsesOutline } from "react-icons/io5";

const sleep = ms => new Promise(r => window.setTimeout(r, ms));
function groupDJsByDays(djsData) {
	const daysDict = {
		0: [],
		1: [],
		2: [],
		3: [],
		4: [],
		5: [],
		6: []
	};

	djsData.forEach(dj => {
		dj.djDays.forEach(day => {
			daysDict[day].push(dj);
		});
	});

	return daysDict;
}


function getNextDJ(djs) {
	const now = new Date();
	const currentUTCDay = now.getUTCDay();
	const currentUTCHours = now.getUTCHours();
	const currentUTCMinutes = now.getUTCMinutes();
	const currentUTCTimeInMinutes = currentUTCHours * 60 + currentUTCMinutes; // Convert current UTC time to minutes since midnight

	let nextDJ = null;
	let minTimeDiff = Infinity;

	djs.forEach(dj => {
		// Check if DJ is active on the current UTC day
		if (dj.djDays.includes(String(currentUTCDay))) {
			const [startHours, startMinutes] = dj.djStartTime?.split(':').map(Number);
			const startTimeInMinutes = startHours * 60 + startMinutes;
			let timeDiff = startTimeInMinutes - currentUTCTimeInMinutes;

			if (timeDiff < 0) {
				timeDiff += 24 * 60; // Adjust for next day if the DJ's start time has already passed today
			}

			// Check if this DJ has the smallest time difference and update nextDJ accordingly
			if (timeDiff < minTimeDiff) {
				minTimeDiff = timeDiff;
				nextDJ = dj;
			}
		}
	});

	return nextDJ;
}


function convertUTCToLocal(utcTime, utcDate = new Date()) {
	// Split the UTC time into hours and minutes
	if (!utcTime) return
	const [utcHours, utcMinutes] = utcTime.split(':').map(Number);

	// Create a Date object using the provided UTC time and date
	const utcDateTime = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcHours, utcMinutes));

	// Get the local time equivalent
	const localDateTime = new Date(utcDateTime);

	// Extract the local hours and minutes
	const localHours = localDateTime.getHours();
	const localMinutes = localDateTime.getMinutes();

	// Format the local time as a string in HH:MM format
	const localTime = `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;

	return localTime;
}

function toTitleCase(str) {
	return str.replace(
		/\w\S*/g,
		function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		}
	);
}


const Timer = ({ timerStart }) => {
	const [straimgTime, setStraimgTime] = useState('00:00:00');
	const interValref = useRef();
	const [second, setSecond] = useState(0);


	const startTime = () => {
		interValref.current = setInterval(() => {
			setSecond(prev => prev + 1);
		}, 1000);

	}

	useEffect(() => {
		let hour = Math.floor(second / 3600);
		let min = Math.floor((second % 3600) / 60);
		let sec = Math.floor((second % 3600) % 60);

		// console.log(second)

		if (hour < 10) hour = `0${hour}`;
		if (min < 10) min = `0${min}`;
		if (sec < 10) sec = `0${sec}`;

		// console.log(`${hour}:${min}:${sec}`)
		setStraimgTime(`${hour}:${min}:${sec}`);
	}, [second]);

	const stopTime = () => {
		clearInterval(interValref.current);
	}

	useEffect(() => {
		console.log(timerStart);
		if (timerStart) {
			startTime();
		} else {
			stopTime();
		}
	}, [timerStart])
	return <span>{straimgTime}</span>
}

// const query = new URLSearchParams(window.location.search);
// const params = {
//   streamId: query.get("id")
// }
const params = {
	streamId: "655347b59c00a7409d9181c3"
}


export default function App() {
	const [user, setUser] = useState(null);
	const [schediles, setSchedules] = useState([]);
	const [songs, setSongs] = useState([]);
	const [isPlay, setIsPlay] = useState(false);
	const [message, setMessage] = useState('');
	const [name, setName] = useState('');
	const [location, setLocation] = useState('');
	const [gedetailOpen, setGetDetailsOpne] = useState(false);
	const [callOpen, setCallOpen] = useState(false);
	const [permissionReset, setPermissionReset] = useState(false);
	// null,processing,accepted,rejected
	const [callStatus, setCallStatus] = useState(null);
	// const [soundOff,setSoundOff] = useState(false);
	const [volume, setVolume] = useState(1);
	const [record, setRecord] = useState(false);
	const [chatOpen, setChatOpen] = useState(false);
	const [scheduleOpen, setScheduleOpen] = useState(false);
	const [djs, setDjs] = useState({});
	const [nextDJ, setNextDJ] = useState([]);
	const audioRef = useRef(null);
	const mediaRecorder = useRef(null);
	const recordedChunks = useRef([]);
	const downloadLink = useRef();

	// console.log('isPlay from components side', isPlay)
	const {owner, schedulePlaying, IsTonePlayingMessage, roomActive, handleRequestSong, isLive, autodj, messageList, handleSendMessage, callAdmin, cutCall, nextSong, currentSong, disabledPlatBtn } = useSocketUser(params.streamId, audioRef, name, isPlay, setIsPlay, message, setMessage, setCallStatus, location);
	// const [more,setMore] = useState(false);
	const [rOpen, setROPen] = useState(false);
	console.log(roomActive)

	const handlePlay = () => {
		console.log(audioRef.current.src)
		if (isPlay) {
			audioRef.current.pause();
			setIsPlay(false);
		} else {
			audioRef.current.play();
			setIsPlay(true);
		}
	}


	useEffect(() => {
		audioRef.current.volume = volume;
	}, [volume]);


	useEffect(() => {
		if (!roomActive) {
			setIsPlay(false);
			audioRef.current.pause();
		}
	}, [roomActive])


	useEffect(() => {
		(async function () {
			try {
				const { data } = await axios.get(`${REACT_PUBLIC_SOCKET_URL}/api/v1/channel-detail/${params.streamId}`);
				setUser(data?.user);
				setSongs(data?.songs);
				setSchedules(data?.schedules);
			} catch (err) {
				console.log(err?.response?.data?.message);
			}
		})();
	}, []);


	function startRecording() {
		const audioStream = audioRef.current.captureStream();

		// Create a MediaRecorder instance
		mediaRecorder.current = new MediaRecorder(audioStream);

		// Listen for data available event
		mediaRecorder.current.ondataavailable = (event) => {
			if (event.data.size > 0) {
				recordedChunks.current.push(event.data);
			}
		};

		// Listen for the recording stop event
		mediaRecorder.current.onstop = () => {
			const blob = new Blob(recordedChunks.current, { type: 'audio/wav' });
			const url = URL.createObjectURL(blob);
			downloadLink.current.href = url;
			downloadLink.current.download = 'live_session.wav';
			downloadLink.current.click();
		};

		// Start recording
		mediaRecorder.current.start();
	}

	function stopRecording() {
		// Stop recording
		mediaRecorder.current.stop();
	}

	const handleRecord = () => {
		if (record) {
			setRecord(false);
			stopRecording();
		} else {
			setRecord(true);
			startRecording();
		}
	}

	const handleCall = async () => {
		audioRef.current.pause();
		window.open(`https://hgdjlive.com/call/${params.streamId}`, "_blank", "width=600,height=600")
	}



	useEffect(() => {
		const element = document.getElementById('navbar');
		if (element) {
			element.style.background = 'transparent';
		}
	}, [])



	useEffect(() => {
		fetch(`${REACT_PUBLIC_SOCKET_URL}/api/v1/all-djs`,).then(res => res.json()).then(res => {
			if (res.teams) {

				setDjs(groupDJsByDays(res.teams));
				setNextDJ(getNextDJ(res.teams));
			}
		}).catch(err => console.log(err.message))
	}, [])


	const handleEnded = async (isPlay) => {
		console.log('handle handleEnded call');
		if (true) {
			console.log('handle playing... call');
			const url = audioRef.current.src
			audioRef.current.src = url;
			await sleep(3000)
			audioRef.current.play();
		}

	}



	return (
		<>
			{
				true &&
				<div className='absolute top-[50%] -translate-y-[50%] left-[50%] -translate-x-[50%] p-2 bg-black/40 rounded-md z-[100000000000000000000000]'>
					{IsTonePlayingMessage}
				</div>
			}

			{/* schedule  */}
			<NewDialog open={scheduleOpen} onClose={() => setScheduleOpen(false)}>
				<div className='h-full flex items-center justify-center flex-col gap-4'>
					<h1 className='text-black text-3xl'>Next DJ</h1>
					<h1 className='text-black/80 text-3xl'>{nextDJ?.name}</h1>
					<h1 className='text-black/80 text-3xl'>{convertUTCToLocal(nextDJ?.djStartTime)} to {convertUTCToLocal(nextDJ?.djEndTime)}</h1>
					<a href='#schedule' className='text-blue-500'>View All Schedule</a>
				</div>
			</NewDialog>



			{/* banner section start */}
			<section className="  banner-section style-two" style={{ backgroundImage: "url('assets/images/bg/banner-bg3.jpg')" }}>
				<div className="container">
					<div class="row align-items-center justify-content-center">
						<div class="col-lg-8 text-center">
							<h2 class="banner-title style-two">Listen and Enjoy With FM.Land 92.0</h2>
						</div>
					</div>
				</div>





				<div className="banner-bottom-player bg-black/40" style={{ marginTop: '7.5rem' }}>
					<div className="px-3">
						<div className="row">
							<div className="col-lg-12">
								<div className="single-audio-player">
									<div class="single-audio-thumb">
										{isLive ? <img src={currentSong.cover} alt='image' /> : <img src="assets/images/shows/player/3.jpg" alt="image" />}

									</div>
									<div className="single-audio-content-top">
										{
											IsTonePlayingMessage ?
												<h4 className="title">{IsTonePlayingMessage}</h4>
												:
												<h4 className="title">{schedulePlaying ? `“Live Schedule”` : !isLive ? `“Auto DJ”` : `“${owner?.name} Live”`}</h4>
										}
										<p className="audio-time" style={{ fontSize: "12px", whiteSpace: 'pre' }}>Current song : {currentSong?.title?.split('.')[0]}</p>
										{
											(currentSong?.artist && currentSong?.album) &&
											<p className="audio-time" style={{ fontSize: "12px", whiteSpace: 'pre' }}>{currentSong?.artist?.toLowerCase() != 'unknown' ? `Artist: ${currentSong?.artist} ,` : ''}  {currentSong?.album?.toLowerCase() != 'unknown' ? `Album: ${currentSong?.album}` : ''} </p>
										}
										<p className="audio-time" style={{ fontSize: "12px", whiteSpace: 'pre' }}>Next song : {nextSong?.title?.split('.')[0]}</p>
									</div>
									<div class="single-audio-content">
										<div class="">

											<div class="audio-control flex items-center flex-row justify-center gap-[5rem]">
												<audio ref={audioRef} controls className="w-full bg-none hidden" onEnded={() => handleEnded(isPlay)} onPlay={() => setIsPlay(true)} autoPlay onPause={() => setIsPlay(false)}></audio>
												<div className='flex gap-4 items-center'>
													<button className=" border-none outline-none text-white disabled:cursor-[not-allowed]  cursor-pointer disabled:opacity-25 mr-2" disabled={!isLive} title="Call" onClick={handleCall}><MdCall size={35} /></button>
													<button className="disabled:opacity-20 p-2 rounded-full border-none outline-none text-white" disabled={!roomActive || disabledPlatBtn} onClick={handlePlay}>
														{
															isPlay ? <IoPauseOutline size={35} /> : <IoPlayOutline size={35} />
														}
													</button>
													<button className=" text-xs border-none bg-none outline-none text-white disabled:cursor-[not-allowed]  cursor-pointer disabled:opacity-25 mr-2" disabled={!isLive} title="live chat" onClick={() => setChatOpen(true)}><IoChatboxEllipsesOutline size={35} /></button>
												</div>
												<div className="md:w-[50%] w-full flex items-center">
													<button className="text-gray-300 mr-3" onClick={() => volume === 0 ? setVolume(0.5) : setVolume(0)}>
														{
															volume === 0 ? <HiSpeakerXMark size={22} /> : <HiSpeakerWave size={22} />
														}
													</button>

													<input type="range" className="w-[90%]" min={0} max={1} step={0.1} value={volume} onChange={(e) => setVolume(e.target.value)} />
												</div>
											</div>


										</div>

									</div>

								</div>
							</div>
						</div>
					</div>
				</div>

				<Dialog open={rOpen} onClose={() => setROPen(false)} name={name} setName={setName}>
					{
						songs && songs.map((data) => (
							<div className="flex justify-between items-center my-6">
								<div className="flex items-center gap-4">
									<img src={REACT_PUBLIC_SOCKET_URL + data.cover} width={200} height={200} alt="cover" className="h-[4rem] w-[4rem] object-conver rounded" />
									<h2 className="text-xl text-black">{data?.title}</h2>
								</div>

								<div className="mr-10">
									<button className="py-2 px-4 rounded-md text-white bg-indigo-500" title="request for this song" onClick={() => handleRequestSong(data)}>Request</button>
								</div>
							</div>
						))
					}
				</Dialog>


				{/* mannual  */}
				<Dialog open={permissionReset} onClose={() => setPermissionReset(false)}>
					<div className=''>
						<h2 className='text-center mb-8 text-2xl text-gray-700'>Reset Permission</h2>
						<ol className='text-lg flex text-gray-600 flex-col gap-3 list-decimal'>
							<li>1. Click On i button</li>
							<li><img src={`${REACT_PUBLIC_RADIO_URL}/images/1.png`} className='w-[20rem]' /></li>
							<li>2. Click on the reset permission</li>
							<li><img src={`${REACT_PUBLIC_RADIO_URL}/images/3.png`} className='w-[20rem]' /></li>

							<li>3. click on reload button"</li>
							<li><img src={`${REACT_PUBLIC_RADIO_URL}/images/3.png`} className='w-[20rem]' /></li>
						</ol>
					</div>
				</Dialog>






				<ChatBox open={chatOpen} onClose={() => setChatOpen(false)} name={name} setName={setName} message={message} setMessage={setMessage} handleSendMessage={handleSendMessage}>
					{
						messageList.map(data => <Message {...data} />)
					}
				</ChatBox>

				<CallComponents open={callOpen} onClose={() => setCallOpen(false)} name={name} setName={setName}>
					<div className='w-full h-full flex flex-col gap-5 justify-center items-center'>
						<h2 className='text-3xl text-gray-800'>{user?.name && toTitleCase(user?.name)}</h2>
						{
							callStatus == 'processing' &&
							<div className='flex items-center'>
								<h3 className='text-lg text-gray-500'>Calling</h3>
								<div class="loading flex gap-1 items-center ml-1">
									<div class="dot bg-gray-500 w-1 h-1 rounded-full"></div>
									<div class="dot bg-gray-500 w-1 h-1 rounded-full"></div>
									<div class="dot bg-gray-500 w-1 h-1 rounded-full"></div>
								</div>
							</div>
						}

						{
							callStatus == 'accepted' &&
							<h3 className='text-lg text-gray-500'><Timer timerStart={true} /></h3>

						}
						{
							callStatus == 'rejected' &&
							<h3 className='text-lg text-gray-500'>Call Rejected</h3>

						}
						{
							callStatus == 'complete' &&
							<h3 className='text-lg text-gray-500'>Call Complete</h3>

						}
						{
							callStatus == 'rejected' || callStatus == 'complete' ?
								<button className='p-2 text-green-600 rounded-full bg-gray-200' onClick={handleCall}><MdCall size={23} /></button>
								:
								<button className='p-2 text-red-600 rounded-full bg-gray-200' onClick={cutCall}><MdCall size={23} /></button>
						}
					</div>
				</CallComponents>


				<CallComponents open={gedetailOpen} onClose={() => setGetDetailsOpne(false)}>
					<div>
						<div className='input-group flex flex-col gap-1 mb-6'>
							<label for="password" className='text-black text-lg'>Name</label>
							<div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
								<FaUser size={20} className='text-gray-400' />
								<input type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your password' id='password' name='password' required />
							</div>
						</div>
						<div className='input-group flex flex-col gap-1 mb-6'>
							<label for="password" className='text-black text-lg'>Location</label>
							<div className='flex items-center relative py-2 px-1 border-gray-400  border-2 hover:border-indigo-500 rounded-md'>
								<FaLocationDot size={20} className='text-gray-400' />
								<input type='text' value={location} onChange={(e) => setLocation(e.target.value)} className='w-[95%] outline-none ml-1' placeholder='Enter your password' id='password' name='password' required />
							</div>
						</div>

						<div className='flex justify-center items-center'>
							<button type='submit' onClick={handleCall} className='py-2 px-4 rounded-md bg-indigo-500 text-white text-lg hover:bg-indigo-700 transition-al disabled:opacity-40' disabled={!name || !location}>Call Now</button>
						</div>
					</div>
				</CallComponents>
			</section>
		</>

	);
}