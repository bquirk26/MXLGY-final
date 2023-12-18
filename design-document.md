# MXLGY Design
## Intended user experience

We want to help our users make cocktails. 

Our database contains recipes for cocktails, and the ingredients that the recipes contain. It also stores information about users: who they are, what cocktails they like, and what ingredients they own. Users should be able to browse recipes and ingredients in order to save recipes they like and mark ingredients as owned.

Users can use our app to keep track of ingredients they own. Then, the app should be able to tell them what cocktails they can make. Moreover, Users should be able to use our app to find and select cocktail recipes that they like. Then, based on the ingredients they have and a budget they input, our app should be able to make suggestions about what ingredients they should buy next in order to be able to make more cocktails that they like. 

## Preliminary Entity Relationship model
Entities
- Users
- Recipes
- Ingredients

Relations
- User owns Ingredients (and what amount)
- Recipe contains Ingredients (and what amount)
- User saved a recipe (and the date saved)

### ER Diagram
![er model](ERmodel.png)

## Our Data
- We have taken our data from [TheCocktailDB](https://www.thecocktaildb.com/)'s freely available API

## Implementation Plan

### Frontend
- For the frontend, we are planning on using modern web frameworks such as Next.js, React, the Fetch API, and TailwindCSS.

### Backend
- For our backend, we plan to use Docker to deploy, and the Fiber library with Go's SQL driver for our API.
- We intend to use Docker Compose to orchestrate networking between the Go server and PostgreSQL.

## save progress

'use client'

import { useState, useEffect } from 'react'
import DrinkCard from './DrinkCard'
import DrinkModal, { DrinkModalProps } from './DrinkModal'

import Fuse from 'fuse.js'

export type DrinkLibraryProps = {
    name: DrinkModalProps[],
    price: DrinkModalProps[],
    percent: DrinkModalProps[]
}

function sort(arr: any, sortType: 'name' | 'price' | 'percent', sorts: any) {
    /**
    switch (sortType) {
        case 'name': {
            return arr
        }
        case 'price': {
            return arr.toSorted((a: any, b: any) => (a['price'] < b['price'] ? 1 : -1))
        }
        case 'percent': {
            return arr.toSorted((a: any, b: any) => (a['percent'] < b['percent'] ? 1 : -1))
        }
    }
     */
    console.log(sorts['price']);
    
    return sorts[sortType];

}

export default function DrinkLibrary(props: DrinkLibraryProps) {
    const [sortType, setSortType] = useState<'name' | 'price' | 'percent'>('name')

    const sorts = {
        name: props.name,
        price: props.price,
        percent: props.percent
    }

    props.name = props.name.map((drink) => ({
        ...drink,
        price: drink.ingredients.map((ingredient): number => ingredient.price).reduce((a, b) => a + b, 0),
        percent: Math.round(100 * drink.ingredients.map((ingredient): number => ingredient.owned ? 1 : 0).reduce((a, b) => a + b, 0) / drink.ingredients.length)
    }))
    props.price = props.price.map((drink) => ({
        ...drink,
        price: drink.ingredients.map((ingredient): number => ingredient.price).reduce((a, b) => a + b, 0),
        percent: Math.round(100 * drink.ingredients.map((ingredient): number => ingredient.owned ? 1 : 0).reduce((a, b) => a + b, 0) / drink.ingredients.length)
    }))
    
    props.percent = props.percent.map((drink) => ({
        ...drink,
        price: drink.ingredients.map((ingredient): number => ingredient.price).reduce((a, b) => a + b, 0),
        percent: Math.round(100 * drink.ingredients.map((ingredient): number => ingredient.owned ? 1 : 0).reduce((a, b) => a + b, 0) / drink.ingredients.length)
    }))

    const [drink, setDrink] = useState<DrinkModalProps | null>(null)
    const [searchResults, setSearchResults] = useState<DrinkModalProps[]>(props.name)



    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const fuse = new Fuse(props[sortType], {
            keys: ['name'],
        })
        if (e.target.value == '') {
            setSearchResults(props[sortType].map((drink) => ({
                ...drink,
                price: drink.ingredients.map((ingredient): number => ingredient.price).reduce((a, b) => a + b, 0),
                percent: Math.round(100 * drink.ingredients.map((ingredient): number => ingredient.owned ? 1 : 0).reduce((a, b) => a + b, 0) / drink.ingredients.length)
            })))
        } else {
            setSearchResults(fuse.search(e.target.value).map((result) => result.item))
        }
    }

    return (
        <>
            <input onChange={handleChange} className="max-w-lg w-full text-2xl font-semibold outline-none border-2 border-black focus:border-red-500 placeholder-neutral-600 px-4 py-3" type="text" placeholder="Search for cocktails ..." />
            <div className="flex gap-4">
                <button onClick={() => setSortType("name")} className={`${sortType === "name" ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-red-100'} rounded-full font-semibold border-2 border-red-500 px-4 py-2 transition`}>Sort Alphabetically</button>
                <button onClick={() => setSortType("price")} className={`${sortType === "price" ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-red-100'} rounded-full font-semibold border-2 border-red-500 px-4 py-2 transition`}>Sort By Cost</button>
                <button onClick={() => setSortType("percent")} className={`${sortType === "percent" ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-red-100'} rounded-full font-semibold border-2 border-red-500 px-4 py-2 transition`}>Sort By Makeability</button>
            </div>
            {searchResults.length === 0 && <p className="text-lg text-black font-mono">No results.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {sort(searchResults, sortType, sorts).map((drink: any) => <div className="hover:cursor-pointer" key={drink.name} onClick={() => setDrink(drink)}><DrinkCard {...drink} /></div>)}
            </div>
            {drink && <DrinkModal close={() => setDrink(null)} {...drink} />}
        </>
    )
}

