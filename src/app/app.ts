import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PokemonList } from './components/pokemon-list/pokemon-list';

@Component({
  imports: [RouterOutlet, PokemonList],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('PokeTeam');
}
