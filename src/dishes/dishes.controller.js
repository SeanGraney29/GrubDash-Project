const path = require("path");

const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

///HANDLERS///////////
function list(req, res) { res.json({ data: dishes })};
function read(req, res) {res.json({ data: res.locals.dish })};

function create(req, res) {
	const { data: { name, description, price, image_url } = {}} = req.body;
	const newDish = { id: nextId(), name, description, price, image_url };
	dishes.push(newDish);
	res.status(201).json({ data: newDish });
}

function update(req, res) {
	const { data: { name, description, price, image_url } = {} } = req.body;
	res.locals.dish = { id: res.locals.dishId, name, description, price, image_url };
	res.json({ data: res.locals.dish });
}

///MIDDLEWARE////////////
function dishExists(req, res, next) {
	const { data: { name, description, price, image_url } = {} } = req.body;
    let detail = (!name) ? "name" : 
      (!description) ? "description" :
      (!image_url) ? "image_url":
      (typeof price !== 'number') ? "price" :
      (price <= 0 ) ? "price" : ''; 
    if(detail) {
		next({ 
          status: 400, 
          message: `Dish must include a ${detail}` 
        })}
	next();
}

function dishIdExists(req, res, next) {
	const { dishId } = req.params;
	const foundDish = dishes.find((dish) => dish.id === dishId);
	if(foundDish) {
		res.locals.dish = foundDish;
		next();
	}
	next({ 
      status: 404, 
      message: `Dish id does not exist: ${dishId}` 
    })
}

function routeMatch(req, res, next) {
	const { dishId } = req.params;
	const { data: { id } = {} } = req.body;
	if(!id || id === dishId) {
		res.locals.dishId = dishId;
		next();
	}
	next({ 
		status: 400, 
		message: `Dish id must match route id. Dish: ${id}, Route: ${dishId}` });
}

////EXPORTS/////////
module.exports = {
	list,
	create: [dishExists, create],
	read: [dishIdExists, read],
	update: [dishIdExists, dishExists, routeMatch, update],
};
