import React from 'react';
import { FaTwitter, FaTelegramPlane, FaDiscord } from 'react-icons/fa';
import Logo from '../../Header/Logo/Logo'

const Footer = () => {
  return (
    <footer className="bg-[#0B0F19] text-gray-400 pt-[80px] pr-[80px] pl-[80px]">
      <div className="mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div>
          <Logo />
          <p className="mt-[16px] text-[16px] text-[#9499AA] max-w-[390px]">
            Moonbot is an AI-powered trading tool that helps users discover trending tokens, track insider movements, and execute trades efficiently.
          </p>
        </div>

        <div>
          <h2 className="font-[400] text-[#E4EEFE] text-[16px] mb-[24px]">Info</h2>
          <ul className="space-y-[12px]">
            <li><a href="/" className="hover:text-white font-[400] text-[#9499AA] text-[16px]">Home</a></li>
            <li><a href="/about" className="hover:text-white font-[400] text-[#9499AA] text-[16px]">About</a></li>
            <li><a href="/docs" className="hover:text-white font-[400] text-[#9499AA] text-[16px]">Docs</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-[#E4EEFE] text-[16px] mb-[24px]">Contact</h2>
          <p className='text-[#9499AA] text-[16px] mb-[12px]'>hello-customer123@gmail.com</p>
          <p className='text-[#9499AA] text-[16px]'>+1 137 3547 375</p>
        </div>

        <div>
          <div className="flex mt-2 gap-4">
            <a href="#" className="w-8 h-8 flex items-center justify-center rounded bg-[#151B2D] hover:bg-[#1e253b] transition">
              <img src="/x.png" alt="X" />
            </a>
            <a href="#" className="w-8 h-8 flex items-center justify-center rounded bg-[#151B2D] hover:bg-[#1e253b] transition">
              <img src="/telegram.png" alt="Telegram"/>
            </a>
            <a href="#" className="w-8 h-8 flex items-center justify-center rounded bg-[#151B2D] hover:bg-[#1e253b] transition">
              <img src="/discord.png" alt="Discord" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-[80px] text-center text-gray-500 text-sm border-t border-[#151B2D] bg-[#0A0E19] h-[36px] w-full flex items-center justify-center">
        &copy; MoonBot 2025 All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
