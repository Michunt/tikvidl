import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import crypto from 'crypto';

// Constants for TikTok API
const API_HOSTNAME = 'api16-normal-c-useast1a.tiktokv.com';
const APP_INFO = {
  aid: '1233',
  app_name: 'musical_ly',
  app_version: '35.1.3',
  manifest_app_version: '2023501030',
};

// Generate a random device ID
function generateDeviceId() {
  return crypto
    .createHash('md5')
    .update(String(Date.now() + Math.random()))
    .digest('hex');
}

// Parse TikTok URL to extract video ID and user ID
function parseTikTokUrl(url: string) {
  const regex = /https?:\/\/www\.tiktok\.com\/(?:embed|@(?<user_id>[\w\.-]+)?\/video)\/(?<id>\d+)/;
  const match = url.match(regex);
  
  if (!match || !match.groups?.id) {
    throw new Error('Invalid TikTok URL');
  }
  
  return {
    videoId: match.groups.id,
    userId: match.groups.user_id || '_',
  };
}

// Create a standardized TikTok URL
function createStandardUrl(userId: string, videoId: string) {
  return `https://www.tiktok.com/@${userId || '_'}/video/${videoId}`;
}

// Build API query parameters
function buildApiQuery(query: Record<string, any> = {}) {
  const deviceId = generateDeviceId();
  
  return {
    ...query,
    device_platform: 'android',
    os: 'android',
    ssmix: 'a',
    _rticket: Date.now(),
    cdid: crypto.createHash('md5').update(String(Date.now())).digest('hex'),
    channel: 'googleplay',
    aid: APP_INFO.aid,
    app_name: APP_INFO.app_name,
    version_code: APP_INFO.app_version.split('.').map(v => String(parseInt(v, 10)).padStart(2, '0')).join(''),
    version_name: APP_INFO.app_version,
    manifest_version_code: APP_INFO.manifest_app_version,
    update_version_code: APP_INFO.manifest_app_version,
    ab_version: APP_INFO.app_version,
    resolution: '1080*2400',
    dpi: 420,
    device_type: 'Pixel 7',
    device_brand: 'Google',
    language: 'en',
    os_api: '29',
    os_version: '13',
    ac: 'wifi',
    is_pad: '0',
    current_region: 'US',
    app_type: 'normal',
    sys_region: 'US',
    timezone_name: 'America/New_York',
    residence: 'US',
    app_language: 'en',
    timezone_offset: '-14400',
    host_abi: 'armeabi-v7a',
    locale: 'en',
    ac2: 'wifi5g',
    uoo: '1',
    carrier_region: 'US',
    op_region: 'US',
    build_number: APP_INFO.app_version,
    region: 'US',
    ts: Math.floor(Date.now() / 1000),
    device_id: deviceId,
    openudid: Array(16).fill(0).map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
  };
}

