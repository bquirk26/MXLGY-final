
# Relational Schema


## Entities
```sql
CREATE TABLE users (
	userid VARCHAR(200) PRIMARY KEY
);

CREATE TABLE ingredients (
	IngredientName VARCHAR(100) PRIMARY KEY,
	Description VARCHAR(7500),
	Type VARCHAR(100),
	ABV REAL,
	price REAL
);

CREATE TABLE recipes (
	RecipeName VARCHAR(100) PRIMARY KEY,
	Category VARCHAR(100),
	Image VARCHAR(500),
	Glass VARCHAR(100),
	Instructions VARCHAR(10000)
);
--view for recipes + total cost?
```


### relations 
```sql
CREATE TABLE owns (
	userid VARCHAR(200),
	IngredientName VARCHAR(100),
	Amount VARCHAR(200),
	PRIMARY KEY (userid, IngredientName), 
	FOREIGN KEY (userid) REFERENCES users(userid),
	FOREIGN KEY (IngredientName) REFERENCES ingredients(IngredientName)
);

CREATE TABLE saved (
	userid VARCHAR(200),
	RecipeName VARCHAR(100),
	OnDate TIMESTAMP,
	PRIMARY KEY (userid, RecipeName),
	FOREIGN KEY (userid) REFERENCES users(userid),
	FOREIGN KEY (RecipeName) REFERENCES recipes(RecipeName)
);
	
CREATE TABLE contains (
	RecipeName VARCHAR(100),
	IngredientName VARCHAR(100),
	Amount VARCHAR(200), --CHARs, probably
	PRIMARY KEY (RecipeName, IngredientName),
	FOREIGN KEY (RecipeName) REFERENCES recipes(RecipeName),
	FOREIGN KEY (IngredientName) REFERENCES ingredients(IngredientName)
);

```

### Queries

```sql
-- get all recipes and mark whether a given user has saved them
SELECT recipes.recipename, CASE WHEN saved.email IS NULL THEN FALSE ELSE TRUE END AS isSaved
FROM recipes
LEFT JOIN saved ON saved.recipename = recipes.recipename AND saved.email = 'test@icloud.com'

-- get all ingredients and mark whether a given user owns them
SELECT ingredients.ingredientname, CASE WHEN owns.email IS NULL THEN FALSE ELSE TRUE END AS isOwned
FROM ingredients
LEFT JOIN owns ON owns.ingredientname = ingredients.ingredientname AND owns.email = 'test@icloud.com';

-- all recipes a user can make given the ingredients they own

SELECT C1.recipeName, Count (ingredientName)
FROM contains as C1
GROUP BY recipeName
HAVING Count (C1.ingredientName) = (SELECT Count (C2.ingredientName) 
								FROM contains as C2
								INNER JOIN owns ON owns.ingredientName = C2.ingredientName
								WHERE userid = 'test@icloud.com' AND C1.recipeName = C2.recipeName
								GROUP BY C2.recipeName);

-- recipes ordered by how many of their ingredients a user is missing
SELECT contains.recipeName, Count (contains.ingredientName)
FROM contains
WHERE contains.ingredientName NOT IN (SELECT ingredientName from owns WHERE email = 'test@icloud.com')
GROUP BY contains.recipeName
ORDER BY Count (contains.ingredientName) ASC;

--recipes by cost: 

join recipe contains on ingredients by ingredientname
group by recipe sum price
inner join on recipes so we have everything 

WITH recipecosts AS (
	SELECT recipename, SUM (price) as recipecost
	FROM contains
	INNER JOIN ingredients ON contains.ingredientname = ingredients.ingredientname
	GROUP BY recipeName
)
SELECT recipes.glass, recipecost, CASE WHEN saved.userid IS NULL THEN FALSE ELSE TRUE END AS isSaved
FROM temp
INNER JOIN recipes ON temp.recipename = recipes.recipename
LEFT JOIN saved ON saved.recipename = temp.recipename AND saved.userid = $1
ORDER BY recipecost ASC


-- get all with cost and percent
WITH recipecosts AS (
	SELECT recipename, SUM (price) as price
	FROM contains
	INNER JOIN ingredients ON contains.ingredientname = ingredients.ingredientname
	GROUP BY recipeName
),
missing AS (  
	SELECT contains.recipename, Count (contains.ingredientName) AS missing 
	FROM contains 
	WHERE contains.ingredientName NOT IN (SELECT ingredientName from owns WHERE userid = 'dffb5bb780b36c8bcb38aaab209830062964628be192bbdc0a49b836c4646c83')
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
LEFT JOIN saved ON saved.recipename = recipes.recipename AND saved.userid = 'dffb5bb780b36c8bcb38aaab209830062964628be192bbdc0a49b836c4646c83'







```