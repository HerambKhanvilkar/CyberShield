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
                src="./dclogoUK.png"
                className="h-16 me-3"
                alt="DeepCytes Logo"
              />
            </Link>
          </div>
          <span className="text-sm grid grid-rows-2 ">
            <div className="dark:text-white"><Link href={'https://www.deepcytes.io/'} target="_blank">Deepcytes.io</Link></div>
            <div className="dark:text-gray-400 text-slate-600">© {new Date().getFullYear()} DeepCytes. All Rights Reserved.</div>
          </span>
        </div>
        <hr className="my-2 sm:mx-auto dark:border-gray-700 border-slate-300" />
      </div>
    </footer>
  );
} 