import Link from "next/link";
import React from "react";

export default function Footer() {
  return (
    <footer className="dark:bg-[rgba(0,0,0,0.15)] bg-[rgba(255,255,255,0.15)] backdrop-blur-lg border-b-2 dark:border-[#38C8F8] border-blue-400 border-opacity-70 h-0.5">
      <div className="mx-auto w-full max-w-screen-xl p-4 py-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Link href={'/'}>
              <img
                src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_203,h_79,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/For%20Dark%20Theme.png"
                className="h-16 me-3"
                alt="DeepCytes Logo"
              />
            </Link>
          </div>
          <span className="text-sm grid grid-rows-2 dark:text-gray-400 text-slate-600">
            <div><Link className="dark:text-white" href={'https://www.deepcytes.io/'} target="_blank">Deepcytes.io</Link></div>
            <div>© {new Date().getFullYear()} DeepCytes. All Rights Reserved.</div>
          </span>
        </div>
        <hr className="my-2 sm:mx-auto dark:border-gray-700 border-slate-300" />
      </div>
    </footer>
  );
} 