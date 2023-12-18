const pgp = require('pg-promise')();
const connect = 'postgresql://localhost/mxlgy'
const db = pgp(connect);
db.connect().then(obj => {
    console.log(obj.client.serverVersion);
    obj.done();
}).catch(error => {
    console.log("ERROR: ", error.message || error);
})
/** 
db.any('SELECT * from ingredients')
    .then((data) => { //array of rows
        console.log(data);
        console.log(typeof(data[0]));
    })
    .catch((error) => {
        console.log("ERROR");
    });
*/

//get all recipes, ingredients.users

const get_all = `WITH recipecosts AS (
	SELECT recipename, SUM (price) as price
	FROM contains
	INNER JOIN ingredients ON contains.ingredientname = ingredients.ingredientname
	GROUP BY recipeName
),
missing AS (  
	SELECT contains.recipename, Count (contains.ingredientName) AS missing 
	FROM contains 
	WHERE contains.ingredientName NOT IN (SELECT ingredientName from owns WHERE userid = $1)
	GROUP BY contains.recipeName 
	ORDER BY Count (contains.ingredientName) ASC
),
needed AS (
	SELECT contains.recipename, COUNT (contains.ingredientName) AS needed
	FROM contains
	GROUP BY contains.recipeName
)
SELECT recipes.*, recipecosts.price, missing.missing, needed.needed, CASE WHEN saved.userid IS NULL THEN FALSE ELSE TRUE END AS isSaved
FROM recipes
INNER JOIN recipecosts ON recipes.recipename = recipecosts.recipename
INNER JOIN needed ON recipes.recipename = needed.recipename
INNER JOIN missing ON recipes.recipename = missing.recipename
LEFT JOIN saved ON saved.recipename = recipes.recipename AND saved.userid = $1
`

function getAllRecipes(userid, savedOnly) {
    let data;
    if (savedOnly === 'true') {
        data = db.any("WITH temp AS (SELECT recipes.*, CASE WHEN saved.userid IS NULL THEN FALSE ELSE TRUE END AS Saved " +
            "FROM recipes " +
            "LEFT JOIN saved ON saved.recipename = recipes.recipename AND saved.userid = $1 " +
            "ORDER BY saved DESC, recipename ASC) " +
            "SELECT * FROM temp WHERE Saved = TRUE", [userid]);
    } else {
        data = db.any("SELECT recipes.*, CASE WHEN saved.userid IS NULL THEN FALSE ELSE TRUE END AS Saved " +
            "FROM recipes " +
            "LEFT JOIN saved ON saved.recipename = recipes.recipename AND saved.userid = $1 " +
            "ORDER BY saved DESC, recipename ASC", [userid]);
    }

    return data;
}

function getAllRecipesTwo(userid) {
    let data = db.any(get_all, [userid]);
    return data;
}

function getAllIngredients(userid, ownedOnly) {
    let data;
    if (ownedOnly === 'true') {
        data = db.any("WITH temp AS (SELECT ingredients.*, CASE WHEN owns.userid IS NULL THEN FALSE ELSE TRUE END AS Owned " +
            "FROM ingredients " +
            "LEFT JOIN owns ON owns.ingredientname = ingredients.ingredientname AND owns.userid = $1 " +
            "ORDER BY ingredientname ASC) " +
            "SELECT * FROM TEMP WHERE Owned = true", [userid]);
    } else {
        data = db.any("SELECT ingredients.*, CASE WHEN owns.userid IS NULL THEN FALSE ELSE TRUE END AS Owned " +
            "FROM ingredients " +
            "LEFT JOIN owns ON owns.ingredientname = ingredients.ingredientname AND owns.userid = $1 " +
            "ORDER BY ingredientname ASC", [userid]);
    }

    return data;
}

// orderings

// by price/ total cost
function ingredientsByPrice(userid, ownedOnly) {
    const data = db.any("SELECT ingredients.*, CASE WHEN owns.userid IS NULL THEN FALSE ELSE TRUE END AS isSaved " +
        "FROM ingredients " +
        "LEFT JOIN owns ON owns.ingredientname = ingredients.ingredientname AND owns.userid = $1 " +
        "ORDER BY Price ASC", [userid]);
    return data;
}

// by price/ total cost
function ingredientsByAlpha(userid) {
    const data = db.any("SELECT ingredients.*, CASE WHEN owns.userid IS NULL THEN FALSE ELSE TRUE END AS isOwned " +
        "FROM ingredients " +
        "LEFT JOIN owns ON owns.ingredientname = ingredients.ingredientname AND owns.userid = $1 " +
        "ORDER BY ingredientname ASC", [userid]);
    return data;
}

// by price/ total cost
function ingredientsByOwned(userid) {
    const data = db.any("SELECT ingredients.*, CASE WHEN owns.userid IS NULL THEN FALSE ELSE TRUE END AS isOwned " +
        "FROM ingredients " +
        "LEFT JOIN owns ON owns.ingredientname = ingredients.ingredientname AND owns.userid = $1 " +
        "ORDER BY isowned DESC, ingredientname, ASC", [userid]);
    return data;
}

function recipesByCost(userid) {
    const data = db.any("WITH temp AS ( " + 
        "SELECT recipename, SUM (price) as price " +
        "FROM contains " +
        "INNER JOIN ingredients ON contains.ingredientname = ingredients.ingredientname " +
        "GROUP BY recipeName) " +
    "SELECT recipes.*, price, CASE WHEN saved.userid IS NULL THEN FALSE ELSE TRUE END AS isSaved " +
    "FROM temp " +
    "INNER JOIN recipes ON temp.recipename = recipes.recipename " + 
    "LEFT JOIN saved ON saved.recipename = temp.recipename AND saved.userid = $1 " + 
    "ORDER BY price ASC", [userid]);
    return data;
}


