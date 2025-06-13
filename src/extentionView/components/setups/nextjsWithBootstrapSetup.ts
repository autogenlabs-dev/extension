import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// Function to create a basic Next.js app structure with Bootstrap
export async function nextjsWithBootstrap(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const rootPath = workspaceFolders[0].uri.fsPath;
    console.log("🚀 ~ nextjsWithBootstrap ~ rootPath:", rootPath);

    function getFileContent(filePath: any) {
      try {
        return fs.readFileSync(filePath, "utf-8");
      } catch (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return "";
      }
    }
    
    // Define the Next.js with Bootstrap structure
    const nextjsStructure = [
      {
        folder: "components",
        files: [
          {
            name: "Navbar.jsx",
            content: `
import React from 'react';
import Link from 'next/link';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';

const Navbar = () => {
  return (
    <BootstrapNavbar bg="light" expand="lg" className="mb-4">
      <Container>
        <Link href="/" passHref legacyBehavior>
          <BootstrapNavbar.Brand>Next.js + Bootstrap</BootstrapNavbar.Brand>
        </Link>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Link href="/" passHref legacyBehavior>
              <Nav.Link>Home</Nav.Link>
            </Link>
            <Link href="/features" passHref legacyBehavior>
              <Nav.Link>Features</Nav.Link>
            </Link>
            <Link href="/about" passHref legacyBehavior>
              <Nav.Link>About</Nav.Link>
            </Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
            `,
          },
          {
            name: "Hero.jsx",
            content: `
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

const Hero = () => {
  return (
    <Container className="py-5">
      <Row className="align-items-center">
        <Col lg={6}>
          <h1 className="display-4 fw-bold">Next.js with Bootstrap</h1>
          <p className="lead">A powerful combination for building responsive web applications with server-side rendering.</p>
          <hr className="my-4" />
          <p>Get started quickly with this pre-configured template.</p>
          <div className="d-grid gap-2 d-md-flex justify-content-md-start">
            <Button variant="primary" size="lg">Get Started</Button>
            <Button variant="outline-secondary" size="lg">Learn More</Button>
          </div>
        </Col>
        <Col lg={6}>
          <div className="bg-light p-5 rounded-3 shadow">
            <h2 className="fs-4 fw-bold">Welcome to your new application</h2>
            <p>Your Next.js + Bootstrap project has been set up successfully!</p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Hero;
            `,
          },
        ],
      },
      {
        folder: "pages",
        files: [
          {
            name: "index.js",
            content: `
import React from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Next.js with Bootstrap</title>
        <meta name="description" content="Next.js application with Bootstrap framework" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Navbar />
        <Hero />
      </main>

      <footer className="container py-5 mt-5 border-top">
        <div className="row">
          <div className="col-12 col-md text-center text-md-start">
            <p className="mb-3">&copy; {new Date().getFullYear()} NextJS Bootstrap. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
            `,
          },
          {
            name: "_app.js",
            content: `
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
            `,
          },
        ],
      },
      {
        folder: "styles",
        files: [
          {
            name: "globals.css",
            content: `
html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}
            `,
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
      }      // Create Next.js specific configuration files
      const nextConfigContent = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
      `;

      fs.writeFileSync(path.join(rootPath, "next.config.js"), nextConfigContent);

      // Create package.json with Next.js and Bootstrap dependencies
      const packageJson = {
        name: "nextjs-bootstrap-app",
        version: "0.1.0",
        private: true,
        scripts: {
          dev: "next dev",
          build: "next build",
          start: "next start",
          lint: "next lint"
        },
        dependencies: {
          "next": "^13.4.0",
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "bootstrap": "^5.3.0",
          "react-bootstrap": "^2.8.0",
          "react-icons": "^4.10.0"
        },
        devDependencies: {
          "@types/node": "^18.15.11",
          "@types/react": "^18.2.0",
          "@types/react-dom": "^18.2.0",
          "typescript": "^5.0.4",
          "eslint": "^8.40.0",
          "eslint-config-next": "^13.4.0"
        }
      };

      const packageJsonPath = path.join(rootPath, "package.json");
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Create .gitignore file
      const gitignoreContent = `
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
      `;
      
      fs.writeFileSync(path.join(rootPath, ".gitignore"), gitignoreContent);

      // Create jsconfig.json for better code navigation
      const jsconfigContent = `
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
      `;
      
      fs.writeFileSync(path.join(rootPath, "jsconfig.json"), jsconfigContent);

      // Run npm install and start dev server
      const terminal = vscode.window.createTerminal("Next.js Bootstrap App Setup");
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
