document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const ingredientInput = document.getElementById('ingredient-input');
    const resultsContainer = document.getElementById('results-container');
    const loader = document.getElementById('loader');

    // API base URL for searching by ingredient
    const API_URL = 'https://www.themealdb.com/api/json/v1/1/filter.php?i=';

    // Event listener for the search button
    searchBtn.addEventListener('click', findRecipes);
    ingredientInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            findRecipes();
        }
    });

    async function findRecipes() {
        const ingredientsText = ingredientInput.value.trim();
        if (!ingredientsText) {
            resultsContainer.innerHTML = '<p>Please enter some ingredients.</p>';
            return;
        }

        // Show loader and clear previous results
        loader.style.display = 'block';
        resultsContainer.innerHTML = '';

        // Split ingredients by comma and trim whitespace
        const ingredients = ingredientsText.split(',').map(item => item.trim()).filter(item => item);

        try {
            // Fetch recipes for each ingredient concurrently
            const recipePromises = ingredients.map(ingredient => 
                fetch(`${API_URL}${ingredient}`).then(response => response.json())
            );
            
            const results = await Promise.all(recipePromises);

            // Process results to find common recipes
            const commonRecipes = processResults(results);
            
            displayRecipes(commonRecipes);

        } catch (error) {
            console.error('Error fetching recipes:', error);
            resultsContainer.innerHTML = '<p>Sorry, something went wrong. Please try again later.</p>';
        } finally {
            // Hide loader
            loader.style.display = 'none';
        }
    }

    function processResults(results) {
        // Filter out any null results (ingredient not found)
        const validResults = results.filter(result => result.meals);

        if (validResults.length === 0) {
            return [];
        }
        
        // Extract meal IDs from each result set
        const mealIdSets = validResults.map(result => new Set(result.meals.map(meal => meal.idMeal)));
        
        // Find the intersection of all meal ID sets
        const commonMealIds = mealIdSets.reduce((acc, currentSet) => {
            return new Set([...acc].filter(id => currentSet.has(id)));
        });

        // Get the full meal details for the common recipes
        const firstResultMeals = validResults[0].meals;
        const commonMeals = firstResultMeals.filter(meal => commonMealIds.has(meal.idMeal));
        
        return commonMeals;
    }

    function displayRecipes(recipes) {
        if (recipes.length === 0) {
            resultsContainer.innerHTML = '<p>No recipes found matching all your ingredients. Try fewer ingredients.</p>';
            return;
        }
        
        const recipeCardsHTML = recipes.map(recipe => `
            <a href="https://www.themealdb.com/meal/${recipe.idMeal}" target="_blank" class="recipe-card">
                <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
                <h3>${recipe.strMeal}</h3>
            </a>
        `).join('');

        resultsContainer.innerHTML = recipeCardsHTML;
    }
});