// Call TikTok API
async function callTikTokApi(endpoint: string, videoId: string, data: any = null) {
  const query = buildApiQuery();
  const url = `https://${API_HOSTNAME}/aweme/v1/${endpoint}/`;
  
  try {
    const response = await axios.post(url, data, {
      params: query,
      headers: {
        'User-Agent': 'okhttp/3.14.9',
        'Accept': 'application/json',
        'X-Argus': '',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('API call failed:', error);
    throw new Error('Failed to fetch video data from TikTok');
  }
}

// Extract video information from API response
function extractVideoInfo(awemeDetail: any) {
  if (!awemeDetail) {
    throw new Error('No video details found');
  }
  
  const videoInfo = awemeDetail.video || {};
  const formats = [];
  
  // Extract direct video links (play_addr)
  if (videoInfo.play_addr?.url_list) {
    const urls = videoInfo.play_addr.url_list;
    
    // Filter out URLs that are likely to work better
    // Prefer URLs from different domains for better chances of success
    const filteredUrls = urls.filter(url => 
      url.includes('tiktokcdn') || 
      url.includes('bytedance') || 
      !url.includes('tiktok')
    );
    
    formats.push({
      type: 'direct',
      urls: filteredUrls.length > 0 ? filteredUrls : urls,
      format: 'mp4',
      quality: 'high',
      watermark: false,
    });
  }
  
  // Extract download links (may contain watermark)
  if (videoInfo.download_addr?.url_list) {
    const urls = videoInfo.download_addr.url_list;
    formats.push({
      type: 'download',
      urls,
      format: 'mp4',
      quality: 'medium',
      watermark: !!videoInfo.has_watermark,
    });
  }
  
  // Try to extract alternative video sources if available
  if (awemeDetail.bit_rate) {
    for (const bitRate of awemeDetail.bit_rate) {
      if (bitRate.play_addr?.url_list && bitRate.play_addr.url_list.length > 0) {
        formats.push({
          type: 'alternative',
          urls: bitRate.play_addr.url_list,
          format: 'mp4',
          quality: bitRate.gear_name || 'alternative',
          watermark: false,
          bitrate: bitRate.bit_rate,
        });
      }
    }
  }
  
  // Extract music
  const musicInfo = awemeDetail.music || {};
  const musicUrl = musicInfo.play_url?.url_list?.[0];
  
  if (musicUrl) {
    formats.push({
      type: 'audio',
      urls: [musicUrl],
      format: 'mp3',
      quality: 'audio',
      watermark: false,
    });
  }
  
  // Extract metadata
  const metadata = {
    id: awemeDetail.aweme_id,
    title: awemeDetail.desc || `TikTok video #${awemeDetail.aweme_id}`,
    author: {
      name: awemeDetail.author?.nickname || 'Unknown',
      username: awemeDetail.author?.unique_id || 'unknown',
    },
    music: {
      title: musicInfo.title || 'Original sound',
      artist: musicInfo.author || '',
    },
    stats: {
      views: awemeDetail.statistics?.play_count || 0,
      likes: awemeDetail.statistics?.digg_count || 0,
      comments: awemeDetail.statistics?.comment_count || 0,
      shares: awemeDetail.statistics?.share_count || 0,
    },
    thumbnails: videoInfo.cover?.url_list || [],
    duration: videoInfo.duration || 0,
  };
  
  return {
    formats,
    metadata,
  };
}

// Fallback to web scraping if API fails
async function extractFromWebpage(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tiktok.com/',
      },
    });
    
    const html = response.data;
    
    // Try to extract JSON data from the webpage
    const sigiStateMatch = html.match(/<script[^>]+\bid="(?:SIGI_STATE|sigi-persisted-data)"[^>]*>(.*?)<\/script>/s);
    const universalDataMatch = html.match(/<script[^>]+\bid="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/s);
    const nextJsDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    
    let videoData = null;
    
    if (universalDataMatch && universalDataMatch[1]) {
      try {
        const universalData = JSON.parse(universalDataMatch[1]);
        videoData = universalData?.['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.['itemInfo']?.['itemStruct'];
      } catch (e) {
        console.error('Failed to parse universal data:', e);
      }
    }
    
    if (!videoData && sigiStateMatch && sigiStateMatch[1]) {
      try {
        const sigiData = JSON.parse(sigiStateMatch[1]);
        const videoId = url.match(/\/video\/(\d+)/)?.[1];
        videoData = sigiData?.['ItemModule']?.[videoId];
      } catch (e) {
        console.error('Failed to parse SIGI state data:', e);
      }
    }
    
    if (!videoData && nextJsDataMatch && nextJsDataMatch[1]) {
      try {
        const nextData = JSON.parse(nextJsDataMatch[1]);
        videoData = nextData?.['props']?.['pageProps']?.['itemInfo']?.['itemStruct'];
      } catch (e) {
        console.error('Failed to parse Next.js data:', e);
      }
    }
    
    if (!videoData) {
      throw new Error('Could not extract video data from webpage');
    }
    
    // Extract formats
    const formats = [];
    const videoInfo = videoData.video || {};
    
    // Helper function to normalize URLs
    const normalizeUrls = (urlOrUrls: string | string[]) => {
      if (!urlOrUrls) return [];
      const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
      return urls.filter(Boolean);
    };
    
    // Extract direct video links
    if (videoInfo.playAddr) {
      const urls = normalizeUrls(videoInfo.playAddr);
      if (urls.length > 0) {
        formats.push({
          type: 'direct',
          urls,
          format: 'mp4',
          quality: 'high',
          watermark: false,
        });
      }
    }
    
    // Extract download links
    if (videoInfo.downloadAddr) {
      const urls = normalizeUrls(videoInfo.downloadAddr);
      if (urls.length > 0) {
        formats.push({
          type: 'download',
          urls,
          format: 'mp4',
          quality: 'medium',
          watermark: true,
        });
      }
    }
    
    // Try to extract from additional sources
    // Look for video URLs in various places in the data structure
    const findVideoUrls = (obj: any, depth = 0, maxDepth = 3): string[] => {
      if (depth > maxDepth || !obj || typeof obj !== 'object') return [];
      
      let urls: string[] = [];
      
      // Look for common URL patterns
      for (const key in obj) {
        if (typeof obj[key] === 'string' && 
            (obj[key].includes('.mp4') || obj[key].includes('video')) && 
            obj[key].startsWith('http')) {
          urls.push(obj[key]);
        } else if (typeof obj[key] === 'object') {
          urls = [...urls, ...findVideoUrls(obj[key], depth + 1, maxDepth)];
        }
      }
      
      return urls;
    };
    
    const additionalUrls = findVideoUrls(videoData);
    if (additionalUrls.length > 0) {
      formats.push({
        type: 'alternative',
        urls: additionalUrls,
        format: 'mp4',
        quality: 'alternative',
        watermark: false,
      });
    }
    
    // Extract music
    const musicInfo = videoData.music || {};
    if (musicInfo.playUrl) {
      const urls = normalizeUrls(musicInfo.playUrl);
      if (urls.length > 0) {
        formats.push({
          type: 'audio',
          urls,
          format: 'mp3',
          quality: 'audio',
          watermark: false,
        });
      }
    }
    
    // Extract metadata
    const metadata = {
      id: videoData.id,
      title: videoData.desc || `TikTok video #${videoData.id}`,
      author: {
        name: videoData.author?.nickname || 'Unknown',
        username: videoData.author?.uniqueId || 'unknown',
      },
      music: {
        title: musicInfo.title || 'Original sound',
        artist: musicInfo.authorName || '',
      },
      stats: {
        views: videoData.stats?.playCount || 0,
        likes: videoData.stats?.diggCount || 0,
        comments: videoData.stats?.commentCount || 0,
        shares: videoData.stats?.shareCount || 0,
      },
      thumbnails: videoInfo.cover ? [videoInfo.cover] : [],
      duration: videoInfo.duration || 0,
    };
    
    return {
      formats,
      metadata,
    };
  } catch (error) {
    console.error('Web extraction failed:', error);
    throw new Error('Failed to extract video data from TikTok webpage');
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Parse TikTok URL
    const { videoId, userId } = parseTikTokUrl(url);
    const standardUrl = createStandardUrl(userId, videoId);
    
    let videoInfo;
    
    // Try API approach first
    try {
      const apiResponse = await callTikTokApi('multi/aweme/detail', videoId, {
        aweme_ids: `[${videoId}]`,
        request_source: '0',
      });
      
      const awemeDetail = apiResponse?.aweme_details?.[0];
      videoInfo = extractVideoInfo(awemeDetail);
    } catch (error) {
      console.log('API extraction failed, falling back to web scraping');
      
      // Fallback to web scraping
      videoInfo = await extractFromWebpage(standardUrl);
    }
    
    return NextResponse.json(videoInfo);
  } catch (error: any) {
    console.error('Download error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to process TikTok video' },
      { status: 500 }
    );
  }
}

