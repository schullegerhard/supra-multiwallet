"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Github, 
  Star, 
  GitFork, 
  BookOpen, 
  Code2, 
  ExternalLink,
  Twitter,
  FileCode,
} from 'lucide-react';
import { SendSupraTokens } from '@/components/SendSupraTokens';
import useSupraMultiWallet from '@/hooks/useSupraMultiWallet';
import Image from 'next/image';

// GitHub repo stats interface
interface GitHubStats {
  stars: number;
  forks: number;
  loading: boolean;
}

export default function Home() {
  const { accounts } = useSupraMultiWallet();
  const [githubStats, setGithubStats] = useState<GitHubStats>({
    stars: 0,
    forks: 0,
    loading: true
  });

  // Fetch GitHub stats
  useEffect(() => {
    fetch('https://api.github.com/repos/Crystara-Markets/supra-multiwallet')
      .then(res => res.json())
      .then(data => {
        setGithubStats({
          stars: data.stargazers_count || 0,
          forks: data.forks_count || 0,
          loading: false
        });
      })
      .catch(() => {
        setGithubStats({ stars: 0, forks: 0, loading: false });
      });
  }, []);

  const resources = [
    {
      title: 'Supra Documentation',
      description: 'Official Supra blockchain documentation and Move tutorials',
      icon: BookOpen,
      href: 'https://docs.supra.com/network/move/getting-started',
    },
    {
      title: 'Move Language Book',
      description: 'Comprehensive guide to the Move programming language',
      icon: FileCode,
      href: 'https://move-book.com/reference',
    },
    {
      title: 'Supra Framework',
      description: 'Explore Supra blockchain modules and smart contracts',
      icon: Code2,
      href: 'https://github.com/Entropy-Foundation/aptos-core/tree/dev/aptos-move/framework/supra-framework/sources',
    }
  ];

  const authors = [
    {
      name: 'Crystara Markets',
      role: 'NFT Marketplace',
      twitter: 'https://x.com/CrystaraMarkets',
      description: 'Building the future of NFTs on Supra',
      logo: '/builtby/crystara.jpg'
    },
    {
      name: 'Ribbit Wallet',
      role: 'Wallet Provider',
      twitter: 'https://x.com/RibbitWallet',
      description: 'Secure multi-chain wallet for Supra',
      logo: '/builtby/ribbit.jpg'
    }
  ];

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
                Supra Multiwallet Connect
              </h1>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Open-source multi-wallet connector built for Supra blockchain.
              </p>

              {/* Key Features - Point Form */}
              <div className="mb-10 space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Starkey & Ribbit wallet integrations</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-teal-400 mt-1">•</span>
                  <span>Beautifully designed wallet connection UI with sign-in screen</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>JWT authentication for account sensitive protected routes</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Built for edge runtime - Vercel, Cloudflare, any serverless platform</span>
                </div>
              </div>

              {/* GitHub Link */}
              <div className="flex items-center gap-4 mb-6">
                <a
                  href="https://github.com/Crystara-Markets/supra-multiwallet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <span className="font-medium">View on GitHub</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{githubStats.loading ? '...' : githubStats.stars}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                    <GitFork className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{githubStats.loading ? '...' : githubStats.forks}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Send Tokens */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 relative">
                <h2 className="text-2xl font-bold mb-2">Send SUPRA Tokens</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Transfer SUPRA tokens to any address on the Supra blockchain
                </p>
                
                {/* Blur overlay when not connected */}
                {!accounts.length && (
                  <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <p className="text-center text-gray-300 px-6">
                      Connect your wallet first to send tokens to another user
                    </p>
                  </div>
                )}
                
                <SendSupraTokens />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Built By Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Built By</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {authors.map((author, index) => (
              <motion.div
                key={author.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-gray-800 border border-gray-700 rounded-lg"
              >
                <div className="flex items-start gap-4 mb-4">
                  <Image
                    src={author.logo}
                    alt={author.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{author.name}</h3>
                    <p className="text-sm text-blue-400">{author.role}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">{author.description}</p>
                <a
                  href={author.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-blue-400 transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  Follow on X
                  <ExternalLink className="h-3 w-3" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Resources */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Documentation & Resources</h2>
          <p className="text-center text-gray-400 mb-10">
            Everything you need to start building on the Supra blockchain
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <motion.a
                key={resource.title}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-all"
              >
                <resource.icon className="h-6 w-6 text-blue-400 mb-3" />
                <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                  {resource.title}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-gray-400 text-sm">{resource.description}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Contributing Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-4">Contribute to the Ecosystem</h2>
            <p className="text-center text-gray-400 mb-8">
              This is an open-source community project. Contributions from developers of all skill levels are welcome.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-semibold text-gray-300">1</span>
                </div>
                <h4 className="font-medium mb-1 text-sm">Fork & Clone</h4>
                <p className="text-xs text-gray-400">Star the repo and clone to your machine</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-semibold text-gray-300">2</span>
                </div>
                <h4 className="font-medium mb-1 text-sm">Build Your Feature</h4>
                <p className="text-xs text-gray-400">Add integrations or improve security</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-semibold text-gray-300">3</span>
                </div>
                <h4 className="font-medium mb-1 text-sm">Submit a Pull Request</h4>
                <p className="text-xs text-gray-400">Share improvements with the community</p>
              </div>
            </div>

            <div className="text-center">
              <a
                href="https://github.com/Crystara-Markets/supra-multiwallet/fork"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors text-sm font-medium"
              >
                <Github className="h-4 w-4" />
                Fork on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 mb-4 text-sm">
            Open source template for building on Supra blockchain
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <a href="https://github.com/Crystara-Markets/supra-multiwallet" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
              GitHub
            </a>
            <span>•</span>
            <a href="https://docs.supra.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
              Supra Docs
            </a>
            <span>•</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
