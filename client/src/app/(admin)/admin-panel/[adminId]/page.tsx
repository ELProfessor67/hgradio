import React from "react";
// import { AiOutlineCheckCircle } from "react-icons/ai";
// import { FaBookOpen } from "react-icons/fa6";
// import { GiBookshelf } from "react-icons/gi";
// import { HiUsers } from "react-icons/hi2";
// import { MdPersonAddAlt1, MdPlayCircleFilled } from "react-icons/md";
// import { PiStudentFill } from "react-icons/pi";
// import { RiMoneyDollarCircleFill } from "react-icons/ri";

const page = () => {
  return (
    <div className=" text-[#fff] ">
      <h3 className=" mb-[2rem] ">Dashboard</h3>

      {/* <Summary /> */}
    </div>
  );
};

export default page;

// const Summary = () => {

//   const summaryItems = [
//   { title: "Enrolled Courses", count: 30, icon: <FaBookOpen /> },
//   { title: "Active Courses", count: 30, icon: <MdPlayCircleFilled /> },
//   { title: "Completed Courses", count: 30, icon: <AiOutlineCheckCircle /> },
//   { title: "New Registrations", count: 30, icon: <MdPersonAddAlt1 /> },
//   { title: "Total Students", count: 30, icon: <PiStudentFill /> },
//   { title: "Total Courses", count: 30, icon: <GiBookshelf /> },
//   { title: "Total Earning", count: 30, icon: <RiMoneyDollarCircleFill /> },
//   { title: "Total Instructors", count: 30, icon: <HiUsers /> },
// ];


//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2">
//       {summaryItems.map((item, idx) => (
//         <div
//           key={idx}
//           className="flex items-center gap-6 px-[1rem] py-[1.5rem]  bg-[#0400ff]/5"
//         >
//           <div className="p-3 bg-[#0400ff]/10 text-[#0400ff] text-[2rem] ">
//             {item.icon}
//           </div>
//           <div className=" text-lg font-medium">
//             <div className="text-[#5e5e5e]">{item.title}</div>
//             <div>{item.count}</div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };
