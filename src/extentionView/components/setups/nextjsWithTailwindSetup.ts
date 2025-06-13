import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// Function to create a basic Next.js app structure with Tailwind CSS
export async function nextjsWithTailwind(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const rootPath = workspaceFolders[0].uri.fsPath;
    console.log("🚀 ~ nextjsWithTailwind ~ rootPath:", rootPath);

    function getFileContent(filePath: any) {
      try {
        return fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return "";
      }
    }
    const nextjsStructure = [
      {
        folder: "public",
        files: [
          { 
            name: "favicon.ico", 
            content: `` 
          },
          { 
            name: "vercel.svg", 
            content: `` 
          }
        ],
      },
      {
        folder: "src",
        files: [],
      },
      {
        folder: "src/app",
        files: [
          { 
            name: "layout.jsx", 
            content: `
    import '@/styles/globals.css'
    
    export const metadata = {
      title: 'Autogen Labs',
      description: 'Pioneering the future of automated intelligence',
    }
    
    export default function RootLayout({ children }) {
      return (
        <html lang="en">
          <body className="min-h-screen">
            {children}
          </body>
        </html>
      )
    }
    ` 
          },
          { 
            name: "page.jsx", 
            content: `
    export default function Home() {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 p-4 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              
              <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Welcome to Autogen Labs</h1>
              <p className="text-lg text-gray-600 mb-6">Pioneering the future of automated intelligence</p>
              
              <div className="w-24 h-1 bg-indigo-600 mb-6"></div>
              
              <p className="text-gray-700 mb-8">
                Discover how our cutting-edge AI systems are transforming industries and creating new possibilities for businesses worldwide.
              </p>
              
              <div className="space-y-4">
                <a 
                  href="https://autogenlabs.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition duration-300"
                >
                  Visit Our Website
                </a>
                
                <p className="text-sm text-gray-500">
                  <a 
                    href="https://autogenlabs.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-indigo-600 hover:underline"
                  >
                    autogenlabs.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
    `
          },
        ],
      },
      {
        folder: "src/app/about",
        files: [
          { 
            name: "page.jsx", 
            content: `
    export default function About() {
      return (
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-6">About Autogen Labs</h1>
          <p className="mb-4">
            Autogen Labs is at the forefront of developing cutting-edge AI solutions that transform how businesses operate.
          </p>
          <p>
            Our team of experts combines deep technical knowledge with industry expertise to deliver intelligent automation that drives real business value.
          </p>
        </div>
      )
    }
    `
          },
        ],
      },
      {
        folder: "src/components",
        files: [
          { 
            name: "Navbar.jsx", 
            content: `
    'use client';
    
    import Link from 'next/link';
    import { useState } from 'react';
    
    export default function Navbar() {
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="text-xl font-bold text-indigo-600">
                    Autogen Labs
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link href="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium text-gray-900">
                    Home
                  </Link>
                  <Link href="/about" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                    About
                  </Link>
                  <Link href="/services" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                    Services
                  </Link>
                  <Link href="/contact" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                    Contact
                  </Link>
                </div>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  <span className="sr-only">Open main menu</span>
                  {!isOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
    
          {isOpen && (
            <div className="sm:hidden">
              <div className="pt-2 pb-3 space-y-1">
                <Link href="/" className="block pl-3 pr-4 py-2 border-l-4 border-indigo-500 text-base font-medium text-indigo-700 bg-indigo-50">
                  Home
                </Link>
                <Link href="/about" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">
                  About
                </Link>
                <Link href="/services" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">
                  Services
                </Link>
                <Link href="/contact" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800">
                  Contact
                </Link>
              </div>
            </div>
          )}
        </nav>
      );
    }
    `
          },
          { 
            name: "Footer.jsx", 
            content: `
    export default function Footer() {
      return (
        <footer className="bg-gray-800 text-white">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Autogen Labs</h3>
                <p className="text-gray-400">
                  Pioneering the future of automated intelligence
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><a href="/" className="text-gray-400 hover:text-white transition">Home</a></li>
                  <li><a href="/about" className="text-gray-400 hover:text-white transition">About</a></li>
                  <li><a href="/services" className="text-gray-400 hover:text-white transition">Services</a></li>
                  <li><a href="/contact" className="text-gray-400 hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    <span className="sr-only">GitHub</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-700 pt-8 text-center">
              <p className="text-gray-400">© {new Date().getFullYear()} Autogen Labs. All rights reserved.</p>
            </div>
          </div>
        </footer>
      );
    }
    `
          },
          { 
            name: "Button.jsx", 
            content: `
    const Button = ({ children, variant = 'primary', className = '', ...props }) => {
      const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
      
      const variants = {
        primary: 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500',
        outline: 'border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50 focus:ring-indigo-500',
      };
      
      const classes = \`\${baseClasses} \${variants[variant]} \${className}\`;
      
      return (
        <button className={classes} {...props}>
          {children}
        </button>
      );
    };
    
    export default Button;
    `
          }
        ],
      },
      {
        folder: "src/styles",
        files: [
          { 
            name: "globals.css", 
            content: `
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    
    @layer base {
      html {
        scroll-behavior: smooth;
      }
      
      body {
        @apply text-gray-800 bg-gray-50;
      }
      
      h1, h2, h3, h4, h5, h6 {
        @apply font-bold;
      }
      
      h1 {
        @apply text-4xl md:text-5xl mb-6;
      }
      
      h2 {
        @apply text-3xl md:text-4xl mb-4;
      }
      
      h3 {
        @apply text-2xl md:text-3xl mb-4;
      }
    }
    
    @layer components {
      .container-custom {
        @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
      }
    }
    `
          }
        ],
      },
      {
        folder: "src/lib",
        files: [
          { 
            name: "utils.js", 
            content: `
    export function classNames(...classes) {
      return classes.filter(Boolean).join(' ')
    }
    
    export function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }
    
    export function truncateText(text, length = 100) {
      if (text.length <= length) return text;
      return \`\${text.substring(0, length)}...\`;
    }
    `
          }
        ],
      },
      {
        folder: "src/hooks",
        files: [
          { 
            name: "useWindowSize.js", 
            content: `
    'use client';
    
    import { useState, useEffect } from 'react';
    
    export default function useWindowSize() {
      const [windowSize, setWindowSize] = useState({
        width: undefined,
        height: undefined,
      });
      
      useEffect(() => {
        // Only execute on the client
        if (typeof window === 'undefined') return;
        
        function handleResize() {
          setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
          });
        }
        
        window.addEventListener('resize', handleResize);
        
        // Call handler right away so state gets updated with initial values
        handleResize();
        
        return () => window.removeEventListener('resize', handleResize);
      }, []);
      
      return windowSize;
    }
    `
          }
        ],
      },
      {
        folder: "",
        files: [
          { 
            name: "package.json", 
            content: `
    {
      "name": "nextjs-tailwind-app",
      "version": "0.1.0",
      "private": true,
      "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
      },
      "dependencies": {
        "next": "^14.0.3",
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      },
      "devDependencies": {
        "autoprefixer": "^10.4.16",
        "eslint": "^8.54.0",
        "eslint-config-next": "^14.0.3",
        "postcss": "^8.4.31",
        "tailwindcss": "^3.3.5"
      }
    }
    `
          },
          { 
            name: "tailwind.config.js", 
            content: `
    /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
      ],
      theme: {
        extend: {
          colors: {
            primary: {
              50: '#eef2ff',
              100: '#e0e7ff',
              200: '#c7d2fe',
              300: '#a5b4fc',
              400: '#818cf8',
              500: '#6366f1',
              600: '#4f46e5',
              700: '#4338ca',
              800: '#3730a3',
              900: '#312e81',
              950: '#1e1b4b',
            },
          },
          fontFamily: {
            sans: ['var(--font-inter)'],
          },
        },
      },
      plugins: [],
    }
    `
          },
          { 
            name: "postcss.config.js", 
            content: `
    module.exports = {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    }
    `
          },
          { 
            name: "next.config.js", 
            content: `
    /** @type {import('next').NextConfig} */
    const nextConfig = {
      reactStrictMode: true,
      swcMinify: true,
    }
    
    module.exports = nextConfig
    `
          },
          { 
            name: ".eslintrc.json", 
            content: `
    {
      "extends": "next/core-web-vitals"
    }
    `
          },
          { 
            name: ".gitignore", 
            content: `
    # See https://help.github.com/articles/ignoring-files/ for more about ignoring files.
    
    # dependencies
    /node_modules
    /.pnp
    .pnp.js
    
    # testing
    /coverage
    
    # next.js
    /.next/
    /out/
    
    # production
    /build
    
    # misc
    .DS_Store
    *.pem
    
    # debug
    npm-debug.log*
    yarn-debug.log*
    yarn-error.log*
    
    # local env files
    .env*.local
    
    # vercel
    .vercel
    
    # typescript
    *.tsbuildinfo
    next-env.d.ts
    `
          },
          { 
            name: "jsconfig.json", 
            content: `
    {
      "compilerOptions": {
        "paths": {
          "@/*": ["./src/*"]
        }
      }
    }
    `
          },
        ],
      },
    ];
       try {
      for (const { folder, files } of nextjsStructure) {
        const newFolder = path.join(rootPath, folder);

        // Check if folder exists, if not, create it recursively
        if (!fs.existsSync(newFolder)) {
          fs.mkdirSync(newFolder, { recursive: true });
          console.log(`Created folder: ${newFolder}`);
        }

        // Create the files in the folder
        for (const file of files) {
          const newFile = path.join(newFolder, file.name);
          fs.writeFileSync(newFile, file.content);
          console.log(`Created file: ${newFile}`);
        }
      }

      // Create Next.js specific files
      const nextConfigContent = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
`;

      const tailwindConfigContent = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3490dc",
        secondary: "#ffed4a",
        danger: "#e3342f",
      },
    },
  },
  plugins: [],
}
`;

      const postcssConfigContent = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;

      const globalCssContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
}
`;

      // Create initial Next.js pages
      const indexPageContent = `
import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="text-center text-white p-8 rounded-lg shadow-xl">
        <h1 className="text-5xl font-bold mb-8">Next.js + Tailwind CSS</h1>
        <p className="text-xl mb-8">Your project has been set up successfully!</p>
        <div className="flex justify-center space-x-4">
          <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer" className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            Next.js Docs
          </a>
          <a href="https://tailwindcss.com/docs" target="_blank" rel="noreferrer" className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            Tailwind Docs
          </a>
        </div>
      </div>
    </div>
  );
}
`;

      // Create necessary directories for Next.js
      const pagesDir = path.join(rootPath, "pages");
      if (!fs.existsSync(pagesDir)) {
        fs.mkdirSync(pagesDir, { recursive: true });
      }

      const stylesDir = path.join(rootPath, "styles");
      if (!fs.existsSync(stylesDir)) {
        fs.mkdirSync(stylesDir, { recursive: true });
      }

      // Write the config files
      fs.writeFileSync(path.join(rootPath, "next.config.js"), nextConfigContent);
      fs.writeFileSync(path.join(rootPath, "tailwind.config.js"), tailwindConfigContent);
      fs.writeFileSync(path.join(rootPath, "postcss.config.js"), postcssConfigContent);
      fs.writeFileSync(path.join(stylesDir, "globals.css"), globalCssContent);
      fs.writeFileSync(path.join(pagesDir, "index.js"), indexPageContent);

      // Create _app.js file for global styles
      const appJsContent = `
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
`;
      fs.writeFileSync(path.join(pagesDir, "_app.js"), appJsContent);

      // Create package.json with Next.js config
      const packageJson = {
        name: "nextjs-tailwind-project",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        },
        dependencies: {
          next: "^13.4.0",
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "react-icons": "^4.7.1",
        },
        devDependencies: {
          "@types/node": "^18.15.11",
          "@types/react": "^18.0.35",
          "@types/react-dom": "^18.0.11",
          "autoprefixer": "^10.4.14",
          "postcss": "^8.4.21",
          "tailwindcss": "^3.3.1",
          "typescript": "^5.0.4"
        }
      };

      const packageJsonPath = path.join(rootPath, "package.json");
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Run npm install and start dev server
      const terminal = vscode.window.createTerminal("Next.js App Setup");
      terminal.sendText("npm install");
      terminal.sendText("npm run dev");
      terminal.show();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error creating file/folder: ${(error as Error).message}`
      );
    }
  } else {
    vscode.window.showErrorMessage("No workspace folder found!");
  }
}
