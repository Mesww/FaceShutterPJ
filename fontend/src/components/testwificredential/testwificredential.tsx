import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Network, Globe, MapPin, Info } from 'lucide-react';

interface IPInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
}

const IPChecker = () => {
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localIP, setLocalIP] = useState<string | null>(null);

  const getLocalIPs = async () => {
    try {
      // Get local IP addresses using WebRTC
      const RTCPeerConnection = window.RTCPeerConnection;
      const pc = new RTCPeerConnection({
        iceServers: [],
      });
      
      pc.createDataChannel('');
      await pc.createOffer().then(pc.setLocalDescription.bind(pc));
      
      pc.onicecandidate = (ice) => {
        if (ice.candidate) {
          // Extract IP from candidate string
          const matches = ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/);
          if (matches) {
            setLocalIP(matches[1]);
          }
        }
      };
    } catch (err) {
      console.error('Failed to get local IP:', err);
    }
  };

  const fetchIPInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://ipinfo.io/json');
      if (!response.ok) {
        throw new Error('Failed to fetch IP information');
      }
      
      const data = await response.json();
      setIpInfo(data);
      
      // Get local IPs
      await getLocalIPs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch IP information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPInfo();
  }, []);

  const renderInfoRow = (icon: React.ReactNode, label: string, value: string | undefined) => {
    if (!value) return null;
    
    return (
      <div className="flex justify-between items-center p-3 bg-gray-100 rounded">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}:</span>
        </div>
        <span>{value}</span>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          IP Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {renderInfoRow(
                <Globe className="h-4 w-4" />,
                "Public IP",
                ipInfo?.ip
              )}
              
              {renderInfoRow(
                <Network className="h-4 w-4" />,
                "Local IP",
                localIP || 'Not available'
              )}
              
              {renderInfoRow(
                <MapPin className="h-4 w-4" />,
                "Location",
                ipInfo?.city && ipInfo?.country
                  ? `${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country}`
                  : undefined
              )}
              
              {renderInfoRow(
                <Info className="h-4 w-4" />,
                "ISP",
                ipInfo?.org
              )}
              
              {renderInfoRow(
                <Globe className="h-4 w-4" />,
                "Timezone",
                ipInfo?.timezone
              )}
            </div>
          )}

          <Button 
            onClick={fetchIPInfo} 
            disabled={loading}
            className="w-full mt-4"
          >
            {loading ? 'Refreshing...' : 'Refresh IP Information'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default IPChecker;