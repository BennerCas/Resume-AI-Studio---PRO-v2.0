const PEXELS_API_KEY = 'J4EF29WInQCxjXvSIjWLiYrONPh3KCzsLuhJmiZguSXtwrkCQOQDbUHL';
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

interface PexelsImage {
  id: number;
  src: {
    original: string;
    large2x: string;
    medium: string;
    small: string;
    tiny: string;
  };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsImage[];
  total_results: number;
}

export const searchPexels = async (query: string): Promise<string[]> => {
  if (!query.trim()) {
    return [];
  }

  const search = async (q: string): Promise<PexelsResponse | null> => {
    try {
      const response = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(q)}&per_page=12&orientation=landscape`, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      });

      if (!response.ok) {
        console.error("Pexels API error:", response.statusText);
        alert(`Error al buscar imágenes en Pexels: ${response.statusText}`);
        return null;
      }
      const data: PexelsResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching from Pexels:", error);
      alert("No se pudieron cargar las imágenes de Pexels. Revisa tu conexión de red.");
      return null;
    }
  }
  
  let results = await search(query);

  // Fallback logic
  if (!results || results.photos.length === 0) {
    const fallbackQueries = ['technology', 'business', 'office', 'abstract', 'work', 'code', 'minimal'];
    const randomFallback = fallbackQueries[Math.floor(Math.random() * fallbackQueries.length)];
    console.log(`No results for "${query}", falling back to "${randomFallback}"`);
    results = await search(randomFallback);
  }

  if (results && results.photos.length > 0) {
    return results.photos.map(photo => photo.src.large2x);
  }

  return [];
};
