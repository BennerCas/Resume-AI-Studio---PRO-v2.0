
// NOTE: This is a very basic scraper. Due to browser security restrictions (CORS),
// it cannot directly fetch content from most websites.
// This service relies on a CORS proxy. Public proxies are often unreliable or have limitations.
// For a production application, you would need your own server-side proxy.

const CORS_PROXY = 'https://api.allorigins.win/raw?url='; // A public CORS proxy

export const fetchUrlContent = async (url: string): Promise<string> => {
    if (!url || !url.startsWith('http')) {
        alert('Por favor, introduce una URL válida.');
        return '';
    }

    try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            throw new Error(`Error al acceder a la URL: ${response.status} ${response.statusText}`);
        }
        
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Remove non-content elements to clean up the text
        doc.querySelectorAll('script, style, nav, header, footer, aside, form, button, [aria-hidden="true"]').forEach(el => el.remove());

        // A simple approach to get the main content text. This could be improved.
        const body = doc.body;
        if (!body) {
            throw new Error("No se pudo analizar el contenido de la página.");
        }

        const textContent = body.innerText || body.textContent || '';
        
        // Basic cleanup of the extracted text
        return textContent.replace(/\s\s+/g, ' ').trim();

    } catch (error) {
        console.error('Error al obtener o procesar el contenido de la URL:', error);
        alert('No se pudo obtener el contenido de la URL. Esto puede deberse a restricciones de seguridad del sitio web (CORS). Por favor, intenta pegar el texto manualmente.');
        return '';
    }
};
