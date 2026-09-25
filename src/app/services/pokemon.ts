import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Pokemon {
    name: string;
    url: string;
}

// On définit une "interface" : une sorte de contrat qui décrit la forme (structure) d'un objet Pokémon tel qu'il est fourni par la PokéAPI.
interface PokemonAPiResponse {
    results: Pokemon[];
}

// @Injectable indique à Angular que cette classe peut être "injectée" dans d'autres composants ou services (système d'injection de dépendances).
// providedIn: 'root' signifie que ce service est disponible dans TOUTE l'application, sans avoir à le déclarer ailleurs.
@Injectable({
    providedIn: 'root'
})
export class PokemonService {
    // L'URL de base de l'API qu'on va appeler. ?limit=20 signifie qu'on demande seulement les 20 premiers Pokémon.
    private apiUrl = 'https://pokeapi.co/api/v2/pokemon?limit=20';

    constructor(private http: HttpClient){} //Service Angular pour requête HTTP

    // Cette méthode va chercher la liste des Pokémon et la renvoie sous forme d'Observable<Pokemon[]>
    getPokemonList(): Observable<Pokemon[]> {
        return new Observable(observer => {
            //renvoie une requête HTTP de type get vers l'URL de l'application
            this.http.get<PokemonAPiResponse>(this.apiUrl).subscribe({
                //next : si la requête réussit. on extrait le tableau et le transmets à l'observer
                next: (response) => observer.next(response.results),
                //error : en cas d'échec. error est transmis
                error: (err) => observer.error(err),
                //complete quand le fluix est terminé
                complete: () => observer.complete()
            });
        });
    }
}
