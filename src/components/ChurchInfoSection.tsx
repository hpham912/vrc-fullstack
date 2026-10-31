import React from 'react';
import {
  Clock,
  MapPin,
  Mail,
  Phone,
  Heart,
  Users,
  ExternalLink,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export const ChurchInfoSection: React.FC = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-stone-200">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Gather with Us
        </span>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mt-2">
          Service Times & Community Info
        </h2>
        <p className="text-stone-600 text-sm mt-2">
          Whether you are visiting for the first time or looking for a church home, our doors and hearts are open to welcome you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Weekly Services */}
        <div className="bg-stone-50 rounded-3xl p-8 border border-stone-200 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Weekly Services
            </h3>
            <p className="text-xs text-stone-500 mt-1">In-person & live-streamed</p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="pb-3 border-b border-stone-200">
              <span className="font-bold text-stone-900 block">Sunday Morning Worship</span>
              <p className="text-amber-700 font-semibold text-xs">9:00 AM & 11:00 AM</p>
              <p className="text-xs text-stone-500 mt-0.5">Nursery & Children Sunday School available</p>
            </div>

            <div className="pb-3 border-b border-stone-200">
              <span className="font-bold text-stone-900 block">Wednesday Family Night</span>
              <p className="text-amber-700 font-semibold text-xs">7:00 PM – 8:15 PM</p>
              <p className="text-xs text-stone-500 mt-0.5">Bible study, youth group & prayer circles</p>
            </div>

            <div>
              <span className="font-bold text-stone-900 block">Saturday Morning Prayer</span>
              <p className="text-amber-700 font-semibold text-xs">7:00 AM – 8:00 AM</p>
              <p className="text-xs text-stone-500 mt-0.5">In the Prayer Chapel</p>
            </div>
          </div>
        </div>

        {/* Location & Directions */}
        <div className="bg-stone-50 rounded-3xl p-8 border border-stone-200 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Sanctuary Location
            </h3>
            <p className="text-xs text-stone-500 mt-1">Convenient parking & accessible</p>
          </div>

          <div className="space-y-3 text-sm text-stone-700">
            <p className="font-semibold text-stone-900">
              Grace & Truth Community Church<br />
              <span className="text-stone-600 font-normal">
                742 Evergreen Terrace<br />
                Springfield, IL 62701
              </span>
            </p>

            <p className="text-xs text-stone-500 leading-relaxed pt-2">
              Guest parking is located directly in front of the main sanctuary entrance with greeters ready to assist you.
            </p>

            <div className="pt-2">
              <a
                href="https://maps.google.com/?q=742+Evergreen+Terrace+Springfield"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 underline"
              >
                <span>Get Directions via Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Giving & Contact */}
        <div className="bg-stone-50 rounded-3xl p-8 border border-stone-200 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Connect & Stewardship
            </h3>
            <p className="text-xs text-stone-500 mt-1">Ministry leadership & tithes</p>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-stone-700">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span className="truncate">contact@gracetruthchurch.org</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>(555) 742-WORD (9673)</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-stone-200 mt-4 space-y-2">
              <span className="font-bold text-xs text-stone-900 block">
                Online Tithes & Offerings
              </span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Thank you for your generous support of our church ministries and local community outreach programs.
              </p>
              <button
                onClick={() => alert('Online giving portal: Secure tithes & offerings are gratefully received during Sunday service or via your dedicated member portal.')}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Support Church Ministries
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
