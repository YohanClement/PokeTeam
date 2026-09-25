import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PokemonService, PokemonDetail as PokemonDetailModel, PokedexEntry } from '../../services/pokemon';
import { DecimalPipe } from '@angular/common';

const TYPE_COLORS: Record<string, string> = {
  fire: '#f08030',
  water: '#6890f0',
  grass: '#78c850',
  electric: '#f8d030',
  ice: '#98d8d8',
  fighting: '#c03028',
  poison: '#a040a0',
  ground: '#e0c068',
  flying: '#a890f0',
  psychic: '#f85888',
  bug: '#a8b820',
  rock: '#b8a038',
  ghost: '#705898',
  dragon: '#7038f8',
  dark: '#705848',
  steel: '#b8b8d0',
  fairy: '#ee99ac',
  normal: '#a8a878',
};

@Component({
  imports: [RouterLink, DecimalPipe],
  selector: 'app-pokemon-detail',
  styleUrl: './pokemon-detail.scss',
  templateUrl: './pokemon-detail.html',
})
export class PokemonDetail implements OnInit {
  pokemon = signal<PokemonDetailModel | null>(null);
  descriptions = signal<PokedexEntry[]>([]);
  frenchName = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private pokemonService: PokemonService
  ) { }

  ngOnInit(): void {
    // this.route.snapshot.paramMap.get() récupère la valeur du paramètre.
    // snapshot c'est à l'instant t
    const name = this.route.snapshot.paramMap.get('name');

    if (name) {
      this.pokemonService.getPokemonDetail(name).subscribe({
        next: (data) => { this.pokemon.set(data); },
        error: (err) => { console.error('Erreur lors du chargement du détail:', err); }
      });

      this.pokemonService.getPokemonSpeciesData(name).subscribe({
        next: (data) => { 
          this.frenchName.set(data.frenchName); 
          this.descriptions.set(data.descriptions);
        },
        error: (err) => { console.error('Erreur lors du chargement des descriptions:', err) }
      })
    }
  }

  getTypeColor(typeName: string): string {
    return TYPE_COLORS[typeName] ?? '#a8a878';
  }

  convertWeight(weight: number): number {
    return weight / 10;
  }

  convertHeight(height: number): number {
    return height * 10;
  }
}
