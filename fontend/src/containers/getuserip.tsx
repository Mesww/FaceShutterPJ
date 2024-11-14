// IP service endpoints
const IP_SERVICES = [
    'https://api.ipify.org?format=json',
    'https://api64.ipify.org?format=json',
    'https://api.ip.sb/jsonip',
    'https://api.myip.com'
  ];
  
  const getIPAddress = async () => {
    for (const service of IP_SERVICES) {
      try {
        const response = await fetch(service);
        const data = await response.json();
        // Different services use different response formats
        return data.ip || data.ipAddress;
      } catch (error) {
        console.error(`Failed to fetch from ${service}:`, error);
        continue; // Try next service
      }
    }
    throw new Error('Failed to fetch IP address from all services');
  };
  
  // Usage in component:
export const checkIP = async () => {
    try {
      const ip = await getIPAddress();
      console.log('Your IP:', ip);
    } catch (error) {
      console.error('Failed to get IP:', error);
    }
  };