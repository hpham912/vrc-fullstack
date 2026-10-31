import React from 'react';
import { Clock, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

export const ChurchInfoSection: React.FC = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-stone-200/80">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 block mb-1">
          Lịch Nhóm & Địa Điểm • Join Us
        </span>
        <h2 className="text-3xl font-serif font-bold text-stone-900">
          Service Times & Location
        </h2>
        <p className="text-stone-500 text-sm mt-2">
          We warmly welcome you and your family to worship with us this week.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Service Schedule */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs space-y-6">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>

          <div>
            <h3 className="font-serif font-bold text-xl text-stone-900">Weekly Gatherings</h3>
            <p className="text-xs text-stone-400 mt-0.5">In-person & online live stream</p>
          </div>

          <div className="space-y-4 text-sm divide-y divide-stone-100">
            <div className="pt-2">
              <span className="font-semibold text-stone-900 block">Sunday Celebration Service</span>
              <p className="text-amber-700 text-xs font-semibold">3:00 PM – 5:00 PM</p>
              <p className="text-xs text-stone-500 mt-0.5">Worship, preaching, and youth Sunday school</p>
            </div>

            <div className="pt-3">
              <span className="font-semibold text-stone-900 block">Friday Youth Fellowship</span>
              <p className="text-amber-700 text-xs font-semibold">6:30 PM – 9:00 PM</p>
              <p className="text-xs text-stone-500 mt-0.5">Youth & young adults gathering and fellowship</p>
            </div>

            <div className="pt-3">
              <span className="font-semibold text-stone-900 block">Wednesday Bible Study</span>
              <p className="text-amber-700 text-xs font-semibold">7:30 PM – 9:00 PM</p>
              <p className="text-xs text-stone-500 mt-0.5">Verse-by-verse scripture study & prayer</p>
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-xs space-y-6">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
            <MapPin className="w-5 h-5 text-amber-400" />
          </div>

          <div>
            <h3 className="font-serif font-bold text-xl text-stone-900">Sanctuary Location</h3>
            <p className="text-xs text-stone-400 mt-0.5">Tempe, Arizona</p>
          </div>

          <div className="space-y-4 text-sm text-stone-700">
            <div>
              <p className="font-semibold text-stone-900">Vietnamese Revival Church</p>
              <p className="text-xs text-stone-500 mt-1">
                Tempe, Arizona<br />
                Serving the Greater Phoenix & East Valley Community
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-700" />
                <span>contact@vnrevivalchurch.org</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-700" />
                <span>(555) 777-VREV (8738)</span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://maps.google.com/?q=Tempe+Arizona"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900"
              >
                <span>Directions to Tempe, AZ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
