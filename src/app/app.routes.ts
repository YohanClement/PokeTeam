import { Routes } from '@angular/router';
import { PokemonDetail } from './components/pokemon-detail/pokemon-detail';
import { PokemonList } from './components/pokemon-list/pokemon-list';

export const routes: Routes = [
    {path: '', component: PokemonList},
     // Route pour le détail d'un Pokémon. ":name" est un paramètre dynamique qui capture ce qu'il y a dans l'URL
    {path: 'pokemon/:name', component: PokemonDetail}
];