//by closeness to completion: 
function orderByCloseness(userid, savedOnly) {
    let data;
    if (savedOnly === 'true') {
        data = db.any("WITH temp AS ( " +
            "SELECT contains.recipename, Count (contains.ingredientName) AS missing " +
            "FROM contains " +
            "WHERE contains.ingredientName NOT IN (SELECT ingredientName from owns WHERE userid = $1) " +
            "GROUP BY contains.recipeName " +
            "ORDER BY Count (contains.ingredientName) ASC) " +
            "SELECT temp.recipename, recipes.*, temp.missing " +
            "FROM temp " +
            "INNER JOIN recipes ON recipes.recipename = temp.recipename " +
            "WHERE temp.recipename in (SELECT recipename from saved WHERE userid = $1) " +
            "ORDER BY temp.missing", [userid]);
    } else {
        data = db.any("WITH temp AS ( " +
            "SELECT contains.recipename, Count (contains.ingredientName) AS missing " +
            "FROM contains " +
            "WHERE contains.ingredientName NOT IN (SELECT ingredientName from owns WHERE userid = $1) " +
            "GROUP BY contains.recipeName " +
            "ORDER BY Count (contains.ingredientName) ASC) " +
            "SELECT temp.recipename, recipes.*, temp.missing " +
            "FROM temp " +
            "INNER JOIN recipes ON recipes.recipename = temp.recipename " +
            "ORDER BY temp.missing", [userid]);
    }
    return data;
}

//get user's recipes, ingredients

async function getAllSavedRecipes(userid) {
    const data = await db.any("SELECT recipes.* " +
        "FROM users, saved, recipes " +
        "WHERE saved.userid = users.userid AND users.userid = $1 AND recipes.RecipeName = saved.RecipeName ",
        [userid]);
    return data;
}

function getAllOwnedIngredients(userid) {
    const data = db.any("SELECT ingredients.*, owns.amount " +
        "FROM users, owns, ingredients " +
        "WHERE owns.userid = users.userid and owns.IngredientName = ingredients.IngredientName and users.userid = $1",
        [userid]);
    return data;
}

function getIngredientsInRecipe(recipe, userid) {
    return db.any("SELECT contains.ingredientname, contains.amount, ingredients.price, CASE WHEN owns.userid IS NULL THEN FALSE ELSE TRUE END AS Owned FROM contains LEFT JOIN owns ON owns.userid = $2 AND owns.ingredientname = contains.ingredientname LEFT JOIN ingredients ON ingredients.ingredientname = contains.ingredientname WHERE contains.recipename = $1", [recipe, userid]);
}

//user saves recipe
function saveRecipe(userid, recipe) {
    //check if exists?
    db.any("SELECT userid FROM saved WHERE userid = $1 AND recipename = $2",
        [userid, recipe]).then((data) => {
            if (data.length > 0) {
                return;
            } else {
                return db.any(`INSERT INTO saved (userid, recipename) VALUES ($1, $2)`, [userid, recipe]);
            }
        })


}

//unsave recipe
function unsaveRecipe(userid, recipe) {
    db.any("SELECT userid FROM saved WHERE userid = $1 AND recipename = $2",
        [userid, recipe]).then((data) => {
            if (data.length == 0) {
                return;
            } else {
                return db.any(`DELETE FROM saved WHERE userid = $1 AND recipename = $2`, [userid, recipe]);
            }
        });

}

//user marks ingredient as owned

function ownIngredient(userid, ingredient) {
    return db.any("SELECT userid FROM owns WHERE userid = $1 AND ingredientname = $2",
        [userid, ingredient]).then((data => {
            if (data.length > 0) {
                return;
            } else {
                return db.any('INSERT INTO owns (userid, ingredientname) VALUES ($1, $2)', [userid, ingredient]);
            }
        }));
}

function disownIngredient(userid, ingredient) {
    db.any("SELECT userid FROM owns WHERE userid = $1 AND ingredientname = $2",
        [userid, ingredient]).then((data => {
            if (data.length == 0) {
                return;
            } else {
                return db.any('DELETE FROM owns WHERE userid = $1 AND ingredientname = $2', [userid, ingredient]);
            }
        }))
}

async function isOwned(userId, ingredientName) {
    const res = await db.any("SELECT userid FROM owns WHERE userid = $1 AND ingredientname = $2",
        [userId, ingredientName]);
    return res.length === 1;
}


// create user

function create_user(uid) {
    return db.any('INSERT INTO users (userid) VALUES ($1)', [uid]);
}

async function user_exists(uid) {
    const res = await db.any('SELECT * FROM users WHERE users.userid = $1', [uid]);
    console.log(res)
    console.log(res.length === 1)
    return res.length === 1;
}



/** 
getAllOwnedIngredients("test@icloud.com").then((data) => {
    console.log("res: ");
    console.log(data);
}).catch(() => {
    console.log("err");
});
*/
//all ingredients a recipe contains

//db.any('SELECT name from users').then(data => console.log(data));

module.exports = {
    pgp,
    db,
    getAllOwnedIngredients,
    getAllSavedRecipes,
    getAllRecipesTwo,
    getAllIngredients,
    getIngredientsInRecipe,
    saveRecipe,
    unsaveRecipe,
    ownIngredient,
    disownIngredient,
    create_user,
    orderByCloseness,
    user_exists,
    ingredientsByOwned,
    ingredientsByAlpha,
    ingredientsByPrice,
    isOwned,
    recipesByCost
}