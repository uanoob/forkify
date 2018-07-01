import axios from 'axios';
import key from '../../apiKey';

class Search {
  constructor(query) {
    this.query = query;
  }
  async getResults() {
    const proxy = 'https://cors-anywhere.herokuapp.com/';
    // const proxy = 'https://crossorigin.me/';
    try {
      const res = await axios(
        `${proxy}http://food2fork.com/api/search?key=${key}&q=${this.query}`
      );
      this.result = res.data.recipes;
    } catch (err) {
      console.log(err);
    }
  }
}

export default Search;
