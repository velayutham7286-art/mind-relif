import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Globe, 
  Edit3, 
  Save, 
  X,
  Crosshair
} from 'lucide-react';
import { LocationData, UserProfile } from '../types';
import { identifyUserLocation, syncUserLocationToServer, getMapUrl } from '../lib/locationService';

interface UserLocationCardProps {
  user: UserProfile;
  onLocationUpdated: (updatedLocation: LocationData) => void;
  compact?: boolean;
}

export const UserLocationCard: React.FC<UserLocationCardProps> = ({
  user,
  onLocationUpdated,
  compact = false
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Custom edit fields
  const [editCity, setEditCity] = useState(user.location?.city || user.city || '');
  const [editRegion, setEditRegion] = useState(user.location?.region || user.region || '');
  const [editCountry, setEditCountry] = useState(user.location?.country || user.country || 'India');
  const [editAddress, setEditAddress] = useState(user.location?.address || '');

  const loc = user.location;
  const lat = (typeof loc?.lat === 'number' && !isNaN(loc.lat)) ? loc.lat : (Number(loc?.lat) || 13.0827);
  const lng = (typeof loc?.lng === 'number' && !isNaN(loc.lng)) ? loc.lng : (Number(loc?.lng) || 80.2707);
  const accuracy = (typeof loc?.accuracy === 'number' && !isNaN(loc.accuracy)) ? loc.accuracy : (Number(loc?.accuracy) || 15);
  const source = loc?.source ?? 'DEFAULT';

  // Automatically attempt identification on mount if user location has not been refreshed recently
  useEffect(() => {
    if (!loc || !loc.detectedAt) {
      handleIdentifyLocation(false);
    }
  }, []);

  const handleIdentifyLocation = async (showNotice: boolean = true) => {
    setIsDetecting(true);
    setDetectionNotice(null);

    try {
      const result = await identifyUserLocation(user.id);
      if (result.success) {
        onLocationUpdated(result.location);
        setEditCity(result.location.city || '');
        setEditRegion(result.location.region || '');
        setEditCountry(result.location.country || '');
        setEditAddress(result.location.address || '');

        if (showNotice) {
          setDetectionNotice(`Location identified via ${result.sourceLabel}!`);
          setTimeout(() => setDetectionNotice(null), 4500);
        }
      } else {
        if (showNotice) {
          setDetectionNotice(result.error || 'Failed to detect precise location. Using default.');
          setTimeout(() => setDetectionNotice(null), 4000);
        }
      }
    } catch (err: any) {
      if (showNotice) {
        setDetectionNotice('Error determining location. Please check browser permissions.');
        setTimeout(() => setDetectionNotice(null), 4000);
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveCustomLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedLoc: LocationData = {
      lat,
      lng,
      accuracy: 5,
      city: editCity.trim() || loc?.city || 'Chennai',
      region: editRegion.trim() || loc?.region || 'Tamil Nadu',
      country: editCountry.trim() || loc?.country || 'India',
      address: editAddress.trim() || [editCity, editRegion, editCountry].filter(Boolean).join(', '),
      source: 'MANUAL',
      detectedAt: new Date().toISOString()
    };

    onLocationUpdated(updatedLoc);
    await syncUserLocationToServer(user.id, updatedLoc);
    setIsEditing(false);
    setDetectionNotice('Custom location and landmark details updated.');
    setTimeout(() => setDetectionNotice(null), 4000);
  };

  const displayCity = loc?.city || user.city || 'Chennai';
  const displayRegion = loc?.region || user.region || 'Tamil Nadu';
  const displayCountry = loc?.country || user.country || user.currentHostCountry || 'India';
  const displayAddress = loc?.address || `${displayCity}, ${displayRegion}, ${displayCountry}`;

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4 transition-all">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                Verified User Location & GPS
              </h3>
              {/* Source Badge */}
              {source === 'GPS' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  GPS Verified (±{accuracy}m)
                </span>
              ) : source === 'NETWORK_IP' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                  <Globe className="w-3 h-3 text-sky-600" />
                  Network IP Geolocation
                </span>
              ) : source === 'MANUAL' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Edit3 className="w-3 h-3 text-amber-600" />
                  User-Specified Location
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3 text-stone-500" />
                  Registered Location
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-500">
              Auto-attached to your vocal stress assessments and emergency Twilio crisis SMS.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleIdentifyLocation(true)}
            disabled={isDetecting}
            className="flex-1 sm:flex-none justify-center text-xs px-3 py-2 sm:py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 min-h-[38px] touch-manipulation"
            title="Identify my current location using browser GPS and IP"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin text-sky-400' : ''}`} />
            <span>{isDetecting ? 'Identifying...' : 'Identify Location'}</span>
          </button>

          <a
            href={getMapUrl(lat, lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2.5 py-2 sm:py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors flex items-center gap-1 min-h-[38px] touch-manipulation"
            title="View on Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Map</span>
          </a>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs px-2.5 py-2 sm:py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors flex items-center gap-1 min-h-[38px] touch-manipulation"
            title="Edit location details or landmark notes"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Refine</span>
          </button>
        </div>
      </div>

      {/* Detection Notice Banner */}
      {detectionNotice && (
        <div className="text-xs bg-sky-50 border border-sky-200 text-sky-900 rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{detectionNotice}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setDetectionNotice(null)} 
            className="text-stone-400 hover:text-stone-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Normal Display State */}
      {!isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Main Locality */}
          <div className="sm:col-span-2 bg-stone-50 border border-stone-200/60 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              Physical Location & Address
            </span>
            <div className="text-sm font-bold text-stone-900">
              {displayCity}, {displayRegion} ({displayCountry})
            </div>
            <div className="text-xs text-stone-600 line-clamp-2" title={displayAddress}>
              {displayAddress}
            </div>
          </div>

          {/* Coordinates and Sensor Info */}
          <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              GPS Navigation Coordinates
            </span>
            <div className="font-mono text-xs font-semibold text-stone-800">
              {(Number(lat) || 13.0827).toFixed(5)}° N, {(Number(lng) || 80.2707).toFixed(5)}° E
            </div>
            <div className="text-[11px] text-stone-500 flex items-center gap-1">
              <span>Radius: ±{Math.round(accuracy)} meters</span>
              {loc?.postalCode && <span>• PIN: {loc.postalCode}</span>}
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode Form */
        <form onSubmit={handleSaveCustomLocation} className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-stone-200">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-stone-600" />
              Refine Location & Landmark Details
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-stone-400 hover:text-stone-600 text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase mb-1">
                City / Town
              </label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="e.g. Chennai"
                required
                className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase mb-1">
                State / Region
              </label>
              <input
                type="text"
                value={editRegion}
                onChange={(e) => setEditRegion(e.target.value)}
                placeholder="e.g. Tamil Nadu"
                className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase mb-1">
                Country
              </label>
              <input
                type="text"
                value={editCountry}
                onChange={(e) => setEditCountry(e.target.value)}
                placeholder="e.g. India"
                className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-700 uppercase mb-1">
              Street, Building, or Specific Landmark (for Emergency Responders)
            </label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="e.g. Anna Salai, Guindy, near Metro Station"
              className="w-full text-xs px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs px-3 py-1.5 border border-stone-200 text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs px-4 py-1.5 bg-stone-900 text-white hover:bg-stone-800 rounded-lg font-semibold flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Location Details
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserLocationCard;
