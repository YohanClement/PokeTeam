import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PokemonService, PokemonDetail as PokemonDetailModel } from '../../services/pokemon';

@Component({
  imports: [RouterLink],
  selector: 'app-pokemon-detail',
  styleUrl: './pokemon-detail.scss',
  templateUrl: './pokemon-detail.html',
})
export class PokemonDetail implements OnInit {
  pokemon = signal<PokemonDetailModel | null>(null);

  constructor(
    private route: ActivatedRoute,
    private pokemonService: PokemonService
  ) { }

  ngOnInit(): void {
    // this.route.snapshot.paramMap.get() récupère la valeur du paramètre.
    // snapshot c'est a l'instant t
    const name = this.route.snapshot.paramMap.get('name');
    if (name) {
      this.pokemonService.getPokemonDetail(name).subscribe({
        next: (data) => { this.pokemon.set(data); },
        error: (err) => { console.error('Erreur lors du chargement du détail:', err); }
      });
    }
  }
}