// GET method for proxy download
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const filename = request.nextUrl.searchParams.get('filename') || 'tiktok-video.mp4';
  
  if (!url) {
    return NextResponse.json(
      { message: 'TikTok downloader API is running. Use with ?url=VIDEO_URL to download videos.' },
      { status: 200 }
    );
  }
  
  // Helper function to download with retries
  async function downloadWithRetry(downloadUrl: string, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Download attempt ${attempt} for: ${downloadUrl}`);
        
        // Use different headers for each attempt
        const headers: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.tiktok.com/',
          'Accept': 'video/webm,video/mp4,video/*;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://www.tiktok.com',
          'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="120", "Chromium";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Sec-Fetch-Dest': 'video',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
        };
        
        // Add random cookies for the third attempt
        if (attempt === 3) {
          headers['Cookie'] = `tt_csrf_token=${Math.random().toString(36).substring(2, 15)}; ttwid=${Math.random().toString(36).substring(2, 15)}`;
        }
        
        const response = await axios({
          method: 'get',
          url: downloadUrl,
          responseType: 'arraybuffer',
          headers,
          timeout: 60000, // 60 seconds timeout
          maxRedirects: 10,
        });
        
        if (response.status === 200 && response.data && response.data.length > 0) {
          return response.data;
        }
        
        throw new Error('Empty response or non-200 status');
      } catch (error: any) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        lastError = error;
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All download attempts failed');
  }
  
  try {
    console.log('Proxying download for:', url);
    
    // Try to download the content
    const data = await downloadWithRetry(url);
    
    // Create response with appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', 'video/mp4');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', data.length.toString());
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return new NextResponse(data, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Proxy download error:', error);
    
    return NextResponse.json(
      { error: 'Failed to download video. Try copying the URL instead.' },
      { status: 500 }
    );
  }
}
