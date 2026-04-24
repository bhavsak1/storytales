import dns from 'dns';
import { promisify } from 'util';

const lookupAsync = promisify(dns.lookup);

export async function validateExternalUrl(urlString: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format');
  }

  // 1. Enforce HTTPS only
  if (url.protocol !== 'https:') {
    throw new Error('SSRF Protection: Only HTTPS URLs are allowed');
  }

  // 2. Block obvious internal/metadata hosts
  const forbiddenHosts = ['localhost', '169.254.169.254'];
  if (forbiddenHosts.includes(url.hostname)) {
    throw new Error('SSRF Protection: Forbidden hostname');
  }

  // 3. Resolve the hostname to an IP and verify the IP
  try {
    const { address } = await lookupAsync(url.hostname);
    
    // Block common private, loopback, and link-local IPv4 prefixes
    const forbiddenPrefixes = [
      '127.',      // Loopback
      '10.',       // Private Class A
      '192.168.',  // Private Class C
      '169.254.',  // Link-local / AWS Metadata
      '0.',        // Current network
    ];
    
    if (forbiddenPrefixes.some(prefix => address.startsWith(prefix))) {
      throw new Error('SSRF Protection: URL resolves to a forbidden IP range');
    }
    
    // Block Private Class B (172.16.x.x - 172.31.x.x)
    if (address.startsWith('172.')) {
      const secondOctet = parseInt(address.split('.')[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        throw new Error('SSRF Protection: URL resolves to a private IP range');
      }
    }
    
    // Block IPv6 Loopback / Unspecified
    if (address === '::1' || address === '::') {
      throw new Error('SSRF Protection: URL resolves to loopback IP');
    }
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('SSRF Protection')) {
      throw error;
    }
    throw new Error('SSRF Protection: Could not resolve URL hostname');
  }

  return url.toString();
}
