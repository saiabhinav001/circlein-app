'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Camera, Upload, X, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { qrService, QRScanResult, QRCodeData } from '@/lib/qr-service';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (result: QRScanResult) => void;
}

export function QRScanner({ isOpen, onClose, onScanSuccess }: QRScannerProps) {
  const { data: session } = useSession();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !scannerInitialized) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
        setScannerInitialized(false);
      }
    };
  }, [isOpen]);

  const initializeScanner = () => {
    const config = {
      fps: 10,
      qrbox: { width: 300, height: 300 },
      aspectRatio: 1.0,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA, Html5QrcodeScanType.SCAN_TYPE_FILE]
    };

    const scanner = new Html5QrcodeScanner('qr-scanner', config, false);
    
    scanner.render(
      (decodedText, decodedResult) => {
        handleScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Ignore frequent scanning errors, only log actual issues
        if (!errorMessage.includes('No QR code found')) {
          console.warn('QR scan error:', errorMessage);
        }
      }
    );

    scannerRef.current = scanner;
    setScannerInitialized(true);
  };

  const handleScanSuccess = async (qrContent: string) => {
    setIsScanning(true);
    setError(null);

    try {
      const scannerInfo = {
        userId: session?.user?.email,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        scanMethod: 'camera'
      };

      const result = await qrService.scanQRCode(qrContent, scannerInfo);
      setScanResult(result);

      if (result.success) {
        toast.success(result.message);
        onScanSuccess?.(result);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      const errorMsg = 'Failed to process QR code';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('QR scan processing error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      // Use HTML5-QRCode to scan from file
      const { Html5Qrcode } = await import('html5-qrcode');
      const qrCodeReader = new Html5Qrcode('file-scanner');
      
      const result = await qrCodeReader.scanFile(file, true);
      await handleScanSuccess(result);
    } catch (err) {
      const errorMsg = 'Could not read QR code from image';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('File scan error:', err);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'check-in':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'check-out':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <QrCode className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'check-in': return 'bg-green-100 text-green-800 border-green-200';
      case 'check-out': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleClose = () => {
    setScanResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </DialogTitle>
          <DialogDescription>
            Scan a booking QR code to check in/out or view details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AnimatePresence mode="wait">
            {scanResult ? (
              <motion.div
                key="scan-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {scanResult.success ? (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-green-800">
                          Scan Successful!
                        </CardTitle>
                        {scanResult.action && (
                          <Badge className={getActionColor(scanResult.action)}>
                            {getActionIcon(scanResult.action)}
                            <span className="ml-1">{scanResult.action.replace('-', ' ').toUpperCase()}</span>
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-green-700">
                        {scanResult.message}
                      </CardDescription>
                    </CardHeader>
                    
                    {scanResult.data && (
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Amenity</p>
                            <p className="font-medium">{scanResult.data.amenityName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Date</p>
                            <p className="font-medium">{formatDate(scanResult.data.startTime)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Time</p>
                            <p className="font-medium">
                              {formatTime(scanResult.data.startTime)} - {formatTime(scanResult.data.endTime)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Status</p>
                            <Badge variant="outline" className="text-xs">
                              {scanResult.data.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {/* Check-in/Check-out timestamps */}
                        {(scanResult.data.checkInTime || scanResult.data.checkOutTime) && (
                          <div className="pt-2 border-t space-y-2">
                            {scanResult.data.checkInTime && (
                              <div className="flex items-center gap-2 text-sm text-green-700">
                                <CheckCircle className="h-4 w-4" />
                                <span>Checked in at {formatTime(scanResult.data.checkInTime)}</span>
                              </div>
                            )}
                            {scanResult.data.checkOutTime && (
                              <div className="flex items-center gap-2 text-sm text-blue-700">
                                <CheckCircle className="h-4 w-4" />
                                <span>Checked out at {formatTime(scanResult.data.checkOutTime)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ) : (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Scan Failed
                      </CardTitle>
                      <CardDescription className="text-red-700">
                        {scanResult.message}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => setScanResult(null)} className="flex-1">
                    Scan Another
                  </Button>
                  <Button onClick={handleClose} variant="outline">
                    Close
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="scanner-interface"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Camera Scanner */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Camera Scanner
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div id="qr-scanner" className="w-full"></div>
                    {isScanning && (
                      <div className="flex items-center justify-center py-4">
                        <Loader className="h-5 w-5 animate-spin mr-2" />
                        <span className="text-sm">Processing QR code...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* File Upload Option */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </CardTitle>
                    <CardDescription>
                      Upload an image containing a QR code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full"
                      disabled={isScanning}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                  </CardContent>
                </Card>

                {/* Hidden div for file scanning */}
                <div id="file-scanner" className="hidden"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QRScanner;