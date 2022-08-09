import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Try {
  letters: Letter[];
}

interface Letter {
  slot: number,
  guess: string,
  result: string
}

@Component({
  selector: 'app-wordle',
  templateUrl: './wordle.component.html',
  styleUrls: ['./wordle.component.scss']
})
export class WordleComponent implements OnInit {

  tries: Try[] = [];
  seed: number = 0;
  guessStringLength: number = 5;
  isCorrect: boolean = false;
  alphabetBase: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');
  presentAlphabetBase: string[] = [];
  constructor(
    private http: HttpClient
  ) { }

  ngOnInit(): void {

  }

  start() {
    this.reset();
    this.guessWord();
  }

  reset() {
    //Rset values
    this.tries = [];
    this.isCorrect = false;
    this.alphabetBase = 'abcdefghijklmnopqrstuvwxyz'.split('');
    this.presentAlphabetBase = [];

    // Returns a random integer from 1 to 2000:
    this.seed = 1+ Math.floor(Math.random() * 2000);
  }

  guessWord() {
    let guess = '';
    let previousResult: Letter[] = [];

    // Previous guess result
    if (this.tries.length > 0) {
      previousResult = this.tries[0].letters;
    }

    // Get all present Alphabet
    if (previousResult.length > 0) {
      this.getAllPresentAlphabetResult(previousResult);
    }
    for (let i = 0; i < this.guessStringLength; i++) {
      if (previousResult.length > 0 && previousResult[i]) {
        // previous guess result
        let result = previousResult[i].result;
        if (result === 'correct') {
          // This index alphabet is sure.
          guess += previousResult[i].guess;
        } else {
          let letter = this.checkPresntAlphabetResult(i);
          guess += letter;
        }
      } else {
        let letter = this.checkPresntAlphabetResult(i);
        guess += letter;
      }
    }
    this.checkWord(guess).subscribe(
      (result) => {
        this.tries.unshift({ letters: result });

        // Check is it all correct in the end
        this.checkWordAllCorrect(result);
        if (!this.isCorrect) {
          this.guessWord();
        }
      }
    )
  }

  randomAlphabet(): string {
    const randomIndex = Math.floor(Math.random() * this.alphabetBase.length);
    const alphabet = this.alphabetBase[randomIndex];
    this.alphabetBase.splice(randomIndex, 1);
    return alphabet;
  }

  getAllPresentAlphabetResult(presentAlphabet: Letter[]): void {
    for (const letter of presentAlphabet) {
      // Correct letter also as present, becasue one letter may show more than once
      if (letter.result === 'present' || letter.result === 'correct') {
        this.presentAlphabetBase.push(letter.guess);
      }
    }
  }

  checkPresntAlphabetResult(index: number): string {
    let alphabet: string = '';
    let tryAllSlotAlphabet: string[] = [];
    for (let i = 0; i < this.presentAlphabetBase.length; i++) {
      let existsSlot = this.returnAlphabetInTryExistsSlot(this.presentAlphabetBase[i]);
      if (existsSlot.length === this.guessStringLength) {
        // this alphabet has been try in all slot
        // need remove out the alphabet in presentAlphabetBase
        tryAllSlotAlphabet.push(this.presentAlphabetBase[i]);
      } else {
        if (existsSlot.indexOf(index) === -1) {
          alphabet = this.presentAlphabetBase[i];
        }
        break;
      }
    }

    // remove letter if needed
    for (const letter of tryAllSlotAlphabet) {
      let presentIndex = this.presentAlphabetBase.indexOf(letter);
      if (presentIndex !== -1) {
        this.presentAlphabetBase.splice(presentIndex, 1);
      }
    }

    // if no present letter can assign, get a random letter
    if (alphabet === '') {
      alphabet = this.randomAlphabet();
    }
    return alphabet;
  }

  returnAlphabetInTryExistsSlot(alphabet: string): number[] {
    // check alphabet has been tested in slot before
    let alphabetExistsSlot: number[] = [];
    for (const letters of this.tries) {
      for (const letter of letters.letters) {
        if (letter.guess === alphabet || letter.result === 'correct') {
          alphabetExistsSlot.push(letter.slot);
        }
      }
    }
    return [...new Set(alphabetExistsSlot)];
  }

  checkWordAllCorrect(result: Letter[]): void {
    //check all slot has correct letter
    let correctCount = 0;
    for (const letter of result) {
      if (letter.result === 'correct') {
        correctCount++;
      }
    }
    if (correctCount === this.guessStringLength) {
      this.isCorrect = true;
    }
  }

  checkWord(guess: string): Observable<Letter[]> {
    const params = {
      guess: guess,
      seed: this.seed,
      size: this.guessStringLength
    }
    return this.http.get<Letter[]>('https://v1.wordle.k2bd.dev/random', { params });
  }


}




