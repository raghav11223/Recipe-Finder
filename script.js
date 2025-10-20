const API_KEY = "089c5f803d4941859e76f1f83d561808"; 
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const cuisineSelect = document.getElementById("cuisineSelect");
const recipeContainer = document.getElementById("recipeContainer");
const loading = document.getElementById("loading");

searchBtn.addEventListener("click", fetchRecipes);

async function fetchRecipes() {
  const query = searchInput.value.trim();
  const cuisine = cuisineSelect.value;
  if (!query) {
    alert("Please enter a recipe name or ingredient!");
    return;
  }

  recipeContainer.innerHTML = "";
  loading.style.display = "block";

  const url = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&cuisine=${cuisine}&number=12&apiKey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    loading.style.display = "none";

    if (data.results && data.results.length > 0) {
      displayRecipes(data.results);
    } else {
      recipeContainer.innerHTML = `<p class="no-results">No recipes found. Try different ingredients or cuisine.</p>`;
    }
  } catch (error) {
    loading.style.display = "none";
    recipeContainer.innerHTML = `<p class="error">Error fetching recipes. Please try again later.</p>`;
    console.error("Error:", error);
  }
}

// MODIFIED: Function to fetch instructions and open them in a new window
async function fetchInstructions(recipeId, recipeTitle) {
  const instructionsUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`;
  
  try {
    const response = await fetch(instructionsUrl);
    const data = await response.json();

    let instructionsHTML = `<p>Instructions not available for this recipe via API.</p>`;
    
    if (data.instructions) {
      // Use the raw HTML instructions if provided, or clean the string
      instructionsHTML = `<ol>${data.instructions
        .replace(/<[^>]*>?/gm, '') // Remove existing HTML tags
        .split('.') // Split by period (assuming sentences/steps end with a period)
        .filter(step => step.trim() !== '')
        .map(step => `<li>${step.trim()}</li>`)
        .join('')}</ol>`;
    } else if (data.analyzedInstructions && data.analyzedInstructions.length > 0) {
      // Generate an ordered list from analyzed steps
      instructionsHTML = `<ol>${data.analyzedInstructions[0].steps.map(step => `<li>${step.step}</li>`).join('')}</ol>`;
    }

    // New: Generate the full HTML content for the new window
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${recipeTitle} - Instructions</title>
          <style>
              body { font-family: 'Poppins', sans-serif; padding: 20px; background-color: #f4f4f4; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #ff7f50; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
              ol { padding-left: 20px; }
              li { margin-bottom: 15px; line-height: 1.6; }
              p { font-style: italic; color: #555; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Instructions for: ${recipeTitle}</h1>
              ${instructionsHTML}
              <p>Source: Spoonacular API</p>
              <button onclick="window.close()" style="background-color: #007bff; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Close Window</button>
          </div>
      </body>
      </html>
    `;

    // Open a new window and write the content to it
    const newWindow = window.open();
    newWindow.document.write(fullHTML);
    newWindow.document.close();

  } catch (error) {
    console.error("Error fetching instructions:", error);
    alert("Error fetching instructions. Please try again later.");
  }
}

function displayRecipes(recipes) {
  recipeContainer.innerHTML = recipes
    .map(
      (r) => {
        // Encode the recipe title for a URL query
        const encodedTitle = encodeURIComponent(r.title + " recipe video");
        // Construct a YouTube search URL
        const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodedTitle}`;
        
        // Escape single quotes in the title for the inline onClick handler
        const safeTitle = r.title.replace(/'/g, "\\'");

        return `
          <div class="recipe-card">
            <img src="${r.image}" alt="${r.title}" />
            <h3>${r.title}</h3>
            
            <button onclick="fetchInstructions(${r.id}, '${safeTitle}')" class="instructions-btn">Show Instructions</button>

            <a href="${youtubeSearchUrl}" target="_blank" class="video-link">Watch Video</a>
          </div>
        `;
      }
    )
    .join("");
}