/**
 * @module infrastructure/ragAdapter
 * Infrastructure adapter wiring rag-engine searchRag into the domain searchProvider contract (ARCH-01).
 */
import { searchRag } from '../rag-engine.js';
import { setSearchProvider, searchProvider } from '../domain/searchProvider.js';

setSearchProvider(searchRag);

export { searchProvider, setSearchProvider };
export default searchProvider;
