import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer p-4 bg-base-100 border-t border-base-200 text-base-content/60 flex flex-col sm:flex-row justify-between items-center text-xs mt-auto gap-2">
      <div>
        <p>
          &copy; {new Date().getFullYear()}{' '}
          <a
            href="https://beon.co.id"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-semibold text-primary"
          >
            PT Beon Intermedia
          </a>
          . All rights reserved.
        </p>
      </div>
      <div className="flex gap-4">
        <a href="#privacy" className="hover:underline">Privacy Policy</a>
        <span className="opacity-30">|</span>
        <a href="#terms" className="hover:underline">Terms of Service</a>
        <span className="opacity-30">|</span>
        <a href="#help" className="hover:underline">Help & Support</a>
      </div>
    </footer>
  );
};
export default Footer;
