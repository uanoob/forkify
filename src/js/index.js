import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as LikesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
 * - Search object
 * - Current recipe object
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/**
 * SEARCH CONTROLLER
 */
const searchCtrl = async () => {
  // Get query from view
  const query = searchView.getInput();
  if (query) {
    // New search object and add to state
    state.search = new Search(query);
    // Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    try {
      // Search for recipes
      await state.search.getResults();

      // Render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (err) {
      console.log(`Error processing search: ${err}`);
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  searchCtrl();
});

elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/**
 * RECIPE CONTROLLER
 */
const recipeCtrl = async () => {
  // Get id from url
  const id = window.location.hash.replace('#', '');
  if (id) {
    // Prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);
    // Highlight selected search item
    if (state.search) {
      searchView.highlightSelected(id);
    }
    // Create new recipe object
    state.recipe = new Recipe(id);

    try {
      // Get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      // Calculate serving and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      // Render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (err) {
      console.log(`Error processing recipe: ${err}`);
    }
  }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, recipeCtrl));

/**
 * LIST CONTROLLER
 */
const listCtrl = () => {
  // Create new list if there in none yet
  if (!state.list) {
    state.list = new List();
  }
  // Add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  // Handle the delete button
  if (e.target.matches('.shopping__delete, .shopping__delete *')) {
    // Delete from state
    state.list.deleteItem(id);
    // Delete from UI
    listView.deleteItem(id);
    // Handle the count update
  } else if (e.target.matches('.shopping__count-value')) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

/**
 * LIKES CONTROLLER
 */

const LikesCtrl = () => {
  if (!state.likes) {
    state.likes = new Likes();
  }
  const currentID = state.recipe.id;

  if (!state.likes.isLiked(currentID)) {
    // Add like to the state
    const newLike = state.likes.addLike(currentID, state.recipe.title, state.recipe.author, state.recipe.img);
    // Toggle the like button
    LikesView.toggleLikeButton(true);
    // Add like to UI list
    LikesView.renderLike(newLike);
  } else {
    // Remove like from the state
    state.likes.deleteLike(currentID);
    // Toggle the like button
    LikesView.toggleLikeButton(false);
    // Remove like from UI list
    LikesView.deleteLike(currentID);
  }
  LikesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restored likes recipe on page load
window.addEventListener('load', () => {
  state.likes = new Likes();
  // Restore likes
  state.likes.readStorage();
  // Toggle like menu button
  LikesView.toggleLikeMenu(state.likes.getNumLikes());
  // Render existing likes
  state.likes.likes.forEach(like => {
    LikesView.renderLike(like);
  });
});

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
  if (e.target.matches('.btn-decrease, .btn-decrease *')) {
    // Decrease button is clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings('dec');
    }
  } else if (e.target.matches('.btn-increase, .btn-increase *')) {
    // Increase button is clicked
    state.recipe.updateServings('inc');
  } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
    // Add ingredients to shopping list
    listCtrl();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    // Likes Controller
    LikesCtrl();
  }
  recipeView.updateServingsIngredients(state.recipe);
});
