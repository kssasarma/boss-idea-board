
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Built by Satya Kodamanchili{' '}
          <a 
            href="https://github.com/satyakodamanchili" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            GitHub
          </a>{' '}
          with 💖
        </p>
      </div>
    </footer>
  );
};

export default Footer;
