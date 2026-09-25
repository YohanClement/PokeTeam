import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

const SUPPORTED_LANGUAGES = ['fr', 'en', 'de', 'es', 'it', 'ja', 'ko', 'zh-Hans', 'zh-Hant'];

export interface Pokemon {
    name: string;
    url: string;
    imageUrl: string;
}

// On définit une "interface" : une sorte de contrat qui décrit la forme (structure) d'un objet Pokémon tel qu'il est fourni par la PokéAPI.
interface PokemonApiResponse {
    results: { name: string; url: string }[];
}

export interface PokemonDetail {
    name: string;
    height: number;
    weight: number;
    sprites: {
        front_default: string
    };
    types: {
        type: { name: string; };
    }[];
}

// Interface décrivant la réponse de l'endpoint pokemon-species.
// On ne garde que le champ qui nous intéresse : flavor_text_entries.
interface PokemonSpeciesResponse {
    names: {
        name: string;
        language: { name: string };
    }[];

    flavor_text_entries: {
        flavor_text: string;
        language: { name: string };
        version: { name: string };
    }[];

    varieties: {
        is_default: boolean;
        pokemon: {
            name: string;
            url: string;
        };
    }[];
}

interface PokemonFormResponse {
    names: {
        name: string;
        language: { name: string };
    }[];
}

export interface PokemonVariant {
    slug: string;
    label: string;
}

export interface PokemonSpeciesData {
    frenchName: string;
    descriptions: PokedexEntry[];
    variants: PokemonVariant[];
}

export interface PokedexEntry {
    version: string;
    text: string;
}

// @Injectable indique à Angular que cette classe peut être "injectée" dans d'autres composants ou services (système d'injection de dépendances).
// providedIn: 'root' signifie que ce service est disponible dans TOUTE l'application, sans avoir à le déclarer ailleurs.
@Injectable({
    providedIn: 'root'
})
export class PokemonService {
    // L'URL de base de l'API qu'on va appeler. 
    private apiUrl = 'https://pokeapi.co/api/v2/';

    constructor(private http: HttpClient) { }

    private getUserLanguage(): string {
        const fullLang = navigator.language;
        const shortLang = fullLang.split('-')[0];

        if (shortLang === 'zh') {
            // Taiwan et Hong Kong utilisent traditionnellement le chinois traditionnel.
            if (fullLang === 'zh-TW' || fullLang === 'zh-HK') {
                return 'zh-Hant';
            }
            // Chine continentale, Singapour... utilisent le chinois simplifié.
            return 'zh-Hans';
        }

        return SUPPORTED_LANGUAGES.includes(shortLang) ? shortLang : 'fr';
    }

    // Cette méthode va chercher la liste des Pokémon et la renvoie sous forme d'Observable<Pokemon[]>
    getPokemonList(): Observable<Pokemon[]> {
        // return new Observable(observer => {
        //     this.http.get<PokemonAPiResponse>(this.apiUrl).subscribe({
        //         next: (response) => observer.next(response.results),
        //         error: (err) => observer.error(err),
        //         complete: () => observer.complete()
        //     });
        // });

        // .pipe() + map() permet de TRANSFORMER les données reçues avant de les renvoyer à celui qui appelle cette méthode.
        return this.http.get<PokemonApiResponse>(`${this.apiUrl}pokemon-species?limit=1500`).pipe(
            map(response => response.results.map(pokemon => ({ name: pokemon.name, url: pokemon.url, imageUrl: this.extractImageUrl(pokemon.url) })
            )
            ))
    }

    // Récupère les détails d'UN SEUL Pokémon, identifié par son nom.
    getPokemonDetail(name: string): Observable<PokemonDetail> {
        return this.http.get<PokemonDetail>(`${this.apiUrl}pokemon/${name}`);
    }

    private extractImageUrl(url: string): string {
        // On récupère le dernier segment numérique de l'URL.
        const segments = url.split('/').filter(Boolean); // filter(Boolean) enlève les segments vides
        const id = segments[segments.length - 1];
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    }

    getPokemonSpeciesData(name: string): Observable<PokemonSpeciesData> {
    const lang = this.getUserLanguage();

    return this.http.get<PokemonSpeciesResponse>(
        `${this.apiUrl}pokemon-species/${name}`
    ).pipe(
        // switchMap permet d'enchaîner un DEUXIÈME appel HTTP qui dépend
        // du résultat du premier (ici, la liste des variantes).
        switchMap(response => {
            let nameEntry = response.names.find(n => n.language.name === lang);
            if (!nameEntry) {
                nameEntry = response.names.find(n => n.language.name === 'en');
            }

            let descriptions = response.flavor_text_entries
                .filter(entry => entry.language.name === lang);
            if (descriptions.length === 0) {
                descriptions = response.flavor_text_entries
                    .filter(entry => entry.language.name === 'en');
            }

            const cleanedDescriptions = descriptions.map(entry => ({
                version: entry.version.name,
                text: entry.flavor_text.replace(/[\n\f]/g, ' ')
            }));

            const seenTexts = new Set<string>();
            const uniqueDescriptions = cleanedDescriptions.filter(entry => {
                const normalized = entry.text.trim().toLowerCase();
                if (seenTexts.has(normalized)) return false;
                seenTexts.add(normalized);
                return true;
            });

            const variantSlugs = response.varieties
                .filter(v => !v.is_default)
                .map(v => v.pokemon.name);

            // Cas simple : aucune variante, pas besoin d'appels supplémentaires.
            if (variantSlugs.length === 0) {
                return of({
                    frenchName: nameEntry?.name ?? name,
                    descriptions: uniqueDescriptions,
                    variants: []
                });
            }

            // Pour chaque variante, on prépare un appel HTTP vers pokemon-form
            // afin de récupérer son nom traduit.
            const variantRequests = variantSlugs.map(slug =>
                this.http.get<PokemonFormResponse>(`${this.apiUrl}pokemon-form/${slug}`).pipe(
                    map(formResponse => {
                        let formNameEntry = formResponse.names.find(n => n.language.name === lang);
                        if (!formNameEntry) {
                            formNameEntry = formResponse.names.find(n => n.language.name === 'en');
                        }
                        return {
                            slug: slug,
                            // Si aucun nom traduit n'existe pour cette forme,
                            // on retombe sur le slug technique par défaut.
                            label: formNameEntry?.name ?? slug
                        };
                    })
                )
            );

            // forkJoin attend que TOUS les appels de la liste soient terminés,
            // puis renvoie leurs résultats regroupés dans un seul tableau.
            return forkJoin(variantRequests).pipe(
                map(variants => ({
                    frenchName: nameEntry?.name ?? name,
                    descriptions: uniqueDescriptions,
                    variants: variants
                }))
            );
        })
    );
}
}
