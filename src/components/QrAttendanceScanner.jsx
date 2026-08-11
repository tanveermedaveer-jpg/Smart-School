import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const QrAttendanceScanner = ({ onClose, onScanSuccess }) => {
  const qrReaderRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Initialize html5QrCode
    const html5QrCode = new Html5Qrcode("qr-reader");
    html5QrCodeRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Success
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Suppress verbose scanning logs
      }
    ).catch(err => {
      console.error("Error starting QR Code scanner:", err);
    });

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Scan QR Attendance</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scanner target */}
        <div className="p-6 flex flex-col items-center">
          <div id="qr-reader" ref={qrReaderRef} className="w-full aspect-square max-w-[280px] bg-black rounded-xl overflow-hidden shadow-inner"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center leading-relaxed">
            Point your camera at the teacher's dynamic QR Code to instantly mark your attendance.
          </p>
        </div>

      </div>
    </div>
  );
};

export default QrAttendanceScanner;
