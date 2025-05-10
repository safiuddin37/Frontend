import { useEffect } from 'react';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { useMap } from 'react-leaflet';
import 'leaflet-geosearch/dist/geosearch.css'; // ✅ add this line

const SearchControl = ({ setPosition }) => {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      autoClose: true,
      retainZoomLevel: false,
      searchLabel: 'Search for location...',
      keepResult: true,
    });

    map.addControl(searchControl);

    map.on('geosearch/showlocation', (result) => {
      const { x, y } = result.location;
      setPosition([y, x]);
    });

    return () => map.removeControl(searchControl);
  }, [map, setPosition]);

  return null;
};

export default SearchControl;
