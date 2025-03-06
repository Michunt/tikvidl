'use client';

import { useState, useRef, useEffect } from 'react';
// import Image from 'next/image';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoData, setVideoData] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on page load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a TikTok URL');
      return;
    }
    
    // Reset states
    setLoading(true);
    setError('');
    setVideoData(null);
    
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download video');
      }
      
      const data = await response.json();
      setVideoData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing your request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg shadow-lg bg-gradient-to-r from-pink-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            T
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 to-indigo-600 text-transparent bg-clip-text">
            TikVidl
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-indigo-600 mb-2">
              TikVidl
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Download TikTok videos without watermark
            </p>
          </div>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  id="tiktok-url"
                  name="tiktok-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste TikTok URL here..."
                  ref={inputRef}
                  className="w-full px-4 py-3 pr-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.readText().then(text => {
                      if (text.includes('tiktok.com')) {
                        setUrl(text);
                      } else {
                        setError('Clipboard does not contain a valid TikTok URL');
                        setTimeout(() => setError(''), 3000);
                      }
                    }).catch(err => {
                      console.error('Failed to read clipboard:', err);
                      setError('Failed to access clipboard. Please paste the URL manually.');
                      setTimeout(() => setError(''), 3000);
                    });
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-sm rounded-lg shadow-md hover:from-pink-600 hover:to-indigo-700 transition-all duration-200"
                >
                  Paste
                </button>
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-lg shadow-md hover:from-pink-600 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                ) : (
                  'Download'
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
          </form>

          {/* Results Section */}
          {videoData && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
              {/* Video Info Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  {videoData.metadata.thumbnails && videoData.metadata.thumbnails.length > 0 && (
                    <div className="w-full sm:w-48 h-64 sm:h-auto relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <div className="text-gray-500 dark:text-gray-400 text-sm">Thumbnail</div>
                    </div>
                  )}
                  
                  {/* Video Details */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {videoData.metadata.title}
                    </h3>
                    
                    <div className="flex items-center mb-4">
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="font-medium">@{videoData.metadata.author.username}</span>
                        {' • '}
                        <span>{videoData.metadata.author.name}</span>
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex flex-col items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-500 dark:text-gray-400">Views</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {videoData.metadata.stats.views.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-500 dark:text-gray-400">Likes</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {videoData.metadata.stats.likes.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-500 dark:text-gray-400">Comments</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {videoData.metadata.stats.comments.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-500 dark:text-gray-400">Shares</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {videoData.metadata.stats.shares.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {videoData.metadata.music && (
                      <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <span className="font-medium">{videoData.metadata.music.title}</span>
                        {videoData.metadata.music.artist && (
                          <span> • {videoData.metadata.music.artist}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Download Options */}
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Download Options</h4>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {videoData.formats.map((format, index) => (
                    <div key={index} className="flex flex-col">
                      <button
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-lg shadow-md hover:from-pink-600 hover:to-indigo-700 transition-all duration-300 flex items-center space-x-2"
                        onClick={async () => {
                          // Use our proxy API to download the file
                          const fileExt = format.format === 'mp3' ? 'mp3' : 'mp4';
                          const filename = `${videoData.metadata.id}_${format.quality}.${fileExt}`;
                          
                          // Set downloading state
                          setDownloadingIndex(index);
                          setError('');
                          
                          try {
                            // Try each URL in the format.urls array until one works
                            for (let i = 0; i < format.urls.length; i++) {
                              const currentUrl = format.urls[i];
                              const proxyUrl = `/api/download?url=${encodeURIComponent(currentUrl)}&filename=${encodeURIComponent(filename)}`;
                              
                              try {
                                // Create a temporary anchor element to trigger download
                                const a = document.createElement('a');
                                a.href = proxyUrl;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                
                                // If we reach here, we assume the download started
                                console.log(`Download initiated with URL ${i + 1}/${format.urls.length}`);
                                break;
                              } catch (err) {
                                console.error(`Error with URL ${i + 1}:`, err);
                                // If this is the last URL and it failed, throw the error
                                if (i === format.urls.length - 1) {
                                  throw err;
                                }
                                // Otherwise try the next URL
                              }
                            }
                          } catch (err) {
                            console.error('All download attempts failed:', err);
                            setError('Download failed. Try copying the URL instead.');
                          } finally {
                            // Reset downloading state after a timeout
                            setTimeout(() => {
                              setDownloadingIndex(null);
                            }, 3000);
                          }
                        }}
                        disabled={downloadingIndex === index}
                      >
                        {downloadingIndex === index ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Downloading...
                          </span>
                        ) : (
                          <span>{format.type === 'audio' ? 'Download Music' : `Download ${format.quality} ${format.watermark ? '(Watermarked)' : '(No Watermark)'}`}</span>
                        )}
                      </button>
                      <button
                        className="mt-1 px-4 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
                        onClick={() => {
                          navigator.clipboard.writeText(format.urls[0]);
                          setCopiedIndex(index);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                      >
                        {copiedIndex === index ? 'Copied!' : 'Copy URL'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <p>
                    If the download doesn&apos;t start automatically, try using the &quot;Copy URL&quot; button and paste it in a new tab.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* How to Use Section */}
          {!videoData && !loading && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-6">
                How to Download TikTok Videos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">1</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Copy Video URL</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Open TikTok and find the video you want to download. Tap on "Share" and then "Copy Link".
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">2</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Paste URL</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Paste the copied TikTok video URL into the input field above.
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">3</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Download</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Click the "Download" button and choose your preferred quality option to save the video.
                  </p>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-6">
                Error
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Couldn't find the video. Please check if the URL is correct.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} TikVidl. All rights reserved.</p>
      </footer>
    </div>
  );
}
