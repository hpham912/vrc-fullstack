import React, { useState } from 'react';
import { X, MapPin, Navigation, Compass, Copy, Check, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { getGoogleMapsDirectionsUrl, getAppleMapsDirectionsUrl } from '../utils/directions.ts';
import { CHURCH_NAME } from '../constants/church.ts';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationName?: string;
  address?: string;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({
  isOpen,
  onClose,
  destinationName = CHURCH_NAME.en,
  address = CHURCH_NAME.address,
}) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fallbackAddress = CHURCH_NAME.address;
  const cleanAddress = (address && !address.toLowerCase().includes('tempe, arizona') && address.toLowerCase() !== 'tempe, az' && address.toLowerCase() !== 'tempe az' ? address : fallbackAddress).trim();
  const googleUrl = getGoogleMapsDirectionsUrl(cleanAddress);
  const appleUrl = getAppleMapsDirectionsUrl(cleanAddress);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white">
                {language === 'vi' ? 'Bắt Đầu Chỉ Đường' : 'Start Navigation'}
              </h3>
              <p className="text-xs text-amber-200/80">
                {language === 'vi' ? 'Từ vị trí hiện tại của bạn' : 'From your current location'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Card */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-serif font-bold text-sm text-stone-900 truncate">
                  {destinationName}
                </p>
                <p className="text-xs text-stone-800 mt-0.5 leading-relaxed font-medium">
                  {cleanAddress}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-700 font-medium">
              <span>{language === 'vi' ? 'Điểm đến được chọn' : 'Selected destination'}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-950 active:scale-95 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{language === 'vi' ? 'Đã chép' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Chép địa chỉ' : 'Copy address'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-700 font-medium text-center">
            {language === 'vi'
              ? 'Chọn ứng dụng bản đồ ưa thích để bắt đầu dẫn đường ngay lập tức:'
              : 'Choose your preferred maps app to start turn-by-turn routing immediately:'}
          </p>

          {/* Map Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Google Maps Button */}
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-md hover:shadow-lg transition-all active:scale-95 group border border-stone-800"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-white text-xs">Google Maps</span>
                  <span className="block text-[10px] text-stone-400">
                    {language === 'vi' ? 'Chỉ đường tức thì' : 'Live directions'}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-white" />
            </a>

            {/* Apple Maps Button */}
            <a
              href={appleUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-medium text-xs shadow-md hover:shadow-lg transition-all active:scale-95 group border border-amber-600/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-white text-xs">Apple Maps</span>
                  <span className="block text-[10px] text-amber-200">
                    {language === 'vi' ? 'Dẫn đường iOS' : 'iOS turn-by-turn'}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-amber-200 group-hover:text-white" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
          >
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
