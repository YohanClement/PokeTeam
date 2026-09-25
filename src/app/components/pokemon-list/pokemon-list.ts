import { Component, OnInit, signal } from '@angular/core';
import { Pokemon, PokemonService } from '../../services/pokemon';

@Component({
  imports: [],
  selector: 'app-pokemon-list',
  styleUrl: './pokemon-list.scss',
  templateUrl: './pokemon-list.html',
})


export class PokemonList implements OnInit {
  // Un signal est une valeur réactive : quand on la modifie via .set(), Angular sait immédiatement qu'il doit mettre à jour l'affichage,
  // même en mode zoneless.
  pokemons = signal<Pokemon[]>([]);

  constructor(private pokemonService: PokemonService) { }

  // ngOnInit() est appelée automatiquement UNE FOIS, juste après la création du composant.
  ngOnInit(): void {
    this.pokemonService.getPokemonList().subscribe({
      next: (data) => {
        // Quand les données arrivent, on les stocke dans notre propriété "pokemons". Angular va automatiquement mettre à jour l'affichage (HTML).
        this.pokemons.set(data);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des Pokémon:', err);
      }
    });
  }


}
