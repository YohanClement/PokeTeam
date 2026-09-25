import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

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
}

export interface PokemonSpeciesData {
    frenchName: string;
    descriptions: PokedexEntry[];
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

    // Cette méthode va chercher la liste des Pokémon et la renvoie sous forme d'Observable<Pokemon[]>
    getPokemonList(): Observable<Pokemon[]> {
        // return new Observable(observer => {
        //     //renvoie une requête HTTP de type get vers l'URL de l'application
        //     this.http.get<PokemonAPiResponse>(this.apiUrl).subscribe({
        //         //next : si la requête réussit. on extrait le tableau et le transmets à l'observer
        //         next: (response) => observer.next(response.results),
        //         //error : en cas d'échec. error est transmis
        //         error: (err) => observer.error(err),
        //         //complete quand le fluix est terminé
        //         complete: () => observer.complete()
        //     });
        // });

        // .pipe() + map() permet de TRANSFORMER les données reçues avant de les renvoyer à celui qui appelle cette méthode.
        return this.http.get<PokemonApiResponse>(`${this.apiUrl}pokemon?limit=1500`).pipe(
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
        return this.http.get<PokemonSpeciesResponse>(
            `${this.apiUrl}pokemon-species/${name}`
        ).pipe(map(
            response => {
                const frenchNameEntry = response.names.find(n => n.language.name === 'fr');
                const descriptions = response.flavor_text_entries
                    .filter(entry => entry.language.name === 'fr')
                    .map(entry => ({
                        version: entry.version.name,
                        text: entry.flavor_text.replace(/[\n\f]/g, ' ')
                    }));

                // On déduplique en se basant sur le texte : si deux entrées ont exactement le même contenu, on ne garde que la première rencontrée.
                const seenTexts = new Set<string>();
                const uniqueDescriptions = descriptions.filter(entry => {
                    if (seenTexts.has(entry.text)) return false; // on l'a déjà vu, on l'exclut
                    seenTexts.add(entry.text);
                    return true; // première fois qu'on le voit, on le garde
                });

                return {
                    frenchName: frenchNameEntry?.name ?? name,
                    descriptions: uniqueDescriptions
            };
    })
    );
}
}
