import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { getGoogleMapsUrl, getWazeUrl } from '../../utils/geoLinks';

interface AddressGpsLinksProps {
  address: string;
  className?: string;
  showWazeBadge?: boolean;
}

export const AddressGpsLinks: React.FC<AddressGpsLinksProps> = ({
  address,
  className = '',
  showWazeBadge = true,
}) => {
  if (!address || !address.trim()) {
    return <span className="text-slate-400">Endereço não informado</span>;
  }

  const cleanAddr = address.trim();
  const mapsUrl = getGoogleMapsUrl(cleanAddr);
  const wazeUrl = getWazeUrl(cleanAddr);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
        title="Abrir no Google Maps"
      >
        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span className="line-clamp-1">{cleanAddr}</span>
      </a>

      {showWazeBadge && (
        <div className="inline-flex items-center gap-1 shrink-0">
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-1.5 py-0.5 rounded-md bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10px] font-bold inline-flex items-center gap-1 transition-all"
            title="Abrir rota no Waze"
          >
            <Navigation className="w-2.5 h-2.5" />
            Waze
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-1.5 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1 transition-all"
            title="Abrir rota no Google Maps"
          >
            Maps
          </a>
        </div>
      )}
    </div>
  );
};
