import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Pokemon, PokemonService } from '../../services/pokemon';

@Component({
  imports: [CommonModule],
  selector: 'app-pokemon-list',
  styleUrl: './pokemon-list.scss',
  templateUrl: './pokemon-list.html',
})
export class PokemonList implements OnInit {
  pokemons: Pokemon[] = [];

  constructor(private pokemonService: PokemonService) { }

  ngOnInit(): void {
    this.pokemonService.getPokemonList().subscribe({
      next: (data) => {
        this.pokemons = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des Pokémon:', err);
      }
    });
  }


}
